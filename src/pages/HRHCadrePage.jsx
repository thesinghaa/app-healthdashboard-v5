// HRH / Cadre detail page — Current Status (Key Deliverable 2025-26)
// Charts: react-plotly.js   Animations: GSAP
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import ThemeToggle from '../components/ThemeToggle';
import Plot from 'react-plotly.js';
import { STATUS_CONFIG } from '../data/programs';
import CurrentStatusSection, { CSEntryBar } from './CurrentStatusSection';

/* ── Palette ─────────────────────────────────────────────────────── */
const C_REG  = '#00b5cc';
const C_CTRL = '#F59E0B';
const C_GAP  = '#CBD5E1';

/* ── Per-cadre productivity data (HRH PDF Slide 6) ──────────────── */
const HRH_PRODUCTIVITY = {
  'medical-officer': [
    { name: 'OPD / Doctor / Day',      actual: 7,  iphs: 60  },
  ],
  'lab-tech': [
    { name: 'Tests / LT / Day (PHC)',  actual: 3,  iphs: 100 },
    { name: 'Tests / LT / Day (DH)',   actual: 17, iphs: 100 },
  ],
  'specialist': [
    { name: 'Ob/Gyn Surgeries / Week', actual: 2,  iphs: 7   },
    { name: 'Dental OPD / Day',        actual: 4,  iphs: 20  },
  ],
};

/* ── NCD specialist sub-cadres (HRH PDF Slide 4) ────────────────── */
const NCD_SPECIALISTS = [
  { name: 'Physician',       pct: 35  },
  { name: 'ENT Surgeon',     pct: 90  },
  { name: 'Ophthalmologist', pct: 118 },
  { name: 'Psychiatrist',    pct: 100 },
  { name: 'Dentist',         pct: 106 },
  { name: 'Audiologist',     pct: 100 },
  { name: 'Optometrist',     pct: 16  },
  { name: 'Counsellor',      pct: 31  },
  { name: 'MPSW',            pct: 71  },
  { name: 'Psychologist',    pct: 26  },
  { name: 'Physiotherapist', pct: 91  },
];

/* ── Fill-rate pill colour ───────────────────────────────────────── */
function fillPillStyle(pct) {
  if (pct == null) return { background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB' };
  if (pct >= 80)   return { background: '#F0FFF4', color: '#276749', border: '1px solid #C6F6D5' };
  if (pct >= 50)   return { background: '#FFFBEB', color: '#B7791F', border: '1px solid #FAF089' };
  return             { background: '#FFF0F0', color: '#C53030', border: '1px solid #FED7D7' };
}

/* ── Plotly shared config ────────────────────────────────────────── */
const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };
const BASE_LAYOUT = {
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: "'Inter', 'DM Sans', sans-serif", size: 12, color: '#475569' },
  margin: { t: 16, b: 16, l: 16, r: 16 },
  autosize: true,
};

/* ── Animated counter using GSAP ─────────────────────────────────── */
function CountUp({ to, duration = 1.2, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: typeof to === 'number' ? to : 0,
      duration,
      ease: 'power2.out',
      onUpdate() {
        if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString();
      },
    });
    return () => tween.kill();
  }, [to, duration]);
  return <span ref={ref} className={className}>0</span>;
}

