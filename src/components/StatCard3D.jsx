/* ═══════════════════════════════════════════════════════════════════════════
   StatCard3D.jsx — 3-face GSAP rotating prism stat card

   Layout: 3 faces at rotateY(0 / 120 / 240 deg), backface-hidden.
   Container (.sc3d-prism) rotates −120° per step via GSAP.
   Auto-advances every 20 s. Click pauses + navigates.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/* ── Status display config ───────────────────────────────────────────────── */
const STATUS_CFG = {
  achieved: { label: 'On Track',     color: '#059669', bg: 'rgba(5,150,105,0.12)',  bar: '#059669' },
  close:    { label: 'Caution',      color: '#D97706', bg: 'rgba(217,119,6,0.12)',  bar: '#F59E0B' },
  gap:      { label: 'Critical Gap', color: '#DC2626', bg: 'rgba(220,38,38,0.12)',  bar: '#EF4444' },
  neutral:  { label: 'No Data',      color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', bar: '#94A3B8' },
};

/* ── Face component ─────────────────────────────────────────────────────── */
function Face({ stat, image, faceIdx, accent }) {
  const cfg = STATUS_CFG[stat?.status] ?? STATUS_CFG.neutral;

  return (
    <div className={`sc3d-face sc3d-face--${faceIdx}`}>
      {/* Background illustration */}
      <div
        className="sc3d-face-bg"
        style={{ backgroundImage: `url(${image})` }}
      />
      {/* Content */}
      <div className="sc3d-face-content">
        {/* Top row: face index dot + status badge */}
        <div className="sc3d-face-top">
          <div className="sc3d-face-dots">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={`sc3d-dot ${i === faceIdx ? 'sc3d-dot--active' : ''}`}
                style={i === faceIdx ? { background: accent } : {}}
              />
            ))}
          </div>
          {stat?.status && (
            <span
              className="sc3d-face-badge"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {cfg.label}
            </span>
          )}
        </div>

        {/* Main value */}
        <div className="sc3d-face-body">
          <div className="sc3d-face-value" style={{ color: accent }}>
            {stat?.value ?? '—'}
          </div>
          <div className="sc3d-face-indicator">
            {stat?.label ?? ''}
          </div>
        </div>

        {/* Footer: programme name + progress bar */}
        <div className="sc3d-face-foot">
          <span className="sc3d-face-prog" style={{ borderColor: accent }}>
            {stat?.programme ?? ''}
          </span>
          {stat?.pct != null && (
            <div className="sc3d-face-bar-track">
              <div
                className="sc3d-face-bar-fill"
                style={{
                  width: `${Math.min(150, Math.max(0, stat.pct))}%`,
                  background: cfg.bar,
                }}
              />
              <span className="sc3d-face-pct">
                {stat.pct}% vs target {stat.targetLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function StatCard3D({
  divLabel,
  accent = '#4F8EF7',
  stats = [],          // array of up to 3 face objects from getDivisionStats
  images = [],         // array of 3 image URLs
  onClick,
  startDelay = 0,      // ms to stagger first roll (so all 5 cards don't roll at once)
}) {
  const prismRef   = useRef(null);
  const faceIdxRef = useRef(0);
  const pausedRef  = useRef(false);
  const timerRef   = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    /* Staggered start */
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(rollNext, 20_000);
    }, startDelay);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDelay]);

  function rollNext() {
    if (pausedRef.current) return;
    faceIdxRef.current = (faceIdxRef.current + 1) % 3;
    gsap.to(prismRef.current, {
      rotateY:  -faceIdxRef.current * 120,
      duration: 1.1,
      ease:     'power3.inOut',
    });
  }

  function handleClick() {
    /* Pause auto-rotation then navigate */
    pausedRef.current = true;
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    onClick?.();
  }

  /* Ensure we always have 3 slots (pad with nulls if needed) */
  const faces  = [stats[0] ?? null, stats[1] ?? null, stats[2] ?? null];
  const imgs   = [images[0] ?? '', images[1] ?? '', images[2] ?? ''];

  return (
    <div
      className="sc3d-scene"
      style={{ '--sc3d-accent': accent }}
      onClick={handleClick}
      title={`${divLabel} — click to explore`}
    >
      {/* Division label strip at top */}
      <div className="sc3d-label" style={{ color: accent }}>
        {divLabel}
      </div>

      {/* 3-face prism */}
      <div className="sc3d-prism" ref={prismRef}>
        {faces.map((stat, i) => (
          <Face
            key={i}
            stat={stat}
            image={imgs[i]}
            faceIdx={i}
            accent={accent}
          />
        ))}
      </div>

      {/* Hover CTA */}
      <div className="sc3d-hover-cta" style={{ borderColor: accent, color: accent }}>
        Explore Division
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="6" x2="10" y2="6"/>
          <polyline points="7,3 10,6 7,9"/>
        </svg>
      </div>
    </div>
  );
}
