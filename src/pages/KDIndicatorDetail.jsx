import { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import ThemeToggle from '../components/ThemeToggle';
import Plot from 'react-plotly.js';
import { useTheme } from '../context/ThemeContext';
import apDistricts from '../data/apDistricts.json';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ── Sheet config ────────────────────────────────────────────────── */
const SHEET_ID = '1vsCSdPZpBK5SQw9gppRLEEKDLhj19DHk';
const CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

const MONTH_ORDER = ['April','May','June','July','August','September','October','November','December','January','February','March'];
const MONTH_SHORT  = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const DISTRICTS    = [
  'Changlang','Dibang Valley','East Kameng','Anjaw','East Siang','Kamle',
  'Kra Daadi','Kurung Kumey','Leparada','Lohit','Longding',
  'Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai',
  'Pakke Kessang','Papum Pare','Shi Yomi','Siang','Tawang','Tirap',
  'Upper Siang','Upper Subansiri','West Kameng','West Siang',
  // Newer districts (created 2022–2024; HMIS sheet not yet updated for these)
  'Bichom','Keyi Panyor',
];

/* ── Status helpers ──────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const ratio = kd.achievement / kd.target;
  if (kd.lowerIsBetter) {
    if (ratio <= 1.00) return 'achieved';
    if (ratio <= 1.33) return 'close';
    return 'gap';
  }
  if (ratio >= 1.00) return 'achieved';
  if (ratio >= 0.75) return 'close';
  return 'gap';
}

const S_COLOR = { achieved:'#059669', close:'#D97706', gap:'#DC2626', neutral:'#94A3B8' };
const S_LABEL = { achieved:'Achieved', close:'Near Target', gap:'Gap', neutral:'No Data' };
const S_BG    = { achieved:'#ECFDF5', close:'#FFFBEB',    gap:'#FEF2F2', neutral:'#F8FAFC' };

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 100000) return `${(n/100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n/1000).toFixed(1)}K`;
  return Number(n).toLocaleString();
}

/* ── CSV parser (handles quoted commas) ──────────────────────────── */
function parseCSV(text) {
  return text.trim().split('\n').map(line => {
    const cols = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"')              { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else                         { cur += ch; }
    }
    cols.push(cur.trim());
    return cols;
  });
}

