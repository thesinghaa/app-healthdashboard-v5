/* ═══════════════════════════════════════════════════════════════════════════
   LandingPage.jsx — V4 redesign
   Light-mode scrollable: Programme Overview → NHM Flow (Sankey) → Alerts
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { DIVISIONS } from '../data/programs';
import { KD_TREE } from '../data/kdData';
import ThemeToggle from '../components/ThemeToggle';
import ReportModal from '../components/ReportModal';
import ProgrammeOverview from '../components/ProgrammeOverview';
import '../styles/landing-v4.css';

const NHMSankey = lazy(() => import('../components/NHMSankey'));

/* ── Status helpers ─────────────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const r = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return r <= 1 ? 'achieved' : r <= 1.33 ? 'close' : 'gap';
  return r >= 1 ? 'achieved' : r >= 0.75 ? 'close' : 'gap';
}

function getDivBreakdown(divId) {
  const tree = KD_TREE[divId];
  if (!tree) return { achieved: 0, close: 0, gap: 0, neutral: 0, total: 0 };
  let achieved = 0, close = 0, gap = 0, neutral = 0;
  Object.values(tree.programmes || {}).forEach(p =>
    (p.kds || []).forEach(kd => {
      const s = kdStatus(kd);
      if (s === 'achieved') achieved++;
      else if (s === 'close') close++;
      else if (s === 'gap') gap++;
      else neutral++;
    })
  );
  return { achieved, close, gap, neutral, total: achieved + close + gap + neutral };
}

function getTopGaps(n = 5) {
  const all = [];
  DIVISIONS.forEach(div => {
    const tree = KD_TREE[div.id];
    if (!tree) return;
    Object.entries(tree.programmes || {}).forEach(([progId, prog]) => {
      (prog.kds || []).forEach(kd => {
        if (kdStatus(kd) !== 'gap') return;
        const r = kd.target > 0 ? kd.achievement / kd.target : 1;
        const deficit = kd.lowerIsBetter ? r - 1 : 1 - r;
        all.push({ ...kd, divId: div.id, divLabel: div.label, progName: prog.name || progId, deficit });
      });
    });
  });
  return all.sort((a, b) => b.deficit - a.deficit).slice(0, n);
}

/* ── Division accent colours ─────────────────────────────────────────────── */
const DIV_COLORS = {
  rch:  { main: '#4F8EF7', light: '#EBF3FF', text: '#1D4ED8' },
  ndcp: { main: '#F7B23B', light: '#FFFBEB', text: '#92400E' },
  ncd:  { main: '#9B6FEB', light: '#F3EEFF', text: '#5B21B6' },
  hss:  { main: '#2DD4BF', light: '#ECFDF5', text: '#065F46' },
  hrh:  { main: '#F7614F', light: '#FFF1EE', text: '#9B1C1C' },
};

