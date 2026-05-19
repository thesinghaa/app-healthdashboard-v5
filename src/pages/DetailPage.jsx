import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Plot from 'react-plotly.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LabelList, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { STATUS_CONFIG } from '../data/programs';

/* ── Plotly theme constants ──────────────────────────────────────── */
const ORG  = '#00b5cc';
const NAVY = '#1A1F36';
const TEAL = '#0E9E8A';
const AMB  = '#D97706';
const SLT  = '#CBD5E1';
const PLOT_BASE = {
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'Inter, sans-serif', color: NAVY, size: 12 },
  margin: { t: 28, r: 20, b: 44, l: 20 },
  colorway: [ORG, NAVY, AMB, TEAL, SLT],
};
const PLOT_CFG = { displayModeBar: false, responsive: true };

/* ── GSAP animation helper ───────────────────────────────────────── */
function useCSAnim(ref) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      );
      gsap.from(ref.current.querySelectorAll('.detail-card, .cs-band, .cs-plot-card'),
        { opacity: 0, y: 22, duration: 0.5, stagger: 0.09, ease: 'power2.out', delay: 0.18 },
      );
    }, ref);
    return () => ctx.revert();
  }, []);
}

const NFHS4_COLOR = '#4A7FA5';
const NFHS5_COLOR = '#B8793A';

/* ── HRH helpers ─────────────────────────────────────────────────── */

function HRHDonut({ regular, contractual, gap, total, colors: colorsProp }) {
  const size = 84, r = 30, cx = 42;
  const circ = 2 * Math.PI * r;
  const colors = colorsProp || ['#00b5cc', '#D97706', '#CBD5E1'];
  const segs = [
    { pct: (regular    / total) * 100, color: colors[0] },
    { pct: (contractual / total) * 100, color: colors[1] },
    { pct: (gap        / total) * 100, color: colors[2] },
  ].filter(s => s.pct > 0);
  let off = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 84 84">
      <g transform="rotate(-90 42 42)">
        {segs.map((s, i) => {
          const dash = (s.pct / 100) * circ; const o = off; off += dash;
          return <circle key={i} cx={cx} cy={cx} r={r} fill="none"
            stroke={s.color} strokeWidth={13}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-o} />;
        })}
      </g>
    </svg>
  );
}

