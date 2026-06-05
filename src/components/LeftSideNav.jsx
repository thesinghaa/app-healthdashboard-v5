/* ═══════════════════════════════════════════════════════════════════════════
   LeftSideNav.jsx
   Slide-in left panel → click division → full-page Programme Wheel.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { gsap } from 'gsap';
import { DIVISIONS as DIV_DATA } from '../data/programs';
import { KD_TREE } from '../data/kdData';

const Plot = lazy(() => import('react-plotly.js'));

/* ── Division display meta ──────────────────────────────────────────────── */
const DIVISIONS = [
  { id: 'rch',  short: 'RCH',  name: 'Reproductive & Child Health',   color: '#1B6FF5', light: '#DBEAFE' },
  { id: 'ndcp', short: 'NDCP', name: 'National Disease Control',       color: '#D97706', light: '#FEF3C7' },
  { id: 'ncd',  short: 'NCD',  name: 'Non-Communicable Diseases',      color: '#7C3AED', light: '#EDE9FE' },
  { id: 'hss',  short: 'HSS',  name: 'Health Systems Strengthening',   color: '#0F9B82', light: '#CCFBF1' },
  { id: 'hrh',  short: 'HRH',  name: 'Human Resources for Health',     color: '#DC4B2A', light: '#FEE2E2' },
];

/* ── Wheel labels — full form first, short form after.
   Single-element arrays = one line; two-element = two lines.          ── */
const PROG_FULL = {
  'maternal-health':   ['Maternal', 'Health'],
  'jsy':               ['Janani', 'Suraksha Yojana'],
  'cac':               ['Comp.', 'Abortion Care'],
  'pcpndt':            ['PC &', 'PNDT'],
  'child-health':      ['Child', 'Health'],
  'immunization':      ['Immunization'],
  'adolescent-health': ['Adolescent', 'Health'],
  'family-planning':   ['Family', 'Planning'],
  'nutrition':         ['Nutrition'],
  'nvhcp':             ['Viral', 'Hepatitis Ctrl'],
  'tb':                ['TB Mukt', 'Bharat Abhiyan'],
  'nlep':              ['Leprosy', 'Eradication'],
  'ncvbdcp':           ['Vector Borne', 'Disease Ctrl'],
  'idsp':              ['Disease', 'Surveillance'],
  'nscaem':            ['Sickle Cell', 'Elimination'],
  'np-ncd':            ['NCD', 'Programme'],
  'pmndp':             ['Dialysis', 'Programme'],
  'nppc':              ['Palliative', 'Care'],
  'nmhp':              ['Mental', 'Health'],
  'nphce':             ['Elderly', 'Health Care'],
  'npcbvi':            ['Blindness', 'Control'],
  'nppcd':             ['Deafness', 'Prevention'],
  'nohp':              ['Oral Health', 'Programme'],
  'niddcp':            ['Iodine', 'Deficiency Ctrl'],
  'ntcp':              ['Tobacco', 'Control'],
  'npcchh':            ['Climate', 'Change Health'],
  'hss-urban':         ['HSS', 'Urban'],
  'hss-rural':         ['HSS', 'Rural'],
  'drugs-diagnostics': ['Drugs &', 'Diagnostics'],
  'mpw':               ['Multi-Purpose', 'Workers (F+M)'],
  'staff-nurse':       ['Staff', 'Nurse'],
  'cho':               ['Community', 'Health Officers'],
  'lab-tech':          ['Lab', 'Technicians'],
  'pharmacist':        ['Pharmacists'],
  'medical-officer':   ['Medical', 'Officers'],
  'specialist':        ['Clinical', 'Specialists'],
  'pm-abhim':          ['PM-ABHIM'],
};

/* ── Reusable SVG icon paths ─────────────────────────────────────────────── */
const ICON_PATHS = {
  person:      'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 10c4 0 8 2 8 4v2H4v-2c0-2 4-4 8-4z',
  baby:        'M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-5 8h10v2c0 3-2 5-5 5s-5-2-5-5v-2z',
  syringe:     'M19 3l2 2-3 3-4-4 3-3zm-5 5L4 18l-1 3 3-1 10-10-2-2zm-7 9l-2 2',
  lung:        'M12 4v8M7 7C4 8 3 11 3 14c0 2 1 3 2 3s2-1 2-3V8m10-1c3 1 4 4 4 7 0 2-1 3-2 3s-2-1-2-3V8',
  eye:         'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zm10-3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  ecg:         'M3 12h4l2-7 4 14 3-7h5',
  building:    'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  brain:       'M9 3C6 3 4 5 4 8c0 2 1 3 2 4l6 9 6-9c1-1 2-2 2-4 0-3-2-5-5-5a4 4 0 0 0-3 1.5A4 4 0 0 0 9 3z',
  drop:        'M12 2L7 10a6 6 0 1 0 10 0L12 2z',
  groups:      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m19 0v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  cross:       'M12 5v14M5 12h14',
  flask:       'M9 3v7L4 17a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 17l-5-7V3M9 3h6',
  ribbon:      'M12 22c0 0-8-5-8-12a8 8 0 0 1 16 0c0 7-8 12-8 12z',
  stethoscope: 'M4.5 8C4.5 11 7 13 10 13h2m0 0v2a4 4 0 0 0 8 0v-1',
  coin:        'M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 5v10m-3-7.5C9 8.1 10.3 7 12 7s3 1.1 3 2.5S13.7 12 12 12s-3 1.1-3 2.5S10.3 17 12 17s3-1.1 3-2.5',
  ear:         'M6 8a6 6 0 1 1 11.9 1.2C17.5 12 15 14 14 15.5c-.5.8-.8 1.7-.8 2.5V19a2 2 0 0 1-4 0v-.5',
  tooth:       'M8 3C6 4 5 6 5 8c0 3 1 6 2 8l1 5 2-5h4l2 5 1-5c1-2 2-5 2-8 0-2-1-4-3-5L13 3h-2z',
  leaf:        'M17 8C8 10 5.9 16.2 3.7 19.7 9.1 21 16 17 17 8zM3.7 19.7c2.5-1.9 5.1-3.4 8.3-2.7',
  mosquito:    'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM5 9L2 6M5 9H2M5 15H2M19 9l3-3M19 9h3M19 15h3',
  badge:       'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm4 5h10M7 14h6',
  nosmoke:     'M2 12h12m4 0h4M18 8c2 1 3 3 3 4M18 16c2-1 3-3 3-4M4 4l16 16',
};

