/* ═══════════════════════════════════════════════════════════════════════════
   StatCard3D.jsx — 3-face GSAP rotating prism stat card

   Each face uses the original v5-stat-card visual layout:
     division id tag · big number · label · programme pill · illustration

   Container (.sc3d-prism) rotates −120° per step via GSAP.
   Auto-advances every 20 s. startDelay staggers cards so they don't all
   flip simultaneously. Click pauses and navigates to DivisionPage.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/* ── Single face ─────────────────────────────────────────────────────────── */
function Face({ stat, image, faceIdx, accent, divFullName }) {
  return (
    <div
      className={`sc3d-face sc3d-face--${faceIdx}`}
      style={{ '--accent': accent }}
    >
      {/* Illustration (right side, behind gradient) */}
      {image && <img src={image} className="v5-stat-card-img" alt="" />}

      {/* Gradient so text stays readable over the illustration */}
      <div className="sc3d-face-overlay" />

      {/* Content stack — mirrors original v5-stat-card */}
      <div className="v5-stat-number">{stat?.value ?? '—'}</div>
      <div className="v5-stat-label">{stat?.label ?? ''}</div>
      <div className="v5-stat-prog">{divFullName}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function StatCard3D({
  divLabel,
  divFullName,
  accent = '#4F8EF7',
  stats  = [],      // array of up to 3 face objects from getDivisionStats
  images = [],      // array of 3 image URLs
  onClick,
  startDelay = 0,   // ms stagger before first auto-roll
}) {
  const prismRef    = useRef(null);
  const faceIdxRef  = useRef(0);
  const pausedRef   = useRef(false);
  const timerRef    = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
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
      rotateX:  faceIdxRef.current * 120,
      duration: 0.9,
      ease:     'power3.inOut',
    });
  }

  function handleClick() {
    pausedRef.current = true;
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    onClick?.();
  }

  const faces = [stats[0] ?? null, stats[1] ?? null, stats[2] ?? null];
  const imgs  = [images[0] ?? '', images[1] ?? '', images[2] ?? ''];

  return (
    <div
      className="sc3d-scene"
      style={{ '--sc3d-accent': accent }}
      onClick={handleClick}
      title={`${divLabel} — click to explore`}
    >
      {/* 3-face prism — GSAP targets this element */}
      <div className="sc3d-prism" ref={prismRef}>
        {faces.map((stat, i) => (
          <Face
            key={i}
            stat={stat}
            image={imgs[i]}
            faceIdx={i}
            accent={accent}
            divFullName={divFullName}
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
