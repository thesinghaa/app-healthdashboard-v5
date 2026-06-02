/* ═══════════════════════════════════════════════════════════════════════════
   ProgrammeProgressChart.jsx
   Stacked monthly bar chart — HMIS indicator throughput per programme.
   Data source: NCD_Compiled.xlsx (hardcoded FY 2024-25 + 2025-26 actuals).
   Only RCH has data currently; others show empty state.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

/* ── Raw data (from progress_stackedChart_v6.html) ───────────────────────── */
const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

const INDICATORS = [
  { key: 'anc',   label: 'Antenatal Care (ANC) registrations', abbr: null,  color: '#F59E0B' },
  { key: 'del',   label: 'Institutional deliveries',           abbr: null,  color: '#10B981' },
  { key: 'imm',   label: 'Fully immunised children',           abbr: null,  color: '#06B6D4' },
  { key: 'fp',    label: 'Family planning acceptors',          abbr: null,  color: '#6B7280' },
  { key: 'anaem', label: 'Anaemia on treatment',               abbr: null,  color: '#FF1744' },
];

const RAW = {
  RCH: {
    '2024-25': [
      { key:'anc',   data:[2587,2709,2473,2378,2299,2087,2045,2016,1809,2182,2156,2391] },
      { key:'del',   data:[1381,1428,1341,1649,1757,1921,1824,1735,1841,1851,1531,1553] },
      { key:'imm',   data:[1538,1766,1857,2026,1974,1814,1843,1742,1530,1484,1491,1722] },
      { key:'fp',    data:[234,269,228,278,226,257,190,210,185,216,202,214]             },
      { key:'anaem', data:[24,37,50,83,96,93,207,98,50,244,242,88]                      },
    ],
    '2025-26': [
      { key:'anc',   data:[2472,2631,2383,2382,2266,2059,1956,1910,1884,2109,null,null] },
      { key:'del',   data:[1390,1254,1314,1565,1706,1886,1722,1606,1669,1507,null,null] },
      { key:'imm',   data:[1614,2022,1826,1993,2209,1714,1799,1747,1593,1455,null,null] },
      { key:'fp',    data:[234,237,197,220,158,186,163,179,156,174,null,null]           },
      { key:'anaem', data:[71,70,80,75,84,225,105,79,57,32,null,null]                   },
    ],
  },
};

