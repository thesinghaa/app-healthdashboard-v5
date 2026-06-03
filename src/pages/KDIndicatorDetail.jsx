/* ═══════════════════════════════════════════════════════════════════════════
   KDIndicatorDetail.jsx
   Layout: Meta → FY Performance → State Map → Monthly Trends → District Comparison
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import ThemeToggle from '../components/ThemeToggle';
import Plot from 'react-plotly.js';
import { useTheme } from '../context/ThemeContext';
import apDistricts from '../data/apDistricts.json';
import {
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ── Division accent colors ──────────────────────────────────────── */
const DIVISION_COLORS = {
  rch:  '#1B6FF5',
  ndcp: '#D97706',
  ncd:  '#7C3AED',
  hss:  '#0F9B82',
  hrh:  '#DC4B2A',
};

/* ── Per-division choropleth colorscales (light mode) ────────────── */
const DIVISION_SCALES = {
  rch:  [[0,'#DBEAFE'],[0.33,'#93C5FD'],[0.66,'#3B82F6'],[1,'#1E40AF']],
  ndcp: [[0,'#FEF3C7'],[0.33,'#FCD34D'],[0.66,'#F59E0B'],[1,'#92400E']],
  ncd:  [[0,'#EDE9FE'],[0.33,'#C4B5FD'],[0.66,'#7C3AED'],[1,'#4C1D95']],
  hss:  [[0,'#CCFBF1'],[0.33,'#5EEAD4'],[0.66,'#0F9B82'],[1,'#065F46']],
  hrh:  [[0,'#FEE2E2'],[0.33,'#FCA5A5'],[0.66,'#EF4444'],[1,'#7F1D1D']],
};

/* ── Sheet config ────────────────────────────────────────────────── */
const SHEET_ID = '1vsCSdPZpBK5SQw9gppRLEEKDLhj19DHk';
const CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

