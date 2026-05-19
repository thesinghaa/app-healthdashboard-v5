import { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import '../styles/ncd.css';
import KDDetailPage from './KDDetailPage';

/* ── Sheet config ────────────────────────────────────────────────── */
const SHEET_ID       = '1vsCSdPZpBK5SQw9gppRLEEKDLhj19DHk';
const DATA_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;
const CSV_URL        = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;

const DISTRICTS = [
  'Changlang','Dibang Valley','East Kameng','Anjaw','East Siang',
  'Kamle','Kra Daadi','Kurung Kumey','Leparada','Lohit','Longding',
  'Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai',
  'Pakke Kessang','Papum Pare','Shi Yomi','Siang','Tawang',
  'Tirap','Upper Siang','Upper Subansiri','West Kameng','West Siang',
];

const MONTH_ORDER = ['April','May','June','July','August','September','October','November','December','January','February','March'];
const MONTH_SHORT  = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

/* ── Category config ─────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'M1', label: 'ANC',           fullName: 'Ante Natal Care',           color: '#00b5cc' },
  { id: 'M2', label: 'Deliveries',    fullName: 'Deliveries',                color: '#059669' },
  { id: 'M3', label: 'C-Sections',   fullName: 'Caesarean Deliveries',       color: '#B45309' },
  { id: 'M4', label: 'Outcomes',      fullName: 'Pregnancy & Newborn',        color: '#B45309' },
  { id: 'M5', label: 'Anaemia',       fullName: 'Anaemia Mukt Bharat',        color: '#C0392B' },
  { id: 'M8', label: 'Fam. Planning', fullName: 'Family Planning',            color: '#1E40AF' },
  { id: 'M9', label: 'Immunisation',  fullName: 'Child Immunisation',         color: '#0891B2' },
];

/* Key codes to highlight per category — {code, label, shortLabel, isKpi} */
const KEY_ITEMS = {
  M1: [
    { code: '1.1',   label: 'New ANC Registered',          shortLabel: 'New ANC',       isKpi: true  },
    { code: '1.1.1', label: '1st Trimester Registration',  shortLabel: '1st Trimester', isKpi: true  },
    { code: '1.2.7', label: '4+ ANC Check-ups',            shortLabel: '4+ ANC',        isKpi: true  },
    { code: '1.4.2', label: 'Anaemia Detected (Hb<11)',    shortLabel: 'Anaemia (Hb<11)',isKpi: true  },
    { code: '1.3.1', label: 'HTN in Pregnancy (new)',      shortLabel: 'HTN Detected',   isKpi: false },
    { code: '1.5.2', label: 'GDM Positive (OGTT)',         shortLabel: 'GDM Positive',   isKpi: false },
  ],
  M2: [
    { code: '2.2',     label: 'Institutional Deliveries',  shortLabel: 'Inst. Del.',    isKpi: true  },
    { code: '2.1.1.a', label: 'Home Deliveries (SBA)',     shortLabel: 'Home (SBA)',     isKpi: true  },
    { code: '2.1.1.b', label: 'Home Deliveries (Non-SBA)', shortLabel: 'Home (Non-SBA)',isKpi: true  },
    { code: '2.4',     label: 'HBNC Visits (6 visits)',    shortLabel: 'HBNC (6v)',      isKpi: true  },
    { code: '2.5',     label: 'Sick Newborns Referred',    shortLabel: 'Sick NB Ref.',   isKpi: false },
  ],
  M3: [
    { code: '3.1',   label: 'Total C-Sections',            shortLabel: 'C-Sections',    isKpi: true  },
    { code: '3.1.1', label: 'Night C-Sections (8PM-8AM)', shortLabel: 'Night C-Sec',    isKpi: true  },
    { code: '3.1.2', label: 'Stay 72h+ After C-Section',  shortLabel: '72h+ Stay',      isKpi: true  },
  ],
  M4: [
    { code: '4.1.1.a', label: 'Live Births — Male',         shortLabel: 'Live M',        isKpi: true  },
    { code: '4.1.1.b', label: 'Live Births — Female',       shortLabel: 'Live F',        isKpi: true  },
    { code: '4.1.2',   label: 'Pre-term Newborns (<37wk)', shortLabel: 'Pre-term',       isKpi: true  },
    { code: '4.4.2',   label: 'Low Birth Weight (<2500g)', shortLabel: 'LBW',            isKpi: true  },
    { code: '4.4.3',   label: 'Breastfed Within 1 Hour',   shortLabel: 'EBF 1hr',        isKpi: false },
    { code: '4.1.3.a', label: 'Intrapartum Stillbirths',   shortLabel: 'Stillbirth',     isKpi: false },
  ],
  M5: [
    { code: '5.1.1', label: 'IFA to WRA (20-49 yrs)',      shortLabel: 'IFA WRA',        isKpi: true  },
    { code: '5.1.2', label: 'IFA Syrup to Children',       shortLabel: 'IFA Children',   isKpi: true  },
    { code: '5.2.1.b',label: 'Adolescent Girls Anaemic',   shortLabel: 'Adol. Anaemia',  isKpi: true  },
    { code: '5.2.2.b',label: 'Severe Anaemia — Adol. Girls',shortLabel: 'Severe Anaemia',isKpi: true  },
    { code: '5.2.3.b',label: 'Anaemic Girls on Treatment', shortLabel: 'On Treatment',   isKpi: false },
  ],
  M8: [
    { code: '8.2.1', label: 'Laparoscopic Sterilizations', shortLabel: 'Lap. Steril.',   isKpi: true  },
    { code: '8.2.2', label: 'Interval Sterilizations',     shortLabel: 'Interval Ster.', isKpi: true  },
    { code: '8.3',   label: 'Interval IUCD Insertions',    shortLabel: 'IUCD',           isKpi: true  },
    { code: '8.4',   label: 'Postpartum IUCD (48h)',       shortLabel: 'PPIUCD',         isKpi: true  },
    { code: '8.12',  label: 'OCP Cycles Distributed',      shortLabel: 'OCP',            isKpi: false },
    { code: '8.13',  label: 'Condoms Distributed',         shortLabel: 'Condoms',        isKpi: false },
  ],
  M9: [
    { code: '9.1.2',   label: 'BCG',                       shortLabel: 'BCG',            isKpi: true  },
    { code: '9.1.5',   label: 'Pentavalent 3',             shortLabel: 'Penta-3',        isKpi: true  },
    { code: '9.2.5.a', label: 'Fully Immunised — Male',    shortLabel: 'FI Male',        isKpi: true  },
    { code: '9.2.5.b', label: 'Fully Immunised — Female',  shortLabel: 'FI Female',      isKpi: true  },
    { code: '9.1.6',   label: 'OPV Birth Dose',            shortLabel: 'OPV0',           isKpi: false },
    { code: '9.1.10',  label: 'Hepatitis-B Birth Dose',    shortLabel: 'Hep-B0',         isKpi: false },
  ],
};

/* ── CSV parser ──────────────────────────────────────────────────── */
function parseCSV(text) {
  return text.trim().split('\n').map(line => {
    const cols = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    return cols;
  });
}

/* ── Fetch sheet ─────────────────────────────────────────────────── */
async function fetchSheetData() {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('Empty sheet');

  const headers = rows[0].map(h => h.replace(/"/g, '').trim());
  const distCols = {};
  DISTRICTS.forEach(d => {
    const idx = headers.findIndex(h => h.toLowerCase() === d.toLowerCase());
    if (idx >= 0) distCols[d] = idx;
  });

  const COL = {
    year:  headers.findIndex(h => /^year$/i.test(h)),
    month: headers.findIndex(h => /^month$/i.test(h)),
    cat:   headers.findIndex(h => /^category$/i.test(h)),
    code:  headers.findIndex(h => /data item code/i.test(h)),
    name:  headers.findIndex(h => /data item name/i.test(h)),
  };

  const parsed = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 6) continue;
    const catMatch = r[COL.cat]?.replace(/"/g,'').match(/^(M\d+)/);
    if (!catMatch) continue;

    // normalise code — strip trailing dot so '2.2' and '2.2.' match
    const code = r[COL.code]?.replace(/"/g,'').trim().replace(/\.$/, '');
    const name = r[COL.name]?.replace(/"/g,'').trim();
    const year = r[COL.year]?.replace(/"/g,'').trim();
    const month = r[COL.month]?.replace(/"/g,'').trim();

    const distTotals = {};
    DISTRICTS.forEach(d => {
      const raw = r[distCols[d]]?.replace(/"/g,'').replace(/,/g,'').trim();
      distTotals[d] = parseFloat(raw) || 0;
    });
    const stateTotal = DISTRICTS.reduce((s, d) => s + (distTotals[d] ?? 0), 0);

    parsed.push({ year, month, cat: catMatch[1], code, name, stateTotal, distTotals });
  }
  return parsed;
}

/* ── Process raw rows for a category + year ─────────────────────── */
function processCategory(rawRows, catId, year) {
  const rows = rawRows.filter(r => r.cat === catId && r.year === year);

  // annual total per code
  const annual = {};
  // monthly state total per code
  const monthly = {};
  // district total per code
  const distByCode = {};
  // code -> name lookup
  const names = {};

  rows.forEach(r => {
    annual[r.code]    = (annual[r.code] ?? 0) + r.stateTotal;
    names[r.code]     = r.name;
    if (!monthly[r.code])   monthly[r.code]   = {};
    if (!distByCode[r.code]) distByCode[r.code] = {};

    const moIdx = MONTH_ORDER.findIndex(m => m.toLowerCase() === r.month.toLowerCase());
    const moKey = moIdx >= 0 ? MONTH_SHORT[moIdx] : r.month.slice(0, 3);
    monthly[r.code][moKey] = (monthly[r.code][moKey] ?? 0) + r.stateTotal;

    DISTRICTS.forEach(d => {
      distByCode[r.code][d] = (distByCode[r.code][d] ?? 0) + (r.distTotals[d] ?? 0);
    });
  });

  // Build monthly trend rows (all months in order)
  const monthlyRows = MONTH_SHORT.map((mo, i) => {
    const row = { month: mo };
    (KEY_ITEMS[catId] ?? []).forEach(({ code }) => {
      row[code] = monthly[code]?.[mo] ?? 0;
    });
    return row;
  }).filter(row => Object.values(row).some((v, i) => i > 0 && v > 0));

  // District totals for primary KPI (first isKpi item)
  const primaryCode = (KEY_ITEMS[catId] ?? []).find(k => k.isKpi)?.code;
  const distRows = primaryCode
    ? DISTRICTS.map(d => ({ district: d, value: distByCode[primaryCode]?.[d] ?? 0 }))
        .sort((a, b) => b.value - a.value)
    : [];

  return { annual, monthly, monthlyRows, distRows, distByCode, names };
}

/* ── Recharts custom tooltip ─────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ncd-tooltip">
      <div className="ncd-tip-label">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="ncd-tip-row" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span className="ncd-tip-val">{(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Number formatter ────────────────────────────────────────────── */
function fmt(n) {
  if (!n) return '0';
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ── RCH programme → default HMIS category ──────────────────────── */
const PROGRAM_TO_CAT = {
  'maternal-health': 'M1',
  'jsy':             'M2',
  'cac':             'M3',
  'pcpndt':          'M4',
  'child-health':    'M4',
  'immunization':    'M9',
  'adolescent-health':'M5',
  'family-planning': 'M8',
  'nutrition':       'M5',
};

/* ── Main page ───────────────────────────────────────────────────── */
export default function NCDDetailPage({ program, onBack }) {
  const wrapRef = useRef(null);

  const [rawRows,    setRawRows]    = useState(null);
  const [activeCat,  setActiveCat]  = useState(PROGRAM_TO_CAT[program?.id] ?? 'M1');
  const [activeYear, setActiveYear] = useState('2025');
  const [isLive,     setIsLive]     = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  useEffect(() => {
    fetchSheetData()
      .then(rows => { setRawRows(rows); setIsLive(true); })
      .catch(err  => setFetchError(err.message));
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hmis-section',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, ease: 'power3.out' },
      );
    }, wrapRef);
    return () => ctx.revert();
  }, [activeCat]);

  const handleBack = () => {
    gsap.to(wrapRef.current, {
      opacity: 0, y: -14, duration: 0.28, ease: 'power2.in', onComplete: onBack,
    });
  };

  const catCfg  = CATEGORIES.find(c => c.id === activeCat) ?? CATEGORIES[0];
  const keyItems = KEY_ITEMS[activeCat] ?? [];
  const kpiItems = keyItems.filter(k => k.isKpi);

  const processed = useMemo(
    () => rawRows ? processCategory(rawRows, activeCat, activeYear) : null,
    [rawRows, activeCat, activeYear],
  );

  const years = useMemo(() => {
    if (!rawRows) return ['2025'];
    return [...new Set(rawRows.map(r => r.year))].sort();
  }, [rawRows]);

  /* Trend chart: up to 3 key items */
  const trendItems = keyItems.slice(0, 3);
  const CHART_COLORS = ['#00b5cc','#B45309','#007a8f'];

  /* ── 4th layer: render KD detail page when indicator is selected ─ */
  if (selectedIndicator) {
    return (
      <KDDetailPage
        indicator={selectedIndicator}
        catCfg={catCfg}
        rawRows={rawRows}
        activeYear={activeYear}
        program={program}
        onBack={() => setSelectedIndicator(null)}
      />
    );
  }

  return (
    <div className="ncd-root" ref={wrapRef}>

      {/* ── Topbar ───────────────────────────────────────────────── */}
      <div className="ncd-topbar">
        <div className="ncd-topbar-inner">
          <button className="back-btn" onClick={handleBack}>
            <span className="back-chevron">←</span> Back to Overview
          </button>
          <div className="detail-breadcrumb">
            <span className="ncd-badge" style={{ background: '#266b6e' }}>RCH</span>
            <span className="detail-prog-name">
              {program?.name ? `${program.name} — HMIS Data` : 'RCH Programme Data'}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {isLive && (
              <span className="hmis-live-badge">● Live</span>
            )}
            {fetchError && (
              <span className="hmis-error-badge" title={fetchError}>Offline</span>
            )}
            <a href={DATA_SHEET_URL} target="_blank" rel="noopener noreferrer" className="hmis-sheet-link">
              View Sheet
            </a>
            <div className="ncd-source-tag">Arunachal Pradesh · {activeYear}</div>
          </div>
        </div>
      </div>

      <div className="ncd-content">

        {/* ── Category tabs ──────────────────────────────────────── */}
        <section className="hmis-section hmis-tabs-section">
          <div className="hmis-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`hmis-tab ${activeCat === cat.id ? 'hmis-tab-active' : ''}`}
                style={activeCat === cat.id ? { borderColor: cat.color, color: cat.color, background: cat.color + '12' } : {}}
                onClick={() => setActiveCat(cat.id)}
              >
                <span className="hmis-tab-id" style={activeCat === cat.id ? { background: cat.color } : {}}>{cat.id}</span>
                <span className="hmis-tab-label">{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="hmis-year-pills">
            {years.map(yr => (
              <button
                key={yr}
                className={`hmis-year-pill ${activeYear === yr ? 'hmis-year-active' : ''}`}
                style={activeYear === yr ? { background: catCfg.color, borderColor: catCfg.color } : {}}
                onClick={() => setActiveYear(yr)}
              >
                {yr}
              </button>
            ))}
          </div>
        </section>

        {/* ── Category heading ───────────────────────────────────── */}
        <section className="hmis-section">
          <div className="hmis-cat-header" style={{ borderLeftColor: catCfg.color }}>
            <span className="hmis-cat-id" style={{ background: catCfg.color }}>{catCfg.id}</span>
            <div>
              <div className="hmis-cat-name">{catCfg.fullName}</div>
              <div className="hmis-cat-sub">
                {isLive ? `Live · All 25 Districts · ${activeYear}` : 'Loading data…'}
              </div>
            </div>
          </div>
        </section>

        {/* ── KPI cards ──────────────────────────────────────────── */}
        {processed && (
          <section className="hmis-section">
            <div className="hmis-kpi-grid">
              {kpiItems.map(item => {
                const val = processed.annual[item.code] ?? 0;
                return (
                  <div className="hmis-kpi-card" key={item.code}>
                    <div className="hmis-kpi-val" style={{ color: catCfg.color }}>{fmt(val)}</div>
                    <div className="hmis-kpi-label">{item.label}</div>
                    <div className="hmis-kpi-code">{item.code}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Monthly trend chart ────────────────────────────────── */}
        {processed && processed.monthlyRows.length > 0 && (
          <section className="hmis-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>Monthly Trend — {catCfg.fullName}</h3>
                <span className="ncd-card-note">State totals · {activeYear} · all 25 districts</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={processed.monthlyRows} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    {trendItems.map((item, i) => (
                      <linearGradient key={item.code} id={`grad-${item.code}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLORS[i]} stopOpacity={0.30} />
                        <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8892A4' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8892A4' }} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<ChartTip />} />
                  <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                  {trendItems.map((item, i) => (
                    <Area
                      key={item.code}
                      type="monotone"
                      dataKey={item.code}
                      name={item.shortLabel}
                      stroke={CHART_COLORS[i]}
                      fill={`url(#grad-${item.code})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── District breakdown ─────────────────────────────────── */}
        {processed && processed.distRows.length > 0 && (() => {
          const primaryItem = kpiItems[0];
          const top10 = processed.distRows.slice(0, 10);
          return (
            <section className="hmis-section">
              <div className="ncd-card">
                <div className="ncd-card-header">
                  <h3>District Breakdown — {primaryItem?.label}</h3>
                  <span className="ncd-card-note">Top 10 districts · {activeYear} cumulative</span>
                </div>
                <ResponsiveContainer width="100%" height={top10.length * 38 + 40}>
                  <BarChart
                    data={top10}
                    layout="vertical"
                    margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8ECF0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#8892A4' }} tickFormatter={v => fmt(v)} />
                    <YAxis
                      dataKey="district"
                      type="category"
                      width={148}
                      tick={{ fontSize: 11, fill: '#3D4966' }}
                    />
                    <Tooltip
                      formatter={v => [v.toLocaleString(), primaryItem?.label]}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2E8F0' }}
                    />
                    <Bar dataKey="value" name={primaryItem?.shortLabel} fill={catCfg.color} radius={[0,4,4,0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          );
        })()}

        {/* ── All indicators table ───────────────────────────────── */}
        {processed && (
          <section className="hmis-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>All Indicators — {catCfg.fullName}</h3>
                <span className="ncd-card-note">State total · {activeYear} · click row for KD targets &amp; NFHS</span>
              </div>
              <div className="hmis-table">
                <div className="hmis-table-head">
                  <span>Code</span>
                  <span>Indicator</span>
                  <span className="hmis-col-right">State Total</span>
                  <span style={{ minWidth: 24 }}></span>
                </div>
                {keyItems.map(item => {
                  const val = processed.annual[item.code] ?? 0;
                  return (
                    <div
                      key={item.code}
                      className={`hmis-table-row hmis-row-clickable ${item.isKpi ? 'hmis-row-kpi' : ''}`}
                      onClick={() => setSelectedIndicator({ code: item.code, label: item.label, catId: catCfg.id })}
                    >
                      <span className="hmis-code-pill" style={{ background: catCfg.color + '18', color: catCfg.color }}>
                        {item.code}
                      </span>
                      <span className="hmis-row-name">{item.label}</span>
                      <span className="hmis-row-val" style={{ color: catCfg.color }}>
                        {val.toLocaleString()}
                      </span>
                      <span className="hmis-row-drill">→</span>
                    </div>
                  );
                })}

                {/* All other indicators for this category */}
                {Object.entries(processed.annual)
                  .filter(([code]) => !keyItems.find(k => k.code === code))
                  .sort((a, b) => b[1] - a[1])
                  .map(([code, val]) => (
                    <div
                      key={code}
                      className="hmis-table-row hmis-row-secondary hmis-row-clickable"
                      onClick={() => setSelectedIndicator({ code, label: processed.names[code] ?? code, catId: catCfg.id })}
                    >
                      <span className="hmis-code-pill" style={{ background: '#F1F5F9', color: '#64748B' }}>
                        {code}
                      </span>
                      <span className="hmis-row-name">{processed.names[code] ?? code}</span>
                      <span className="hmis-row-val" style={{ color: '#475569' }}>
                        {val.toLocaleString()}
                      </span>
                      <span className="hmis-row-drill">→</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </section>
        )}

        {/* ── Loading state ───────────────────────────────────────── */}
        {!processed && !fetchError && (
          <section className="hmis-section">
            <div className="hmis-loading">
              <div className="hmis-spinner" style={{ borderTopColor: catCfg.color }} />
              <span>Loading sheet data…</span>
            </div>
          </section>
        )}

        {fetchError && (
          <section className="hmis-section">
            <div className="hmis-error-card">
              <div className="hmis-error-title">Could not load live data</div>
              <div className="hmis-error-msg">{fetchError}</div>
              <div className="hmis-error-hint">Make sure the sheet is shared as "Anyone with the link can view".</div>
            </div>
          </section>
        )}

      </div>

      <footer className="detail-footer">
        Source: HMIS Monthly Data — Arunachal Pradesh, {activeYear}. RCH Programme categories:
        M1 Ante Natal Care · M2 Deliveries · M3 C-Sections · M4 Pregnancy &amp; Newborn ·
        M5 Anaemia Mukt Bharat · M8 Family Planning · M9 Child Immunisation.
        Ministry of Health &amp; Family Welfare, Govt. of India.
      </footer>
    </div>
  );
}