/* ── Division SVG icons (3 per division for the illustration zone) ─────── */
const DIV_ICONS = {
  rch: [
    /* Mother & child */
    <svg key="rc1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="10" r="5" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 30 C7 22 10 18 15 18 C20 18 23 22 23 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="19" cy="26" rx="3.5" ry="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="29" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M24 33 C24 28 26 26 29 26 C32 26 34 28 34 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    /* Vaccine syringe */
    <svg key="rc2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="17" width="22" height="7" rx="3.5" stroke="currentColor" strokeWidth="2"/>
      <line x1="32" y1="20.5" x2="38" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="20.5" x2="10" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="13" x2="16" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="13" x2="20" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="13" x2="24" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="24" x2="20" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    /* Heartbeat baby */
    <svg key="rc3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.6"/>
    </svg>,
  ],
  ndcp: [
    /* Microscope */
    <svg key="nd1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="6" width="8" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="20" y1="18" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 28 Q15 24 20 24 Q25 24 28 28" stroke="currentColor" strokeWidth="2"/>
      <line x1="10" y1="34" x2="30" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="12" r="2" fill="currentColor" opacity="0.4"/>
    </svg>,
    /* Lungs / TB */
    <svg key="nd2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="6" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 14 C20 14 10 14 8 20 C6 26 8 34 14 34 C17 34 20 30 20 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 14 C20 14 30 14 32 20 C34 26 32 34 26 34 C23 34 20 30 20 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    /* Test tube */
    <svg key="nd3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8 L14 28 Q14 36 20 36 Q26 36 26 28 L26 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="28" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 26 Q17 28 20 26 Q23 24 26 26" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>,
  ],
  ncd: [
    /* Heart ECG */
    <svg key="nc1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 32 C20 32 6 24 6 14 C6 9 10 6 14 6 C17 6 20 9 20 9 C20 9 23 6 26 6 C30 6 34 9 34 14 C34 24 20 32 20 32Z" stroke="currentColor" strokeWidth="2"/>
      <polyline points="8,20 12,20 14,14 17,26 20,18 23,22 26,20 32,20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    /* Blood pressure meter */
    <svg key="nc2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 28 A14 14 0 0 1 32 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="28" x2="26" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="28" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="20" cy="28" r="2" fill="currentColor"/>
      <line x1="11" y1="28" x2="10" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    /* Eye */
    <svg key="nc3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20 C4 20 10 10 20 10 C30 10 36 20 36 20 C36 20 30 30 20 30 C10 30 4 20 4 20Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="20" cy="20" r="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="21" cy="19" r="2" fill="currentColor" opacity="0.5"/>
    </svg>,
  ],
  hss: [
    /* Hospital building */
    <svg key="hs1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="8" y1="36" x2="32" y2="36" stroke="currentColor" strokeWidth="2"/>
      <line x1="20" y1="18" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="15" y1="23" x2="25" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="16" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>,
    /* Pills */
    <svg key="hs2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="14" width="28" height="12" rx="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="20" y1="14" x2="20" y2="26" stroke="currentColor" strokeWidth="1.5"/>
      <ellipse cx="28" cy="28" rx="7" ry="5" stroke="currentColor" strokeWidth="1.5" transform="rotate(-30 28 28)"/>
    </svg>,
    /* Ambulance */
    <svg key="hs3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="14" width="28" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 18 L36 22 L36 30 L32 30" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="12" cy="32" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="28" cy="32" r="4" stroke="currentColor" strokeWidth="2"/>
      <line x1="10" y1="20" x2="10" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="23" x2="13" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
  ],
  hrh: [
    /* Stethoscope */
    <svg key="hr1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 8 L10 20 C10 27 16 32 22 32 C28 32 32 27 32 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 8 L16 20 C16 27 16 32 22 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="32" cy="18" r="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="18" r="2" fill="currentColor" opacity="0.4"/>
    </svg>,
    /* Doctor figure */
    <svg key="hr2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="10" r="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 34 C10 24 13 20 20 20 C27 20 30 24 30 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="24" x2="20" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="27" x2="23" y2="27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    /* Clipboard */
    <svg key="hr3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="20" height="26" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="16" y="6" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="14" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="25" x2="26" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="30" x2="21" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
  ],
};

/* positions for each of the 3 icons within a zone (top, left, bottom) */
const ICON_POSITIONS = [
  { top: '8%',  left: '15%' },
  { top: '10%', left: '58%' },
  { top: '48%', left: '35%' },
];

/* ── Computed summary stats ──────────────────────────────────────────────── */
function useDivStats() {
  return useMemo(() => {
    return DIVISIONS.map(div => {
      const brk = getDivBreakdown(div.id);
      const onTrackPct = brk.total > 0 ? Math.round((brk.achieved / brk.total) * 100) : 0;
      return { div, brk, onTrackPct };
    });
  }, []);
}