/* ── Plotly Gauge with GSAP needle sweep ─────────────────────────── */
function AchievementGauge({ ach, tgt, barColor }) {
  const [plotVal, setPlotVal] = useState(0);

  useEffect(() => {
    setPlotVal(0);
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: ach,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate() { setPlotVal(Math.round(obj.val)); },
    });
    return () => tween.kill();
  }, [ach]);

  const data = [{
    type: 'indicator',
    mode: 'gauge+number',
    value: plotVal,
    number: {
      suffix: '%',
      font: { size: 44, color: barColor, family: "'Playfair Display', Georgia, serif" },
    },
    gauge: {
      axis: {
        range: [0, 100],
        tickwidth: 1, tickcolor: '#CBD5E1',
        tickfont: { size: 11, color: '#94A3B8' },
        nticks: 6,
      },
      bar: { color: barColor, thickness: 0.55 },
      bgcolor: '#F8FAF9',
      borderwidth: 0,
      steps: [
        { range: [0, tgt ?? 100],   color: 'rgba(0,181,204,0.07)'  },
        { range: [tgt ?? 100, 100], color: 'rgba(200,220,212,0.15)' },
      ],
      threshold: tgt != null ? {
        line: { color: '#1A1F36', width: 3 },
        thickness: 0.78,
        value: tgt,
      } : undefined,
    },
  }];

  const layout = {
    ...BASE_LAYOUT,
    margin: { t: 28, b: 8, l: 36, r: 36 },
    height: 210,
  };

  return (
    <div style={{ width: '100%' }}>
      <Plot data={data} layout={layout} config={PLOTLY_CONFIG}
        useResizeHandler style={{ width: '100%', height: '210px' }} />
      {tgt != null && (
        <div style={{
          textAlign: 'center', fontSize: 11, color: '#64748B',
          fontWeight: 600, marginTop: 4,
        }}>
          RoP Target: {tgt}%
        </div>
      )}
    </div>
  );
}

/* ── Plotly Donut — Workforce composition ────────────────────────── */
function WorkforceDonut({ regIP, ctrlIP, gap, req }) {
  const values = [regIP, ctrlIP];
  const labels = [`Regular (${regIP})`, `Contractual (${ctrlIP})`];
  const colors = [C_REG, C_CTRL];
  if (gap > 0) { values.push(gap); labels.push(`Gap (${gap})`); colors.push(C_GAP); }

  const data = [{
    type: 'pie', values, labels,
    hole: 0.52,
    marker: { colors, line: { color: '#FFFFFF', width: 2 } },
    textinfo: 'percent',
    textfont: { size: 13, color: '#FFFFFF', family: "'Inter', sans-serif" },
    hovertemplate: '<b>%{label}</b><br>%{value} staff<br>%{percent}<extra></extra>',
    pull: [0.02, 0.02, 0],
    sort: false,
  }];

  const layout = {
    ...BASE_LAYOUT,
    height: 270,
    margin: { t: 8, b: 8, l: 8, r: 8 },
    showlegend: true,
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.05, font: { size: 11 } },
    annotations: [{
      text: `<b>${Math.round((regIP + ctrlIP) / req * 100)}%</b><br><span style="font-size:11px">filled</span>`,
      x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
      showarrow: false,
      font: { size: 16, color: '#1A1F36', family: "'Inter', sans-serif" },
    }],
  };

  return (
    <Plot data={data} layout={layout} config={PLOTLY_CONFIG}
      useResizeHandler style={{ width: '100%', height: '270px' }} />
  );
}

/* ── Plotly Bar — Staffing breakdown ─────────────────────────────── */
function StaffingBar({ staffingData, barColor }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 220);
    return () => clearTimeout(t);
  }, []);

  const categories = staffingData.map(d => d.category);
  const data = [
    {
      type: 'bar', name: 'Sanctioned / Approved',
      x: categories,
      y: ready ? staffingData.map(d => d.sanctioned) : staffingData.map(() => 0),
      marker: { color: C_GAP, line: { width: 0 } },
      hovertemplate: '<b>%{x} — Sanctioned</b><br>%{y}<extra></extra>',
    },
    {
      type: 'bar', name: 'In Place',
      x: categories,
      y: ready ? staffingData.map(d => d.inPlace) : staffingData.map(() => 0),
      marker: { color: barColor, line: { width: 0 } },
      hovertemplate: '<b>%{x} — In Place</b><br>%{y}<extra></extra>',
    },
  ];

  const layout = {
    ...BASE_LAYOUT,
    height: 250,
    margin: { t: 20, b: 44, l: 50, r: 20 },
    barmode: 'group',
    bargap: 0.28, bargroupgap: 0.08,
    xaxis: { showgrid: false, tickfont: { size: 13 } },
    yaxis: { gridcolor: '#EDE9E1', gridwidth: 1 },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2, font: { size: 12 } },
    transition: { duration: 600, easing: 'cubic-in-out' },
  };

  return (
    <Plot data={data} layout={layout} config={PLOTLY_CONFIG}
      useResizeHandler style={{ width: '100%', height: '250px' }} />
  );
}