function fillPillStyle(pct) {
  if (pct == null) return { background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB' };
  if (pct >= 80)   return { background: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5' };
  if (pct >= 50)   return { background: '#FFFBEB', color: '#B7791F', border: '1px solid #FAF089' };
  return             { background: '#FFF0F0', color: '#C53030', border: '1px solid #FED7D7' };
}

const HRH_PRODUCTIVITY = {
  'medical-officer': [
    { name: 'OPD / Doctor / Day',       Actual: 7,  IPHS: 60  },
  ],
  'lab-tech': [
    { name: 'Tests / LT / Day (PHC)',   Actual: 3,  IPHS: 100 },
    { name: 'Tests / LT / Day (DH)',    Actual: 17, IPHS: 100 },
  ],
  'specialist': [
    { name: 'Ob/Gyn Surgeries / Week',  Actual: 2,  IPHS: 7   },
    { name: 'Dental OPD / Day',         Actual: 4,  IPHS: 20  },
  ],
};

const NCD_SPECIALISTS = [
  { name: 'Physiotherapist', pct: 91  },
  { name: 'Psychologist',    pct: 26  },
  { name: 'MPSW',            pct: 71  },
  { name: 'Counsellor',      pct: 31  },
  { name: 'Optometrist',     pct: 16  },
  { name: 'Audiologist',     pct: 100 },
  { name: 'Dentist',         pct: 106 },
  { name: 'Psychiatrist',    pct: 100 },
  { name: 'Ophthalmologist', pct: 118 },
  { name: 'ENT Surgeon',     pct: 90  },
  { name: 'Physician',       pct: 35  },
];

function HRHSection({ program }) {
  const ach     = program.achievement ?? 0;
  const tgt     = program.target;
  const inPlace = program.inPlace ?? 0;
  const req     = program.requirement ?? 0;
  const gap     = req - inPlace;
  const regIP   = program.regular ?? 0;
  const regS    = program.regSanctioned ?? 0;
  const ctrlIP  = program.contractual ?? 0;
  const ctrlA   = program.ctrlApproved ?? 0;
  const regFill  = regS  > 0 ? Math.round(regIP  / regS  * 100) : null;
  const ctrlFill = ctrlA > 0 ? Math.round(ctrlIP / ctrlA * 100) : null;
  const barColor = program.status === 'red' ? '#E53E3E' : program.status === 'yellow' ? '#D97706' : '#00b5cc';

  const staffingData = [];
  if (regS  > 0) staffingData.push({ category: 'Regular',     Sanctioned: regS,  'In Place': regIP  });
  if (ctrlA > 0) staffingData.push({ category: 'Contractual', Sanctioned: ctrlA, 'In Place': ctrlIP });

  const prodData = HRH_PRODUCTIVITY[program.id];
  const prodH    = prodData ? prodData.length * 72 + 50 : 0;

  return (
    <>
      <div className="hrh-cs-band">
        <span className="hrh-cs-eyebrow">Current Status</span>
        <span className="hrh-cs-src">Key Deliverable 2025-26 · NHM NPCC</span>
      </div>

      {/* Achievement gauge */}
      <div className="detail-card hrh-ach-card">
        <div className="hrh-ach-top">
          <div className="hrh-ach-pct" style={{ color: barColor }}>{ach}%</div>
          <div className="hrh-ach-gauge-wrap">
            <div className="hrh-ach-track">
              <div className="hrh-ach-fill" style={{ width: `${ach}%`, background: barColor }} />
              {tgt != null && <div className="hrh-ach-target" style={{ left: `${tgt}%` }} />}
            </div>
            <div className="hrh-ach-sublabels">
              <span>0%</span>
              {tgt != null && (
                <span className="hrh-ach-tgt-tag" style={{ left: `${tgt}%` }}>Target {tgt}%</span>
              )}
              <span>100%</span>
            </div>
          </div>
        </div>
        <div className="hrh-stat-row">
          {[
            { label: 'Requirement', val: req,     col: '#1A1F36' },
            { label: 'In Place',    val: inPlace,  col: barColor  },
            { label: 'Gap',         val: gap > 0 ? gap : '—', col: gap > 0 ? '#E53E3E' : '#00b5cc' },
            ...(tgt != null ? [{ label: 'RoP Target', val: `${tgt}%`, col: '#D97706' }] : []),
          ].map(s => (
            <div key={s.label} className="hrh-stat">
              <div className="hrh-stat-val" style={{ color: s.col }}>{s.val}</div>
              <div className="hrh-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Staffing breakdown + Workforce composition */}
      <div className="detail-two-col">
        {staffingData.length > 0 && (
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Staffing Breakdown</h3>
              <span className="detail-card-note">Sanctioned/Approved vs In Place</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={staffingData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9e1" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e0d8cc' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Sanctioned" fill="#CBD5E1" radius={[3,3,0,0]} maxBarSize={44} />
                <Bar dataKey="In Place"   fill={barColor} radius={[3,3,0,0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Workforce Composition</h3>
            <span className="detail-card-note">vs Total Requirement</span>
          </div>
          <div className="hrh-donut-wrap">
            <HRHDonut regular={regIP} contractual={ctrlIP}
              gap={gap > 0 ? gap : 0} total={req || 1} />
            <div className="hrh-donut-legend">
              {[
                { label: `Regular (${regIP})`,      color: '#00b5cc' },
                { label: `Contractual (${ctrlIP})`, color: '#D97706' },
                ...(gap > 0 ? [{ label: `Gap (${gap})`, color: '#CBD5E1' }] : []),
              ].map(l => (
                <div key={l.label} className="hrh-dl-item">
                  <span className="hrh-dl-dot" style={{ background: l.color }} />
                  <span>{l.label}</span>
                </div>
              ))}
              <div className="hrh-dl-total">Required: {req}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fill rate table */}
      <div className="detail-card">
        <div className="detail-card-header">
          <h3>Fill Rate Analysis</h3>
          <span className="detail-card-note">Regular sanctioned + Contractual approved vs In Place</span>
        </div>
        <div className="hrh-fill-table">
          <div className="hrh-fill-head">
            <span>Category</span>
            <span className="ta-r">Posts</span>
            <span className="ta-r">In Place</span>
            <span className="ta-r">Fill Rate</span>
            <span className="ta-r">Vacant</span>
          </div>
          {regS > 0 && (
            <div className="hrh-fill-row">
              <span>Regular</span>
              <span className="ta-r">{regS}</span>
              <span className="ta-r hrh-fi-teal">{regIP}</span>
              <span className="ta-r"><span className="hrh-fill-pill" style={fillPillStyle(regFill)}>{regFill}%</span></span>
              <span className="ta-r hrh-fi-red">{regS - regIP}</span>
            </div>
          )}
          {ctrlA > 0 && (
            <div className="hrh-fill-row">
              <span>Contractual</span>
              <span className="ta-r">{ctrlA}</span>
              <span className="ta-r hrh-fi-teal">{ctrlIP}</span>
              <span className="ta-r"><span className="hrh-fill-pill" style={fillPillStyle(ctrlFill)}>{ctrlFill != null ? ctrlFill + '%' : '—'}</span></span>
              <span className="ta-r hrh-fi-red">{ctrlA - ctrlIP}</span>
            </div>
          )}
          <div className="hrh-fill-row hrh-fill-total">
            <span>Total</span>
            <span className="ta-r">{(regS || 0) + (ctrlA || 0)}</span>
            <span className="ta-r hrh-fi-teal">{inPlace}</span>
            <span className="ta-r"><span className="hrh-fill-pill hrh-fill-pill--navy">{ach}%</span></span>
            <span className="ta-r hrh-fi-red">{gap > 0 ? gap : 0}</span>
          </div>
        </div>
      </div>

      {/* Productivity vs IPHS — cadre-specific */}
      {prodData && (
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>Productivity vs IPHS 2022</h3>
            <span className="detail-card-note">Actual state average · National standard comparison</span>
          </div>
          <ResponsiveContainer width="100%" height={prodH}>
            <BarChart data={prodData} layout="vertical"
              margin={{ top: 8, right: 80, left: 0, bottom: 8 }}
              barGap={3} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9e1" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#7a7060' }} />
              <YAxis dataKey="name" type="category" width={210}
                tick={{ fontSize: 11, fill: '#3a3020' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e0d8cc' }} />
              <Legend iconType="square" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Actual" fill="#E53E3E" radius={[0,3,3,0]} maxBarSize={16} />
              <Bar dataKey="IPHS"   fill="#CBD5E1" radius={[0,3,3,0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
          <p className="hrh-prod-note">IPHS 2022 = Indian Public Health Standards national benchmark.</p>
        </div>
      )}

      {/* NCD specialist sub-cadres — Specialist only */}
      {program.id === 'specialist' && (
        <div className="detail-card">
          <div className="detail-card-header">
            <h3>NCD Specialist Sub-Cadres — Facility Coverage vs IPHS</h3>
            <span className="detail-card-note">% of facilities meeting IPHS norms · Slide 4, HRH Review 2025-26</span>
          </div>
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={NCD_SPECIALISTS} layout="vertical"
              margin={{ top: 8, right: 64, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9e1" />
              <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 130]} />
              <YAxis dataKey="name" type="category" width={130}
                tick={{ fontSize: 11, fill: '#3a3020' }} />
              <Tooltip formatter={v => [`${v}%`, 'Coverage vs IPHS']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="pct" name="Coverage vs IPHS" fill="#00b5cc"
                radius={[0,3,3,0]} maxBarSize={16}
                label={{ position: 'right', fontSize: 10, fill: '#475569',
                  formatter: v => `${v}%` }} />
            </BarChart>
          </ResponsiveContainer>
          <p className="hrh-prod-note">Values ≥100% indicate full IPHS coverage. Source: NHM HRH Review 2025-26.</p>
        </div>
      )}

      {/* State-wide HRH context */}
      <div className="detail-card hrh-context-card">
        <div className="detail-card-header">
          <h3>State HRH Context</h3>
          <span className="detail-card-note">All cadres combined · HRH Review 2025-26</span>
        </div>
        <div className="hrh-ctx-grid">
          <div className="hrh-ctx-panel">
            <HRHDonut regular={48} contractual={30} gap={22} total={100} />
            <div className="hrh-ctx-legend">
              {[
                { l: 'Regular 48%',     c: '#00b5cc' },
                { l: 'Contractual 30%', c: '#D97706' },
                { l: 'Gap 22%',         c: '#CBD5E1' },
              ].map(x => (
                <div key={x.l} className="hrh-dl-item">
                  <span className="hrh-dl-dot" style={{ background: x.c }} /><span>{x.l}</span>
                </div>
              ))}
            </div>
            <div className="hrh-ctx-title">Workforce Mix</div>
          </div>

          <div className="hrh-ctx-panel">
            <HRHDonut regular={50} contractual={24} gap={26} total={100}
              colors={['#C0504D', '#E53E3E', '#E8E0D0']} />
            <div className="hrh-ctx-legend">
              {[
                { l: 'HRH = 50% of RE', c: '#C0504D' },
                { l: 'Spent 24%',        c: '#E53E3E' },
                { l: 'Unspent 26%',      c: '#E8E0D0' },
              ].map(x => (
                <div key={x.l} className="hrh-dl-item">
                  <span className="hrh-dl-dot" style={{ background: x.c }} /><span>{x.l}</span>
                </div>
              ))}
            </div>
            <div className="hrh-ctx-title">Budget (Nov 2025)</div>
          </div>

          <div className="hrh-ctx-panel">
            <div className="hrh-ctx-prod">
              {[
                { lbl: 'OPD/Doctor/Day',   actual: 7, std: 60  },
                { lbl: 'Dental OPD/Day',   actual: 4, std: 20  },
                { lbl: 'Tests/LT/Day',     actual: 9, std: 100 },
                { lbl: 'Surgery/OBG/Wk',  actual: 2, std: 7   },
              ].map(p => (
                <div key={p.lbl} className="hrh-ctx-prod-row">
                  <span className="hrh-ctx-prod-lbl">{p.lbl}</span>
                  <span>
                    <span className="hrh-ctx-prod-actual">{p.actual}</span>
                    <span className="hrh-ctx-prod-std">/{p.std}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="hrh-ctx-title">Productivity vs IPHS</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Current-Status Section helpers ─────────────────────────────── */

function CSBand({ heading, source }) {
  return (
    <div className="cs-band">
      <span className="cs-eyebrow">Current Status</span>
      <span className="cs-hdg">{heading}</span>
      <span className="cs-src-tag">{source}</span>
    </div>
  );
}

function CSPlotCard({ title, note, children, half }) {
  return (
    <div className={`cs-plot-card${half ? ' cs-plot-card--half' : ''}`}>
      <div className="detail-card-header">
        <h3 className="cs-plot-title">{title}</h3>
        {note && <span className="detail-card-note">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function MMRStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  return (
    <div ref={ref}>
      <CSBand heading="SDG 3.1.1 — Maternal Mortality Ratio" source={cs.source} />
      <div className="cs-plot-row">
        {/* Stats card */}
        <div className="detail-card cs-card" style={{ flex: 1 }}>
          <div className="cs-sdg-strip">
            <div className="cs-sdg-col cs-sdg-col--label">
              <span className="cs-value-muted">SDG Indicator</span>
              <span className="cs-sdg-indicator-name">3.1.1 Maternal Mortality Ratio</span>
            </div>
            <div className="cs-sdg-col">
              <span className="cs-value-muted">State Status</span>
              <span className="cs-value-na">N/A</span>
            </div>
            <div className="cs-sdg-col">
              <span className="cs-value-muted">SDG Target</span>
              <span className="cs-value-good">Less than 70</span>
            </div>
          </div>
          <div className="cs-stats-3" style={{ marginTop: 20 }}>
            <div className="cs-stat-block">
              <div className="cs-stat-val">28</div>
              <div className="cs-stat-lbl">Total Districts</div>
            </div>
            <div className="cs-stat-block">
              <div className="cs-stat-val cs-red">3</div>
              <div className="cs-stat-lbl">Maternal Deaths — HMIS 2024-25</div>
            </div>
            <div className="cs-stat-block cs-stat-wide">
              <div className="cs-stat-lbl cs-stat-lbl--header">Major Cause (HMIS)</div>
              <div className="cs-stat-cause">Others / Unknown — 64.3% (2)</div>
              <div className="cs-stat-cause">Hypertensive Disorder — 5.51% (1)</div>
            </div>
          </div>
          <div className="cs-highlights">
            <div className="cs-hl-row">
              <span className="cs-hl-label">Districts with most MDs</span>
              <span className="cs-hl-value">East Siang (2); Namsai (1)</span>
            </div>
            <div className="cs-hl-row">
              <span className="cs-hl-label">Place of Deaths</span>
              <span className="cs-hl-value">Facility deaths (100%)</span>
            </div>
          </div>
        </div>
        {/* District donut */}
        <CSPlotCard title="Maternal Deaths by District" note="FY 2024-25 · HMIS" half>
          <Plot
            data={[{
              type: 'pie', hole: 0.58,
              labels: ['East Siang', 'Namsai', '26 districts — 0 deaths'],
              values: [2, 1, 25],
              marker: { colors: [ORG, AMB, '#E2E8F0'], line: { color: '#fff', width: 2 } },
              textinfo: 'label+value',
              textfont: { size: 12, color: NAVY },
              hovertemplate: '<b>%{label}</b><br>Deaths: %{value}<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE,
              height: 280,
              showlegend: false,
              annotations: [{ text: '<b style="color:#00b5cc">3</b><br>Deaths', x: 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 18, color: ORG } }],
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>
    </div>
  );
}

function ChildHealthStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const sncuColors = [ORG, NAVY, AMB, SLT];
  const imrColors  = [ORG, AMB, TEAL, SLT];
  return (
    <div ref={ref}>
      <CSBand heading="Child Health — Arunachal Pradesh" source={cs.source} />
      {/* SDG indicators + facility stats */}
      <div className="detail-card cs-card">
        <table className="cs-table">
          <thead><tr><th>S No</th><th>SDG Indicator</th><th>State</th><th>National</th><th>SDG Target 2030</th></tr></thead>
          <tbody>
            {cs.sdgIndicators.map((row, i) => (
              <tr key={i}><td>{row.no}</td><td>{row.name}</td><td className="cs-val-teal">{row.state}</td><td>{row.national}</td><td>{row.sdgTarget}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="cs-stats-3" style={{ marginTop: 20 }}>
          <div className="cs-stat-block"><div className="cs-stat-val">{cs.totalDistricts}</div><div className="cs-stat-lbl">Total Districts</div></div>
          <div className="cs-stat-block"><div className="cs-stat-val">{cs.sncuNicus}</div><div className="cs-stat-lbl">SNCU / NICUs</div></div>
          <div className="cs-stat-block"><div className="cs-stat-val">{cs.deics}</div><div className="cs-stat-lbl">DEICs</div></div>
        </div>
      </div>
      {/* Mortality cause donuts */}
      <div className="cs-plot-row">
        <CSPlotCard title="SNCU / NICU Mortality Causes" note="27 Neonatal Deaths · FBNC Portal Apr–Dec 2025" half>
          <Plot
            data={[{
              type: 'pie', hole: 0.55,
              labels: ['Resp. Distress Syndrome', 'Birth Asphyxia', 'Meconium Aspiration', 'Any Other'],
              values: [18.5, 14.8, 7.4, 55.6],
              marker: { colors: sncuColors, line: { color: '#fff', width: 2 } },
              textinfo: 'percent', textfont: { size: 11 },
              hovertemplate: '<b>%{label}</b><br>%{percent}<extra></extra>',
            }]}
            layout={{ ...PLOT_BASE, height: 290, showlegend: true, legend: { orientation: 'h', y: -0.18, font: { size: 10 } } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
        <CSPlotCard title="Infant Mortality Causes" note="52 Infant Deaths · HMIS Apr–Dec 2025" half>
          <Plot
            data={[{
              type: 'pie', hole: 0.55,
              labels: ['Prematurity', 'Asphyxia', 'Sepsis', 'Other'],
              values: [23.1, 11.5, 5.8, 57.7],
              marker: { colors: imrColors, line: { color: '#fff', width: 2 } },
              textinfo: 'percent', textfont: { size: 11 },
              hovertemplate: '<b>%{label}</b><br>%{percent}<extra></extra>',
            }]}
            layout={{ ...PLOT_BASE, height: 290, showlegend: true, legend: { orientation: 'h', y: -0.18, font: { size: 10 } } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>
      {/* High-mortality districts */}
      {cs.mortalityRows.map((row, i) => (
        <div key={i} className="detail-card cs-card">
          <div className="cs-mort-label">{row.label}</div>
          <div className="cs-mort-two">
            <div><div className="cs-mort-head">Districts with High Mortality</div><div className="cs-mort-val">{row.highDistricts}</div></div>
            <div><div className="cs-mort-head">Main Reasons of Mortality</div><div className="cs-mort-val">{row.causes}</div></div>
          </div>
        </div>
      ))}
      {/* RBSK */}
      <CSPlotCard title="RBSK — Functionality of DEIC" note="Overall availability · MoHFW NPCC May 2026">
        <div className="cs-plot-row" style={{ alignItems: 'flex-start', gap: 24 }}>
          <Plot
            data={[{
              type: 'bar', orientation: 'h',
              x: [52, 67],
              y: ['HR Available', 'Equipment Available'],
              marker: { color: [ORG, TEAL], opacity: 0.9 },
              text: ['52%', '67%'], textposition: 'outside',
              textfont: { size: 14, color: NAVY, family: 'JetBrains Mono, monospace' },
              hovertemplate: '%{y}: %{x}%<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE, height: 160,
              margin: { t: 12, r: 60, b: 28, l: 140 },
              xaxis: { range: [0, 110], ticksuffix: '%', gridcolor: '#F1F5F9', showgrid: true },
              yaxis: { tickfont: { size: 13 } },
              showlegend: false,
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
          <div style={{ paddingTop: 12 }}>
            <div className="cs-stat-lbl cs-stat-lbl--header" style={{ marginBottom: 8 }}>Bottom 30% Districts</div>
            {cs.rbsk.bottom30.map((d, j) => <div key={j} className="cs-stat-cause cs-red" style={{ fontSize: 15, fontWeight: 700 }}>{d}</div>)}
          </div>
        </div>
      </CSPlotCard>
    </div>
  );
}

function FPStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  return (
    <div ref={ref}>
      <CSBand heading="SDG 3.7.1 — Family Planning" source={cs.source} />
      <div className="cs-plot-row">
        <div className="detail-card cs-card" style={{ flex: 1 }}>
          <div className="cs-fp-indicator">{cs.indicator}</div>
          <div className="cs-stats-3" style={{ marginTop: 20 }}>
            <div className="cs-stat-block">
              <div className="cs-stat-val cs-red">{cs.stateStatus}</div>
              <div className="cs-stat-lbl">State Status</div>
            </div>
            <div className="cs-stat-block">
              <div className="cs-stat-val cs-value-good-lg">{cs.sdgTarget}</div>
              <div className="cs-stat-lbl">SDG Target {cs.sdgTargetNote}</div>
            </div>
          </div>
        </div>
        <CSPlotCard title="Family Planning Satisfaction — vs Target" note="SDG 3.7.1" half>
          <Plot
            data={[{
              type: 'indicator', mode: 'gauge+number+delta',
              value: 60.2,
              delta: { reference: 74.2, valueformat: '.1f', suffix: ' pp gap', increasing: { color: TEAL }, decreasing: { color: ORG } },
              number: { suffix: '%', font: { size: 48, color: ORG, family: 'JetBrains Mono, monospace' } },
              gauge: {
                axis: { range: [0, 100], ticksuffix: '%', tickfont: { size: 11 } },
                bar: { color: ORG, thickness: 0.28 },
                bgcolor: '#F8FAFC',
                borderwidth: 0,
                steps: [
                  { range: [0, 60.2], color: 'rgba(0,181,204,0.12)' },
                  { range: [60.2, 74.2], color: 'rgba(16,185,129,0.12)' },
                ],
                threshold: { line: { color: TEAL, width: 3 }, thickness: 0.8, value: 74.2 },
              },
            }]}
            layout={{
              ...PLOT_BASE, height: 260,
              annotations: [{ text: `<b style="color:${TEAL}">▶ 74.2% target</b>`, x: 0.5, y: 0.08, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 12, color: TEAL } }],
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>
    </div>
  );
}

function TBStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const metricVals = cs.abhiyanMetrics.map(m => parseFloat(m.value));
  const metricLabels = cs.abhiyanMetrics.map(m => m.label.length > 32 ? m.label.slice(0, 30) + '…' : m.label);
  return (
    <div ref={ref}>
      <CSBand heading="TB Mukt Bharat Abhiyan — Current Status" source={cs.source} />
      {/* Incidence + mortality gauges side by side */}
      <div className="cs-plot-row">
        <CSPlotCard title="TB Incidence" note="per lakh population · State vs Target" half>
          <Plot
            data={[{
              type: 'indicator', mode: 'gauge+number',
              value: parseInt(cs.incidence),
              number: { font: { size: 52, color: ORG, family: 'JetBrains Mono, monospace' } },
              gauge: {
                axis: { range: [0, 250], tickfont: { size: 10 } },
                bar: { color: ORG, thickness: 0.3 },
                bgcolor: '#F8FAFC', borderwidth: 0,
                steps: [{ range: [0, 47], color: 'rgba(16,185,129,0.15)' }, { range: [47, 250], color: 'rgba(0,181,204,0.08)' }],
                threshold: { line: { color: TEAL, width: 3 }, thickness: 0.8, value: 47 },
              },
            }]}
            layout={{ ...PLOT_BASE, height: 220, annotations: [{ text: '<b>Target: 47</b> / lakh', x: 0.5, y: 0.05, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 12, color: TEAL } }] }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
        <CSPlotCard title="TB Mortality" note="per lakh population · State vs Target" half>
          <Plot
            data={[{
              type: 'indicator', mode: 'gauge+number',
              value: parseInt(cs.mortality),
              number: { font: { size: 52, color: NAVY, family: 'JetBrains Mono, monospace' } },
              gauge: {
                axis: { range: [0, 30], tickfont: { size: 10 } },
                bar: { color: NAVY, thickness: 0.3 },
                bgcolor: '#F8FAFC', borderwidth: 0,
                steps: [{ range: [0, 3], color: 'rgba(16,185,129,0.15)' }, { range: [3, 30], color: 'rgba(26,31,54,0.08)' }],
                threshold: { line: { color: TEAL, width: 3 }, thickness: 0.8, value: 3 },
              },
            }]}
            layout={{ ...PLOT_BASE, height: 220, annotations: [{ text: '<b>Target: 3</b> / lakh', x: 0.5, y: 0.05, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 12, color: TEAL } }] }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>
      {/* District notification + death rate */}
      <div className="cs-plot-row">
        <CSPlotCard title="Notification vs Estimates — District Achievement" note={`Factors: ${cs.factors.notification}`} half>
          <Plot
            data={[{
              type: 'bar',
              x: [cs.notifVsEst.above90, cs.notifVsEst.mid, cs.notifVsEst.below50],
              y: ['>90%', '50–90%', '<50%'],
              orientation: 'h',
              marker: { color: [TEAL, AMB, ORG] },
              text: [`${cs.notifVsEst.above90} districts`, `${cs.notifVsEst.mid} districts`, `${cs.notifVsEst.below50} districts`],
              textposition: 'outside',
              textfont: { size: 13, color: NAVY, family: 'JetBrains Mono, monospace' },
              hovertemplate: '%{y}: %{x} districts<extra></extra>',
            }]}
            layout={{ ...PLOT_BASE, height: 180, margin: { t: 12, r: 80, b: 32, l: 56 }, xaxis: { range: [0, 12], showgrid: false }, yaxis: { tickfont: { size: 13 } }, showlegend: false }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
        <CSPlotCard title="Death Rate — District Achievement" note={`Factors: ${cs.factors.deathRate}`} half>
          <Plot
            data={[{
              type: 'bar',
              x: [cs.deathRate.above5, cs.deathRate.mid, cs.deathRate.below3],
              y: ['>5%', '3–5%', '<3%'],
              orientation: 'h',
              marker: { color: [ORG, AMB, TEAL] },
              text: [`${cs.deathRate.above5} districts`, `${cs.deathRate.mid} districts`, `${cs.deathRate.below3} districts`],
              textposition: 'outside',
              textfont: { size: 13, color: NAVY, family: 'JetBrains Mono, monospace' },
              hovertemplate: '%{y}: %{x} districts<extra></extra>',
            }]}
            layout={{ ...PLOT_BASE, height: 180, margin: { t: 12, r: 80, b: 32, l: 56 }, xaxis: { range: [0, 12], showgrid: false }, yaxis: { tickfont: { size: 13 } }, showlegend: false }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>
      {/* Abhiyan progress horizontal bars */}
      <CSPlotCard title="TB Mukt Bharat Abhiyan Progress" note={cs.abhiyanPeriod}>
        <Plot
          data={[{
            type: 'bar', orientation: 'h',
            x: metricVals,
            y: metricLabels,
            marker: { color: metricVals.map(v => v >= 50 ? TEAL : v >= 25 ? AMB : ORG), opacity: 0.9 },
            text: cs.abhiyanMetrics.map(m => `${m.value}  ${m.detail}`),
            textposition: 'outside',
            textfont: { size: 11, color: '#374151' },
            hovertemplate: '<b>%{y}</b><br>%{x}%<extra></extra>',
          }]}
          layout={{
            ...PLOT_BASE, height: 340,
            margin: { t: 12, r: 220, b: 40, l: 240 },
            xaxis: { range: [0, 130], ticksuffix: '%', gridcolor: '#F1F5F9' },
            yaxis: { tickfont: { size: 12 }, automargin: true },
            showlegend: false,
          }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
        <div className="cs-tb-infra" style={{ marginTop: 12 }}>
          {cs.infrastructure.map((inf, i) => (
            <div key={i} className="cs-hl-row">
              <span className="cs-hl-label">{inf.label}</span>
              <span className="cs-hl-value"><strong>{inf.value}</strong> — {inf.detail}</span>
            </div>
          ))}
        </div>
      </CSPlotCard>
      {/* Ni-kshay Poshan Yojana */}
      <CSPlotCard title="Ni-kshay Poshan Yojana" note="Eligible vs Paid vs Pending beneficiaries">
        <Plot
          data={[
            { type: 'bar', name: 'Paid All Benefits', x: cs.nikshayYojana.map(r => r.year), y: cs.nikshayYojana.map(r => r.paidAll), marker: { color: TEAL }, text: cs.nikshayYojana.map(r => r.paidAll.toLocaleString()), textposition: 'outside', textfont: { size: 13, color: TEAL } },
            { type: 'bar', name: 'To Be Paid', x: cs.nikshayYojana.map(r => r.year), y: cs.nikshayYojana.map(r => r.toBePaid), marker: { color: ORG }, text: cs.nikshayYojana.map(r => r.toBePaid.toLocaleString()), textposition: 'outside', textfont: { size: 13, color: ORG } },
          ]}
          layout={{ ...PLOT_BASE, height: 260, barmode: 'group', margin: { t: 16, r: 20, b: 40, l: 60 }, xaxis: { tickfont: { size: 14 } }, yaxis: { title: 'Beneficiaries', gridcolor: '#F1F5F9' }, legend: { orientation: 'h', y: -0.2, font: { size: 12 } } }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
      </CSPlotCard>
    </div>
  );
}

function LeprosyStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const notIOT = cs.totalDistricts - cs.iotAchieved;
  return (
    <div ref={ref}>
      <CSBand heading="NLEP — Disease Elimination Status" source={cs.source} />
      <div className="cs-plot-row">
        {/* IOT donut */}
        <CSPlotCard title="IOT Achievement" note="Interruption of Transmission · District-level" half>
          <Plot
            data={[{
              type: 'pie', hole: 0.6,
              labels: ['IOT Achieved', 'Yet to Achieve'],
              values: [cs.iotAchieved, notIOT],
              marker: { colors: [TEAL, '#E2E8F0'], line: { color: '#fff', width: 2 } },
              textinfo: 'label+value',
              textfont: { size: 13 },
              hovertemplate: '<b>%{label}</b><br>%{value} districts<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE, height: 280, showlegend: false,
              annotations: [{ text: `<b>${cs.iotAchieved}</b><br><span style="font-size:11px">of ${cs.totalDistricts}</span>`, x: 0.5, y: 0.5, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 20, color: TEAL } }],
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
        {/* Annual cases grouped bar */}
        <CSPlotCard title="Annual Case Data — Arunachal Pradesh" note="New cases, G2D and Child cases" half>
          <Plot
            data={[
              { type: 'bar', name: 'Total New Cases', x: cs.annualData.map(r => r.fy), y: cs.annualData.map(r => r.newCases), marker: { color: ORG }, text: cs.annualData.map(r => r.newCases), textposition: 'outside', textfont: { size: 15, color: ORG } },
              { type: 'bar', name: 'G2D Cases', x: cs.annualData.map(r => r.fy), y: cs.annualData.map(r => r.g2dCases), marker: { color: NAVY }, text: cs.annualData.map(r => r.g2dCases), textposition: 'outside', textfont: { size: 13, color: NAVY } },
              { type: 'bar', name: 'Child Cases', x: cs.annualData.map(r => r.fy), y: cs.annualData.map(r => r.childCases), marker: { color: AMB }, text: cs.annualData.map(r => r.childCases), textposition: 'outside', textfont: { size: 13, color: AMB } },
            ]}
            layout={{ ...PLOT_BASE, height: 280, barmode: 'group', margin: { t: 20, r: 20, b: 40, l: 48 }, xaxis: { tickfont: { size: 13 } }, yaxis: { gridcolor: '#F1F5F9', title: 'Cases' }, legend: { orientation: 'h', y: -0.22, font: { size: 11 } } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>
      <div className="detail-card cs-card">
        <div className="cs-mort-head">Districts achieving IOT — 50–60% range</div>
        <div className="cs-iot-districts" style={{ marginTop: 8 }}>{cs.iotDistricts50_60}</div>
      </div>
    </div>
  );
}

function MalariaStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const years = cs.casesTrend.map(r => r.year);
  return (
    <div ref={ref}>
      <CSBand heading="Malaria — Disease Status" source={cs.source} />
      {/* Elimination target + 2025 stat */}
      <div className="detail-card cs-card">
        <div className="cs-stats-3">
          <div className="cs-stat-block cs-stat-wide">
            <div className="cs-stat-lbl cs-stat-lbl--header">National Framework Target</div>
            <div className="cs-stat-cause">{cs.eliminationTarget}</div>
          </div>
          <div className="cs-stat-block">
            <div className="cs-stat-val cs-amber">{cs.totalCases2025}</div>
            <div className="cs-stat-lbl">Total Cases 2025</div>
            <div className="cs-stat-sub">{cs.caseBreakdown2025}</div>
          </div>
        </div>
      </div>
      {/* Stacked bar: indigenous + imported by year */}
      <CSPlotCard title="Annual Case Trend — Indigenous vs Imported" note="Pv = P. vivax · Pf = P. falciparum · Zero deaths across all years">
        <Plot
          data={[
            { type: 'bar', name: 'Indigenous', x: years, y: cs.casesTrend.map(r => r.indigenous), marker: { color: ORG }, text: cs.casesTrend.map(r => r.indigenous), textposition: 'inside', textfont: { size: 13, color: '#fff' } },
            { type: 'bar', name: 'Imported', x: years, y: cs.casesTrend.map(r => r.imported), marker: { color: NAVY }, text: cs.casesTrend.map(r => r.imported), textposition: 'inside', textfont: { size: 13, color: '#fff' } },
          ]}
          layout={{
            ...PLOT_BASE, height: 300, barmode: 'stack',
            margin: { t: 16, r: 20, b: 40, l: 48 },
            xaxis: { tickfont: { size: 14 } },
            yaxis: { title: 'Cases', gridcolor: '#F1F5F9' },
            legend: { orientation: 'h', y: -0.2, font: { size: 13 } },
          }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
        {/* Pv/Pf breakdown as a second trace */}
        <div className="cs-plot-row" style={{ marginTop: 16 }}>
          <CSPlotCard title="Species Breakdown" note="P. vivax vs P. falciparum" half>
            <Plot
              data={[
                { type: 'bar', name: 'P. vivax (Pv)', x: years, y: cs.casesTrend.map(r => r.pv), marker: { color: AMB } },
                { type: 'bar', name: 'P. falciparum (Pf)', x: years, y: cs.casesTrend.map(r => r.pf), marker: { color: TEAL } },
              ]}
              layout={{ ...PLOT_BASE, height: 220, barmode: 'group', margin: { t: 8, r: 16, b: 40, l: 40 }, xaxis: { tickfont: { size: 13 } }, yaxis: { gridcolor: '#F1F5F9' }, legend: { orientation: 'h', y: -0.28, font: { size: 11 } } }}
              config={PLOT_CFG} style={{ width: '100%' }}
            />
          </CSPlotCard>
          <div className="detail-card cs-card" style={{ flex: 1 }}>
            <div className="detail-card-header"><h3>Programme Status</h3><span className="detail-card-note">NCVBDCP · MoHFW NPCC May 2026</span></div>
            <ul className="obs-list">
              {cs.keyPoints.map((pt, i) => (
                <li key={i} className="obs-item"><span className="obs-marker" />{pt}</li>
              ))}
            </ul>
          </div>
        </div>
      </CSPlotCard>
    </div>
  );
}

function PMABHIMStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const fyrs = cs.financialYears;
  const totalRow = cs.financialProgress.find(r => r.isTotal);
  return (
    <div ref={ref}>
      <CSBand heading="PM-ABHIM — Physical & Financial Progress (FY 2021-22 to 2025-26)" source={cs.source} />
      {/* Physical progress chart */}
      <CSPlotCard title="Physical Progress" note="FY 2021-22 to FY 2025-26">
        <Plot
          data={[
            { type: 'bar', name: 'Approved', x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.approved), marker: { color: SLT } },
            { type: 'bar', name: 'Work Started', x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.started), marker: { color: AMB } },
            { type: 'bar', name: 'Completed', x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.completed), marker: { color: TEAL } },
            { type: 'bar', name: 'Functional', x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.functional), marker: { color: ORG } },
          ]}
          layout={{ ...PLOT_BASE, height: 300, barmode: 'group', margin: { t: 16, r: 20, b: 60, l: 56 }, xaxis: { tickfont: { size: 13 } }, yaxis: { title: 'Units', gridcolor: '#F1F5F9' }, legend: { orientation: 'h', y: -0.28, font: { size: 12 } } }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
      </CSPlotCard>
      {/* XV-FC financial progress — approval vs release by year */}
      <CSPlotCard title="XV-FC Financial Progress — TOTAL" note="Rs. in Crore · Approval vs Release by FY">
        <Plot
          data={[
            { type: 'bar', name: 'Approval', x: fyrs, y: fyrs.map(yr => totalRow?.[yr]?.approval ?? 0), marker: { color: NAVY }, text: fyrs.map(yr => totalRow?.[yr]?.approval ? `${totalRow[yr].approval}` : ''), textposition: 'outside', textfont: { size: 11, color: NAVY } },
            { type: 'bar', name: 'Release', x: fyrs, y: fyrs.map(yr => totalRow?.[yr]?.release ?? 0), marker: { color: ORG }, text: fyrs.map(yr => totalRow?.[yr]?.release ? `${totalRow[yr].release}` : '—'), textposition: 'outside', textfont: { size: 11, color: ORG } },
          ]}
          layout={{ ...PLOT_BASE, height: 300, barmode: 'group', margin: { t: 24, r: 20, b: 48, l: 60 }, xaxis: { tickfont: { size: 13 } }, yaxis: { title: 'Rs. Crore', gridcolor: '#F1F5F9' }, legend: { orientation: 'h', y: -0.22, font: { size: 13 } } }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
        <p className="hrh-prod-note" style={{ marginTop: 8 }}>% Expenditure (as on March 2026) is against the amount released.</p>
      </CSPlotCard>
      {/* Detailed financial table */}
      <div className="detail-card cs-card">
        <div className="detail-card-header"><h3>XV-FC Component-wise Detail</h3><span className="detail-card-note">Rs. in Crore</span></div>
        <div className="cs-table-scroll">
          <table className="cs-table cs-table--finance">
            <thead>
              <tr>
                <th rowSpan={2} className="cs-th-component">Component</th>
                {fyrs.map(yr => <th key={yr} colSpan={2} className="cs-th-yr">{yr}</th>)}
              </tr>
              <tr>{fyrs.map(yr => [<th key={yr+'a'} className="cs-th-sub">Appr.</th>, <th key={yr+'r'} className="cs-th-sub">Rel.</th>])}</tr>
            </thead>
            <tbody>
              {cs.financialProgress.map((row, i) => (
                <tr key={i} className={row.isTotal ? 'cs-row-total' : ''}>
                  <td>{row.component}</td>
                  {fyrs.map(yr => [
                    <td key={yr+'a'}>{row[yr]?.approval ?? '—'}</td>,
                    <td key={yr+'r'} className={row[yr]?.release == null ? 'cs-val-muted' : ''}>{row[yr]?.release ?? '—'}</td>,
                  ])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CurrentStatusSection({ program }) {
  const cs = program.currentStatus;
  if (!cs) return null;
  switch (cs.type) {
    case 'mmr':            return <MMRStatus cs={cs} />;
    case 'child-health':   return <ChildHealthStatus cs={cs} />;
    case 'family-planning': return <FPStatus cs={cs} />;
    case 'tb':             return <TBStatus cs={cs} />;
    case 'leprosy':        return <LeprosyStatus cs={cs} />;
    case 'malaria':        return <MalariaStatus cs={cs} />;
    case 'pm-abhim':       return <PMABHIMStatus cs={cs} />;
    default:               return null;
  }
}

export default function DetailPage({ program, division, onBack }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' },
      );
      gsap.from('.dm-card', { y: 28, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.15 });
      gsap.from('.obs-item, .action-item', { x: -14, opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out', delay: 0.4 });
    }, wrapRef);
    return () => ctx.revert();
  }, [program.id]);

  const handleBack = () => {
    gsap.to(wrapRef.current, {
      opacity: 0, y: -14, duration: 0.28, ease: 'power2.in',
      onComplete: onBack,
    });
  };

  const cfg = STATUS_CONFIG[program.status];

  // Programmes where the NFHS section is rebranded as "Current Status"
  const isCurrentStatus = ['maternal-health', 'child-health'].includes(program.id);

  // Build chart data — only % indicators with both values
  const chartData = (program.nfhsData || [])
    .filter(d => d.unit === '%' && d.nfhs4 !== null && d.nfhs5 !== null)
    .map(d => ({
      name: isCurrentStatus
        ? (d.label.length > 38 ? d.label.slice(0, 36) + '…' : d.label)
        : (d.label.length > 44 ? d.label.slice(0, 42) + '…' : d.label),
      fullLabel: d.label,
      'NFHS-4 (2015-16)': d.nfhs4,
      'NFHS-5 (2019-21)': d.nfhs5,
    }));

  // Radar chart data for maternal-health (all % indicators)
  const radarData = program.id === 'maternal-health'
    ? chartData.map(d => ({
        indicator: d.name.length > 22 ? d.name.slice(0, 20) + '…' : d.name,
        'NFHS-4': d['NFHS-4 (2015-16)'],
        'NFHS-5': d['NFHS-5 (2019-21)'],
      }))
    : [];

  const barH = isCurrentStatus ? 68 : 54;
  const chartHeight = chartData.length * barH + 50;

  return (
    <div className="detail-root" ref={wrapRef}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="detail-topbar">
        <div className="detail-topbar-inner">
          <button className="back-btn" onClick={handleBack}>
            <span className="back-chevron">←</span> Back to Overview
          </button>
          <div className="detail-breadcrumb">
            <span className="detail-div-tag">{division.label}</span>
            <span className="detail-prog-name">{program.name}</span>
          </div>
          <div className={`status-pill st-${program.status}`}>
            {cfg.shortLabel}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="detail-content">

        {/* Summary */}
        <div className="detail-summary-bar">
          <p className="detail-summary-text">{program.summary}</p>
        </div>

        {/* Key Metrics */}
        <div className="detail-metrics-grid">
          {program.keyMetrics.map(m => (
            <div className="dm-card" key={m.label}>
              <div className="dm-value">{m.value}</div>
              <div className="dm-label">{m.label}</div>
              {m.change && (
                <div className={`dm-change ${m.changeDir === 'up' ? 'dm-pos' : 'dm-neg'}`}>
                  {m.changeDir === 'up' ? '▲' : '▼'} {m.change} vs previous
                </div>
              )}
              <div className="dm-source">{m.source}</div>
            </div>
          ))}
        </div>

        {/* Programme-specific Current Status */}
        <CurrentStatusSection program={program} />

        {/* HRH staffing detail — cadre programmes only */}
        {division?.id === 'hrh' && program.id !== 'pm-abhim' && <HRHSection program={program} />}

        {/* NFHS Chart — "Current Status" for maternal-health & child-health */}
        {chartData.length > 0 && (
          <div className={`detail-card${isCurrentStatus ? ' cs-nfhs-card' : ''}`}>
            <div className="detail-card-header">
              {isCurrentStatus
                ? <h3 className="cs-nfhs-title">Current Status <span className="cs-nfhs-subtitle">NFHS-4 (2015-16) vs NFHS-5 (2019-21)</span></h3>
                : <h3>NFHS-4 (2015-16) vs NFHS-5 (2019-21) — Key Indicators</h3>
              }
              <span className="detail-card-note">Percentage points</span>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: isCurrentStatus ? 56 : 44, left: 12, bottom: 8 }}
                  barCategoryGap="28%"
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ede9e1" />
                  <XAxis type="number" tick={{ fontSize: isCurrentStatus ? 13 : 11, fill: '#7a7060' }} unit="%" domain={[0, 100]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={isCurrentStatus ? 300 : 274}
                    tick={{ fontSize: isCurrentStatus ? 13 : 11, fill: '#3a3020', fontWeight: isCurrentStatus ? 500 : 400 }}
                  />
                  <Tooltip
                    labelFormatter={(_, p) => p?.[0]?.payload?.fullLabel || ''}
                    formatter={(v, name) => [`${v}%`, name]}
                    contentStyle={{ fontSize: isCurrentStatus ? 14 : 12, borderRadius: 8, border: '1px solid #e0d8cc' }}
                  />
                  <Legend iconType="square" wrapperStyle={{ fontSize: isCurrentStatus ? 13 : 12 }} />
                  <Bar dataKey="NFHS-4 (2015-16)" fill={NFHS4_COLOR} radius={[0, 3, 3, 0]} maxBarSize={isCurrentStatus ? 26 : 18}>
                    {isCurrentStatus && (
                      <LabelList dataKey="NFHS-4 (2015-16)" position="right"
                        formatter={v => `${v}%`}
                        style={{ fontSize: 11, fill: NFHS4_COLOR, fontWeight: 600 }} />
                    )}
                  </Bar>
                  <Bar dataKey="NFHS-5 (2019-21)" fill={NFHS5_COLOR} radius={[0, 3, 3, 0]} maxBarSize={isCurrentStatus ? 26 : 18}>
                    {isCurrentStatus && (
                      <LabelList dataKey="NFHS-5 (2019-21)" position="right"
                        formatter={v => `${v}%`}
                        style={{ fontSize: 11, fill: NFHS5_COLOR, fontWeight: 600 }} />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Radar chart — maternal health only */}
        {radarData.length > 0 && (
          <div className="detail-card cs-nfhs-card">
            <div className="detail-card-header">
              <h3 className="cs-nfhs-title">Current Status <span className="cs-nfhs-subtitle">Coverage Profile — Radar View</span></h3>
              <span className="detail-card-note">NFHS-4 vs NFHS-5 · % of women / births</span>
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Radar name="NFHS-4 (2015-16)" dataKey="NFHS-4" stroke={NFHS4_COLOR}
                  fill={NFHS4_COLOR} fillOpacity={0.18} strokeWidth={2} />
                <Radar name="NFHS-5 (2019-21)" dataKey="NFHS-5" stroke={NFHS5_COLOR}
                  fill={NFHS5_COLOR} fillOpacity={0.25} strokeWidth={2.5} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                <Tooltip formatter={(v, name) => [`${v}%`, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e0d8cc' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* NFHS Detail Table — "Current Status" for maternal-health & child-health */}
        {(program.nfhsData || []).length > 0 && (
          <div className={`detail-card${isCurrentStatus ? ' cs-nfhs-card' : ''}`}>
            <div className="detail-card-header">
              {isCurrentStatus
                ? <h3 className="cs-nfhs-title">Current Status <span className="cs-nfhs-subtitle">Indicator Details</span></h3>
                : <h3>Indicator Details</h3>
              }
              <div className="table-legend">
                <span className="tl-dot" style={{ background: NFHS4_COLOR }} /> NFHS-4
                <span className="tl-dot" style={{ background: NFHS5_COLOR }} /> NFHS-5
              </div>
            </div>
            <div className={`ind-table${isCurrentStatus ? ' ind-table--lg' : ''}`}>
              <div className="ind-head">
                <span>Indicator <span className="head-note">(green row = improvement · red row = regression)</span></span>
                <span>NFHS-4 (2015-16)</span>
                <span>NFHS-5 (2019-21)</span>
                <span>Change</span>
              </div>
              {program.nfhsData.map(d => <IndRow key={d.label} {...d} large={isCurrentStatus} />)}
            </div>
          </div>
        )}

        {/* Observations + Actions */}
        <div className="detail-two-col">
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Programme Observations</h3>
              <span className="detail-card-note">Source: NFHS-5 (2019-21) · NHM NPCC Meeting, Apr 2026</span>
            </div>
            <ul className="obs-list">
              {program.observations.map((o, i) => (
                <li key={i} className={`obs-item ${i < 2 && program.status === 'red' ? 'obs-critical' : ''}`}>
                  <span className="obs-marker" />
                  {o}
                </li>
              ))}
            </ul>
          </div>

          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Priority Actions</h3>
              <span className="detail-card-note">Derived from NPCC Apr 2026 · NFHS-5 gap analysis</span>
            </div>
            <ol className="action-list">
              {program.actions.map((a, i) => (
                <li key={i} className="action-item">
                  <span className="action-num">{String(i + 1).padStart(2, '0')}</span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

      </div>

      <footer className="detail-footer">
        Sources: NFHS-4 (2015-16) State Fact Sheet — Arunachal Pradesh, IIPS Mumbai.
        NFHS-5 (2019-21) State Fact Sheet — Arunachal Pradesh, IIPS Mumbai.
        NHM NPCC Meeting, Arunachal Pradesh, 1 April 2026. Ministry of Health &amp; Family Welfare, Govt. of India.
      </footer>
    </div>
  );
}

function IndRow({ label, nfhs4, nfhs5, unit, lowerIsBetter, large }) {
  let improved = null;
  let diff = null;

  if (nfhs4 !== null && nfhs5 !== null) {
    improved = lowerIsBetter ? nfhs5 < nfhs4 : nfhs5 > nfhs4;
    diff = (nfhs5 - nfhs4).toFixed(1);
  }

  const fmtVal = v => v !== null && v !== undefined
    ? <span className={large ? 'mono mono--lg' : 'mono'}>{v}{unit}</span>
    : <em className="na">—</em>;

  return (
    <div className={`ind-row ${improved === null ? '' : improved ? 'row-ok' : 'row-bad'}${large ? ' ind-row--lg' : ''}`}>
      <span className="ind-lbl">
        {label}
        <span className="ind-direction">{lowerIsBetter ? 'lower is better' : 'higher is better'}</span>
      </span>
      <span className="ind-val v4">{fmtVal(nfhs4)}</span>
      <span className="ind-val v5">{fmtVal(nfhs5)}</span>
      <span className={`ind-delta ${improved === null ? 'delta-na' : improved ? 'delta-pos' : 'delta-neg'}${large ? ' ind-delta--lg' : ''}`}>
        {improved !== null && (improved ? '↑ ' : '↓ ')}
        {diff !== null ? `${diff > 0 ? '+' : ''}${diff}${unit}` : '—'}
      </span>
    </div>
  );
}