/* ── HMIS fetch + parse ──────────────────────────────────────────── */
async function fetchHMIS(hmisCode, hmisCat) {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/"/g,'').trim());
  const COL = {
    year:  headers.findIndex(h => /^year$/i.test(h)),
    month: headers.findIndex(h => /^month$/i.test(h)),
    cat:   headers.findIndex(h => /^category$/i.test(h)),
    code:  headers.findIndex(h => /data item code/i.test(h)),
    name:  headers.findIndex(h => /data item name/i.test(h)),
  };
  const distCols = {};
  DISTRICTS.forEach(d => {
    const idx = headers.findIndex(h => h.toLowerCase() === d.toLowerCase());
    if (idx >= 0) distCols[d] = idx;
  });

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 6) continue;
    const catMatch = r[COL.cat]?.replace(/"/g,'').match(/^(M\d+)/);
    if (!catMatch) continue;
    if (hmisCat && catMatch[1] !== hmisCat) continue;
    const code = r[COL.code]?.replace(/"/g,'').trim().replace(/\.$/, '');
    if (code !== hmisCode) continue;

    const distTotals = {};
    DISTRICTS.forEach(d => {
      const raw = r[distCols[d]]?.replace(/"/g,'').replace(/,/g,'').trim();
      distTotals[d] = parseFloat(raw) || 0;
    });
    const stateTotal = Object.values(distTotals).reduce((s, v) => s + v, 0);

    out.push({
      year:  r[COL.year]?.replace(/"/g,'').trim(),
      month: r[COL.month]?.replace(/"/g,'').trim(),
      code, stateTotal, distTotals,
    });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════
   SHARED PALETTE HELPERS
   ══════════════════════════════════════════════════════════════════ */
const ACH_PAL = {
  achieved: { branch: '#047857', leaf: '#10B981', empty: '#6EE7B7' },
  close:    { branch: '#B45309', leaf: '#F59E0B', empty: '#FCD34D' },
  gap:      { branch: '#BE123C', leaf: '#F43F5E', empty: '#FCA5A5' },
  neutral:  { branch: '#475569', leaf: '#64748B', empty: '#CBD5E1' },
};
const N5_PAL = { branch: '#6D28D9', leaf: '#7C3AED', empty: '#DDD6FE' };
const N4_PAL = { branch: '#B45309', leaf: '#D97706', empty: '#FDE68A' };

function normPctFor(val, target, unit) {
  if (val == null) return null;
  if (unit === '%') return Math.min(Math.max(val, 0), 100);
  if (target) return Math.min(Math.max((val / target) * 100, 0), 100);
  return null;
}

/* ── Chart 1: FY 2025-26 Government Data ─────────────────────── */
function PlotlyFYChart({ indicator, status }) {
  const achievement = indicator?.achievement;
  const target      = indicator?.target;
  const unit        = indicator?.unit ?? '%';
  const pal         = ACH_PAL[status] || ACH_PAL.neutral;
  const achNorm     = normPctFor(achievement, target, unit);
  const achPct      = achNorm ?? 0;
  const isPercent   = unit === '%';

  const centerVal = achievement != null
    ? (isPercent ? `${Number(achievement).toFixed(1)}%` : fmt(achievement))
    : 'N/A';
  const targetStr = target != null
    ? (isPercent ? `target ${target}%` : `target ${fmt(target)}`)
    : '';

  const trace = {
    type: 'sunburst',
    ids:     ['root', 'fy-a', 'fy-r'],
    labels:  ['', `${achPct.toFixed(1)}%`, ''],
    parents: ['', 'root', 'root'],
    values:  [100, achPct, 100 - achPct],
    branchvalues: 'total',
    marker: { colors: ['rgba(0,0,0,0)', pal.leaf, pal.empty], line: { color: '#ffffff', width: 2 } },
    hovertemplate: [
      '<extra></extra>',
      `<b>FY 2025-26 Achieved</b><br>${indicator?.achievedLabel ?? centerVal}<extra></extra>`,
      `<b>Gap to target</b><br>${targetStr}<extra></extra>`,
    ],
    textfont: { family: "'Inter', sans-serif", size: 13, color: '#ffffff' },
    insidetextorientation: 'radial',
    leaf: { opacity: 1 },
  };

  const layout = {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    margin: { t: 10, b: 10, l: 10, r: 10 }, height: 340,
    annotations: [{
      x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
      text: `<b>${centerVal}</b><br><span style="font-size:12px;color:#64748B">${targetStr}</span>`,
      showarrow: false,
      font: { family: "'JetBrains Mono', monospace", size: 28, color: achNorm != null ? pal.branch : '#CBD5E1' },
      align: 'center',
    }],
  };

  return (
    <div className="sunburst-wrap">
      <Plot data={[trace]} layout={layout} config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }} useResizeHandler />
      <div className="sb-legend">
        <div className="sb-leg-item">
          <span className="sb-leg-swatch" style={{ background: pal.leaf }} />
          <span><strong>Achieved:</strong> {indicator?.achievedLabel ?? centerVal}</span>
        </div>
        {target != null && (
          <div className="sb-leg-item">
            <span className="sb-leg-tick" />
            <span><strong>Target:</strong> {indicator?.targetLabel ?? target}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── District Choropleth Map ──────────────────────────────────── */
// zoom=0: fitbounds fills container automatically
// zoom 1-4: explicit lon/lat ranges zoom into AP (tighter = more zoomed in)
const AP_ZOOM = [
  null,                                         // 0: fitbounds='geojson'
  { lon: [91.5, 97.5], lat: [26.4, 29.7] },   // 1
  { lon: [92.2, 97.0], lat: [26.7, 29.4] },   // 2
  { lon: [93.0, 96.5], lat: [27.1, 29.1] },   // 3
  { lon: [93.5, 96.0], lat: [27.3, 28.9] },   // 4
];

function DistrictMap({ distData, isLight }) {
  const [zoom, setZoom] = useState(0);

  const valueMap   = Object.fromEntries(distData.map(d => [d.district, d.value]));
  const stateTotal = distData.reduce((s, d) => s + d.value, 0) || 1;
  const features   = apDistricts.features;
  const names      = features.map(f => f.properties.DISTRICT);
  const values     = names.map(n => valueMap[n] ?? null);
  const validVals  = values.filter(v => v != null);
  const maxVal     = validVals.length > 0 ? validVals.reduce((a, b) => Math.max(a, b), 0) : 1;

  /* Centroids: mean of exterior ring coordinates */
  function centroid(f) {
    const coords = f.geometry.type === 'Polygon'
      ? f.geometry.coordinates[0]
      : f.geometry.coordinates.reduce((best, poly) =>
          poly[0].length > best.length ? poly[0] : best, []);
    const lon = coords.reduce((s, p) => s + p[0], 0) / coords.length;
    const lat = coords.reduce((s, p) => s + p[1], 0) / coords.length;
    return [lon, lat];
  }
  const centroids = features.map(centroid);

  const choropleth = {
    type: 'choropleth',
    geojson: apDistricts,
    featureidkey: 'properties.DISTRICT',
    locations: names,
    z: values,
    colorscale: [
      [0,   '#1E3A5F'],
      [0.4, '#D97706'],
      [1,   '#7C3AED'],
    ],
    zmin: 0,
    zmax: maxVal,
    showscale: false,
    marker: {
      line: {
        color: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
        width: 1.2,
      },
    },
    hovertemplate: '<b>%{location}</b><br>%{z:,}<extra></extra>',
  };

  const labelTrace = {
    type: 'scattergeo',
    mode: 'text',
    lon: centroids.map(c => c[0]),
    lat: centroids.map(c => c[1]),
    text: names.map(n => {
      const v = valueMap[n];
      return v != null ? `${Math.round((v / stateTotal) * 100)}%` : '';
    }),
    textfont: { family: "'JetBrains Mono', monospace", size: zoom >= 3 ? 11 : zoom >= 2 ? 9 : 8, color: '#ffffff' },
    hoverinfo: 'skip',
    showlegend: false,
  };

  const layout = {
    geo: {
      visible: false,
      projection: { type: 'mercator' },
      bgcolor: 'transparent',
      domain: { x: [0, 1], y: [0, 1] },
      ...(zoom === 0
        ? { fitbounds: 'geojson' }
        : { lonaxis: { range: AP_ZOOM[zoom].lon }, lataxis: { range: AP_ZOOM[zoom].lat } }
      ),
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor:  'transparent',
    margin: { t: 0, b: 0, l: 0, r: 0 },
    autosize: true,
    hoverlabel: {
      bgcolor:     isLight ? 'rgba(15,23,42,0.92)' : 'rgba(5,7,18,0.96)',
      bordercolor: 'rgba(0,181,204,0.50)',
      font: { color: '#ffffff', size: 11, family: "'JetBrains Mono', monospace" },
    },
  };

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 20, lineHeight: 1, fontWeight: 600,
    background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(30,40,60,0.88)',
    color:      isLight ? '#1E293B'                 : '#E2E8F0',
    boxShadow:  '0 2px 8px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(6px)',
    transition: 'opacity .15s',
  };

  return (
    <div className="dist-chart-wrap" style={{ position: 'relative' }}>
      <Plot
        data={[choropleth, labelTrace]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
      {/* Zoom controls */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20,
        display: 'flex', flexDirection: 'column', gap: 6,
        zIndex: 10,
      }}>
        <button
          style={{ ...btnBase, opacity: zoom >= AP_ZOOM.length - 1 ? 0.35 : 1 }}
          onClick={() => setZoom(z => Math.min(z + 1, AP_ZOOM.length - 1))}
          disabled={zoom >= AP_ZOOM.length - 1}
          title="Zoom in"
        >+</button>
        <button
          style={{ ...btnBase, opacity: zoom <= 0 ? 0.35 : 1 }}
          onClick={() => setZoom(z => Math.max(z - 1, 0))}
          disabled={zoom <= 0}
          title="Zoom out"
        >−</button>
      </div>
    </div>
  );
}

/* ── Chart 2: NFHS Baseline Comparison (Public Data) ─────────── */
function PlotlyNFHSChart({ indicator, nfhsRows }) {
  const { theme } = useTheme();
  const isLight   = theme === 'light';

  const nfhs5Row = nfhsRows?.find(r => r.unit === '%' && r.nfhs5 != null);
  const nfhs4Row = nfhsRows?.find(r => r.unit === '%' && r.nfhs4 != null);
  const n5Pct    = nfhs5Row ? Math.min(Math.max(nfhs5Row.nfhs5, 0), 100) : null;
  const n4Pct    = nfhs4Row ? Math.min(Math.max(nfhs4Row.nfhs4, 0), 100) : null;

  const textColor  = isLight ? '#1E293B' : '#E2E8F0';
  const tickColor  = isLight ? '#475569' : '#94A3B8';
  const gridColor  = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)';
  const restColor  = isLight ? 'rgba(0,0,0,0.06)'  : 'rgba(255,255,255,0.08)';

  const yLabels = ['NFHS-4 (2015–16)', 'NFHS-5 (2019–21)'];

  /* achieved bars */
  const barTrace = {
    type: 'bar',
    orientation: 'h',
    y: yLabels,
    x: [n4Pct ?? 0, n5Pct ?? 0],
    marker: {
      color: [N4_PAL.leaf, N5_PAL.leaf],
      line: { color: 'transparent', width: 0 },
    },
    text: [
      n4Pct != null ? `<b>${n4Pct.toFixed(1)}%</b>` : 'N/A',
      n5Pct != null ? `<b>${n5Pct.toFixed(1)}%</b>` : 'N/A',
    ],
    textposition: 'outside',
    textfont: { family: "'JetBrains Mono', monospace", size: 13, color: textColor },
    hovertemplate: '%{y}: <b>%{x:.1f}%</b><extra></extra>',
    cliponaxis: false,
    showlegend: false,
  };

  /* remaining (background) bars */
  const restTrace = {
    type: 'bar',
    orientation: 'h',
    y: yLabels,
    x: [100 - (n4Pct ?? 0), 100 - (n5Pct ?? 0)],
    marker: { color: restColor, line: { color: 'transparent', width: 0 } },
    hoverinfo: 'skip',
    showlegend: false,
  };

  const shapes = [];
  if (indicator?.target != null) {
    shapes.push({
      type: 'line',
      x0: indicator.target, x1: indicator.target,
      y0: -0.5, y1: 1.5,
      line: { color: '#22C55E', width: 2, dash: 'dot' },
    });
  }

  const layout = {
    barmode: 'stack',
    paper_bgcolor: 'transparent',
    plot_bgcolor:  'transparent',
    margin: { t: 12, b: 36, l: 140, r: 64 },
    height: 170,
    bargap: 0.38,
    xaxis: {
      range: [0, 115],
      ticksuffix: '%',
      tickfont: { family: "'Inter', sans-serif", size: 11, color: tickColor },
      gridcolor: gridColor,
      showline: false,
      zeroline: false,
    },
    yaxis: {
      tickfont: { family: "'Inter', sans-serif", size: 12, color: textColor },
      showgrid: false,
      showline: false,
      automargin: true,
    },
    shapes,
    showlegend: false,
  };

  return (
    <div className="sunburst-wrap">
      <Plot
        data={[restTrace, barTrace]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
      <div className="sb-legend">
        {n5Pct != null && (
          <div className="sb-leg-item">
            <span className="sb-leg-swatch" style={{ background: N5_PAL.leaf }} />
            <span><strong>NFHS-5:</strong> {nfhs5Row?.nfhs5}{nfhs5Row?.unit}&ensp;
              <span className="sb-leg-caption">{nfhs5Row?.label?.slice(0, 46)}</span>
            </span>
          </div>
        )}
        {n4Pct != null && (
          <div className="sb-leg-item">
            <span className="sb-leg-swatch" style={{ background: N4_PAL.leaf }} />
            <span><strong>NFHS-4:</strong> {nfhs4Row?.nfhs4}{nfhs4Row?.unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Custom tooltip ──────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ncd-tooltip">
      <div className="ncd-tip-label">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="ncd-tip-row" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span className="ncd-tip-val">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main page component
   ══════════════════════════════════════════════════════════════════ */
export default function KDIndicatorDetail({ indicator, program, division, onBack }) {
  const wrapRef = useRef(null);
  const [rawRows,    setRawRows]    = useState(null);
  const [hmisError,  setHmisError]  = useState(null);
  const [hmisLoading,setHmisLoading]= useState(false);

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const st       = kdStatus(indicator ?? {});
  const stColor  = S_COLOR[st];

  const gapVal = (indicator?.achievement != null && indicator?.target != null)
    ? (indicator.lowerIsBetter
      ? indicator.target - indicator.achievement
      : indicator.achievement - indicator.target)
    : null;

  const pct = (!indicator?.lowerIsBetter && indicator?.achievement != null && indicator?.target != null && indicator.target > 0)
    ? Math.min((indicator.achievement / indicator.target) * 100, 100)
    : null;

  /* HMIS fetch */
  useEffect(() => {
    if (!indicator?.hmisCode) return;
    setHmisLoading(true);
    setHmisError(null);
    fetchHMIS(indicator.hmisCode, indicator.hmisCat)
      .then(setRawRows)
      .catch(e => setHmisError(e.message))
      .finally(() => setHmisLoading(false));
  }, [indicator?.hmisCode, indicator?.hmisCat]);

  /* Monthly state trend (by year) */
  const trendData = useMemo(() => {
    if (!rawRows?.length) return [];
    const yearMap = {};
    rawRows.forEach(r => {
      if (!yearMap[r.year]) yearMap[r.year] = {};
      const moIdx = MONTH_ORDER.findIndex(m => m.toLowerCase() === r.month.toLowerCase());
      const moKey = moIdx >= 0 ? MONTH_SHORT[moIdx] : r.month.slice(0,3);
      yearMap[r.year][moKey] = (yearMap[r.year][moKey] ?? 0) + r.stateTotal;
    });
    const years = Object.keys(yearMap).sort();
    return MONTH_SHORT.map(mo => {
      const row = { month: mo };
      years.forEach(yr => { row[yr] = yearMap[yr]?.[mo] ?? 0; });
      return row;
    }).filter(row => years.some(yr => row[yr] > 0));
  }, [rawRows]);

  /* District breakdown (most recent year) — all districts, no slice limit */
  const distData = useMemo(() => {
    if (!rawRows?.length) return [];
    const latestYear = [...new Set(rawRows.map(r => r.year))].sort().at(-1);
    const distMap = {};
    rawRows.filter(r => r.year === latestYear).forEach(r => {
      Object.entries(r.distTotals).forEach(([d, v]) => {
        distMap[d] = (distMap[d] ?? 0) + v;
      });
    });
    return Object.entries(distMap)
      .map(([district, value]) => ({ district, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [rawRows]);

  const years = useMemo(() =>
    rawRows ? [...new Set(rawRows.map(r => r.year))].sort() : [],
  [rawRows]);

  /* NFHS rows */
  const nfhsRows = (program?.nfhsData ?? []).filter(d => d.nfhs4 != null || d.nfhs5 != null);

  /* GSAP entry */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.kdi-section', {
        y: 20, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out',
      });
    }, wrapRef);
    return () => ctx.revert();
  }, [indicator?.no]);

  const handleBack = () => onBack();

  const YEAR_COLORS = ['#FF5500', '#B45309', '#7C3AED'];

  return (
    <div className="ncd-root" ref={wrapRef}>

      {/* ── Topbar ───────────────────────────────────────────────── */}
      <div className="ncd-topbar">
        <div className="ncd-topbar-inner">
          <button className="back-btn" onClick={handleBack}>
            <span className="back-chevron">←</span> Back
          </button>
          <div className="detail-breadcrumb">
            <span className="detail-div-tag">{division?.label}</span>
            <span style={{ color:'#CBD5E1', fontSize:13 }}>›</span>
            <span className="detail-prog-name">{program?.name}</span>
            <span style={{ color:'#CBD5E1', fontSize:13 }}>›</span>
            <span style={{
              fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600,
              color:'#475569', maxWidth:280, overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>
              {indicator?.indicator}
            </span>
          </div>
          <div className="ncd-source-tag">FY 2025-26 · NHM Arunachal Pradesh</div>
          <ThemeToggle />
        </div>
      </div>

      <div className="ncd-content">

        {/* ── KD meta strip ────────────────────────────────────────── */}
        <div className="kdi-section">
          <div className="kdi-meta-strip">
            <div className="kdi-meta-top">
              <span className="kdi-no-badge" style={{ background:`${stColor}18`, color:stColor }}>
                Indicator {indicator?.no}
              </span>
              <span className="kdi-type-pill">{indicator?.type}</span>
              <span className="kdi-source-tag">Source: {indicator?.source}</span>
            </div>
            <div className="kdi-name">{indicator?.indicator}</div>
            {indicator?.statement && (
              <div className="kdi-statement">{indicator.statement}</div>
            )}
          </div>
        </div>

        {/* ── FY 2025-26 Performance — redesigned ─────────────────────── */}
        <div className="kdi-section">
          <div className="perf-card" style={{ borderLeftColor: stColor }}>

            {/* Header */}
            <div className="perf-card-header">
              <span className="perf-card-title">FY 2025-26 Performance</span>
              <span className="perf-status-badge" style={{ background: S_BG[st], color: stColor }}>
                {S_LABEL[st]}
              </span>
            </div>

            {/* Stat columns */}
            <div className="perf-stats">
              <div className="perf-stat">
                <div className="perf-stat-label">Target</div>
                <div className="perf-stat-val perf-stat-target">
                  {indicator?.targetLabel ?? (indicator?.target != null ? `${indicator.target}${indicator?.unit ?? ''}` : '—')}
                </div>
              </div>

              <div className="perf-stat-divider" />

              <div className="perf-stat perf-stat--featured">
                <div className="perf-stat-label">Achievement</div>
                <div className="perf-stat-ach" style={{ color: stColor }}>
                  {indicator?.achievedLabel ?? (indicator?.achievement != null ? `${indicator.achievement}${indicator?.unit ?? ''}` : '—')}
                </div>
              </div>

              {gapVal != null && (
                <>
                  <div className="perf-stat-divider" />
                  <div className="perf-stat">
                    <div className="perf-stat-label">{gapVal >= 0 ? 'Surplus' : 'Deficit'}</div>
                    <div className="perf-stat-val" style={{ color: gapVal >= 0 ? '#059669' : stColor }}>
                      {gapVal >= 0 ? '+' : ''}{gapVal.toFixed(1)}{indicator?.unit ?? ''}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Progress bar */}
            {pct != null && (
              <div className="perf-progress-wrap">
                <div className="perf-progress-track">
                  <div
                    className="perf-progress-fill"
                    style={{ width: `${pct}%`, background: stColor }}
                  />
                </div>
                <div className="perf-progress-labels">
                  <span className="perf-prog-ach-label" style={{ color: stColor }}>
                    {indicator?.achievedLabel ?? `${indicator.achievement}${indicator?.unit ?? ''}`}
                    <span className="perf-prog-pct"> · {pct.toFixed(1)}% of target</span>
                  </span>
                  <span className="perf-prog-target-label">
                    Target {indicator?.targetLabel ?? `${indicator.target}${indicator?.unit ?? ''}`}
                  </span>
                </div>
              </div>
            )}

            {/* Numerator / Denominator */}
            {indicator?.numerator != null && indicator?.denominator != null && (
              <div className="perf-fraction">
                <span className="perf-fraction-label">Numerator</span>
                <span className="perf-fraction-val">{fmt(indicator.numerator)}</span>
                <span className="perf-fraction-sep">/</span>
                <span className="perf-fraction-label">Denominator</span>
                <span className="perf-fraction-val">{fmt(indicator.denominator)}</span>
              </div>
            )}

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            ACHIEVEMENT CHARTS — split: FY (govt) + NFHS (public)
            ════════════════════════════════════════════════════════════ */}
        <div className="kdi-section">
          <div className={`kdi-dial-pair${nfhsRows.length > 0 ? ' kdi-dial-pair--split' : ''}`}>

            {/* Left: FY 2025-26 — Government Data */}
            <div className="ncd-card kdi-dial-card">
              <div className="ncd-card-header">
                <h3>FY 2025-26 Performance</h3>
                <span className="ncd-card-note kdi-data-tag kdi-data-tag--govt">Government Data</span>
              </div>
              <PlotlyFYChart indicator={indicator} status={st} />
            </div>

            {/* Right: NFHS Comparison — only if data exists */}
            {nfhsRows.length > 0 && (
              <div className="ncd-card kdi-dial-card">
                <div className="ncd-card-header">
                  <h3>NFHS Baseline Comparison</h3>
                  <span className="ncd-card-note kdi-data-tag kdi-data-tag--public">Publicly Available · Survey Data</span>
                </div>
                <PlotlyNFHSChart indicator={indicator} nfhsRows={nfhsRows} />
              </div>
            )}

          </div>
        </div>

        {/* ── HMIS Monthly Trend ────────────────────────────────────── */}
        {indicator?.hmisCode && (
          <div className="kdi-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>HMIS Monthly Trend</h3>
                <span className="ncd-card-note">
                  Code {indicator.hmisCode} · All 25 districts · State total
                </span>
              </div>

              {hmisLoading && (
                <div className="hmis-loading">
                  <div className="hmis-spinner" style={{ borderTopColor: stColor }} />
                  Loading HMIS data…
                </div>
              )}

              {hmisError && (
                <div className="hmis-error-card">
                  <div className="hmis-error-title">Unable to load HMIS data</div>
                  <div className="hmis-error-msg">{hmisError}</div>
                </div>
              )}

              {!hmisLoading && !hmisError && trendData.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
                    <defs>
                      {years.map((yr, i) => (
                        <linearGradient key={yr} id={`kdi-grad-${yr}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={YEAR_COLORS[i % 3]} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={YEAR_COLORS[i % 3]} stopOpacity={0.01} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={fmt} />
                    <Tooltip content={<ChartTip />} />
                    {years.map((yr, i) => (
                      <Area key={yr}
                        type="monotone"
                        dataKey={yr}
                        name={yr}
                        stroke={YEAR_COLORS[i % 3]}
                        fill={`url(#kdi-grad-${yr})`}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {!hmisLoading && !hmisError && trendData.length === 0 && rawRows !== null && (
                <div className="kd-empty-state">
                  No monthly HMIS data found for code {indicator.hmisCode}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── District breakdown ────────────────────────────────────── */}
        {distData.length > 0 && (
          <div className="kdi-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>District Performance</h3>
                <span className="ncd-card-note">
                  HMIS · {years.at(-1)} cumulative · all districts
                </span>
              </div>

              <div className="dist-two-col">

                {/* ── District Map ── */}
                <DistrictMap distData={distData} isLight={isLight} />

                {/* ── Insight panel ── */}
                {(() => {
                  const stateTotal   = distData.reduce((s, d) => s + d.value, 0);
                  const top3         = distData.slice(0, 3);
                  const bottom3      = [...distData].sort((a,b) => a.value - b.value).slice(0, 3);
                  const top3Share    = Math.round((top3.reduce((s,d)=>s+d.value,0)/stateTotal)*100);
                  const topDist      = distData[0];
                  const topShare     = Math.round((topDist.value/stateTotal)*100);
                  const allDistricts = DISTRICTS.length;
                  const reporting    = distData.length;
                  const noData       = DISTRICTS.filter(d => !distData.find(r => r.district === d));

                  /* Simple interpretive sentence */
                  const concentration = top3Share >= 50
                    ? `The top 3 districts account for ${top3Share}% of the state total, indicating significant geographic concentration.`
                    : `Cases are relatively spread across districts — the top 3 account for ${top3Share}% of the state total.`;

                  return (
                    <div className="dist-insight-panel">

                      {/* State total */}
                      <div className="dist-insight-block">
                        <div className="dist-insight-label">State Total ({years.at(-1)})</div>
                        <div className="dist-insight-value" style={{ color: stColor }}>
                          {fmt(stateTotal)}
                        </div>
                        <div className="dist-insight-sub">
                          {reporting} of {allDistricts} districts reporting
                        </div>
                      </div>

                      {/* Top districts */}
                      <div className="dist-insight-block">
                        <div className="dist-insight-label">Leading Districts</div>
                        <div className="dist-rank-list">
                          {top3.map((d, i) => (
                            <div key={d.district} className="dist-rank-row">
                              <span className="dist-rank-no" style={{ color: stColor }}>#{i+1}</span>
                              <span className="dist-rank-name">{d.district}</span>
                              <span className="dist-rank-val">{fmt(d.value)}</span>
                              <span className="dist-rank-pct">
                                {Math.round((d.value/stateTotal)*100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lowest districts */}
                      <div className="dist-insight-block">
                        <div className="dist-insight-label">Districts Needing Attention</div>
                        <div className="dist-rank-list">
                          {bottom3.map((d, i) => (
                            <div key={d.district} className="dist-rank-row">
                              <span className="dist-rank-no" style={{ color: '#DC2626' }}>↓</span>
                              <span className="dist-rank-name">{d.district}</span>
                              <span className="dist-rank-val">{fmt(d.value)}</span>
                              <span className="dist-rank-pct">
                                {Math.round((d.value/stateTotal)*100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Narrative */}
                      <div className="dist-insight-narrative">
                        <strong>{topDist.district}</strong> leads with{' '}
                        <strong>{fmt(topDist.value)}</strong> ({topShare}% of state total).{' '}
                        {concentration}
                        {noData.length > 0 && (
                          <> <span className="dist-no-data-note">
                            No data: {noData.slice(0,3).join(', ')}{noData.length > 3 ? ` +${noData.length-3} more` : ''}.
                          </span></>
                        )}
                      </div>

                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        )}

        {/* ── NFHS Baseline table ───────────────────────────────────── */}
        {nfhsRows.length > 0 && (
          <div className="kdi-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>NFHS Baseline — {program?.name}</h3>
                <span className="ncd-card-note">NFHS-4 (2015-16) vs NFHS-5 (2019-21) · Arunachal Pradesh</span>
              </div>
              <div className="kdi-nfhs-table">
                {/* Table header */}
                <div className="kdi-nfhs-head">
                  <div className="kdi-nfhs-head-label">Indicator</div>
                  <div className="kdi-nfhs-head-vals">
                    <span className="kdi-nfhs-head-val h4">NFHS-4</span>
                    <span className="kdi-nfhs-head-arrow" />
                    <span className="kdi-nfhs-head-val h5">NFHS-5</span>
                    <span className="kdi-nfhs-head-change">Change</span>
                  </div>
                </div>
                {nfhsRows.map((d, i) => {
                  const diff = d.nfhs4 != null && d.nfhs5 != null
                    ? (d.nfhs5 - d.nfhs4).toFixed(1) : null;
                  const improved = diff != null
                    ? (d.lowerIsBetter ? d.nfhs5 < d.nfhs4 : d.nfhs5 > d.nfhs4) : null;
                  const diffColor = improved == null ? '#94A3B8' : improved ? '#059669' : '#DC2626';
                  return (
                    <div key={i} className="kdi-nfhs-row">
                      <div className="kdi-nfhs-label">{d.label}</div>
                      <div className="kdi-nfhs-vals">
                        <span className="nfhs-val nfhs4">
                          {d.nfhs4 != null ? `${d.nfhs4}${d.unit}` : '—'}
                        </span>
                        <span className="nfhs-arrow">→</span>
                        <span className="nfhs-val nfhs5">
                          {d.nfhs5 != null ? `${d.nfhs5}${d.unit}` : '—'}
                        </span>
                        {diff != null && (
                          <span className={`nfhs-diff${improved == null ? '' : improved ? ' nfhs-diff--up' : ' nfhs-diff--dn'}`}>
                            {improved ? '↑' : '↓'} {parseFloat(diff) > 0 ? '+' : ''}{diff}{d.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="nfhs-source-note">
                Source: NFHS-4 (2015-16) &amp; NFHS-5 (2019-21) State Fact Sheet — Arunachal Pradesh, IIPS Mumbai.
              </div>
            </div>
          </div>
        )}

      </div>

      <footer className="detail-footer">
        Sources: NHM Key Deliverables FY 2025-26 — NPCC Meeting, Arunachal Pradesh, April 2026.
        HMIS Monthly Data (Apr 2024–Dec 2025). NFHS-5 (2019-21) State Fact Sheet — Arunachal Pradesh.
        Ministry of Health &amp; Family Welfare, Govt. of India.
      </footer>
    </div>
  );
}
