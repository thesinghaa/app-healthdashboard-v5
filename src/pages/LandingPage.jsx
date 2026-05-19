import { useState, useEffect, useCallback } from 'react';
import { DIVISIONS } from '../data/programs';
import '../styles/landing.css';

/* ── Per-division colour accents ─────────────────────────────────── */
const DIV_COLORS = {
  rch:  { border: '#a78bfa', glow: 'rgba(167,139,250,0.28)' },
  ndcp: { border: '#60a5fa', glow: 'rgba(96,165,250,0.28)'  },
  ncd:  { border: '#818cf8', glow: 'rgba(129,140,248,0.28)' },
  hss:  { border: '#c084fc', glow: 'rgba(192,132,252,0.28)' },
  hrh:  { border: '#a5b4fc', glow: 'rgba(165,180,252,0.28)' },
};

/* ── Key highlight per division ──────────────────────────────────── */
const DIV_HIGHLIGHT = {
  rch:  'Maternal Health · 4+ ANC: 36.5%',
  ndcp: 'TB Mukt Bharat · Elimination 2025',
  ncd:  'NP-NCD · Hypertension 33.1%',
  hss:  'Drug stock · <2 weeks critical',
  hrh:  '880 MPW · 520 Medical Officers',
};

function getDivStats(div) {
  let red = 0, yellow = 0, green = 0;
  div.programs.forEach(p => {
    if (p.status === 'red')    red++;
    else if (p.status === 'yellow') yellow++;
    else green++;
  });
  return { red, yellow, green, total: div.programs.length };
}

/* ── Card positioning by offset from active ──────────────────────── */
function cardStyle(offset) {
  const abs = Math.abs(offset);
  if (abs > 2) return { display: 'none' };
  const tx = offset * 460;
  const sc = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.66;
  const op = abs === 0 ? 1 : abs === 1 ? 0.58 : 0.20;
  const zi = abs === 0 ? 10 : abs === 1 ? 5 : 1;
  const blur = abs === 0 ? 0 : abs === 1 ? 2 : 6;
  return {
    transform: `translateX(calc(-50% + ${tx}px)) translateY(-50%) scale(${sc})`,
    opacity: op,
    zIndex: zi,
    filter: blur ? `blur(${blur}px)` : 'none',
    pointerEvents: abs === 0 ? 'auto' : 'auto',
  };
}

export default function LandingPage({ onSelectDivision, onViewSummary }) {
  const [active, setActive]   = useState(0);
  const [locked, setLocked]   = useState(false);

  const go = useCallback((dir) => {
    if (locked) return;
    setLocked(true);
    setActive(prev => (prev + dir + DIVISIONS.length) % DIVISIONS.length);
    setTimeout(() => setLocked(false), 480);
  }, [locked]);

  /* Keyboard nav */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  /* Wrap-aware offset */
  const offset = (idx) => {
    let d = idx - active;
    const n = DIVISIONS.length;
    if (d >  n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <div className="lnd-root">

      {/* ── Navbar ────────────────────────────────────────────────── */}
      <header className="lnd-header">
        <div className="lnd-header-inner">
          {/* Brand */}
          <div className="lnd-brand">
            <span className="lnd-brand-name">Arunachal Pradesh</span>
            <span className="lnd-brand-sub">NHM Health Dashboard</span>
          </div>

          {/* Centre label */}
          <div className="lnd-header-centre">
            <span className="lnd-header-label">Select a Division</span>
          </div>

          {/* Summary CTA */}
          <div className="lnd-header-right">
            <button className="lnd-summary-btn" onClick={onViewSummary}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              All Programmes
            </button>
          </div>
        </div>
      </header>

      {/* ── Eyebrow + title ───────────────────────────────────────── */}
      <div className="lnd-intro">
        <p className="lnd-eyebrow">FY 2025–26 · NHM Arunachal Pradesh</p>
        <h1 className="lnd-title">Programme Performance</h1>
      </div>

      {/* ── Cinema reel ───────────────────────────────────────────── */}
      <div className="lnd-reel-wrap">
        {DIVISIONS.map((div, idx) => {
          const off   = offset(idx);
          const stats = getDivStats(div);
          const col   = DIV_COLORS[div.id];
          const isActive = off === 0;

          return (
            <div
              key={div.id}
              className={`lnd-card${isActive ? ' lnd-card--active' : ''}`}
              style={{ ...cardStyle(off), '--bdr': col.border, '--glow': col.glow }}
              onClick={() => {
                if (isActive) onSelectDivision(div);
                else if (off < 0) go(-1);
                else go(1);
              }}
            >
              {/* Top row: badge + icon */}
              <div className="lnd-card-top">
                <span className="lnd-badge">{div.label}</span>
                {isActive && <span className="lnd-enter-hint">Enter ↗</span>}
              </div>

              {/* Division name */}
              <h2 className="lnd-card-name">{div.fullName}</h2>

              {/* Programme count */}
              <p className="lnd-card-count">{stats.total} Programmes</p>

              {/* Status pills */}
              <div className="lnd-card-status">
                {stats.red    > 0 && <span className="lnd-pill lnd-pill--red">{stats.red} Critical</span>}
                {stats.yellow > 0 && <span className="lnd-pill lnd-pill--yellow">{stats.yellow} Caution</span>}
                {stats.green  > 0 && <span className="lnd-pill lnd-pill--green">{stats.green} On Track</span>}
              </div>

              {/* Highlight */}
              <p className="lnd-card-highlight">{DIV_HIGHLIGHT[div.id]}</p>

              {/* Active-only CTA bar */}
              {isActive && (
                <div className="lnd-card-cta">
                  <span>Explore Division</span>
                  <span className="lnd-cta-arrow">→</span>
                </div>
              )}

              {/* Glow ring (active only) */}
              {isActive && <div className="lnd-card-ring" />}
            </div>
          );
        })}
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <div className="lnd-nav">
        <button className="lnd-arrow" onClick={() => go(-1)} aria-label="Previous division">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11.5 3.5L6 9l5.5 5.5" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="lnd-dots">
          {DIVISIONS.map((_, i) => (
            <button
              key={i}
              className={`lnd-dot${i === active ? ' lnd-dot--active' : ''}`}
              onClick={() => { if (!locked) setActive(i); }}
              aria-label={`Go to ${DIVISIONS[i].label}`}
            />
          ))}
        </div>

        <button className="lnd-arrow" onClick={() => go(1)} aria-label="Next division">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M6.5 3.5L12 9l-5.5 5.5" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </div>
  );
}
