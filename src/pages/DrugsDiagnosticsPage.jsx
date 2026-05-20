// HSS / Drugs & Diagnostics
import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { gsap } from 'gsap';
import Plot from 'react-plotly.js';

const C_ORG   = '#00b5cc';
const C_AMBER = '#F59E0B';
const C_RED   = '#E53E3E';
const C_NAVY  = '#1A1F36';
const C_SLATE = '#475569';
const C_GREEN = '#10B981';

const PC = { displayModeBar: false, responsive: true };
const BL = {
  paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
  font: { family: "'Inter','DM Sans',sans-serif", size: 12, color: C_SLATE },
  autosize: true,
};

const DRUG_AVAIL = [
  { facility: 'DH',      stock: 16.12 },
  { facility: 'CHC',     stock: 12.20 },
  { facility: 'AAM-PHC', stock: 24.00 },
  { facility: 'AAM-SHC', stock: 21.56 },
];

const DIAG_TESTS = [
  { facility: 'AAM-SHC', fdsi: 14,  jan25: 5,  jan26: 7  },
  { facility: 'AAM-PHC', fdsi: 63,  jan25: 8,  jan26: 18 },
  { facility: 'CHC',     fdsi: 97,  jan25: 13, jan26: 30 },
  { facility: 'DH',      fdsi: 134, jan25: 55, jan26: 68 },
];

const NQAS_DATA = [
  { facility: 'AAM SHC',  total: 289, certified: 23, pct: 7.96 },
  { facility: 'AAM PHC',  total: 127, certified: 2,  pct: 1.6  },
  { facility: 'DH',       total: 20,  certified: 1,  pct: 5.0  },
  { facility: 'CHC',      total: 57,  certified: 0,  pct: 0    },
  { facility: 'AAM UPHC', total: 6,   certified: 0,  pct: 0    },
];

const IPHS_FACILITY = [
  { facility: 'DH',  lt25: 5,  p25_50: 15,  p50_69: 1,   p70_79: 0,  gt80: 1 },
  { facility: 'CHC', lt25: 19, p25_50: 35,  p50_69: 2,   p70_79: 0,  gt80: 0 },
  { facility: 'PHC', lt25: 26, p25_50: 83,  p50_69: 22,  p70_79: 0,  gt80: 0 },
  { facility: 'SHC', lt25: 24, p25_50: 156, p50_69: 162, p70_79: 49, gt80: 9 },
];

