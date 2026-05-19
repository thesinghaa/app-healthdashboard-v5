import { useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { KD_BY_CATEGORY, CAT_TO_PROGRAM } from '../data/kdData';
import { DIVISIONS } from '../data/programs';

const MONTH_ORDER = ['April','May','June','July','August','September','October','November','December','January','February','March'];
const MONTH_SHORT  = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}K`;
  return Number(n).toLocaleString();
}

function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toFixed(1)}%`;
}

/* ── Gauge arc (SVG) ─────────────────────────────────────────────── */
function GaugeArc({ pct, color, size = 120 }) {
  const r   = size * 0.38;
  const cx  = size / 2;
  const cy  = size * 0.58;
  const len = Math.PI * r;
  const progress = Math.min(Math.max(pct, 0), 100) / 100;
  return (
    <svg width={size} height={size * 0.68} viewBox={`0 0 ${size} ${size * 0.68}`}>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#E8ECF0" strokeWidth={size * 0.07} strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={size * 0.07} strokeLinecap="round"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={len * (1 - progress)}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x={cx} y={cy - r * 0.15} textAnchor="middle" fontSize={size * 0.165}
        fontWeight="700" fill="#1E2A3A" fontFamily="inherit">
        {pct === null ? '—' : `${pct}%`}
      </text>
    </svg>
  );
}

/* ── KD row card ─────────────────────────────────────────────────── */
function KDRow({ kd, color }) {
  const pct = kd.achievement;
  const target = kd.target;
  const lowerBetter = !!kd.lowerIsBetter;

  let status = 'neutral';
  if (pct !== null && target !== null) {
    const gap = lowerBetter ? target - pct : pct - target;
    if (gap >= 0)           status = 'achieved';
    else if (gap >= -10)    status = 'close';
    else                    status = 'gap';
  }

  const statusColor = { achieved: '#059669', close: '#D97706', gap: '#DC2626', neutral: '#64748B' }[status];
  const statusLabel = { achieved: 'Achieved', close: 'Near Target', gap: 'Gap', neutral: '—' }[status];

  return (
    <div className="kd-row">
      <div className="kd-row-top">
        <span className="kd-no" style={{ background: color + '18', color }}>KD {kd.no}</span>
        <span className="kd-type-pill">{kd.type}</span>
        <span className="kd-status-dot" style={{ background: statusColor }} title={statusLabel} />
      </div>
      <div className="kd-row-body">
        <div className="kd-indicator-name">{kd.indicator}</div>
        <div className="kd-statement">{kd.statement}</div>
        <div className="kd-numbers">
          <div className="kd-num-block">
            <span className="kd-num-label">Target</span>
            <span className="kd-num-val">{kd.targetLabel}</span>
          </div>
          <div className="kd-num-block">
            <span className="kd-num-label">FY 2025-26</span>
            <span className="kd-num-val" style={{ color: statusColor, fontWeight: 700 }}>
              {kd.achievedLabel}
            </span>
          </div>
          {kd.numerator !== null && kd.denominator && (
            <div className="kd-num-block">
              <span className="kd-num-label">Count</span>
              <span className="kd-num-val">{fmt(kd.numerator)} / {fmt(kd.denominator)}</span>
            </div>
          )}
          <div className="kd-num-block">
            <span className="kd-num-label">Source</span>
            <span className="kd-num-val kd-source">{kd.source}</span>
          </div>
        </div>
      </div>
      {pct !== null && target !== null && (
        <div className="kd-progress-bar-wrap">
          <div
            className="kd-progress-bar-fill"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: statusColor,
            }}
          />
          <div
            className="kd-progress-target-line"
            style={{ left: `${Math.min(target, 100)}%` }}
            title={`Target: ${kd.targetLabel}`}
          />
        </div>
      )}
    </div>
  );
}

