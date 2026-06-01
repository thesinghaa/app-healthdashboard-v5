/* ═══════════════════════════════════════════════════════════════════════════
   LeftSideNav.jsx
   Slide-in left panel → click division → full-page Programme Wheel.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { DIVISIONS as DIV_DATA } from '../data/programs';
import { KD_TREE } from '../data/kdData';

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
function ProgrammeWheelPage({ division, divData, onSelect, onClose }) {
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

  /* wheel geometry */
  const GAP    = n > 9 ? 2.5 : 3.5;
  const SEG    = (360 - n * GAP) / n;
  const I_R    = 105;
  const O_R    = n > 9 ? 240 : 250;
  const ICON_R = (I_R + O_R) / 2 + 2;
  const LBL_R  = ICON_R + 26;
  const SIZE   = 600;

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
      /* shift wheel + header left */
      gsap.to([headerRef.current, wheelRef.current],
        { x: '-27vw', duration: 0.42, ease: 'power3.out', delay: 0.05 });
      /* panel slides in from right — fromTo so no prior gsap.set needed */
      if (panelRef.current) {
        gsap.fromTo(panelRef.current,
          { x: 500, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.40, ease: 'power3.out', delay: 0.08 });
      }
    } else {
      /* reverse */
      gsap.to([headerRef.current, wheelRef.current], { x: 0, duration: 0.30, ease: 'power3.out' });
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
        <button className="wpg-back-btn" onClick={close}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <div className="wpg-header-center">
          <span className="wpg-header-chip">{division.short}</span>
          <h1 className="wpg-header-title">{division.name}</h1>
        </div>
        <div className="wpg-header-right">
          <span className="wpg-prog-count">{n} Programmes</span>
          <button className="wpg-close-btn" onClick={close} aria-label="Close">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </header>

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

{programs.map((prog, i) => {
              const a0   = i * (SEG + GAP);
              const a1   = a0 + SEG;
              const midA = (a0 + a1) / 2;
              const d    = ringPath(I_R, O_R, a0, a1);
              const isHov = hovered === prog.id;
              const [ix, iy] = toXY(ICON_R, midA);
              const [lx, ly] = toXY(LBL_R, midA);
              const iconKey  = PROG_ICON_KEY[prog.id] || 'cross';
              const lblLines = PROG_FULL[prog.id] || [prog.name?.split(' ')[0] || prog.id];
              /* rotate label: flip text on bottom half so it's always readable */
              let textRot = midA;
              if (midA > 90 && midA < 270) textRot = midA + 180;

              return (
                <g key={prog.id} className={`wheel-seg${isHov ? ' wheel-seg--hov' : ''}`}
                  onClick={() => handleSelect(prog)}
                  onMouseEnter={() => setHovered(prog.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <path d={d} fill={segFill(i, prog.id)}
                    style={{ transform: isHov ? 'scale(1.06)' : 'scale(1)', transformOrigin: '0 0',
                             transition: 'transform 0.2s ease, fill 0.2s', cursor: 'pointer',
                             filter: isHov ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.22))' : 'none' }}
                  />
                  <g transform={`translate(${ix},${iy})`} style={{ pointerEvents: 'none' }}>
                    {PROG_ICON_IMG[prog.id] ? (<>
                      <defs>
                        <clipPath id={`icon-clip-${prog.id}`}>
                          <rect x="-24" y="-24" width="48" height="48" rx="8" ry="8" />
                        </clipPath>
                      </defs>
                      <image href={PROG_ICON_IMG[prog.id]} width="48" height="48"
                        x="-24" y="-24" clipPath={`url(#icon-clip-${prog.id})`} />
                    </>) : (
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
                  <h2 className="wpg-kd-prog-title">{selected.name}</h2>
                </div>
                <button className="wpg-kd-close-btn" onClick={handlePanelClose} aria-label="Close panel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* bordered grid table */}
              <div className="wpg-kd-grid-wrap">
                {kdList.length === 0 ? (
                  <p className="wpg-kd-empty">No indicators available for this programme.</p>
                ) : (
                  <table className="wpg-kd-grid">
                    <thead>
                      <tr className="wpg-kd-grid-hdr">
                        <th className="wpg-kd-gh wpg-kd-gh--no">S.no</th>
                        <th className="wpg-kd-gh wpg-kd-gh--indicator">Indicator</th>
                        <th className="wpg-kd-gh wpg-kd-gh--target">Target</th>
                        <th className="wpg-kd-gh wpg-kd-gh--achvd">Achievement</th>
                        <th className="wpg-kd-gh wpg-kd-gh--status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kdList.map((kd, idx) => {
                        const st = kdStatus(kd);
                        const statusLabel = st === 'achieved' ? 'On Track' : st === 'close' ? 'Caution' : st === 'gap' ? 'Gap' : 'N/A';
                        return (
                          <tr key={kd.no} className={`wpg-kd-gr wpg-kd-gr--${st}`}>
                            <td className="wpg-kd-gd wpg-kd-gd--no">{idx + 1}</td>
                            <td className="wpg-kd-gd wpg-kd-gd--indicator">{kd.indicator}</td>
                            <td className="wpg-kd-gd wpg-kd-gd--target">{kd.targetLabel ?? kd.target ?? '—'}</td>
                            <td className="wpg-kd-gd wpg-kd-gd--achvd">{kd.achievedLabel ?? kd.achievement ?? '—'}</td>
                            <td className="wpg-kd-gd wpg-kd-gd--status">
                              <span className={`wpg-kd-badge wpg-kd-badge--${st}`}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
    title: 'Five health stories of the year',
    subtitle: 'What happened to mothers, babies, women and families across Arunachal Pradesh in FY 2024-25',
    intro: 'Every year, lakhs of people across Arunachal Pradesh walk into a public health centre, a sub-centre, or a hospital. These five stories follow the people the health system met this year — and what it did for them.',
    topStats: [
      { value: '27,132', label: 'Pregnant women cared for' },
      { value: '21,019', label: 'Babies born safely' },
      { value: '20,787', label: 'Children fully immunised by age 1' },
      { value: '25',     label: 'Districts, every corner of the state' },
    ],
    stories: [
      {
        no: 1,
        title: "The mother's journey",
        question: 'Are pregnancies travelling safely from registration to delivery?',
        hero: { value: '73%', text: 'of registered pregnancies ended in a facility delivery this year — 19,812 mothers gave birth in a hospital or health centre' },
        bars: [
          { label: 'Registered for care',    pct: 100, count: '27,132' },
          { label: 'Registered early',        pct: 62,  count: '16,887' },
          { label: 'Completed 4+ check-ups',  pct: 70,  count: '18,957' },
          { label: 'Completed iron tablets',  pct: 90,  count: '24,514' },
          { label: 'Delivered at facility',   pct: 73,  count: '19,812' },
          { label: 'Stayed 48+ hours',        pct: 43,  count: '11,724' },
        ],
        insight: 'Most mothers reach a facility to deliver — a real win for the state. But only 4 in 10 stay for the recommended 48 hours, the window when most complications appear. That is the next mile.',
      },
    ],
  },
};

/* ── Division Story Page ─────────────────────────────────────────────────── */
function DivisionStoryPage({ division, onClose, onExploreProgrammes }) {
  const story = DIVISION_STORIES[division.id];
  const pageRef = useRef(null);

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
    gsap.to(pageRef.current, { opacity: 0, x: -40, duration: 0.22, ease: 'power2.in', onComplete: onExploreProgrammes });
  }

  if (!story) {
    onExploreProgrammes();
    return null;
  }

  return (
    <div className="dsp-page" ref={pageRef} style={{ '--dc': division.color, '--dl': division.light }}>
      {/* ── Header ── */}
      <header className="dsp-header">
        <button className="wpg-back-btn" onClick={close}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <div className="wpg-header-center">
          <span className="wpg-header-chip">{division.short}</span>
          <h1 className="wpg-header-title">{division.name}</h1>
        </div>
        <button className="wpg-close-btn" onClick={close} aria-label="Close">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      {/* ── Scrollable body ── */}
      <div className="dsp-body">

        {/* Hero text */}
        <div className="dsp-hero">
          <h2 className="dsp-title">{story.title}</h2>
          <p className="dsp-subtitle">
            <span className="dsp-subtitle-bar" style={{ background: division.color }} />
            {story.subtitle}
          </p>
          <p className="dsp-intro">{story.intro}</p>
        </div>

        {/* Top stats row */}
        <div className="dsp-top-stats">
          {story.topStats.map((s, i) => (
            <div key={i} className="dsp-top-stat">
              <div className="dsp-top-stat-val" style={{ color: division.color }}>{s.value}</div>
              <div className="dsp-top-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Stories */}
        {story.stories.map(st => (
          <div key={st.no} className="dsp-story">
            {/* Story label + title */}
            <div className="dsp-story-head">
              <span className="dsp-story-no">STORY {st.no}</span>
              <h3 className="dsp-story-title">{st.title}</h3>
            </div>
            <p className="dsp-story-question">{st.question}</p>

            {/* Hero stat */}
            <div className="dsp-story-hero" style={{ borderColor: division.color + '33', background: division.color + '08' }}>
              <span className="dsp-story-hero-val" style={{ color: division.color }}>{st.hero.value}</span>
              <span className="dsp-story-hero-text">{st.hero.text}</span>
            </div>

            {/* Progress bars */}
            <div className="dsp-bars">
              {st.bars.map((b, i) => (
                <div key={i} className="dsp-bar-row">
                  <span className="dsp-bar-label">{b.label}</span>
                  <div className="dsp-bar-track">
                    <div className="dsp-bar-fill"
                      style={{ width: `${b.pct}%`, background: division.color + '33' }}>
                      <span className="dsp-bar-pct" style={{ color: division.color }}>{b.pct}%</span>
                    </div>
                  </div>
                  <span className="dsp-bar-count">{b.count}</span>
                </div>
              ))}
            </div>

            {/* Insight */}
            <div className="dsp-insight" style={{ borderLeftColor: division.color }}>
              {st.insight}
            </div>
          </div>
        ))}

        {/* Explore button */}
        <div className="dsp-footer">
          <button className="dsp-explore-btn" onClick={explore}
            style={{ borderColor: division.color, color: division.color }}>
            Explore Programmes
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Left Nav panel ───────────────────────────────────────────────────────── */
export default function LeftSideNav({ onSelectDivision, onSelectProgramme }) {
  const [open,      setOpen]      = useState(false);
  const [activeDiv, setActiveDiv] = useState(null);
  const [showWheel, setShowWheel] = useState(false);
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

  return (
    <>
      <div className="lsnav-panel" ref={panelRef}>
        <button className={`lsnav-tab${open ? ' lsnav-tab--open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close navigation' : 'Open division navigation'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {open ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
          </svg>
        </button>

        <div className="lsnav-inner">
          <div className="lsnav-header-banner">
            <img src="/banners/banner1.jpeg" className="lsnav-banner-img" alt="" />
            <div className="lsnav-header-content">
              <div className="lsnav-heading-row">
                <img src="/nhm-logo.png" className="lsnav-heading-logo" alt="NHM" />
                <span className="lsnav-heading-divider" />
                <p className="lsnav-heading">NHM Divisions</p>
              </div>
              <p className="lsnav-sub">Select a division to explore</p>
            </div>
          </div>

          <div className="lsnav-divlist">
            {DIVISIONS.map((div, i) => (
              <button key={div.id} ref={el => rowRefs.current[i] = el}
                className="lsnav-div-row" style={{ '--dc': div.color, '--db': div.light }}
                onClick={() => { setOpen(false); setShowWheel(false); setActiveDiv(div); }}>
                <span className="lsnav-div-icon-bg">
                  <img src={`/sidebar/${div.short}.png`} alt="" />
                </span>
                <span className="lsnav-div-text">
                  <span className="lsnav-div-short">{div.short}</span>
                  <span className="lsnav-div-name">{div.name}</span>
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>

          <p className="lsnav-footer">NHM Arunachal Pradesh · FY 2025-26</p>
        </div>
      </div>

      {open && <div className="lsnav-backdrop" onClick={() => setOpen(false)} />}

      {activeDiv && !showWheel && (
        <DivisionStoryPage
          division={activeDiv}
          onClose={() => setActiveDiv(null)}
          onExploreProgrammes={() => setShowWheel(true)}
        />
      )}

      {activeDiv && showWheel && (
        <ProgrammeWheelPage
          division={activeDiv}
          divData={getDivData(activeDiv.id)}
          onSelect={handleWheelSelect}
          onClose={() => { setActiveDiv(null); setShowWheel(false); }}
        />
      )}
    </>
  );
}