/* ─────────────────────────────────────────────────────────────────────
   CHART 1 — Drug Stock Availability (FDSI)
   Horizontal bar: % of essential drugs in stock per facility type
───────────────────────────────────────────────────────────────────── */
function StockBar() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 160); return () => clearTimeout(t); }, []);

  const facs = DRUG_AVAIL.map(d => d.facility);

  const data = [
    {
      type: 'bar', orientation: 'h',
      y: facs,
      x: ready ? DRUG_AVAIL.map(d => d.stock) : facs.map(() => 0),
      marker: { color: DRUG_AVAIL.map(d => d.stock < 20 ? C_RED : C_AMBER), line: { width: 0 } },
      text: ready ? DRUG_AVAIL.map(d => `${d.stock}%`) : [],
      textposition: 'outside',
      textfont: { size: 12, color: C_SLATE, family: "'JetBrains Mono',monospace" },
      cliponaxis: false,
      hovertemplate: '<b>%{y}</b><br>%{x:.2f}% in stock<extra></extra>',
    },
  ];

  const layout = {
    ...BL, height: 200,
    margin: { t: 8, b: 36, l: 76, r: 72 },
    xaxis: {
      range: [0, 65], ticksuffix: '%',
      gridcolor: '#EDE9E1', zeroline: false, tickfont: { size: 11 },
      title: { text: '% essential drugs available', font: { size: 11 } },
    },
    yaxis: { showgrid: false, tickfont: { size: 12, color: C_NAVY } },
    bargap: 0.42,
    showlegend: false,
    shapes: [{
      type: 'line', x0: 50, x1: 50, y0: -0.5, y1: 3.5,
      xref: 'x', yref: 'y',
      line: { color: '#94A3B8', width: 1.5, dash: 'dot' },
    }],
    annotations: [{
      x: 50, y: 3.6, xref: 'x', yref: 'y',
      text: '50% target', showarrow: false,
      font: { size: 10, color: '#94A3B8' }, yanchor: 'bottom',
    }],
  };

  return (
    <Plot data={data} layout={layout} config={PC}
      useResizeHandler style={{ width: '100%', height: '200px' }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CHART 2 — Diagnostic Tests: Jan 2025 vs Jan 2026 vs FDSI Target
   Grouped vertical bar per facility, target shown as dash marker
───────────────────────────────────────────────────────────────────── */
function DiagBar() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 220); return () => clearTimeout(t); }, []);

  const facs = DIAG_TESTS.map(d => d.facility);

  const data = [
    {
      type: 'bar', name: 'Jan 2025',
      x: facs,
      y: ready ? DIAG_TESTS.map(d => d.jan25) : facs.map(() => 0),
      marker: { color: 'rgba(229,62,62,0.85)', line: { width: 0 } },
      hovertemplate: '<b>%{x}</b><br>Jan 2025: %{y} test types<extra></extra>',
    },
    {
      type: 'bar', name: 'Jan 2026',
      x: facs,
      y: ready ? DIAG_TESTS.map(d => d.jan26) : facs.map(() => 0),
      marker: { color: 'rgba(245,158,11,0.9)', line: { width: 0 } },
      hovertemplate: '<b>%{x}</b><br>Jan 2026: %{y} test types<extra></extra>',
    },
    {
      type: 'scatter', mode: 'markers', name: 'FDSI Target',
      x: facs,
      y: ready ? DIAG_TESTS.map(d => d.fdsi) : facs.map(() => 0),
      marker: { symbol: 'line-ew-open', size: 22, color: C_NAVY, line: { color: C_NAVY, width: 2.5 } },
      hovertemplate: '<b>%{x}</b><br>FDSI Target: %{y} test types<extra></extra>',
    },
  ];

  const layout = {
    ...BL, height: 240,
    margin: { t: 8, b: 52, l: 44, r: 16 },
    barmode: 'group', bargap: 0.28, bargroupgap: 0.08,
    xaxis: { showgrid: false, tickfont: { size: 12, color: C_NAVY } },
    yaxis: {
      gridcolor: '#EDE9E1', zeroline: false,
      title: { text: 'Test types available', font: { size: 11 } },
    },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.26, font: { size: 11 } },
  };

  return (
    <Plot data={data} layout={layout} config={PC}
      useResizeHandler style={{ width: '100%', height: '240px' }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CHART 3 — NQAS Certification: certified vs uncertified per facility
   Stacked horizontal bar — immediately shows scale + proportion
───────────────────────────────────────────────────────────────────── */
function NQASBar() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, []);

  const facs = NQAS_DATA.map(d => d.facility);
  const certified   = ready ? NQAS_DATA.map(d => d.certified)             : facs.map(() => 0);
  const uncertified = ready ? NQAS_DATA.map(d => d.total - d.certified)   : facs.map(() => 0);

  const data = [
    {
      type: 'bar', orientation: 'h', name: 'Certified',
      y: facs, x: certified,
      marker: { color: C_ORG },
      text: ready ? NQAS_DATA.map(d => d.certified > 0 ? `${d.certified} certified` : '') : [],
      textposition: 'inside',
      insidetextanchor: 'middle',
      textfont: { size: 11, color: '#fff' },
      hovertemplate: '<b>%{y}</b><br>Certified: %{x} facilities<extra></extra>',
    },
    {
      type: 'bar', orientation: 'h', name: 'Not certified',
      y: facs, x: uncertified,
      marker: { color: '#E2E8F0' },
      text: ready ? NQAS_DATA.map(d => `${d.total} total`) : [],
      textposition: 'inside',
      insidetextanchor: 'end',
      textfont: { size: 11, color: '#94A3B8' },
      hovertemplate: '<b>%{y}</b><br>Not certified: %{x} facilities<extra></extra>',
    },
  ];

  const layout = {
    ...BL, height: 230,
    margin: { t: 8, b: 44, l: 82, r: 16 },
    barmode: 'stack', bargap: 0.34,
    xaxis: {
      gridcolor: '#EDE9E1', zeroline: false,
      title: { text: 'Number of facilities', font: { size: 11 } },
    },
    yaxis: { showgrid: false, tickfont: { size: 12, color: C_NAVY } },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.26, font: { size: 11 } },
  };

  return (
    <Plot data={data} layout={layout} config={PC}
      useResizeHandler style={{ width: '100%', height: '230px' }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CHART 4 — IPHS Compliance Bands by facility type
   100% stacked horizontal bar: Aspirant → Progressive → Compliant
───────────────────────────────────────────────────────────────────── */
function IPHSBar() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 240); return () => clearTimeout(t); }, []);

  const facs   = IPHS_FACILITY.map(d => d.facility);
  const totals = IPHS_FACILITY.map(d => d.lt25 + d.p25_50 + d.p50_69 + d.p70_79 + d.gt80);
  const pct    = key => IPHS_FACILITY.map((d, i) =>
    ready ? +(d[key] / totals[i] * 100).toFixed(1) : 0
  );

  const bands = [
    { key: 'lt25',   name: 'Aspirant  <25%',   color: '#F87171' },
    { key: 'p25_50', name: 'Aspirant  25–50%',  color: '#FDBA74' },
    { key: 'p50_69', name: 'Progress  50–69%',  color: '#FCD34D' },
    { key: 'p70_79', name: 'Progress  70–79%',  color: '#A7F3D0' },
    { key: 'gt80',   name: 'Compliant >80%',    color: C_GREEN   },
  ];

  const data = bands.map(b => ({
    type: 'bar', orientation: 'h', name: b.name,
    y: facs, x: pct(b.key),
    marker: { color: b.color },
    hovertemplate: `<b>%{y}</b><br>${b.name}: %{x:.1f}%<extra></extra>`,
  }));

  const layout = {
    ...BL, height: 220,
    margin: { t: 8, b: 64, l: 50, r: 16 },
    barmode: 'stack', bargap: 0.34,
    xaxis: {
      range: [0, 100], ticksuffix: '%',
      gridcolor: '#EDE9E1',
      title: { text: '% of facilities', font: { size: 11 } },
    },
    yaxis: { showgrid: false, tickfont: { size: 12, color: C_NAVY } },
    legend: {
      orientation: 'h', x: 0.5, xanchor: 'center', y: -0.38,
      font: { size: 10 }, traceorder: 'normal',
    },
  };

  return (
    <Plot data={data} layout={layout} config={PC}
      useResizeHandler style={{ width: '100%', height: '220px' }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────── */
export default function DrugsDiagnosticsPage({ division, onBack }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.set(root.querySelectorAll('.dd2-kpi'),  { opacity: 0, y: 14, scale: 0.94 });
    gsap.set(root.querySelectorAll('.dd2-card'), { opacity: 0, y: 18 });
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .to(root.querySelectorAll('.dd2-kpi'),
        { opacity: 1, y: 0, scale: 1, duration: 0.36, stagger: 0.08, ease: 'back.out(1.4)' }, '-=0.05')
      .to(root.querySelectorAll('.dd2-card'),
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }, '-=0.15');
    return () => tl.kill();
  }, []);

  const kpis = [
    { label: 'Drug Stock',     value: '<25%',  sub: 'All facilities · DVDMS 50% target',   color: C_RED,   bg: '#FFF5F5', border: '#FED7D7' },
    { label: 'NQAS Certified', value: '5.21%', sub: '26 of 499 facilities certified',       color: C_AMBER, bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'IPHS Compliant', value: '2%',    sub: '10 of 609 facilities scoring >80%',   color: C_RED,   bg: '#FFF5F5', border: '#FED7D7' },
  ];

  return (
    <div className="ncd-root" ref={rootRef}>

      <div className="ncd-topbar">
        <div className="ncd-topbar-inner">
          <button className="back-btn" onClick={onBack}>
            <span className="back-chevron">←</span> Back
          </button>
          <div className="detail-breadcrumb">
            <span className="detail-div-tag">{division?.label}</span>
            <span className="detail-prog-name">Drugs &amp; Diagnostics</span>
          </div>
          <div className="status-pill st-red">Critical</div>
          <ThemeToggle />
        </div>
      </div>

      <div className="ncd-content">

        {/* Page title */}
        <div className="dd2-page-header">
          <div className="kd-prog-name">Drugs &amp; Diagnostics</div>
          <div className="kd-prog-summary">
            Free Drug Service Initiative · NQAS · IPHS Compliance · NHM Arunachal Pradesh 2025-26
          </div>
        </div>

        {/* 3 KPI headline cards */}
        <div className="dd2-kpi-strip">
          {kpis.map(k => (
            <div key={k.label} className="dd2-kpi" style={{ background: k.bg, borderColor: k.border }}>
              <div className="dd2-kpi-label">{k.label}</div>
              <div className="dd2-kpi-val" style={{ color: k.color }}>{k.value}</div>
              <div className="dd2-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── FDSI ─────────────────────────────────────────── */}
        <div className="dd2-section-hdr" style={{ borderLeftColor: '#D97706' }}>
          <span style={{ color: '#D97706' }}>Free Drug Service Initiative (FDSI)</span>
          <span className="dd2-section-src">NHM NPCC 2025-26</span>
        </div>

        <div className="detail-two-col dd2-row">
          <div className="dd2-card detail-card">
            <div className="detail-card-header">
              <h3>Drug Stock Availability</h3>
              <span className="detail-card-note">% of IPHS essential drugs available · vs 50% DVDMS target</span>
            </div>
            <StockBar />
            <div className="dd2-stat-row">
              <div className="dd2-stat"><span style={{ color: C_ORG }}>EDL 2024</span><span>notified</span></div>
              <div className="dd2-stat"><span style={{ color: C_ORG }}>30</span><span>warehouses</span></div>
              <div className="dd2-stat"><span style={{ color: C_AMBER }}>86</span><span>active RCs</span></div>
              <div className="dd2-stat"><span style={{ color: C_RED }}>5 / 86</span><span>on DVDMS</span></div>
            </div>
          </div>

          <div className="dd2-card detail-card">
            <div className="detail-card-header">
              <h3>Diagnostic Tests Available</h3>
              <span className="detail-card-note">Jan 2025 vs Jan 2026 actual · (—) FDSI mandate target</span>
            </div>
            <DiagBar />
            <div className="dd2-note">
              State avg 1:1 patient-to-test ratio vs national 1:3 —
              YoY gain of +3 to +13 tests per facility type
            </div>
          </div>
        </div>

        {/* ── NQAS ─────────────────────────────────────────── */}
        <div className="dd2-section-hdr" style={{ borderLeftColor: C_ORG }}>
          <span style={{ color: C_ORG }}>National Quality Assurance Standards (NQAS)</span>
          <span className="dd2-section-src">NHM NPCC 2025-26</span>
        </div>

        <div className="detail-two-col dd2-row">
          <div className="dd2-card detail-card">
            <div className="detail-card-header">
              <h3>Certified vs Total Facilities</h3>
              <span className="detail-card-note">Teal = certified · Grey = not yet certified · counts shown inside bars</span>
            </div>
            <NQASBar />
            <div className="dd2-note">
              Only <strong>26 of 499</strong> facilities NQAS certified —
              AAM SHC leads with 23 certifications (7.96%)
            </div>
          </div>

          <div className="dd2-card detail-card">
            <div className="detail-card-header">
              <h3>Quality Pipeline</h3>
              <span className="detail-card-note">Assessors, certifications &amp; active programmes</span>
            </div>
            <div className="dd2-quality-grid">
              <div className="dd2-qitem dd2-qitem--org">
                <div className="dd2-qval">99</div>
                <div className="dd2-qlbl">Internal Assessors trained</div>
              </div>
              <div className="dd2-qitem dd2-qitem--org">
                <div className="dd2-qval">19</div>
                <div className="dd2-qlbl">External Assessors</div>
              </div>
              <div className="dd2-qitem dd2-qitem--org">
                <div className="dd2-qval">87</div>
                <div className="dd2-qlbl">Internal assessments done</div>
              </div>
              <div className="dd2-qitem dd2-qitem--amber">
                <div className="dd2-qval">23</div>
                <div className="dd2-qlbl">Scored &gt;70% — eligible for NQAS</div>
              </div>
              <div className="dd2-qitem dd2-qitem--amber">
                <div className="dd2-qval">7</div>
                <div className="dd2-qlbl">LaQshya certified (4 LR · 3 OT)</div>
              </div>
              <div className="dd2-qitem dd2-qitem--amber">
                <div className="dd2-qval">25</div>
                <div className="dd2-qlbl">Kayakalp compliant FY 2024-25</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── IPHS ─────────────────────────────────────────── */}
        <div className="dd2-section-hdr" style={{ borderLeftColor: '#B45309' }}>
          <span style={{ color: '#B45309' }}>IPHS Compliance</span>
          <span className="dd2-section-src">IPHS Dashboard · March 2026</span>
        </div>

        <div className="dd2-card detail-card dd2-row">
          <div className="detail-card-header">
            <h3>Compliance Band by Facility Type</h3>
            <span className="detail-card-note">609 facilities assessed · red = Aspirant · yellow = Progressive · green = Compliant</span>
          </div>
          <IPHSBar />
          <div className="dd2-iphs-footer">
            <div className="dd2-iphs-stat" style={{ color: C_RED }}>
              <strong>59%</strong> Aspirant (&lt;50%)
            </div>
            <div className="dd2-iphs-divider" />
            <div className="dd2-iphs-stat" style={{ color: C_AMBER }}>
              <strong>39%</strong> Progressive (50–79%)
            </div>
            <div className="dd2-iphs-divider" />
            <div className="dd2-iphs-stat" style={{ color: C_GREEN }}>
              <strong>2%</strong> Compliant (&gt;80%) — 1 DH + 9 SHC
            </div>
          </div>
        </div>

      </div>

      <footer className="detail-footer">
        Sources: NHM NPCC Meeting, Arunachal Pradesh, 1 April 2026 ·
        IPHS Dashboard 20 March 2026 · FDSI Review 2025-26 · NQAS Status Report.
      </footer>
    </div>
  );
}