/* ── Plotly Bar — Productivity vs IPHS ──────────────────────────── */
function ProductivityBar({ prodData }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const names = prodData.map(d => d.name);
  const data = [
    {
      type: 'bar', name: 'Actual', orientation: 'h',
      y: names,
      x: ready ? prodData.map(d => d.actual) : prodData.map(() => 0),
      marker: { color: '#E53E3E', line: { width: 0 } },
      hovertemplate: '<b>%{y}</b><br>Actual: %{x}<extra></extra>',
    },
    {
      type: 'bar', name: 'IPHS Standard', orientation: 'h',
      y: names,
      x: ready ? prodData.map(d => d.iphs) : prodData.map(() => 0),
      marker: { color: C_GAP, line: { width: 0 } },
      hovertemplate: '<b>%{y}</b><br>IPHS: %{x}<extra></extra>',
    },
  ];

  const h = prodData.length * 90 + 80;
  const layout = {
    ...BASE_LAYOUT,
    height: h,
    margin: { t: 20, b: 50, l: 210, r: 80 },
    barmode: 'group',
    bargap: 0.30, bargroupgap: 0.10,
    xaxis: { gridcolor: '#EDE9E1', gridwidth: 1 },
    yaxis: { showgrid: false, tickfont: { size: 12 } },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.26, font: { size: 12 } },
    transition: { duration: 700, easing: 'cubic-in-out' },
  };

  return (
    <Plot data={data} layout={layout} config={PLOTLY_CONFIG}
      useResizeHandler style={{ width: '100%', height: `${h}px` }} />
  );
}

/* ── Plotly Bar — NCD sub-cadres ─────────────────────────────────── */
function NCDSpecialistBar() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);

  const colors = NCD_SPECIALISTS.map(d =>
    d.pct >= 100 ? '#00b5cc' : d.pct >= 70 ? '#F59E0B' : '#E53E3E'
  );
  const data = [{
    type: 'bar', orientation: 'h',
    y: NCD_SPECIALISTS.map(d => d.name),
    x: ready ? NCD_SPECIALISTS.map(d => d.pct) : NCD_SPECIALISTS.map(() => 0),
    marker: { color: colors, line: { width: 0 } },
    text: NCD_SPECIALISTS.map(d => `${d.pct}%`),
    textposition: 'outside',
    textfont: { size: 11, color: '#475569' },
    hovertemplate: '<b>%{y}</b><br>%{x}% of IPHS norm<extra></extra>',
    cliponaxis: false,
  }];

  const layout = {
    ...BASE_LAYOUT,
    height: 390,
    margin: { t: 16, b: 50, l: 145, r: 74 },
    xaxis: {
      range: [0, 145], ticksuffix: '%',
      gridcolor: '#EDE9E1', gridwidth: 1, tickfont: { size: 11 },
    },
    yaxis: { showgrid: false, tickfont: { size: 12 } },
    shapes: [{
      type: 'line', x0: 100, x1: 100, y0: -0.5,
      y1: NCD_SPECIALISTS.length - 0.5,
      line: { color: '#1A1F36', width: 2, dash: 'dot' },
    }],
    annotations: [{
      x: 100, y: NCD_SPECIALISTS.length - 0.5,
      text: '<b>IPHS 100%</b>',
      showarrow: false, xanchor: 'left',
      font: { size: 10, color: '#1A1F36' }, xshift: 6,
    }],
    transition: { duration: 800, easing: 'cubic-in-out' },
  };

  return (
    <Plot data={data} layout={layout} config={PLOTLY_CONFIG}
      useResizeHandler style={{ width: '100%', height: '390px' }} />
  );
}