const MONTH_ORDER = ['April','May','June','July','August','September','October','November','December','January','February','March'];
const MONTH_SHORT = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const DISTRICTS   = [
  'Changlang','Dibang Valley','East Kameng','Anjaw','East Siang','Kamle',
  'Kra Daadi','Kurung Kumey','Leparada','Lohit','Longding',
  'Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai',
  'Pakke Kessang','Papum Pare','Shi Yomi','Siang','Tawang','Tirap',
  'Upper Siang','Upper Subansiri','West Kameng','West Siang',
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

const S_COLOR = { achieved: '#059669', close: '#D97706', gap: '#DC2626', neutral: '#94A3B8' };
const S_LABEL = { achieved: 'Achieved', close: 'Near Target', gap: 'Gap', neutral: 'No Data' };
const S_BG    = { achieved: '#ECFDF5', close: '#FFFBEB', gap: '#FEF2F2', neutral: '#F8FAFC' };

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}K`;
  return Number(n).toLocaleString();
}

/* ── CSV parser ──────────────────────────────────────────────────── */
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

/* ── HMIS fetch ──────────────────────────────────────────────────── */
async function fetchHMIS(hmisCode, hmisCat) {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/"/g, '').trim());
  const COL = {
    year:  headers.findIndex(h => /^year$/i.test(h)),
    month: headers.findIndex(h => /^month$/i.test(h)),
    cat:   headers.findIndex(h => /^category$/i.test(h)),
    code:  headers.findIndex(h => /data item code/i.test(h)),
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
    const catMatch = r[COL.cat]?.replace(/"/g, '').match(/^(M\d+)/);
    if (!catMatch) continue;
    if (hmisCat && catMatch[1] !== hmisCat) continue;
    const code = r[COL.code]?.replace(/"/g, '').trim().replace(/\.$/, '');
    if (code !== hmisCode) continue;

    const distTotals = {};
    DISTRICTS.forEach(d => {
      const raw = r[distCols[d]]?.replace(/"/g, '').replace(/,/g, '').trim();
      distTotals[d] = parseFloat(raw) || 0;
    });
    const stateTotal = Object.values(distTotals).reduce((s, v) => s + v, 0);
    out.push({
      year:  r[COL.year]?.replace(/"/g, '').trim(),
      month: r[COL.month]?.replace(/"/g, '').trim(),
      code, stateTotal, distTotals,
    });
  }
  return out;
}

/* ── NFHS palette ────────────────────────────────────────────────── */
const N5_PAL = { leaf: '#7C3AED', empty: '#DDD6FE' };
const N4_PAL = { leaf: '#D97706', empty: '#FDE68A' };

/* ── Precompute AP geography ─────────────────────────────────────── */
const ALL_FEATURES  = apDistricts.features;
const ALL_NAMES     = ALL_FEATURES.map(f => f.properties.DISTRICT);

function centroidOf(feature) {
  const coords = feature.geometry.type === 'Polygon'
    ? feature.geometry.coordinates[0]
    : feature.geometry.coordinates.reduce((best, poly) =>
        poly[0].length > best.length ? poly[0] : best, []);
  const lon = coords.reduce((s, p) => s + p[0], 0) / coords.length;
  const lat = coords.reduce((s, p) => s + p[1], 0) / coords.length;
  return [lon, lat];
}
const ALL_CENTROIDS = ALL_FEATURES.map(centroidOf);

const AP_ZOOM = [
  null,
  { lon: [91.5, 97.5], lat: [26.4, 29.7] },
  { lon: [92.2, 97.0], lat: [26.7, 29.4] },
  { lon: [93.0, 96.5], lat: [27.1, 29.1] },
  { lon: [93.5, 96.0], lat: [27.3, 28.9] },
];

/* ══════════════════════════════════════════════════════════════════
   DistrictChoropleth
   AP choropleth — works in full-size (state map) and compact (compare panels)
   ══════════════════════════════════════════════════════════════════ */
function DistrictChoropleth({ distData, selectedDistrict, onSelectDistrict, isLight, compact, divId }) {
  const [zoom, setZoom] = useState(1);

  const valueMap = useMemo(() =>
    Object.fromEntries((distData || []).map(d => [d.district, d.value])),
  [distData]);

  const values    = ALL_NAMES.map(n => valueMap[n] ?? null);
  const validVals = values.filter(v => v != null);
  const maxVal    = validVals.length > 0 ? Math.max(...validVals) : 1;

  const SCALE_LIGHT = DIVISION_SCALES[divId] || DIVISION_SCALES.rch;
  const SCALE_DARK  = [[0, '#93C5FD'], [0.33, '#A5B4FC'], [0.66, '#C7D2FE'], [1, '#F8FAFC']];

  const choropleth = {
    type: 'choropleth',
    geojson: apDistricts,
    featureidkey: 'properties.DISTRICT',
    locations: ALL_NAMES,
    z: values,
    colorscale: isLight ? SCALE_LIGHT : SCALE_DARK,
    zmin: 0, zmax: maxVal,
    showscale: false,
    marker: {
      line: {
        color: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)',
        width: 1.2,
      },
    },
    hovertemplate: '<b>%{location}</b><br>%{z:,}<extra></extra>',
  };

  /* Selected-district ring overlay */
  const selIdx = selectedDistrict ? ALL_NAMES.indexOf(selectedDistrict) : -1;
  const ringTrace = selIdx >= 0 ? {
    type: 'scattergeo',
    mode: 'markers',
    lon: [ALL_CENTROIDS[selIdx][0]],
    lat: [ALL_CENTROIDS[selIdx][1]],
    marker: {
      size: compact ? 14 : 20,
      color: 'rgba(255,255,255,0)',
      symbol: 'circle',
      line: { color: '#FFFFFF', width: compact ? 2.5 : 3.5 },
    },
    hoverinfo: 'skip',
    showlegend: false,
  } : null;

  const zl = compact ? 1 : zoom;
  const layout = {
    geo: {
      visible: false,
      projection: { type: 'mercator' },
      bgcolor: 'transparent',
      domain: { x: [0, 1], y: [0, 1] },
      ...(zl === 0
        ? { fitbounds: 'geojson' }
        : { lonaxis: { range: AP_ZOOM[zl].lon }, lataxis: { range: AP_ZOOM[zl].lat } }
      ),
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { t: 0, b: 0, l: 0, r: 0 },
    autosize: true,
    height: compact ? 210 : 390,
    hoverlabel: {
      bgcolor: 'rgba(15,23,42,0.94)',
      bordercolor: 'rgba(99,102,241,0.6)',
      font: { color: '#ffffff', size: 12, family: "'Inter', sans-serif" },
      align: 'center',
    },
  };

  const traces = ringTrace ? [choropleth, ringTrace] : [choropleth];

  const btn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 18, lineHeight: 1, fontWeight: 700,
    background: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(30,40,60,0.88)',
    color: isLight ? '#1E293B' : '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
  };

  return (
    <div style={{ position: 'relative' }}>
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
        onClick={(ev) => {
          const pt = ev.points?.[0];
          if (pt?.location && onSelectDistrict) onSelectDistrict(pt.location);
        }}
      />
      {!compact && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10,
        }}>
          <button
            style={{ ...btn, opacity: zoom >= AP_ZOOM.length - 1 ? 0.35 : 1 }}
            onClick={() => setZoom(z => Math.min(z + 1, AP_ZOOM.length - 1))}
            disabled={zoom >= AP_ZOOM.length - 1}
          >+</button>
          <button
            style={{ ...btn, opacity: zoom <= 0 ? 0.35 : 1 }}
            onClick={() => setZoom(z => Math.max(z - 1, 0))}
            disabled={zoom <= 0}
          >−</button>
        </div>
      )}
      {compact && onSelectDistrict && !selectedDistrict && (
        <div className="kdi-map-hint">Click to select</div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DistrictSparkline — monthly line chart for a single district
   ══════════════════════════════════════════════════════════════════ */
function DistrictSparkline({ rawRows, district, accentColor }) {
  const years = useMemo(() =>
    rawRows ? [...new Set(rawRows.map(r => r.year))].sort() : [],
  [rawRows]);

  const trendData = useMemo(() => {
    if (!rawRows?.length || !district) return [];
    const yearMap = {};
    rawRows.forEach(r => {
      if (!yearMap[r.year]) yearMap[r.year] = {};
      const moIdx = MONTH_ORDER.findIndex(m => m.toLowerCase() === r.month.toLowerCase());
      const moKey = moIdx >= 0 ? MONTH_SHORT[moIdx] : r.month.slice(0, 3);
      yearMap[r.year][moKey] = (yearMap[r.year][moKey] ?? 0) + (r.distTotals[district] ?? 0);
    });
    return MONTH_SHORT.map(mo => {
      const row = { month: mo };
      years.forEach(yr => { row[yr] = yearMap[yr]?.[mo] ?? 0; });
      return row;
    }).filter(row => years.some(yr => row[yr] > 0));
  }, [rawRows, district, years]);

  const COLORS = [accentColor, 'rgba(148,163,184,0.6)', 'rgba(203,213,225,0.5)'];

  if (!district) return (
    <div className="kdi-spark-empty">Select a district to view trend</div>
  );
  if (!trendData.length) return (
    <div className="kdi-spark-empty">No monthly data available</div>
  );

  return (
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={trendData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94A3B8' }} />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} tickFormatter={fmt} width={42} />
        <Tooltip content={<ChartTip />} />
        {years.map((yr, i) => (
          <Line key={yr}
            type="monotone" dataKey={yr} name={yr}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={i === years.length - 1 ? 2 : 1.5}
            dot={false}
            strokeOpacity={i === years.length - 1 ? 1 : 0.55}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ComparePanel — one side of the district comparison section
   ══════════════════════════════════════════════════════════════════ */
function ComparePanel({ label, accentColor, rawRows, distData, district, onSetDistrict, isLight, divId }) {
  const distStats = useMemo(() => {
    if (!district || !distData?.length) return null;
    const sorted     = [...distData].sort((a, b) => b.value - a.value);
    const stateTotal = distData.reduce((s, d) => s + d.value, 0);
    const found      = distData.find(d => d.district === district);
    if (!found) return null;
    const rank  = sorted.findIndex(d => d.district === district) + 1;
    const share = stateTotal > 0 ? Math.round((found.value / stateTotal) * 100) : 0;
    return { total: found.value, rank, share };
  }, [district, distData]);

  return (
    <div className="kdi-cp">
      {/* Header bar */}
      <div className="kdi-cp-hdr" style={{ borderLeftColor: accentColor }}>
        <span className="kdi-cp-label" style={{ color: accentColor }}>{label}</span>
        <select
          className="kdi-cp-select"
          value={district || ''}
          onChange={e => onSetDistrict(e.target.value || null)}
        >
          <option value="">Select district...</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Mini choropleth — click to select */}
      <div className="kdi-cp-map">
        <DistrictChoropleth
          distData={distData}
          selectedDistrict={district}
          onSelectDistrict={onSetDistrict}
          isLight={isLight}
          compact
          divId={divId || 'rch'}
        />
      </div>

      {/* Monthly trend sparkline */}
      <div className="kdi-cp-spark">
        <div className="kdi-cp-section-lbl">Monthly Trend</div>
        <DistrictSparkline rawRows={rawRows} district={district} accentColor={accentColor} />
      </div>

      {/* Stats strip */}
      {distStats ? (
        <div className="kdi-cp-stats">
          <div className="kdi-cp-stat">
            <div className="kdi-cp-stat-val" style={{ color: accentColor }}>{fmt(distStats.total)}</div>
            <div className="kdi-cp-stat-lbl">Cumulative</div>
          </div>
          <div className="kdi-cp-stat">
            <div className="kdi-cp-stat-val" style={{ color: accentColor }}>#{distStats.rank}</div>
            <div className="kdi-cp-stat-lbl">State Rank</div>
          </div>
          <div className="kdi-cp-stat">
            <div className="kdi-cp-stat-val" style={{ color: accentColor }}>{distStats.share}%</div>
            <div className="kdi-cp-stat-lbl">State Share</div>
          </div>
        </div>
      ) : (
        <div className="kdi-cp-no-data">
          {district ? 'No data for this district' : 'Select above or click the map'}
        </div>
      )}
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

/* ── NFHS Baseline Chart ─────────────────────────────────────────── */
function PlotlyNFHSChart({ indicator, nfhsRows }) {
  const { theme } = useTheme();
  const isLight   = theme === 'light';

  const nfhs5Row = nfhsRows?.find(r => r.unit === '%' && r.nfhs5 != null);
  const nfhs4Row = nfhsRows?.find(r => r.unit === '%' && r.nfhs4 != null);
  const n5Pct    = nfhs5Row ? Math.min(Math.max(nfhs5Row.nfhs5, 0), 100) : null;
  const n4Pct    = nfhs4Row ? Math.min(Math.max(nfhs4Row.nfhs4, 0), 100) : null;

  const textColor = isLight ? '#1E293B' : '#E2E8F0';
  const tickColor = isLight ? '#475569' : '#94A3B8';
  const gridColor = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)';
  const restColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';

  const yLabels  = ['NFHS-4 (2015-16)', 'NFHS-5 (2019-21)'];
  const barTrace = {
    type: 'bar', orientation: 'h',
    y: yLabels, x: [n4Pct ?? 0, n5Pct ?? 0],
    marker: { color: [N4_PAL.leaf, N5_PAL.leaf], line: { color: 'transparent', width: 0 } },
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
  const restTrace = {
    type: 'bar', orientation: 'h',
    y: yLabels, x: [100 - (n4Pct ?? 0), 100 - (n5Pct ?? 0)],
    marker: { color: restColor, line: { color: 'transparent', width: 0 } },
    hoverinfo: 'skip', showlegend: false,
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
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    margin: { t: 12, b: 36, l: 140, r: 64 },
    height: 170, bargap: 0.38,
    xaxis: {
      range: [0, 115], ticksuffix: '%',
      tickfont: { family: "'Inter', sans-serif", size: 11, color: tickColor },
      gridcolor: gridColor, showline: false, zeroline: false,
    },
    yaxis: {
      tickfont: { family: "'Inter', sans-serif", size: 12, color: textColor },
      showgrid: false, showline: false, automargin: true,
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
            <span><strong>NFHS-5:</strong> {nfhs5Row?.nfhs5}{nfhs5Row?.unit}</span>
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

/* ══════════════════════════════════════════════════════════════════
   Main page component
   ══════════════════════════════════════════════════════════════════ */
export default function KDIndicatorDetail({ indicator, program, division, onBack }) {
  const wrapRef = useRef(null);

  const [rawRows,     setRawRows]     = useState(null);
  const [hmisError,   setHmisError]   = useState(null);
  const [hmisLoading, setHmisLoading] = useState(false);
  const [compDistA,   setCompDistA]   = useState(null);
  const [compDistB,   setCompDistB]   = useState(null);

  const { theme } = useTheme();
  const isLight   = theme === 'light';
  const st        = kdStatus(indicator ?? {});
  const stColor   = S_COLOR[st];
  const divId     = division?.id;
  const divColor  = DIVISION_COLORS[divId] || '#1B6FF5';

  /* FY stats */
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

  /* Monthly state trend */
  const years = useMemo(() =>
    rawRows ? [...new Set(rawRows.map(r => r.year))].sort() : [],
  [rawRows]);

  const trendData = useMemo(() => {
    if (!rawRows?.length) return [];
    const yearMap = {};
    rawRows.forEach(r => {
      if (!yearMap[r.year]) yearMap[r.year] = {};
      const moIdx = MONTH_ORDER.findIndex(m => m.toLowerCase() === r.month.toLowerCase());
      const moKey = moIdx >= 0 ? MONTH_SHORT[moIdx] : r.month.slice(0, 3);
      yearMap[r.year][moKey] = (yearMap[r.year][moKey] ?? 0) + r.stateTotal;
    });
    return MONTH_SHORT.map(mo => {
      const row = { month: mo };
      Object.keys(yearMap).sort().forEach(yr => { row[yr] = yearMap[yr]?.[mo] ?? 0; });
      return row;
    }).filter(row => Object.keys(yearMap).some(yr => row[yr] > 0));
  }, [rawRows]);

  /* District breakdown (latest year cumulative) */
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

  /* Init comparison districts when data loads */
  useEffect(() => {
    if (distData.length >= 1 && !compDistA) setCompDistA(distData[0].district);
    if (distData.length >= 2 && !compDistB) setCompDistB(distData[1].district);
  }, [distData]);

  /* NFHS data — fuzzy-match to this specific indicator only */
  const STOP = new Set(['of','in','for','and','the','a','an','by','to','with','at','on','per','its']);
  function nfhsScore(indName, rowLabel) {
    const tok = s => s.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !STOP.has(w));
    const a = tok(indName), b = tok(rowLabel);
    if (!a.length || !b.length) return 0;
    const hits = a.filter(w => b.some(w2 => w2.startsWith(w) || w.startsWith(w2))).length;
    return hits / Math.min(a.length, b.length);
  }
  const allNfhs   = (program?.nfhsData ?? []).filter(d => d.nfhs4 != null || d.nfhs5 != null);
  const nfhsMatch = indicator?.indicator
    ? allNfhs.reduce((best, row) => {
        const s = nfhsScore(indicator.indicator, row.label);
        return s > best.score ? { row, score: s } : best;
      }, { row: null, score: 0 })
    : { row: null, score: 0 };
  /* Only show if match confidence > 40% */
  const nfhsRow   = nfhsMatch.score >= 0.4 ? nfhsMatch.row : null;

  /* GSAP entry */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.kdi-section', {
        y: 20, opacity: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out',
      });
    }, wrapRef);
    return () => ctx.revert();
  }, [indicator?.no]);

  const scale = DIVISION_SCALES[divId] || DIVISION_SCALES.rch;
  const YEAR_COLORS = [scale[3][1], scale[2][1], scale[1][1]];

  return (
    <div className="ncd-root" ref={wrapRef} style={{ '--dc': divColor }}>

      {/* ── Topbar ───────────────────────────────────────────────── */}
      <div className="ncd-topbar">
        <div className="ncd-topbar-inner">
          <button className="back-btn" onClick={onBack}>
            <span className="back-chevron">←</span> Back
          </button>
          <div className="detail-breadcrumb">
            <span className="detail-div-tag">{division?.label}</span>
            <span style={{ color: '#CBD5E1', fontSize: 13 }}>›</span>
            <span className="detail-prog-name">{program?.name}</span>
            <span style={{ color: '#CBD5E1', fontSize: 13 }}>›</span>
            <span style={{
              fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600,
              color: '#475569', maxWidth: 280, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {indicator?.indicator}
            </span>
          </div>
          <div className="ncd-source-tag">FY 2025-26 · NHM Arunachal Pradesh</div>
          <ThemeToggle />
        </div>
      </div>

      <div className="ncd-content">

        {/* ══ HERO BAND ══ */}
        <div className="kdi-hero-band">
          {/* Left: identity */}
          <div className="kdi-hero-left">
            <div className="kdi-meta-tags">
              <span className="kdi-no-badge" style={{ background: `${divColor}18`, color: divColor, borderColor: `${divColor}30` }}>
                KD #{indicator?.no}
              </span>
              {indicator?.type && <span className="kdi-type-pill">{indicator.type}</span>}
              {indicator?.hmisCode && <span className="kdi-hmis-tag">HMIS {indicator.hmisCode}</span>}
            </div>
            <div className="kdi-name">{indicator?.indicator}</div>
            {indicator?.statement && <div className="kdi-statement">{indicator.statement}</div>}
            {indicator?.lowerIsBetter && <div className="kdi-lib-note">Lower value is better</div>}
            {/* Quick stat strip */}
            {indicator?.numerator != null && indicator?.denominator != null && (
              <div className="kdi-quick-strip">
                <div className="kdi-qs-item">
                  <div className="kdi-qs-val">{fmt(indicator.numerator)}</div>
                  <div className="kdi-qs-lbl">Numerator</div>
                </div>
                <div className="kdi-qs-div" />
                <div className="kdi-qs-item">
                  <div className="kdi-qs-val">{fmt(indicator.denominator)}</div>
                  <div className="kdi-qs-lbl">Denominator</div>
                </div>
                {pct != null && (
                  <>
                    <div className="kdi-qs-div" />
                    <div className="kdi-qs-item">
                      <div className="kdi-qs-val" style={{ color: divColor }}>{pct.toFixed(1)}%</div>
                      <div className="kdi-qs-lbl">of Target</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: achievement */}
          <div className="kdi-hero-right">
            <div className="kdi-hero-right-top">
              <span className="kdi-perf-year">FY 2025-26 Performance</span>
              <span className="perf-status-badge" style={{ background: S_BG[st], color: stColor }}>{S_LABEL[st]}</span>
            </div>
            <div className="kdi-ach-display" style={{ color: divColor }}>
              {indicator?.achievedLabel ?? (indicator?.achievement != null ? `${indicator.achievement}${indicator?.unit ?? ''}` : '—')}
            </div>
            <div className="kdi-ach-sub">
              <span>Target <strong>{indicator?.targetLabel ?? (indicator?.target != null ? `${indicator.target}${indicator?.unit ?? ''}` : '—')}</strong></span>
              {gapVal != null && (
                <span className="kdi-ach-gap" style={{ color: gapVal >= 0 ? '#059669' : stColor }}>
                  {gapVal >= 0 ? '▲' : '▼'} {Math.abs(gapVal).toFixed(1)}{indicator?.unit ?? ''} {gapVal >= 0 ? 'surplus' : 'deficit'}
                </span>
              )}
            </div>
            {pct != null && (
              <div className="kdi-hero-progress">
                <div className="perf-progress-track">
                  <div className="perf-progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: divColor }} />
                </div>
                <div className="kdi-hero-prog-label">
                  <span style={{ color: divColor }}>{pct.toFixed(1)}% of target achieved</span>
                  <span>Target {indicator?.targetLabel ?? `${indicator?.target}${indicator?.unit ?? ''}`}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══ SECTION 2: District Performance Map ══════════════════════ */}
        {(distData.length > 0 || hmisLoading) && (
          <>
          <div className="kdi-step-label">
            <span className="kdi-step-num" style={{ background: divColor }}>01</span>
            <span className="kdi-step-title">District Performance</span>
            <div className="kdi-step-line" />
          </div>
          <div className="kdi-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>District Performance Map</h3>
                <span className="ncd-card-note">
                  {years.at(-1)} cumulative · {distData.length} districts reporting · Click district to compare
                </span>
              </div>

              {hmisLoading && (
                <div className="hmis-loading">
                  <div className="hmis-spinner" style={{ borderTopColor: divColor }} />
                  Loading district data…
                </div>
              )}

              {!hmisLoading && distData.length > 0 && (
                <div className="kdi-map-insight-row">
                  {/* Full choropleth */}
                  <div className="kdi-map-main">
                    <DistrictChoropleth
                      distData={distData}
                      selectedDistrict={compDistA}
                      onSelectDistrict={setCompDistA}
                      isLight={isLight}
                      divId={division?.id}
                    />
                    <div className="kdi-map-caption">
                      Click any district to select it for comparison below
                    </div>
                  </div>

                  {/* Insight panel */}
                  {(() => {
                    const stateTotal = distData.reduce((s, d) => s + d.value, 0);
                    const top3       = distData.slice(0, 3);
                    const bottom3    = [...distData].sort((a, b) => a.value - b.value).slice(0, 3);
                    const top3Share  = Math.round((top3.reduce((s, d) => s + d.value, 0) / stateTotal) * 100);
                    const topDist    = distData[0];
                    const topShare   = Math.round((topDist.value / stateTotal) * 100);
                    const noData     = DISTRICTS.filter(d => !distData.find(r => r.district === d));
                    const concentration = top3Share >= 50
                      ? `Top 3 districts account for ${top3Share}% — significant geographic concentration.`
                      : `Cases spread across districts — top 3 account for ${top3Share}%.`;

                    return (
                      <div className="dist-insight-panel">
                        <div className="dist-insight-block">
                          <div className="dist-insight-label">State Total ({years.at(-1)})</div>
                          <div className="dist-insight-value" style={{ color: divColor }}>
                            {fmt(stateTotal)}
                          </div>
                          <div className="dist-insight-sub">
                            {distData.length} of {DISTRICTS.length} districts reporting
                          </div>
                        </div>

                        <div className="dist-insight-block">
                          <div className="dist-insight-label">Leading Districts</div>
                          <div className="dist-rank-list">
                            {top3.map((d, i) => (
                              <div key={d.district} className="dist-rank-row">
                                <span className="dist-rank-no" style={{ color: divColor }}>#{i + 1}</span>
                                <span className="dist-rank-name">{d.district}</span>
                                <span className="dist-rank-val">{fmt(d.value)}</span>
                                <span className="dist-rank-pct">
                                  {Math.round((d.value / stateTotal) * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="dist-insight-block">
                          <div className="dist-insight-label">Needs Attention</div>
                          <div className="dist-rank-list">
                            {bottom3.map(d => (
                              <div key={d.district} className="dist-rank-row">
                                <span className="dist-rank-no" style={{ color: '#DC2626' }}>↓</span>
                                <span className="dist-rank-name">{d.district}</span>
                                <span className="dist-rank-val">{fmt(d.value)}</span>
                                <span className="dist-rank-pct">
                                  {Math.round((d.value / stateTotal) * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="dist-insight-narrative">
                          <strong>{topDist.district}</strong> leads with{' '}
                          <strong>{fmt(topDist.value)}</strong> ({topShare}% of state).{' '}
                          {concentration}
                          {noData.length > 0 && (
                            <span className="dist-no-data-note">
                              {' '}No data: {noData.slice(0, 3).join(', ')}{noData.length > 3 ? ` +${noData.length - 3} more` : ''}.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* ══ SECTION 3: Monthly Trends (State Level) ══════════════════ */}
        {indicator?.hmisCode && (
          <>
          <div className="kdi-step-label">
            <span className="kdi-step-num" style={{ background: divColor }}>02</span>
            <span className="kdi-step-title">Monthly Trends</span>
            <div className="kdi-step-line" />
          </div>
          <div className="kdi-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>Monthly Trends</h3>
                <span className="ncd-card-note">
                  HMIS Code {indicator.hmisCode} · State total · All districts combined
                </span>
              </div>

              {hmisLoading && (
                <div className="hmis-loading">
                  <div className="hmis-spinner" style={{ borderTopColor: divColor }} />
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
                <ResponsiveContainer width="100%" height={300}>
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
                        type="monotone" dataKey={yr} name={yr}
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
                  No monthly data found for HMIS code {indicator.hmisCode}.
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {/* ══ SECTION 4: District Comparison — Two Maps ════════════════ */}
        {rawRows?.length > 0 && distData.length > 0 && (
          <>
          <div className="kdi-step-label">
            <span className="kdi-step-num" style={{ background: divColor }}>03</span>
            <span className="kdi-step-title">District Comparison</span>
            <div className="kdi-step-line" />
          </div>
          <div className="kdi-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>District Comparison</h3>
                <span className="ncd-card-note">
                  Select two districts — use dropdown or click on the map
                </span>
              </div>

              <div className="kdi-compare-grid">
                <ComparePanel
                  label="District A"
                  accentColor={divColor}
                  rawRows={rawRows}
                  distData={distData}
                  district={compDistA}
                  onSetDistrict={setCompDistA}
                  isLight={isLight}
                  divId={divId}
                />
                <ComparePanel
                  label="District B"
                  accentColor={divColor}
                  rawRows={rawRows}
                  distData={distData}
                  district={compDistB}
                  onSetDistrict={setCompDistB}
                  isLight={isLight}
                  divId={divId}
                />
              </div>
            </div>
          </div>
          </>
        )}

        {/* ══ SECTION 5: NFHS Baseline ════════════════════════════════ */}
        {nfhsRow && (() => {
          const diff     = nfhsRow.nfhs4 != null && nfhsRow.nfhs5 != null ? (nfhsRow.nfhs5 - nfhsRow.nfhs4) : null;
          const improved = diff != null ? (nfhsRow.lowerIsBetter ? diff < 0 : diff > 0) : null;
          const rowMax   = Math.max(nfhsRow.nfhs4 ?? 0, nfhsRow.nfhs5 ?? 0) || 1;
          const pct4     = nfhsRow.nfhs4 != null ? Math.round((nfhsRow.nfhs4 / rowMax) * 100) : 0;
          const pct5     = nfhsRow.nfhs5 != null ? Math.round((nfhsRow.nfhs5 / rowMax) * 100) : 0;
          const diffStr  = diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}${nfhsRow.unit}` : null;
          const trendColor = improved === true ? '#059669' : improved === false ? '#DC2626' : '#64748B';
          return (
            <>
            <div className="kdi-step-label">
              <span className="kdi-step-num" style={{ background: divColor }}>04</span>
              <span className="kdi-step-title">NFHS Baseline</span>
              <div className="kdi-step-line" />
            </div>
            <div className="kdi-section">
              <div className="ncd-card">
                <div className="ncd-card-header">
                  <h3>Survey Baseline</h3>
                  <span className="ncd-card-note">NFHS-4 (2015-16) vs NFHS-5 (2019-21) · Arunachal Pradesh</span>
                </div>
                <div className="kdi-nfhs-single">
                  <div className="kdi-nfhs-single-label">{nfhsRow.label}</div>
                  <div className="kdi-nfhs-single-bars">
                    <div className="kdi-nfhs-single-row">
                      <span className="nfhs-bar-tag nfhs-bar-tag--4">NFHS-4</span>
                      <div className="nfhs-bar-track">
                        <div className="nfhs-bar nfhs-bar--4" style={{ width: `${pct4}%` }} />
                      </div>
                      <span className="kdi-nfhs-single-num">{nfhsRow.nfhs4 != null ? `${nfhsRow.nfhs4}${nfhsRow.unit}` : '—'}</span>
                    </div>
                    <div className="kdi-nfhs-single-row">
                      <span className="nfhs-bar-tag nfhs-bar-tag--5">NFHS-5</span>
                      <div className="nfhs-bar-track">
                        <div className="nfhs-bar nfhs-bar--5" style={{ width: `${pct5}%` }} />
                      </div>
                      <span className="kdi-nfhs-single-num">{nfhsRow.nfhs5 != null ? `${nfhsRow.nfhs5}${nfhsRow.unit}` : '—'}</span>
                    </div>
                  </div>
                  {diffStr && (
                    <div className="kdi-nfhs-single-change" style={{ color: trendColor }}>
                      {improved === true ? '▲' : improved === false ? '▼' : ''} {diffStr} since NFHS-4
                    </div>
                  )}
                </div>
                <div className="nfhs-source-note">
                  Source: NFHS-4 (2015-16) &amp; NFHS-5 (2019-21) State Fact Sheet — Arunachal Pradesh, IIPS Mumbai.
                </div>
              </div>
            </div>
            </>
          );
        })()}

      </div>

      <footer className="detail-footer">
        Sources: NHM Key Deliverables FY 2025-26 — NPCC Meeting, Arunachal Pradesh, April 2026.
        HMIS Monthly Data (Apr 2024–Dec 2025). NFHS-5 (2019-21) State Fact Sheet — Arunachal Pradesh.
        Ministry of Health &amp; Family Welfare, Govt. of India.
      </footer>
    </div>
  );
}