const PROG_ICON_KEY = {
  'maternal-health':'person','jsy':'coin','cac':'cross','pcpndt':'eye',
  'child-health':'baby','immunization':'syringe','adolescent-health':'person',
  'family-planning':'groups','nutrition':'leaf','nvhcp':'drop','tb':'lung',
  'nlep':'drop','ncvbdcp':'mosquito','idsp':'flask','nscaem':'drop',
  'np-ncd':'ecg','pmndp':'drop','nppc':'ribbon','nmhp':'brain',
  'nphce':'person','npcbvi':'eye','nppcd':'ear','nohp':'tooth',
  'niddcp':'drop','ntcp':'nosmoke','npcchh':'leaf','hss-urban':'building',
  'hss-rural':'building','drugs-diagnostics':'flask','mpw':'person',
  'staff-nurse':'cross','cho':'groups','lab-tech':'flask','pharmacist':'cross',
  'medical-officer':'stethoscope','specialist':'badge','pm-abhim':'building',
};

/* ── Custom PNG icons per programme (override SVG fallback) ─────────────── */
const PROG_ICON_IMG = {
  'maternal-health':   '/prog-icons/maternal-health.png',
  'jsy':               '/prog-icons/jsy.png',
  'cac':               '/prog-icons/cac.png',
  'pcpndt':            '/prog-icons/pcpndt.png',
  'child-health':      '/prog-icons/child-health.png',
  'immunization':      '/prog-icons/immunization.png',
  'adolescent-health': '/prog-icons/adolescent-health.png',
  'family-planning':   '/prog-icons/family-planning.png',
  'nutrition':         '/prog-icons/nutrition.png',
};

/* ── SVG arc helpers ─────────────────────────────────────────────────────── */
function toXY(r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [r * Math.cos(rad), r * Math.sin(rad)];
}
function ringPath(iR, oR, a0, a1) {
  const [x1,y1]=toXY(oR,a0), [x2,y2]=toXY(oR,a1);
  const [x3,y3]=toXY(iR,a1), [x4,y4]=toXY(iR,a0);
  const lg = a1-a0>180?1:0;
  return `M${x1},${y1}A${oR},${oR} 0 ${lg} 1 ${x2},${y2}L${x3},${y3}A${iR},${iR} 0 ${lg} 0 ${x4},${y4}Z`;
}

/* ── KD status helper ────────────────────────────────────────────────────── */
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

/* ── Programme item card (side column) ───────────────────────────────────── */
function ProgItem({ prog, color, hovered, setHovered, onSelect, side }) {
  const isHov = hovered === prog.id;
  const iconKey = PROG_ICON_KEY[prog.id] || 'cross';
  return (
    <button
      className={`wpg-prog-item${isHov ? ' wpg-prog-item--hov' : ''} wpg-prog-item--${side}`}
      style={{ '--dc': color }}
      onMouseEnter={() => setHovered(prog.id)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onSelect(prog)}
    >
      <span className={`wpg-prog-icon${PROG_ICON_IMG[prog.id] ? ' wpg-prog-icon--img' : ''}`}>
        {PROG_ICON_IMG[prog.id] ? (
          <img src={PROG_ICON_IMG[prog.id]}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, display: 'block' }} alt="" />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON_PATHS[iconKey] || ''}/>
          </svg>
        )}
      </span>
      <span className="wpg-prog-name">{prog.name || prog.id}</span>
      <span className="wpg-prog-arrow">
        {side === 'left'
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        }
      </span>
    </button>
  );
}