/* ── Plotly Donut — small context panel ─────────────────────────── */
function SmallDonut({ labels, values, colors, title }) {
  const data = [{
    type: 'pie', values, labels, hole: 0.48,
    marker: { colors, line: { color: '#FFFFFF', width: 2 } },
    textinfo: 'percent',
    textfont: { size: 12, color: '#FFFFFF' },
    hovertemplate: '<b>%{label}</b><br>%{percent}<extra></extra>',
    sort: false,
  }];

  const layout = {
    ...BASE_LAYOUT,
    height: 210,
    margin: { t: 8, b: 8, l: 8, r: 8 },
    showlegend: true,
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.08, font: { size: 11 } },
  };

  return (
    <div>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#00b5cc', marginBottom: 8 }}>
        {title}
      </div>
      <Plot data={data} layout={layout} config={PLOTLY_CONFIG}
        useResizeHandler style={{ width: '100%', height: '210px' }} />
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────── */
export default function HRHCadrePage({ program, division, onBack, onCurrentStatus }) {
  const rootRef = useRef(null);
  const cfg = STATUS_CONFIG[program?.status] ?? STATUS_CONFIG.yellow;

  /* Derived values */
  const ach    = program.achievement ?? 0;
  const tgt    = program.target;
  const inPlace = program.inPlace ?? 0;
  const req    = program.requirement ?? 0;
  const gap    = req - inPlace;
  const regIP  = program.regular ?? 0;
  const regS   = program.regSanctioned ?? 0;
  const ctrlIP = program.contractual ?? 0;
  const ctrlA  = program.ctrlApproved ?? 0;
  const regFill  = regS  > 0 ? Math.round(regIP  / regS  * 100) : null;
  const ctrlFill = ctrlA > 0 ? Math.round(ctrlIP / ctrlA * 100) : null;
  const barColor = program.status === 'red'    ? '#E53E3E'
                 : program.status === 'yellow' ? '#D97706'
                 :                               '#00b5cc';

  const staffingData = [];
  if (regS  > 0) staffingData.push({ category: 'Regular',     sanctioned: regS,  inPlace: regIP  });
  if (ctrlA > 0) staffingData.push({ category: 'Contractual', sanctioned: ctrlA, inPlace: ctrlIP });

  const prodData = HRH_PRODUCTIVITY[program.id];

  /* ── GSAP entrance — runs each time cadre changes ────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.killTweensOf(root.querySelectorAll('*'));

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(root,
        { opacity: 0 },
        { opacity: 1, duration: 0.28 }
      )
      .fromTo(root.querySelectorAll('.hrh-cadre-section'),
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.48, stagger: 0.08 },
        '-=0.1'
      )
      .fromTo(root.querySelectorAll('.detail-card'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.38, stagger: 0.07 },
        '<0.06'
      )
      .fromTo(root.querySelectorAll('.hrh-stat'),
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.28, stagger: 0.055 },
        '<0.12'
      )
      .fromTo(root.querySelectorAll('.hrh-fill-row'),
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.26, stagger: 0.055 },
        '<0.05'
      )
      .fromTo(root.querySelectorAll('.obs-item, .action-item'),
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.26, stagger: 0.05 },
        '<0.05'
      );

    return () => tl.kill();
  }, [program.id]);

  return (
    <div className="ncd-root" ref={rootRef}>

      {/* ── Topbar ────────────────────────────────────────────── */}
      <div className="ncd-topbar">
        <div className="ncd-topbar-inner">
          <button className="back-btn" onClick={onBack}>
            <span className="back-chevron">←</span> Back
          </button>
          <div className="detail-breadcrumb">
            <span className="detail-div-tag">{division?.label}</span>
            <span className="detail-prog-name">{program?.name}</span>
          </div>
          <div className={`status-pill st-${program?.status}`}>{cfg.shortLabel}</div>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="ncd-content">

        {/* Header */}
        <div className="hrh-cadre-section">
          <div className="kd-prog-header">
            <div className="kd-prog-header-left">
              <div className="kd-prog-name">{program.name}</div>
              {program.summary && (
                <div className="kd-prog-summary">{program.summary}</div>
              )}
            </div>
            <div className={`status-pill st-${program?.status}`} style={{ flexShrink: 0 }}>
              {cfg.label}
            </div>
          </div>
        </div>

        {/* ── PM-ABHIM: entry bar instead of inline charts ────────── */}
        {program.id === 'pm-abhim' ? (
          <div className="hrh-cadre-section">
            {onCurrentStatus && (
              <CSEntryBar
                program={program}
                onClick={() => onCurrentStatus(program, division)}
              />
            )}
          </div>
        ) : (
          <>

        {/* Eyebrow */}
        <div className="hrh-cadre-section">
          <div className="hrh-cs-band">
            <span className="hrh-cs-eyebrow">Current Status</span>
            <span className="hrh-cs-src">Key Deliverable 2025-26 · NHM NPCC</span>
          </div>
        </div>

        {/* ── Gauge + Key Numbers ──────────────────────────── */}
        <div className="hrh-cadre-section detail-two-col">
          <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="detail-card-header" style={{ width: '100%' }}>
              <h3>Achievement vs RoP Target</h3>
              <span className="detail-card-note">Key Deliverable 2025-26</span>
            </div>
            <AchievementGauge ach={ach} tgt={tgt} barColor={barColor} />
          </div>

          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Key Numbers</h3>
              <span className="detail-card-note">NPCC 2026-27</span>
            </div>

            <div className="hrh-stat-row" style={{ paddingTop: 12 }}>
              {[
                { label: 'Required',   val: req,    col: '#1A1F36', isNum: true },
                { label: 'In Place',   val: inPlace, col: barColor,  isNum: true },
                { label: 'Gap',        val: gap > 0 ? gap : null, col: gap > 0 ? '#E53E3E' : C_REG, isNum: gap > 0 },
                ...(tgt != null ? [{ label: 'RoP Target', val: tgt, col: '#D97706', isNum: true, suffix: '%' }] : []),
              ].map((s) => (
                <div key={s.label} className="hrh-stat">
                  <div className="hrh-stat-val" style={{ color: s.col }}>
                    {s.isNum && s.val != null
                      ? <><CountUp to={s.val} duration={1.1} />{s.suffix ?? ''}</>
                      : (s.val == null ? 'Nil' : s.val)
                    }
                  </div>
                  <div className="hrh-stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="hrh-fill-table" style={{ marginTop: 20 }}>
              <div className="hrh-fill-head">
                <span>Category</span>
                <span className="ta-r">Posts</span>
                <span className="ta-r">In Place</span>
                <span className="ta-r">Fill %</span>
                <span className="ta-r">Vacant</span>
              </div>
              {regS > 0 && (
                <div className="hrh-fill-row">
                  <span>Regular</span>
                  <span className="ta-r">{regS}</span>
                  <span className="ta-r hrh-fi-teal">{regIP}</span>
                  <span className="ta-r">
                    <span className="hrh-fill-pill" style={fillPillStyle(regFill)}>
                      {regFill != null ? `${regFill}%` : '—'}
                    </span>
                  </span>
                  <span className="ta-r hrh-fi-red">{regS - regIP}</span>
                </div>
              )}
              {ctrlA > 0 && (
                <div className="hrh-fill-row">
                  <span>Contractual</span>
                  <span className="ta-r">{ctrlA}</span>
                  <span className="ta-r hrh-fi-teal">{ctrlIP}</span>
                  <span className="ta-r">
                    <span className="hrh-fill-pill" style={fillPillStyle(ctrlFill)}>
                      {ctrlFill != null ? `${ctrlFill}%` : '—'}
                    </span>
                  </span>
                  <span className="ta-r hrh-fi-red">{ctrlA - ctrlIP}</span>
                </div>
              )}
              <div className="hrh-fill-row hrh-fill-total">
                <span>Total vs Req.</span>
                <span className="ta-r">{req}</span>
                <span className="ta-r hrh-fi-teal">{inPlace}</span>
                <span className="ta-r">
                  <span className="hrh-fill-pill hrh-fill-pill--navy">{ach}%</span>
                </span>
                <span className="ta-r hrh-fi-red">{gap > 0 ? gap : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Staffing breakdown + Workforce donut ────────── */}
        <div className="hrh-cadre-section detail-two-col">
          {staffingData.length > 0 && (
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Staffing Breakdown</h3>
                <span className="detail-card-note">Sanctioned / Approved vs In Place</span>
              </div>
              <StaffingBar staffingData={staffingData} barColor={barColor} />
            </div>
          )}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3>Workforce Composition</h3>
              <span className="detail-card-note">vs Total Requirement ({req})</span>
            </div>
            <WorkforceDonut regIP={regIP} ctrlIP={ctrlIP}
              gap={gap > 0 ? gap : 0} req={req || 1} />
          </div>
        </div>

        {/* ── Productivity vs IPHS ──────────────────────── */}
        {prodData && (
          <div className="hrh-cadre-section">
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>Productivity vs IPHS 2022</h3>
                <span className="detail-card-note">
                  State average vs Indian Public Health Standards national benchmark
                </span>
              </div>
              <ProductivityBar prodData={prodData} />
              <p className="hrh-prod-note">
                Hover bars for exact values. Low productivity may indicate absenteeism, maldistribution, or infrastructure gaps.
              </p>
            </div>
          </div>
        )}

        {/* ── NCD Specialist sub-cadres ─────────────────── */}
        {program.id === 'specialist' && (
          <div className="hrh-cadre-section">
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>NCD Specialist Sub-Cadres — Coverage vs IPHS Norms</h3>
                <span className="detail-card-note">
                  HRH Review 2025-26, Slide 4 · Green ≥100% · Amber 70-99% · Red &lt;70%
                </span>
              </div>
              <NCDSpecialistBar />
              <p className="hrh-prod-note">
                Dashed line = 100% IPHS benchmark. Values above indicate full cadre coverage.
              </p>
            </div>
          </div>
        )}


        {/* ── State HRH context ─────────────────────────── */}
        <div className="hrh-cadre-section">
          <div className="detail-card hrh-context-card">
            <div className="detail-card-header">
              <h3>State HRH Context — All Cadres Combined</h3>
              <span className="detail-card-note">HRH Review 2025-26</span>
            </div>
            <div className="hrh-ctx-grid">
              <SmallDonut
                title="Workforce Mix"
                labels={['Regular', 'Contractual', 'Gap']}
                values={[48, 30, 22]}
                colors={[C_REG, C_CTRL, C_GAP]}
              />
              <div className="hrh-ctx-panel">
                <div className="hrh-ctx-prod">
                  {[
                    { lbl: 'OPD / Doctor / Day', actual: 7,  std: 60  },
                    { lbl: 'Dental OPD / Day',   actual: 4,  std: 20  },
                    { lbl: 'Tests / LT / Day',   actual: 9,  std: 100 },
                    { lbl: 'Surgery / OBG / Wk', actual: 2,  std: 7   },
                  ].map((p) => (
                    <div key={p.lbl} className="hrh-ctx-prod-row">
                      <span className="hrh-ctx-prod-lbl">{p.lbl}</span>
                      <span>
                        <span className="hrh-ctx-prod-actual">{p.actual}</span>
                        <span className="hrh-ctx-prod-std">/{p.std}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="hrh-ctx-title">Productivity vs IPHS 2022</div>
              </div>
            </div>
          </div>
        </div>

          </>
        )}
        {/* ── end PM-ABHIM conditional ─────────────────────────── */}

      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="detail-footer">
        Sources: NHM NPCC Meeting, Arunachal Pradesh, 1 April 2026.
        HRH Review 2025-26 — Key Deliverable Achievement Table.
        IPHS 2022 — Indian Public Health Standards, MoHFW Govt. of India.
      </footer>
    </div>
  );
}