/* ── NFHS comparison row ─────────────────────────────────────────── */
function NFHSRow({ row }) {
  const hasNfhs4 = row.nfhs4 !== null;
  const hasNfhs5 = row.nfhs5 !== null;
  const improved = hasNfhs4 && hasNfhs5
    ? (row.lowerIsBetter ? row.nfhs5 < row.nfhs4 : row.nfhs5 > row.nfhs4)
    : null;
  const diff = hasNfhs4 && hasNfhs5 ? (row.nfhs5 - row.nfhs4).toFixed(1) : null;

  return (
    <div className="nfhs-row">
      <div className="nfhs-row-label">{row.label}</div>
      <div className="nfhs-row-vals">
        <span className="nfhs-val nfhs4">{hasNfhs4 ? `${row.nfhs4}${row.unit}` : '—'}</span>
        <span className="nfhs-arrow">{improved === null ? '→' : improved ? '↑' : '↓'}</span>
        <span className="nfhs-val nfhs5" style={{ color: improved === null ? '#64748B' : improved ? '#059669' : '#DC2626' }}>
          {hasNfhs5 ? `${row.nfhs5}${row.unit}` : '—'}
        </span>
        {diff !== null && (
          <span className="nfhs-diff" style={{ color: improved ? '#059669' : '#DC2626' }}>
            {parseFloat(diff) > 0 ? `+${diff}` : diff}{row.unit}
          </span>
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
          <span className="ncd-tip-val">{(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function KDDetailPage({ indicator, catCfg, rawRows, activeYear, program, onBack }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.kd-section',
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: 'power3.out' },
      );
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  const handleBack = () => {
    gsap.to(wrapRef.current, {
      opacity: 0, y: -14, duration: 0.25, ease: 'power2.in', onComplete: onBack,
    });
  };

  /* HMIS monthly trend for this specific code, all years */
  const trendData = useMemo(() => {
    if (!rawRows || !indicator?.code) return [];
    const filtered = rawRows.filter(r => r.code === indicator.code && r.cat === catCfg.id);
    const yearMap = {};
    filtered.forEach(r => {
      if (!yearMap[r.year]) yearMap[r.year] = {};
      const moIdx = MONTH_ORDER.findIndex(m => m.toLowerCase() === r.month.toLowerCase());
      const moKey = moIdx >= 0 ? MONTH_SHORT[moIdx] : r.month.slice(0, 3);
      yearMap[r.year][moKey] = (yearMap[r.year][moKey] ?? 0) + r.stateTotal;
    });

    const years = Object.keys(yearMap).sort();
    return MONTH_SHORT.map((mo, i) => {
      const row = { month: mo };
      years.forEach(yr => { row[yr] = yearMap[yr]?.[mo] ?? 0; });
      return row;
    }).filter(row => years.some(yr => row[yr] > 0));
  }, [rawRows, indicator, catCfg, activeYear]);

  /* District breakdown for this code in activeYear */
  const distData = useMemo(() => {
    if (!rawRows || !indicator?.code) return [];
    const filtered = rawRows.filter(r => r.code === indicator.code && r.cat === catCfg.id && r.year === activeYear);
    const distMap = {};
    filtered.forEach(r => {
      Object.entries(r.distTotals ?? {}).forEach(([d, v]) => {
        distMap[d] = (distMap[d] ?? 0) + v;
      });
    });
    return Object.entries(distMap)
      .map(([district, value]) => ({ district, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [rawRows, indicator, catCfg, activeYear]);

  /* KDs for this category */
  const kds = KD_BY_CATEGORY[catCfg.id] ?? [];

  /* NFHS data for parent programme */
  const progId = CAT_TO_PROGRAM[catCfg.id];
  const nfhsData = useMemo(() => {
    for (const div of DIVISIONS) {
      const prog = div.programs.find(p => p.id === progId);
      if (prog) return prog.nfhsData ?? [];
    }
    return [];
  }, [progId]);

  /* Years in data */
  const years = useMemo(() => {
    if (!rawRows) return [];
    const catYears = [...new Set(rawRows.filter(r => r.cat === catCfg.id).map(r => r.year))].sort();
    return catYears;
  }, [rawRows, catCfg]);

  const YEAR_COLORS = ['#00b5cc', '#B45309', '#007a8f', '#C0392B'];

  /* Annual state total for this code + year */
  const annualTotal = useMemo(() => {
    if (!rawRows || !indicator?.code) return null;
    return rawRows
      .filter(r => r.code === indicator.code && r.cat === catCfg.id && r.year === activeYear)
      .reduce((s, r) => s + r.stateTotal, 0);
  }, [rawRows, indicator, catCfg, activeYear]);

  return (
    <div className="ncd-root" ref={wrapRef}>

      {/* ── Topbar ───────────────────────────────────────────────── */}
      <div className="ncd-topbar">
        <div className="ncd-topbar-inner">
          <button className="back-btn" onClick={handleBack}>
            <span className="back-chevron">←</span> Back to {catCfg.fullName}
          </button>
          <div className="detail-breadcrumb">
            <span className="ncd-badge" style={{ background: '#266b6e' }}>RCH</span>
            <span className="ncd-badge" style={{ background: catCfg.color }}>
              {catCfg.id} · {catCfg.label}
            </span>
            <span className="detail-prog-name">{indicator.label}</span>
          </div>
          <div className="ncd-source-tag">HMIS · Arunachal Pradesh · {activeYear}</div>
        </div>
      </div>

      <div className="ncd-content">

        {/* ── Indicator hero ───────────────────────────────────────── */}
        <section className="kd-section">
          <div className="kd-hero" style={{ borderLeftColor: catCfg.color }}>
            <div className="kd-hero-left">
              <div className="kd-hero-code" style={{ background: catCfg.color + '18', color: catCfg.color }}>
                {indicator.code}
              </div>
              <div>
                <div className="kd-hero-name">{indicator.label}</div>
                <div className="kd-hero-sub">
                  {catCfg.fullName} · {activeYear} · All 25 Districts
                </div>
              </div>
            </div>
            {annualTotal !== null && (
              <div className="kd-hero-right">
                <div className="kd-hero-total" style={{ color: catCfg.color }}>
                  {fmt(annualTotal)}
                </div>
                <div className="kd-hero-total-label">State Total {activeYear}</div>
              </div>
            )}
          </div>
        </section>

        {/* ── Monthly HMIS trend ───────────────────────────────────── */}
        {trendData.length > 0 && (
          <section className="kd-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>Monthly Trend — {indicator.label}</h3>
                <span className="ncd-card-note">State total · {years.join(', ')} · HMIS</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    {years.map((yr, i) => (
                      <linearGradient key={yr} id={`kd-grad-${yr}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={YEAR_COLORS[i % 4]} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={YEAR_COLORS[i % 4]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8892A4' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8892A4' }} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<ChartTip />} />
                  {years.map((yr, i) => (
                    <Area
                      key={yr}
                      type="monotone"
                      dataKey={yr}
                      name={yr}
                      stroke={YEAR_COLORS[i % 4]}
                      fill={`url(#kd-grad-${yr})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── District breakdown ───────────────────────────────────── */}
        {distData.length > 0 && (
          <section className="kd-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>District Breakdown — {indicator.label}</h3>
                <span className="ncd-card-note">{activeYear} cumulative · sorted by volume</span>
              </div>
              <ResponsiveContainer width="100%" height={distData.length * 36 + 40}>
                <BarChart
                  data={distData}
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
                    formatter={v => [v.toLocaleString(), indicator.label]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar
                    dataKey="value"
                    name={indicator.label}
                    fill={catCfg.color}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── Key Deliverables ─────────────────────────────────────── */}
        {kds.length > 0 && (
          <section className="kd-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>Key Deliverables — {catCfg.fullName}</h3>
                <span className="ncd-card-note">FY 2025-26 targets vs achievement · NHM Arunachal Pradesh</span>
              </div>
              <div className="kd-summary-row">
                {[
                  { label: 'Total KDs', val: kds.length, color: '#475569' },
                  { label: 'Achieved', val: kds.filter(k => {
                    if (k.achievement === null || k.target === null) return false;
                    return k.lowerIsBetter ? k.achievement <= k.target : k.achievement >= k.target;
                  }).length, color: '#059669' },
                  { label: 'Near Target', val: kds.filter(k => {
                    if (k.achievement === null || k.target === null) return false;
                    const gap = k.lowerIsBetter ? k.target - k.achievement : k.achievement - k.target;
                    return gap < 0 && gap >= -10;
                  }).length, color: '#D97706' },
                  { label: 'Gap', val: kds.filter(k => {
                    if (k.achievement === null || k.target === null) return false;
                    const gap = k.lowerIsBetter ? k.target - k.achievement : k.achievement - k.target;
                    return gap < -10;
                  }).length, color: '#DC2626' },
                ].map(s => (
                  <div key={s.label} className="kd-summary-chip">
                    <span className="kd-summary-num" style={{ color: s.color }}>{s.val}</span>
                    <span className="kd-summary-lbl">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="kd-list">
                {kds.map(kd => <KDRow key={kd.no} kd={kd} color={catCfg.color} />)}
              </div>
            </div>
          </section>
        )}

        {/* ── NFHS Baseline Comparison ─────────────────────────────── */}
        {nfhsData.length > 0 && (
          <section className="kd-section">
            <div className="ncd-card">
              <div className="ncd-card-header">
                <h3>NFHS Baseline — {catCfg.fullName}</h3>
                <span className="ncd-card-note">NFHS-4 (2015-16) vs NFHS-5 (2019-21) · Arunachal Pradesh</span>
              </div>
              <div className="nfhs-legend">
                <span className="nfhs-leg-item nfhs4">NFHS-4</span>
                <span className="nfhs-leg-item nfhs5">NFHS-5</span>
                <span className="nfhs-leg-item">Change</span>
              </div>
              <div className="nfhs-table">
                {nfhsData.map((row, i) => <NFHSRow key={i} row={row} />)}
              </div>
              <div className="nfhs-source-note">
                Source: National Family Health Survey (NFHS) — Ministry of Health &amp; Family Welfare, Govt. of India
              </div>
            </div>
          </section>
        )}

      </div>

      <footer className="detail-footer">
        Indicator: {indicator.code} — {indicator.label} · Category {catCfg.id}: {catCfg.fullName} ·
        Source: HMIS Monthly Data &amp; NHM Key Deliverables FY 2025-26 · Arunachal Pradesh NHM
      </footer>
    </div>
  );
}