/* ── Full-page Programme Wheel ────────────────────────────────────────────── */
function ProgrammeWheelPage({ division, divData, onSelect, onSelectKD, isLoggedIn, loggedInUser, onLogin, onClose, onLogout, onReport }) {
  const [hovered, setHovered]   = useState(null);
  const [selected, setSelected] = useState(null);
  const pageRef   = useRef(null);
  const wheelRef  = useRef(null);
  const leftRef   = useRef(null);
  const rightRef  = useRef(null);
  const headerRef = useRef(null);
  const footerRef = useRef(null);
  const panelRef  = useRef(null);

  const programs  = divData?.programs || [];
  const n         = programs.length;
  const half      = Math.floor(n / 2);
  const leftProgs  = programs.slice(0, half);
  const rightProgs = programs.slice(half);

  /* wheel geometry — memoized, only recomputes when program count changes */
  const { GAP, SEG, I_R, O_R, ICON_R, LBL_R, SIZE, segData } = useMemo(() => {
    const GAP    = n > 9 ? 2.5 : 3.5;
    const SEG    = (360 - n * GAP) / n;
    const I_R    = 105;
    const O_R    = n > 9 ? 240 : 250;
    const ICON_R = (I_R + O_R) / 2 + 2;
    const LBL_R  = ICON_R + 26;
    const SIZE   = 600;
    const segData = programs.map((prog, i) => {
      const a0   = i * (SEG + GAP);
      const a1   = a0 + SEG;
      const midA = (a0 + a1) / 2;
      const d    = ringPath(I_R, O_R, a0, a1);
      const [ix, iy] = toXY(ICON_R, midA);
      const [lx, ly] = toXY(LBL_R, midA);
      let textRot = midA;
      if (midA > 90 && midA < 270) textRot = midA + 180;
      return { prog, i, a0, a1, midA, d, ix, iy, lx, ly, textRot };
    });
    return { GAP, SEG, I_R, O_R, ICON_R, LBL_R, SIZE, segData };
  }, [n, programs]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* entry animation */
  useEffect(() => {
    pageRef.current?.focus({ preventScroll: true });
    const tl = gsap.timeline();
    tl.fromTo(pageRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    tl.fromTo(wheelRef.current,
      { opacity: 0, scale: 0.7, rotation: -25 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.4)', transformOrigin: '50% 50%' },
      '-=0.1');
    if (leftRef.current?.children)
      tl.fromTo(Array.from(leftRef.current.children),
        { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, '-=0.35');
    if (rightRef.current?.children)
      tl.fromTo(Array.from(rightRef.current.children),
        { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, '-=0.45');
  }, []);

  /* on select: fade cards, shift wheel+header left, slide panel in */
  useEffect(() => {
    if (selected) {
      /* fade out cards + footer */
      gsap.to([leftRef.current, rightRef.current],
        { opacity: 0, duration: 0.22, ease: 'power2.in' });
      gsap.to(footerRef.current,
        { opacity: 0, y: 8, duration: 0.22, ease: 'power2.in' });
      /* shift wheel only — header stays fixed */
      gsap.to(wheelRef.current,
        { x: '-27vw', duration: 0.42, ease: 'power3.out', delay: 0.05 });
      /* panel slides in from right — fromTo so no prior gsap.set needed */
      if (panelRef.current) {
        gsap.fromTo(panelRef.current,
          { x: 500, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.40, ease: 'power3.out', delay: 0.08 });
      }
    } else {
      /* reverse */
      gsap.to(wheelRef.current, { x: 0, duration: 0.30, ease: 'power3.out' });
      gsap.to([leftRef.current, rightRef.current], { opacity: 1, duration: 0.30, ease: 'power2.out', delay: 0.15 });
      gsap.to(footerRef.current, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', delay: 0.15 });
    }
  }, [selected]);

  function close() {
    gsap.to(pageRef.current, { opacity: 0, scale: 0.97, duration: 0.2, onComplete: onClose });
  }

  function handleSelect(prog) {
    setSelected(prev => prev?.id === prog.id ? null : prog);
  }

  function handlePanelClose() {
    setSelected(null);
  }

  function handleViewAll(prog) {
    close();
    setTimeout(() => onSelect(prog, divData), 220);
  }

  function segFill(i, id) {
    const base = division.color;
    if (hovered === id) return base;
    return i % 2 === 0 ? base : base + 'CC';
  }

  return (
    <div className="wpg-page" ref={pageRef} tabIndex="-1"
      style={{ '--dc': division.color, '--dl': division.light }}
    >
      {/* ── Header ── */}
      <header className="wpg-header" ref={headerRef}>
        <button className="wpg-back-btn" onClick={onLogout || close}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <div className="wpg-header-center">
          {/* Identity — fades out on login */}
          <div className={`wpg-header-identity${isLoggedIn ? ' wpg-header-identity--out' : ''}`}>
            <span className="wpg-header-chip">{division.short}</span>
            <h1 className="wpg-header-title">{division.name}</h1>
          </div>
          {/* Welcome message — fades in on login */}
          <div className={`wpg-header-welcome${isLoggedIn ? ' wpg-header-welcome--in' : ''}`}>
            <span className="wpg-welcome-name" style={{ color: division.color }}>
              {loggedInUser || 'PIF'}
            </span>
            <span className="wpg-welcome-sep">·</span>
            <span className="wpg-welcome-div">{division.name}</span>
            <span className="wpg-welcome-cta">ready to explore</span>
          </div>
          {/* Login button — visible only when not logged in */}
          {!isLoggedIn && (
            <button
              className="wpg-login-btn"
              style={{ '--dc': division.color }}
              onClick={onLogin}
            >
              Login to access
            </button>
          )}
        </div>
      </header>
      <div className="wpg-header-right wpg-header-right--fixed">
        {isLoggedIn && onReport && (
          <button className="wpg-report-btn" style={{ '--dc': division.color }} onClick={onReport}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            AI Report
          </button>
        )}
        <span className="wpg-prog-count">{n} Programmes</span>
        <button className="wpg-close-btn" onClick={onLogout || close} aria-label="Close">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* ── Outer frame — bordered container for wheel + table ── */}
      <div className="wpg-frame">

      {/* ── Main: 3-col — cards | wheel | cards ── */}
      <main className="wpg-main">

        {/* Left programme cards */}
        <div className="wpg-col wpg-col--left" ref={leftRef}>
          {leftProgs.map(prog => (
            <ProgItem key={prog.id} prog={prog} color={division.color}
              hovered={hovered} setHovered={setHovered}
              onSelect={handleSelect} side="left" />
          ))}
        </div>

        {/* Centre wheel */}
        <div className="wpg-wheel-wrap" ref={wheelRef}>
          <svg width={SIZE} height={SIZE} viewBox={`${-SIZE/2} ${-SIZE/2} ${SIZE} ${SIZE}`} overflow="visible">

{segData.map(({ prog, i, d, ix, iy, lx, ly, textRot }) => {
              const isHov    = hovered === prog.id;
              const iconKey  = PROG_ICON_KEY[prog.id] || 'cross';
              const lblLines = PROG_FULL[prog.id] || [prog.name?.split(' ')[0] || prog.id];

              return (
                <g key={prog.id} className={`wheel-seg${isHov ? ' wheel-seg--hov' : ''}`}
                  onClick={() => handleSelect(prog)}
                  onMouseEnter={() => setHovered(prog.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <path d={d} fill={segFill(i, prog.id)}
                    style={{ transform: isHov ? 'scale(1.06)' : 'scale(1)', transformOrigin: '0 0',
                             transition: 'transform 0.18s ease, fill 0.18s', cursor: 'pointer' }}
                  />
                  <g transform={`translate(${ix},${iy})`} style={{ pointerEvents: 'none' }}>
                    {PROG_ICON_IMG[prog.id] ? (
                      <g>
                        <defs>
                          <clipPath id={`icon-clip-${prog.id}`}>
                            <rect x="-24" y="-24" width="48" height="48" rx="8" ry="8" />
                          </clipPath>
                        </defs>
                        <image href={PROG_ICON_IMG[prog.id]} width="48" height="48"
                          x="-24" y="-24" clipPath={`url(#icon-clip-${prog.id})`} />
                      </g>
                    ) : (
                      <svg x="-14" y="-14" width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d={ICON_PATHS[iconKey] || ''}/>
                      </svg>
                    )}
                  </g>
                  {(() => {
                    const fs  = n > 9 ? 10 : 11;
                    const lh  = fs + 2;
                    const off = -(lblLines.length - 1) * lh / 2;
                    return (
                      <text x={lx} y={ly} textAnchor="middle"
                        transform={`rotate(${textRot},${lx},${ly})`}
                        fontSize={fs} fontWeight="600"
                        fontFamily="Inter,sans-serif" fill="white"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {lblLines.map((ln, li) => (
                          <tspan key={li} x={lx} dy={li === 0 ? off : lh}>{ln}</tspan>
                        ))}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

            {/* Centre badge — white bg so image blends naturally */}
            <circle r={I_R - 6} fill={division.light}
              stroke={division.color} strokeWidth="3"
              style={{ cursor: 'pointer' }}
              onClick={() => { close(); setTimeout(() => onSelect(null, divData), 220); }}
            />
            <image href={`/sidebar/${division.short}.png`}
              x={-(I_R-6)*0.62} y={-(I_R-6)*0.78}
              width={(I_R-6)*1.24} height={(I_R-6)*1.24}
              style={{ pointerEvents: 'none' }}
            />
            <text x="0" y={I_R - 22} textAnchor="middle"
              fontSize="18" fontWeight="800" fontFamily="Inter,sans-serif" fill={division.color}
              style={{ pointerEvents: 'none', letterSpacing: 1 }}>
              {division.short}
            </text>

          </svg>

          {/* Hovered programme name shown below wheel */}
          <div className={`wpg-hover-label${hovered ? ' wpg-hover-label--show' : ''}`}>
            {hovered
              ? programs.find(p => p.id === hovered)?.name ?? ''
              : <span>&nbsp;</span>}
          </div>
        </div>

        {/* Right programme cards */}
        <div className="wpg-col wpg-col--right" ref={rightRef}>
          {rightProgs.map(prog => (
            <ProgItem key={prog.id} prog={prog} color={division.color}
              hovered={hovered} setHovered={setHovered}
              onSelect={handleSelect} side="right" />
          ))}
        </div>

      </main>

      {/* ── Bordered table panel — absolute, slides in from right ── */}
      {selected && (() => {
          const kdList = KD_TREE[division.id]?.programmes?.[selected.id]?.kds || [];
          return (
            <div className="wpg-right-box" ref={panelRef}
              style={{ '--dc': division.color, '--dl': division.light }}>
              {/* panel header — circle icon + name + close */}
              <div className="wpg-kd-hdr">
                <div className="wpg-kd-hdr-left">
                  <div className={`wpg-kd-hdr-circle${PROG_ICON_IMG[selected.id] ? ' wpg-kd-hdr-circle--img' : ''}`}>
                    {PROG_ICON_IMG[selected.id] ? (
                      <img src={PROG_ICON_IMG[selected.id]}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} alt="" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke={division.color} strokeWidth="2" strokeLinecap="round">
                        <path d={ICON_PATHS[PROG_ICON_KEY[selected.id] || 'cross'] || ''}/>
                      </svg>
                    )}
                  </div>
                  <div className="wpg-kd-title-wrap">
                    <h2 className="wpg-kd-prog-title">{selected.name}</h2>
                    <span className="wpg-kd-subtitle">Click on an indicator to explore more</span>
                  </div>
                </div>
                <button className="wpg-kd-close-btn" onClick={handlePanelClose} aria-label="Close panel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* pill rows */}
              <div className="wpg-kd-pills-wrap">
                {kdList.length === 0 ? (
                  <p className="wpg-kd-empty">No indicators available for this programme.</p>
                ) : (
                  <>
                  <div className="wpg-pill-hdr">
                    <span className="wpg-pill-hdr-num">#</span>
                    <span className="wpg-pill-hdr-name">Indicator</span>
                    <div className="wpg-pill-hdr-right">
                      <span>Achievement / Target</span>
                      <span>Status</span>
                    </div>
                  </div>
                  <div className="wpg-kd-pills">
                    {kdList.map((kd, idx) => {
                      const st = kdStatus(kd);
                      const statusLabel = st === 'achieved' ? 'On Track' : st === 'close' ? 'Caution' : st === 'gap' ? 'Gap' : 'N/A';
                      const pct = kd.target > 0 ? Math.round((kd.achievement / kd.target) * 100) : null;
                      return (
                        <div key={kd.no}
                          className={`wpg-pill wpg-pill--${st} wpg-pill--link`}
                          onClick={() => onSelectKD && onSelectKD(kd, selected, divData)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="wpg-pill-num">{idx + 1}</span>
                          <span className="wpg-pill-name">{kd.indicator}</span>
                          <div className="wpg-pill-right">
                            <span className="wpg-pill-vals">
                              <span className="wpg-pill-achvd">{kd.achievedLabel ?? kd.achievement ?? '—'}</span>
                              <span className="wpg-pill-sep">/</span>
                              <span className="wpg-pill-target">{kd.targetLabel ?? kd.target ?? '—'}</span>
                              {pct !== null && <span className="wpg-pill-pct">{pct}%</span>}
                            </span>
                            <span className={`wpg-kd-badge wpg-kd-badge--${st}`}>{statusLabel}</span>
                            <svg className="wpg-pill-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}
              </div>

              {/* navigate to full KD page */}
              <button className="wpg-kd-view-all" onClick={() => handleViewAll(selected)}>
                View All Indicators
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          );
        })()}

      </div>{/* end wpg-frame */}

      {/* ── Footer ── */}
      <footer className="wpg-footer" ref={footerRef}>
        Click a wheel segment to view Key Deliverables &nbsp;·&nbsp; Click the centre to explore the full division
      </footer>
    </div>
  );
}

/* ── Division story data (per division) ─────────────────────────────────── */
const DIVISION_STORIES = {
  rch: {
    title: 'The health stories of the year',
    subtitle: 'Select a story below to explore what FY 2025-26 data revealed across maternal health, newborn care, immunisation, nutrition and family planning in Arunachal Pradesh.',
    intro: '',
    topStats: [
      { value: '24,229', label: 'Pregnant women registered for care',  img: '/prog-icons/maternal-health.png', progId: 'maternal-health' },
      { value: '16,947', label: 'Babies delivered in a facility',       img: '/prog-icons/jsy.png',             progId: 'jsy' },
      { value: '18,024', label: 'Children fully immunised by age 1',    img: '/prog-icons/immunization.png',   progId: 'immunization' },
      { value: '27',     label: 'Districts across the state',           img: '/prog-icons/child-health.png',   progId: 'child-health' },
    ],
    stories: [
      {
        no: 1,
        icon: 'person',
        tab: 'Mothers',
        title: "Safe pregnancy, safe delivery",
        question: 'Is every registered pregnancy reaching a safe, supported delivery?',
        narrative: "A pregnancy registered late is a pregnancy where early danger signs go unseen. In Arunachal Pradesh, nearly every pregnancy gets registered — but when it happens, how often a mother comes back for check-ups, and whether she finally delivers in a hospital rather than at home: these are the four steps that tell us whether the health system truly walks with her. Together, they answer one question: does registration become safety?",
        hero: { value: '70%', text: 'of registered pregnancies ended in a facility delivery this year — 16,947 mothers gave birth in a hospital or health centre' },
        bars: [
          { label: 'Registered for ANC',         pct: 95, count: '24,229' },
          { label: 'Registered early (1st tri.)', pct: 65, count: '15,704' },
          { label: 'Completed 4+ check-ups',      pct: 68, count: '16,460' },
          { label: 'Completed iron course',       pct: 88, count: '21,388' },
          { label: 'Delivered at facility',       pct: 70, count: '16,947' },
        ],
        insight: 'Nearly every pregnancy is registered and most complete their full iron course — a strong foundation. But only 65% register in the first trimester and 68% complete 4+ check-ups, the visits that catch high-risk pregnancies early. Closing the early-registration gap is the next mile.',
      },
      {
        no: 2,
        icon: 'baby',
        tab: 'Newborns',
        title: 'The first week of life',
        question: 'Are newborns getting the care they need during their most critical days?',
        narrative: "More babies die in their first seven days than at any other point in childhood. A quick screen at birth catches the ones born too small or too soon. A nurse in the SNCU saves those who wouldn't survive without care. A feed within the first hour gives lifelong protection that no medicine can replicate. And an ASHA visit at home in the days after discharge catches the danger signs no hospital ever sees. These four numbers together tell us whether Arunachal's newborns are truly safe — or just born.",
        hero: { value: '8.89', text: 'stillbirths per 1,000 births — comfortably below the target of 12, among the better rates in the region' },
        bars: [
          { label: 'Newborns screened at birth',  pct: 87, count: '—' },
          { label: 'SNCU survival & discharge',   pct: 88, count: '—' },
          { label: 'Breastfed within 1 hour',     pct: 85, count: '13,910' },
          { label: 'Home newborn care (HBNC)',    pct: 54, count: '—' },
        ],
        insight: 'Arunachal beats the national stillbirth target and nearly 9 in 10 newborns are screened and survive intensive care. The weak link is follow-up at home — only about half of newborns receive the recommended HBNC visits, where early danger signs are caught.',
      },
      {
        no: 3,
        icon: 'syringe',
        tab: 'Immunisation',
        title: 'Full immunisation by year one',
        question: 'Is every child completing the full vaccine schedule by their first birthday?',
        narrative: "Every vaccine on the schedule exists because a child died without it. The first dose is given at birth. The last arrives just before the first birthday. In between, a cold chain must hold, a health worker must show up, and a family must return — again and again. We follow four checkpoints across that first year: birth dose, full immunisation, the second measles shot, and whether the child is registered digitally so no one falls through the cracks. Together they tell us whether protection is truly universal — or just nearly so.",
        hero: { value: '91%', text: 'of children are fully immunised by their first birthday — 18,024 of 19,823 infants, with almost no drop-out between doses' },
        bars: [
          { label: 'Hep-B birth dose',            pct: 90, count: '14,018' },
          { label: 'Fully immunised by age 1',    pct: 91, count: '18,024' },
          { label: 'Measles-Rubella 2nd dose',    pct: 95, count: '17,098' },
          { label: 'U-WIN digital capture',       pct: 95, count: '1,372' },
        ],
        insight: "Immunisation is the state's strongest performer — second-dose measles-rubella at 95% and drop-out from the first to third Pentavalent dose of just 0.3%. A quiet success of the frontline ASHA, ANM and cold-chain workforce.",
      },
      {
        no: 4,
        icon: 'drop',
        tab: 'Nutrition',
        title: 'Iron for every age',
        question: 'Is iron supplementation reaching every at-risk group — from infants to pregnant women?',
        narrative: "Iron deficiency doesn't announce itself. It shows up quietly — as a child who can't concentrate, a teenager who tires easily, a pregnancy that turns dangerous. The damage it does earliest in life is also the hardest to undo. Arunachal's programme reaches three groups who need iron the most: pregnant women, school-age children, and infants under five. Each group gets a different form — tablets or syrup — through a different delivery system. Tracking all three tells us not just whether iron is being distributed, but whether it's actually reaching the youngest, most vulnerable hands.",
        hero: { value: '88%', text: 'of pregnant women completed their full iron course — 21,388 of 24,227 — but coverage drops sharply for the youngest children' },
        bars: [
          { label: 'Pregnant women (180 IFA)',    pct: 88, count: '21,388' },
          { label: 'Children 5-9 yrs (tablets)',  pct: 93, count: '131,622' },
          { label: 'Children 6-59 mo (syrup)',    pct: 20, count: '25,154' },
        ],
        insight: 'Iron reaches older children and pregnant women well, but only 1 in 5 young children (6-59 months) receive their IFA syrup — the very age when iron deficiency does the most lasting harm to brain development. This is the clearest, most fixable gap in the nutrition programme.',
      },
      {
        no: 5,
        icon: 'groups',
        tab: 'Family Planning',
        title: 'An unequal burden',
        question: 'Is family planning a shared responsibility — or does it still fall on women alone?',
        narrative: "In most households in Arunachal Pradesh, the decision to space or limit births falls almost entirely on women — and so does the physical burden of acting on it. Whether a woman hears about long-acting options at the moment of delivery, whether those options are actually stocked at her nearest facility, and whether families are having open conversations about planning: these three signals reveal how shared the responsibility really is. One number, sitting at zero, answers the question most directly.",
        hero: { value: '0', text: 'additional male sterilisations were recorded this year. Family planning in Arunachal still rests almost entirely on women' },
        barNote: 'Bars show progress against this year’s target',
        bars: [
          { label: 'Post-partum IUCD acceptance', pct: 33,  count: '361' },
          { label: 'Supply chain (FPLMIS) live',  pct: 100, count: '—' },
          { label: 'Saas-Bahu Sammelans held',    pct: 88,  count: '1,380' },
        ],
        insight: 'Long-acting and permanent methods remain rare — post-partum IUCD reached just a third of its target, and not a single additional male sterilisation was recorded. The supply chain is now live in 75% of facilities and 1,380 Saas-Bahu Sammelans built community awareness. The groundwork is laid; uptake of effective methods is the next push.',
      },
    ],
  },
};

/* ── Division Story Page ─────────────────────────────────────────────────── */
function DivisionStoryPage({ division, onClose, onExploreProgrammes, onLogout }) {
  const story = DIVISION_STORIES[division.id];
  const pageRef = useRef(null);
  const [activeStory, setActiveStory] = useState(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    gsap.fromTo(pageRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out' });
  }, []);

  function close() {
    gsap.to(pageRef.current, { opacity: 0, y: 10, duration: 0.2, onComplete: onClose });
  }

  function explore() {
    onExploreProgrammes();
  }

  if (!story) {
    onExploreProgrammes();
    return null;
  }

  return (
    <div className="dsp-page" ref={pageRef} style={{ '--dc': division.color, '--dl': division.light }}>
      {/* ── Header ── */}
      <header className="dsp-header">
        <button className="wpg-back-btn" onClick={onLogout || close}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <div className="wpg-header-center">
          <span className="wpg-header-chip">{division.short}</span>
          <h1 className="wpg-header-title">{division.name}</h1>
        </div>
        <button className="wpg-close-btn" onClick={onLogout || close} aria-label="Close">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      {/* ── Scrollable body ── */}
      <div className="dsp-body">
      <div className="dsp-body-inner">

        {/* Hero text */}
        <div className="dsp-hero" style={{ '--dsp-div-color': division.color }}>
          <h2 className="dsp-title">{story.title}</h2>
          <p className="dsp-subtitle">
            <span className="dsp-subtitle-bar" style={{ background: division.color }} />
            {story.subtitle}
          </p>
        </div>

        {/* Story tabs (inline, after hero) */}
        <div className="dsp-tabs">
          {story.stories.map((st, i) => {
            const isActive = i === activeStory;
            const tabImg = PROG_ICON_IMG[story.topStats?.[i]?.progId] || null;
            return (
              <button
                key={st.no}
                className={`dsp-tab${isActive ? ' dsp-tab--active' : ''}`}
                onClick={() => setActiveStory(i)}
                style={isActive ? { background: division.color, borderColor: division.color } : { borderColor: division.color + '55' }}
              >
                {st.icon && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON_PATHS[st.icon] || ''}/>
                  </svg>
                )}
                <span>{st.tab || st.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active story */}
        {[story.stories[activeStory]].map(st => (
          <div key={st.no} className="dsp-story">
            {/* Story head — number badge + icon + title */}
            <div className="dsp-story-head">
              <span className="dsp-story-no">STORY {st.no}</span>
              {st.icon && (
                <span className="dsp-story-icon" style={{ background: division.light }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke={division.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON_PATHS[st.icon] || ''}/>
                  </svg>
                </span>
              )}
              <h3 className="dsp-story-title">{st.title}</h3>
            </div>
            <p className="dsp-story-question">{st.question}</p>

            {/* 2-col layout: hero+visual (left)  |  chart (right) */}
            <div className="dsp-story-grid">

              {/* Left: hero stat + visual */}
              <div className="dsp-story-left">
                <div className="dsp-story-narrative" style={{ background: division.light + 'AA', borderColor: division.color + '33' }}>
                  <div className="dsp-narrative-head">
                    {st.icon && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke={division.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={ICON_PATHS[st.icon] || ''}/>
                      </svg>
                    )}
                    <span style={{ color: division.color }}>Why this story</span>
                  </div>
                  <p className="dsp-narrative-text">{st.narrative}</p>
                </div>
                <div className="dsp-story-hero" style={{ borderColor: division.color + '33', background: division.color + '08' }}>
                  <span className="dsp-story-hero-val" style={{ color: division.color }}>{st.hero.value}</span>
                  <span className="dsp-story-hero-text">{st.hero.text}</span>
                </div>
              </div>

              {/* Right: "What data tells?" + chart */}
              <div className="dsp-story-right">
                <div className="dsp-data-heading">What data tells?</div>
                <div className="dsp-chart-wrap">
                  <Suspense fallback={<div className="dsp-chart-loading">Loading chart...</div>}>
                    <Plot
                      data={[{
                        type: 'bar',
                        orientation: 'h',
                        y: [...st.bars].reverse().map(b => b.label),
                        x: [...st.bars].reverse().map(b => b.pct),
                        text: [...st.bars].reverse().map(b => `${b.pct}%`),
                        textposition: 'inside',
                        insidetextanchor: 'start',
                        textfont: { color: division.color, size: 12, family: 'JetBrains Mono, monospace', weight: 700 },
                        customdata: [...st.bars].reverse().map(b => b.count),
                        hovertemplate: '<b>%{y}</b><br>%{x}%  ·  %{customdata}<extra></extra>',
                        marker: {
                          color: division.color + '28',
                          line: { color: division.color + '55', width: 1.5 },
                        },
                      }]}
                      layout={{
                        height: st.bars.length * 38 + 20,
                        margin: { l: 0, r: 60, t: 4, b: 4, pad: 0 },
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        xaxis: { range: [0, 108], showgrid: false, showticklabels: false, zeroline: false, fixedrange: true },
                        yaxis: { showgrid: false, zeroline: false, tickfont: { family: 'Inter, sans-serif', size: 12, color: '#4B5563' }, automargin: true, fixedrange: true },
                        bargap: 0.30,
                        annotations: [...st.bars].reverse().map((b, i) => ({
                          x: b.pct + 1.5, y: i,
                          xanchor: 'left', yanchor: 'middle',
                          text: `<b>${b.count}</b>`, showarrow: false,
                          font: { family: 'JetBrains Mono, monospace', size: 11, color: '#6B7280' },
                        })),
                      }}
                      config={{ displayModeBar: false, responsive: true }}
                      style={{ width: '100%' }}
                      useResizeHandler
                    />
                  </Suspense>
                </div>
                {st.barNote && <p className="dsp-bar-note">{st.barNote}</p>}
              </div>

            </div>

            {/* Insights box — full width inside card */}
            <div className="dsp-insights-box">
              <div className="dsp-insights-label" style={{ color: division.color }}>Insights</div>
              <p className="dsp-insights-text">{st.insight}</p>
            </div>
          </div>
        ))}

        {/* Full-width Explore More button */}
        <button className="dsp-explore-btn" onClick={explore}
          style={{ background: division.color }}>
          Explore More
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

      </div>{/* end dsp-body-inner */}
      </div>
    </div>
  );
}

/* ── Left Nav panel ───────────────────────────────────────────────────────── */
export default function LeftSideNav({ onSelectDivision, onSelectProgramme, openWheelDirect, openDivDirect, onNeedLogin, onDirectKD, isLoggedIn, loggedInUser, onLogout, onReport }) {
  const [open,      setOpen]      = useState(false);
  const [activeDiv, setActiveDiv] = useState(null);
  const [showWheel, setShowWheel] = useState(false);

  // Called from Login popup to skip story and go straight to wheel
  useEffect(() => {
    if (!openWheelDirect) return;
    const div = DIVISIONS.find(d => d.id === openWheelDirect);
    if (div) { setActiveDiv(div); setShowWheel(true); }
  }, [openWheelDirect]);

  // Called from landing page division pills — mirrors row click (story first for RCH, wheel for others)
  useEffect(() => {
    if (!openDivDirect) return;
    const div = DIVISIONS.find(d => d.id === openDivDirect);
    if (div) { setActiveDiv(div); setShowWheel(false); }
  }, [openDivDirect]);

  const panelRef = useRef(null);
  const rowRefs  = useRef([]);

  useEffect(() => { gsap.set(panelRef.current, { x: -280 }); }, []);

  useEffect(() => {
    if (!panelRef.current) return;
    if (open) {
      gsap.to(panelRef.current, { x: 0, duration: 0.38, ease: 'power3.out' });
      gsap.fromTo(rowRefs.current.filter(Boolean),
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.07, ease: 'power2.out', delay: 0.1 });
    } else {
      gsap.to(panelRef.current, { x: -280, duration: 0.3, ease: 'power2.in' });
    }
  }, [open]);

  function getDivData(id) { return DIV_DATA.find(d => d.id === id) || null; }

  function handleWheelSelect(prog, divData) {
    setOpen(false);
    setActiveDiv(null);
    if (!divData) return;
    if (prog && onSelectProgramme) onSelectProgramme(prog, divData);
    else if (onSelectDivision)     onSelectDivision(divData);
  }

  function handleKDSelect(kd, prog, divData) {
    if (!isLoggedIn) {
      if (onNeedLogin) onNeedLogin(null);
      return;
    }
    setOpen(false);
    setActiveDiv(null);
    setShowWheel(false);
    if (onDirectKD) onDirectKD(divData, prog.id, kd);
  }

  return (
    <>

      {activeDiv && !showWheel && (
        <DivisionStoryPage
          division={activeDiv}
          onClose={() => setActiveDiv(null)}
          onExploreProgrammes={() => setShowWheel(true)}
          onLogout={onLogout ? () => { setActiveDiv(null); setShowWheel(false); onLogout(); } : null}
        />
      )}

      {activeDiv && showWheel && (
        <ProgrammeWheelPage
          division={activeDiv}
          divData={getDivData(activeDiv.id)}
          onSelect={handleWheelSelect}
          onSelectKD={handleKDSelect}
          isLoggedIn={isLoggedIn}
          loggedInUser={loggedInUser}
          onLogin={() => onNeedLogin && onNeedLogin(null)}
          onClose={() => { setActiveDiv(null); setShowWheel(false); }}
          onLogout={onLogout ? () => { setActiveDiv(null); setShowWheel(false); onLogout(); } : null}
          onReport={onReport ? () => onReport(activeDiv.id, activeDiv.name, activeDiv.color) : null}
        />
      )}
    </>
  );
}