/* ── Reveal on scroll hook ───────────────────────────────────────────────── */
function useReveal(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('v4l-in'); obs.disconnect(); } },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage({ onSelectDivision, onViewSummary, onDirectKD }) {
  const [reportDiv, setReportDiv] = useState(null);
  const divStats = useDivStats();
  const topGaps   = useMemo(() => getTopGaps(8), []);

  /* section refs for scroll-reveal */
  const overviewRef = useRef(null);
  const flowRef     = useRef(null);
  const alertsRef   = useRef(null);
  useReveal(overviewRef);
  useReveal(flowRef);
  useReveal(alertsRef);

  /* overall totals for the hero strip */
  const totals = useMemo(() => {
    let achieved = 0, close = 0, gap = 0, total = 0;
    divStats.forEach(({ brk }) => {
      achieved += brk.achieved; close += brk.close;
      gap += brk.gap; total += brk.total;
    });
    return { achieved, close, gap, total };
  }, [divStats]);

  const onTrackPct = totals.total > 0 ? Math.round((totals.achieved / totals.total) * 100) : 0;

  return (
    <div className="v4l-root">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="v4l-nav">
        <div className="v4l-nav-inner">
          <div className="v4l-brand">
            <img src="/nhm-logo.png" alt="NHM" className="v4l-brand-logo" />
            <div>
              <div className="v4l-brand-name">Arunachal Pradesh</div>
              <div className="v4l-brand-sub">Unified Health Dashboard · FY 2025-26</div>
            </div>
          </div>
          <nav className="v4l-nav-links">
            <button className="v4l-nav-btn" onClick={onViewSummary}>All Programmes</button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* ── Hero strip ──────────────────────────────────────────────────── */}
      <section className="v4l-hero">
        <div className="v4l-hero-inner">
          <div className="v4l-hero-badge">NHM Arunachal Pradesh</div>
          <h1 className="v4l-hero-title">Programme Performance Monitor</h1>
          <p className="v4l-hero-sub">
            Real-time tracking of {totals.total} Key Deliverables across 5 NHM divisions
          </p>
          <div className="v4l-hero-kpis">
            <div className="v4l-hero-kpi v4l-hero-kpi--on">
              <span className="v4l-hero-kpi-val">{totals.achieved}</span>
              <span className="v4l-hero-kpi-lbl">On Track</span>
            </div>
            <div className="v4l-hero-kpi-sep" />
            <div className="v4l-hero-kpi v4l-hero-kpi--cau">
              <span className="v4l-hero-kpi-val">{totals.close}</span>
              <span className="v4l-hero-kpi-lbl">Caution</span>
            </div>
            <div className="v4l-hero-kpi-sep" />
            <div className="v4l-hero-kpi v4l-hero-kpi--gap">
              <span className="v4l-hero-kpi-val">{totals.gap}</span>
              <span className="v4l-hero-kpi-lbl">Critical Gap</span>
            </div>
            <div className="v4l-hero-kpi-sep" />
            <div className="v4l-hero-kpi v4l-hero-kpi--pct">
              <span className="v4l-hero-kpi-val">{onTrackPct}%</span>
              <span className="v4l-hero-kpi-lbl">Overall On Track</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — NHM PROGRAMME OVERVIEW (interactive zones)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="v4l-reveal" ref={overviewRef}>
        <ProgrammeOverview
          onSelectDivision={onSelectDivision}
          totalKDs={totals.total}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — NHM PROGRAMME FLOW (SANKEY)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="v4l-flow v4l-reveal" ref={flowRef}>
        <div className="v4l-section-header">
          <div className="v4l-section-tag">NHM Programme Flow</div>
          <h2 className="v4l-section-title">How KDs distribute across divisions, programmes, and outcome status</h2>
          <p className="v4l-section-sub">
            FY 2025-26 · Click any division or programme node to drill in
          </p>
        </div>

        {/* Legend */}
        <div className="v4l-flow-legend">
          {[
            { clr: '#00C97A', lbl: 'On Track' },
            { clr: '#FFB020', lbl: 'Caution' },
            { clr: '#FF3B5C', lbl: 'Critical Gap' },
            { clr: '#94A3B8', lbl: 'Not Mapped' },
          ].map(({ clr, lbl }) => (
            <div key={lbl} className="v4l-flow-leg-item">
              <span className="v4l-flow-leg-dot" style={{ background: clr }} />
              <span className="v4l-flow-leg-lbl">{lbl}</span>
            </div>
          ))}
        </div>

        {/* Sankey chart container */}
        <div className="v4l-sankey-outer">
          <Suspense fallback={<div className="v4l-sankey-loading">Loading flow diagram…</div>}>
            <NHMSankey
              onSelectDivision={onSelectDivision}
              onSelectProgramme={(prog, div) => {
                if (prog) {
                  /* navigate to kd-list for this programme */
                  onSelectDivision && onSelectDivision(div);
                } else {
                  onSelectDivision && onSelectDivision(div);
                }
              }}
              theme="light"
            />
          </Suspense>
        </div>

        <div className="v4l-section-source">
          Node width proportional to number of Key Deliverables · HRH staffing KDs pending mapping
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — CRITICAL ALERTS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="v4l-alerts v4l-reveal" ref={alertsRef}>
        <div className="v4l-section-header">
          <div className="v4l-section-tag v4l-section-tag--red">Critical Alerts</div>
          <h2 className="v4l-section-title">Top gaps requiring immediate attention</h2>
          <p className="v4l-section-sub">Ranked by deficit magnitude against NHM FY 2025-26 targets</p>
        </div>

        <div className="v4l-alerts-table">
          <div className="v4l-alerts-head">
            <span>#</span>
            <span>Division</span>
            <span>Programme</span>
            <span>Indicator</span>
            <span>Target</span>
            <span>Achievement</span>
            <span>Gap</span>
          </div>
          {topGaps.map((kd, i) => {
            const clr = DIV_COLORS[kd.divId] || DIV_COLORS.rch;
            const gapPct = kd.lowerIsBetter
              ? `+${Math.round((kd.achievement / kd.target - 1) * 100)}%`
              : `-${Math.round((1 - kd.achievement / kd.target) * 100)}%`;
            return (
              <div key={i} className="v4l-alerts-row" onClick={() => onSelectDivision(
                DIVISIONS.find(d => d.id === kd.divId)
              )}>
                <span className="v4l-alerts-rank">{i + 1}</span>
                <span>
                  <span className="v4l-alerts-div-chip"
                        style={{ background: clr.light, color: clr.text }}>
                    {kd.divLabel}
                  </span>
                </span>
                <span className="v4l-alerts-prog">{kd.progName}</span>
                <span className="v4l-alerts-ind">{kd.indicator}</span>
                <span className="v4l-alerts-target">{kd.targetLabel}</span>
                <span className="v4l-alerts-ach">{kd.achievedLabel}</span>
                <span className="v4l-alerts-gap">{gapPct}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="v4l-footer">
        <div className="v4l-footer-inner">
          <div className="v4l-footer-brand">
            <span className="v4l-footer-name">Pahlé India Foundation</span>
            <span className="v4l-footer-sub">NHM Arunachal Pradesh · FY 2025-26</span>
          </div>
          <nav className="v4l-footer-nav">
            {DIVISIONS.map(div => (
              <button key={div.id} className="v4l-footer-link"
                      onClick={() => onSelectDivision(div)}>
                {div.label}
              </button>
            ))}
            <button className="v4l-footer-link" onClick={onViewSummary}>
              All Programmes
            </button>
          </nav>
        </div>
      </footer>

      {reportDiv && (
        <ReportModal division={reportDiv} onClose={() => setReportDiv(null)} />
      )}
    </div>
  );
}