const PROGRAMMES = [
  { value: 'RCH',  label: 'RCH Programme' },
  { value: 'NDCP', label: 'NDCP Programme' },
  { value: 'NCD',  label: 'NCD Programme' },
  { value: 'HSS',  label: 'HSS Programme' },
  { value: 'HRH',  label: 'HRH Programme' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function buildChartRows(prog, fy) {
  const raw = RAW[prog]?.[fy];
  if (!raw) return null;
  return MONTHS.map((month, i) => {
    const row = { month, _hasData: false };
    raw.forEach(ind => {
      const v = ind.data[i];
      row[ind.key] = v ?? 0;
      if (v != null) row._hasData = true;
    });
    return row;
  });
}

function buildTotals(prog, fy) {
  const raw = RAW[prog]?.[fy];
  if (!raw) return null;
  return INDICATORS.map(ind => {
    const series = raw.find(r => r.key === ind.key);
    const total = series ? series.data.reduce((s, v) => s + (v ?? 0), 0) : 0;
    return { ...ind, total };
  });
}

function fmtK(v) {
  return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
}

/* ── Custom tooltip ──────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, hoveredKey }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="ppc-tooltip">
      <div className="ppc-tt-month">{label}</div>
      {payload.map(p => {
        const ind = INDICATORS.find(i => i.key === p.dataKey);
        const focused = hoveredKey === null || hoveredKey === p.dataKey;
        return (
          <div key={p.dataKey} className="ppc-tt-row" style={{ opacity: focused ? 1 : 0.35 }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:8, height:8, borderRadius:2, background:p.fill, flexShrink:0 }} />
              <span style={{ color:'#6B7280' }}>{ind?.label}</span>
            </span>
            <span style={{ fontWeight: focused ? 600 : 400 }}>
              {(p.value || 0).toLocaleString('en-IN')}
            </span>
          </div>
        );
      })}
      <div className="ppc-tt-total">
        <span>Total</span>
        <span>{total.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ProgrammeProgressChart() {
  const [prog, setProg]       = useState('RCH');
  const [fy, setFy]           = useState('2024-25');
  const [hoveredKey, setHovered] = useState(null);

  const chartRows = useMemo(() => buildChartRows(prog, fy), [prog, fy]);
  const totals    = useMemo(() => buildTotals(prog, fy), [prog, fy]);
  const grandTotal = totals ? totals.reduce((s, t) => s + t.total, 0) : 0;

  const fyLabel  = `FY ${fy.replace('-', '–')}`;
  const fyDates  = fy === '2024-25' ? 'Apr 2024 – Mar 2025' : 'Apr 2025 – Jan 2026 (partial)';
  const progLabel = PROGRAMMES.find(p => p.value === prog)?.label ?? prog;

  return (
    <section className="ppc-section">
      <div className="v4l-section-header">
        <div className="v4l-section-tag">Programme Progress</div>
        <h2 className="v4l-section-title">Health Programme Progress</h2>
      </div>
      <div className="ppc-card">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="ppc-header">
          {/* Programme selector pill */}
          <div className="ppc-prog-pill">
            <span className="ppc-prog-label"><span data-abbr={prog}>{prog}</span> Programme</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            <select
              className="ppc-prog-select"
              value={prog}
              onChange={e => setProg(e.target.value)}
              aria-label="Select programme"
            >
              {PROGRAMMES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* FY selector */}
          <div className="ppc-fy-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <select
              className="ppc-fy-select"
              value={fy}
              onChange={e => setFy(e.target.value)}
              aria-label="Select financial year"
            >
              <option value="2024-25">FY 2024–25</option>
              <option value="2025-26">FY 2025–26</option>
            </select>
          </div>
        </div>

        {/* ── Body: chart + summary ───────────────────────────────────────── */}
        <div className="ppc-body">

          {/* Chart */}
          <div className="ppc-chart-col">
            {chartRows ? (
              <>
                <ResponsiveContainer width="100%" height={440}>
                  <BarChart data={chartRows} barSize={42} margin={{ top:8, right:8, left:0, bottom:8 }}>
                    <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize:14, fill:'#374151', fontFamily:'Inter,sans-serif', fontWeight:600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize:13, fill:'#6B7280', fontFamily:'Inter,sans-serif' }}
                      tickFormatter={fmtK}
                      width={40}
                    />
                    <Tooltip
                      content={<CustomTooltip hoveredKey={hoveredKey} />}
                      cursor={{ fill:'rgba(0,0,0,0.04)' }}
                    />
                    {INDICATORS.map(ind => (
                      <Bar
                        key={ind.key}
                        dataKey={ind.key}
                        stackId="a"
                        fill={ind.color}
                        opacity={hoveredKey === null || hoveredKey === ind.key ? 1 : 0.18}
                        radius={ind.key === 'anaem' ? [3,3,0,0] : [0,0,0,0]}
                        onMouseEnter={() => setHovered(ind.key)}
                        onMouseLeave={() => setHovered(null)}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="ppc-legend">
                  {INDICATORS.map(ind => (
                    <span
                      key={ind.key}
                      className="ppc-leg-item"
                      style={{ opacity: hoveredKey === null || hoveredKey === ind.key ? 1 : 0.35 }}
                      onMouseEnter={() => setHovered(ind.key)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <span className="ppc-leg-swatch" style={{ background: ind.color }} />
                      {ind.label}
                    </span>
                  ))}
                </div>

                <p className="ppc-source">
                  Source: Health Management Information System (HMIS), Arunachal Pradesh · {fyLabel} actuals ({fyDates})
                </p>
              </>
            ) : (
              <div className="ppc-empty">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <span>No data available for {progLabel} · {fyLabel}</span>
              </div>
            )}
          </div>

          {/* Summary panel */}
          <div className="ppc-summary">
            <p className="ppc-sum-title">{fyLabel} totals</p>
            {totals ? (
              <>
                {totals.map(ind => {
                  const pct = grandTotal ? Math.round((ind.total / grandTotal) * 100) : 0;
                  const focused = hoveredKey === null || hoveredKey === ind.key;
                  return (
                    <div
                      key={ind.key}
                      className="ppc-sum-row"
                      style={{ opacity: focused ? 1 : 0.3 }}
                      onMouseEnter={() => setHovered(ind.key)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div className="ppc-sum-label">
                        <span className="ppc-sum-swatch" style={{ background: ind.color }} />
                        <span>{ind.label}</span>
                      </div>
                      <span className="ppc-sum-val">{ind.total.toLocaleString('en-IN')}</span>
                      <div className="ppc-sum-bar" style={{ width:`${pct}%`, background: ind.color }} />
                    </div>
                  );
                })}
                <div className="ppc-sum-total">
                  <span>Total touchpoints</span>
                  <span>~{Math.round(grandTotal / 1000)}k</span>
                </div>
              </>
            ) : (
              <div style={{ color:'#9CA3AF', fontSize:13, textAlign:'center', padding:'1rem 0' }}>—</div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
