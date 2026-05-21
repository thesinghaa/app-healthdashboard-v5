import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { DIVISIONS } from '../data/programs';
import { KD_TREE } from '../data/kdData';
import '../styles/landing.css';
import ThemeToggle from '../components/ThemeToggle';

const CardSummary = lazy(() => import('../components/CardSummary'));

/* ── Per-division colour accents ─────────────────────────────────── */
const DIV_COLORS = {
  rch:  { border: '#00b5cc', glow: 'rgba(0,181,204,0.28)' },
  ndcp: { border: '#00b5cc', glow: 'rgba(0,181,204,0.28)' },
  ncd:  { border: '#00b5cc', glow: 'rgba(0,181,204,0.28)' },
  hss:  { border: '#00b5cc', glow: 'rgba(0,181,204,0.28)' },
  hrh:  { border: '#00b5cc', glow: 'rgba(0,181,204,0.28)' },
};


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

function computeProgStatus(divisionId, progId) {
  const div = KD_TREE[divisionId];
  if (!div) return 'yellow';
  const prog = (div.programmes || {})[progId];
  if (!prog || !(prog.kds || []).length) return 'yellow';
  let achieved = 0, close = 0, gap = 0;
  prog.kds.forEach(kd => {
    const st = kdStatus(kd);
    if (st === 'neutral') return;
    if (st === 'achieved') achieved++;
    else if (st === 'close') close++;
    else gap++;
  });
  if (gap > 0) return 'red';
  if (close > 0) return 'yellow';
  if (achieved > 0) return 'green';
  return 'yellow';
}

function getDivStats(div) {
  let red = 0, yellow = 0, green = 0;
  div.programs.forEach(p => {
    const st = computeProgStatus(div.id, p.id);
    if (st === 'red')    red++;
    else if (st === 'yellow') yellow++;
    else green++;
  });
  return { red, yellow, green, total: div.programs.length };
}

/* ── Card positioning by offset from active ──────────────────────── */
function cardStyle(offset) {
  const abs = Math.abs(offset);
  if (abs > 2) return { display: 'none' };
  const vw   = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const cardW = Math.min(1200, vw - 80);
  /* Step: at >= 1440px keep 1300px gap; below that scale with viewport */
  const step = vw >= 1440 ? 1300 : Math.max(cardW + 80, Math.round(vw * 0.88));
  const tx = offset * step;
  const sc = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.66;
  const op = abs === 0 ? 1 : abs === 1 ? 0.58 : 0.20;
  const zi = abs === 0 ? 10 : abs === 1 ? 5 : 1;
  const blur = abs === 0 ? 0 : abs === 1 ? 2 : 6;
  return {
    transform: `translateX(calc(-50% + ${tx}px)) scale(${sc})`,
    opacity: op,
    zIndex: zi,
    filter: blur ? `blur(${blur}px)` : 'none',
    pointerEvents: abs === 0 ? 'auto' : 'auto',
  };
}

export default function LandingPage({ onSelectDivision, onViewSummary, onDirectKD }) {
  const [active, setActive]     = useState(0);
  const [locked, setLocked]     = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  /* Reset filter whenever the active card changes */
  useEffect(() => setActiveFilter(null), [active]);

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
            <span className="lnd-brand-sub">Unified Health Dashboard</span>
          </div>

{/* Centre — All Programmes CTA */}
          <div className="lnd-header-centre">
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

          {/* Right — theme toggle */}
          <div className="lnd-header-right">
            <ThemeToggle />
          </div>
        </div>
      </header>

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
              {/* Index number */}
              <div className="lnd-card-idx">
                <span className="lnd-idx-num">#{String(idx + 1).padStart(2, '0')}</span>
                <span className="lnd-idx-sep"> | </span>
                <span className="lnd-idx-lbl">{div.label}</span>
                {isActive && (
                  <button
                    className="lnd-idx-expand"
                    onClick={(e) => { e.stopPropagation(); onSelectDivision(div); }}
                    aria-label={`Open ${div.fullName}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 2.5h6.5V9M11.5 2.5L2.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="lnd-card-divider" />


              {/* Division name */}
              <h2 className="lnd-card-name">{div.fullName}</h2>

              {/* Programme count */}
              <p className="lnd-card-count">{stats.total} Programmes</p>

              {/* Status pills — filter buttons */}
              <div className="lnd-card-status">
                {stats.red > 0 && (
                  <button
                    className={`lnd-pill lnd-pill--red${isActive && activeFilter === 'red' ? ' lnd-pill--sel' : ''}`}
                    onClick={(e) => { e.stopPropagation(); if (isActive) setActiveFilter(f => f === 'red' ? null : 'red'); }}
                  >
                    {stats.red} Critical
                  </button>
                )}
                {stats.yellow > 0 && (
                  <button
                    className={`lnd-pill lnd-pill--yellow${isActive && activeFilter === 'yellow' ? ' lnd-pill--sel' : ''}`}
                    onClick={(e) => { e.stopPropagation(); if (isActive) setActiveFilter(f => f === 'yellow' ? null : 'yellow'); }}
                  >
                    {stats.yellow} Caution
                  </button>
                )}
                {stats.green > 0 && (
                  <button
                    className={`lnd-pill lnd-pill--green${isActive && activeFilter === 'green' ? ' lnd-pill--sel' : ''}`}
                    onClick={(e) => { e.stopPropagation(); if (isActive) setActiveFilter(f => f === 'green' ? null : 'green'); }}
                  >
                    {stats.green} On Track
                  </button>
                )}
              </div>

              {/* Summary — prog section is a flex child, fills remaining space */}
              <Suspense fallback={<div className="lnd-summary-skeleton" />}>
                <CardSummary
                  divisionId={div.id}
                  programmes={div.programs}
                  activeFilter={isActive ? activeFilter : null}
                  isActive={isActive}
                  onKDClick={(kd, programmeId) => onDirectKD && onDirectKD(div, programmeId, kd)}
                  onExploreDivision={isActive ? () => onSelectDivision(div) : null}
                />
              </Suspense>

              {/* Glow ring (active only) */}
              {isActive && <div className="lnd-card-ring" />}
            </div>
          );
        })}
      </div>

      {/* ── Edge arrows ───────────────────────────────────────────── */}
      <button className="lnd-arrow lnd-arrow--left" onClick={() => go(-1)} aria-label="Previous division">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11.5 3.5L6 9l5.5 5.5" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <button className="lnd-arrow lnd-arrow--right" onClick={() => go(1)} aria-label="Next division">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M6.5 3.5L12 9l-5.5 5.5" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Dot nav ───────────────────────────────────────────────── */}
      <div className="lnd-nav">
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
      </div>

    </div>
  );
}
