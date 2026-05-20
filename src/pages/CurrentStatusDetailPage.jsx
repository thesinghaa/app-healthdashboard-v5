// CurrentStatusDetailPage.jsx
// 3rd-layer page — full Current Status view for a programme
// Opened when user clicks the CSEntryBar on KDProgrammePage / HRHCadrePage / DivisionPage

import { useEffect, useRef } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { gsap } from 'gsap';
import CurrentStatusSection from './CurrentStatusSection';

/* Type → human readable label for the section header */
const TYPE_LABEL = {
  'mmr':             'SDG 3.1.1 — Maternal Mortality Ratio',
  'child-health':    'Child Health Outcomes — SDG 3.2',
  'family-planning': 'SDG 3.7.1 — Safe Motherhood & Family Planning',
  'tb':              'TB Elimination — NTEP · SDG 3.3',
  'leprosy':         'Leprosy Elimination — NLEP',
  'malaria':         'Malaria Control — NCVBDCP',
  'pm-abhim':        'PM-ABHIM — Infrastructure & XV-FC Financial Progress',
};

export default function CurrentStatusDetailPage({ program, division, onBack }) {
  const wrapRef = useRef(null);

  /* Page entry — only animate the wrapper and hero, never touch the
     chart components — they manage their own GSAP animations via useCSAnim */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' },
      );
      gsap.from('.csd-hero', {
        y: 20, opacity: 0, duration: 0.40,
        ease: 'power3.out', delay: 0.08,
      });
      gsap.from('.csd-section-header', {
        y: 16, opacity: 0, duration: 0.38,
        ease: 'power3.out', delay: 0.18,
      });
    }, wrapRef);
    return () => ctx.revert();
  }, [program?.id]);

  const cs = program?.currentStatus;
  const sectionLabel = cs ? (TYPE_LABEL[cs.type] ?? 'Current Status') : 'Current Status';
  const sourceLabel  = cs?.source ?? 'MoHFW NPCC Meeting, Arunachal Pradesh, May 2026';

  return (
    <div className="csd-root" ref={wrapRef}>

      {/* ── Topbar ─────────────────────────────────────────────── */}
      <div className="app-topbar">
        <div className="app-topbar-inner">
          <button className="app-back-btn" onClick={onBack}>
            <span className="app-back-arrow">&#8592;</span> Back
          </button>
          <div className="app-breadcrumb">
            <span className="app-tag" style={{ background: '#00b5cc' }}>
              {division?.label}
            </span>
            <span className="app-bc-sep">&#8250;</span>
            <span className="app-bc-prog">{program?.name}</span>
            <span className="app-bc-sep">&#8250;</span>
            <span className="app-bc-current">Current Status</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Orange hero header ──────────────────────────────────── */}
      <div className="csd-hero">
        <div className="csd-hero-inner">
          <div className="csd-hero-eyebrow">Current Status Report</div>
          <h1 className="csd-hero-title">{program?.name}</h1>
          <div className="csd-hero-sub">
            SDG &amp; Disease Elimination · MoHFW NPCC May 2026 · Arunachal Pradesh
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="csd-content">

        {/* Charts wrapper — header + charts in one orange-bordered container */}
        <div className="csd-charts-outer">
          <div className="csd-section-header">
            <div className="csd-section-header-left">
              <span className="csd-section-live-dot" />
              <div>
                <div className="csd-section-label">{sectionLabel}</div>
                <div className="csd-section-source">{sourceLabel}</div>
              </div>
            </div>
            <span className="csd-section-pill">LIVE DATA</span>
          </div>
          <div className="csd-charts-body">
            {/* Charts — each status component manages its own GSAP via useCSAnim */}
            <CurrentStatusSection program={program} />
          </div>
        </div>

      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="detail-footer">
        Source: MoHFW NPCC Meeting, Arunachal Pradesh, May 2026. NHM AP FY 2025-26 NPCC Document.
      </footer>
    </div>
  );
}
