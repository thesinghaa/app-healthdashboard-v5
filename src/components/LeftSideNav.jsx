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
      <span className="wpg-prog-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICON_PATHS[iconKey] || ''}/>
        </svg>
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

  const programs = divData?.programs || [];
  const n        = programs.length;
  const half     = Math.floor(n / 2);
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

  /* lock body scroll while overlay is visible — do NOT touch .v4l-root
     (setting overflow on it creates a stacking context that clips the fixed panel) */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    gsap.set(panelRef.current, { x: 400 });
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
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' },
        '-=0.35');
    if (rightRef.current?.children)
      tl.fromTo(Array.from(rightRef.current.children),
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' },
        '-=0.45');
  }, []);

  /* on select: fade columns, shift wheel left, slide panel in */
  useEffect(() => {
    if (!panelRef.current) return;
    if (selected) {
      /* fade out side columns and footer */
      gsap.to([leftRef.current, rightRef.current],
        { opacity: 0, duration: 0.22, ease: 'power2.in' });
      gsap.to(footerRef.current,
        { opacity: 0, y: 8, duration: 0.22, ease: 'power2.in' });
      /* header + wheel both shift left together — header stays centred above wheel */
      gsap.to([headerRef.current, wheelRef.current],
        { x: -210, duration: 0.42, ease: 'power3.out', delay: 0.05 });
      /* KD panel slides in from right */
      gsap.to(panelRef.current,
        { x: 0, duration: 0.40, ease: 'power3.out', delay: 0.05 });
    } else {
      /* reverse everything */
      gsap.to([headerRef.current, wheelRef.current],
        { x: 0, duration: 0.30, ease: 'power3.out' });
      gsap.to(panelRef.current,
        { x: 420, duration: 0.28, ease: 'power2.in' });
      gsap.to([leftRef.current, rightRef.current],
        { opacity: 1, duration: 0.30, ease: 'power2.out', delay: 0.15 });
      gsap.to(footerRef.current,
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', delay: 0.15 });
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

      {/* ── Main 3-column ── */}
      <main className="wpg-main">

        {/* Left column */}
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
                  <g transform={`translate(${ix-14},${iy-14})`} style={{ pointerEvents: 'none' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={ICON_PATHS[iconKey] || ''}/>
                    </svg>
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

        {/* Right column */}
        <div className="wpg-col wpg-col--right" ref={rightRef}>
          {rightProgs.map(prog => (
            <ProgItem key={prog.id} prog={prog} color={division.color}
              hovered={hovered} setHovered={setHovered}
              onSelect={handleSelect} side="right" />
          ))}
        </div>

      </main>

      {/* KD panel — slides in from right, wheel shifts left */}
      <div className="wpg-kd-panel" ref={panelRef}
        style={{ '--dc': division.color, '--dl': division.light }}>
        {selected && (() => {
          const kdList = KD_TREE[division.id]?.programmes?.[selected.id]?.kds || [];
          return (
            <>
              {/* panel header */}
              <div className="wpg-kd-hdr">
                <div className="wpg-kd-hdr-text">
                  <span className="wpg-kd-hdr-chip">{division.short}</span>
                  <h2 className="wpg-kd-prog-title">{selected.name}</h2>
                  <p className="wpg-kd-count">{kdList.length} Key Deliverables</p>
                </div>
                <button className="wpg-kd-close-btn" onClick={handlePanelClose} aria-label="Close panel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* section bar */}
              <div className="wpg-kd-section-bar">
                <span>Key Deliverables</span>
                <span className="wpg-kd-section-count">{kdList.length}</span>
              </div>

              {/* indicator table */}
              <div className="wpg-kd-table-wrap">
                {kdList.length === 0 ? (
                  <p className="wpg-kd-empty">No indicators available for this programme.</p>
                ) : (
                  <div className="wpg-kd-table-scroll">
                  <table className="wpg-kd-table">
                    <thead>
                      <tr>
                        <th className="wpg-kd-th wpg-kd-th--no">#</th>
                        <th className="wpg-kd-th wpg-kd-th--indicator">Indicator</th>
                        <th className="wpg-kd-th wpg-kd-th--achvd">Achieved</th>
                        <th className="wpg-kd-th wpg-kd-th--target">Target</th>
                        <th className="wpg-kd-th wpg-kd-th--status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kdList.map(kd => {
                        const st = kdStatus(kd);
                        const statusLabel = st === 'achieved' ? 'On Track' : st === 'close' ? 'Caution' : st === 'gap' ? 'Gap' : 'N/A';
                        return (
                          <tr key={kd.no} className={`wpg-kd-tr wpg-kd-tr--${st}`}>
                            <td className="wpg-kd-td wpg-kd-td--no">{kd.no}</td>
                            <td className="wpg-kd-td wpg-kd-td--indicator">{kd.indicator}</td>
                            <td className="wpg-kd-td wpg-kd-td--achvd">{kd.achievedLabel ?? kd.achievement ?? '—'}</td>
                            <td className="wpg-kd-td wpg-kd-td--target">{kd.targetLabel ?? kd.target ?? '—'}</td>
                            <td className="wpg-kd-td wpg-kd-td--status">
                              <span className={`wpg-kd-badge wpg-kd-badge--${st}`}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
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
            </>
          );
        })()}
      </div>

      {/* ── Footer hint ── */}
      <footer className="wpg-footer" ref={footerRef}>
        Click a wheel segment to view Key Deliverables &nbsp;·&nbsp; Click the centre to explore the full division
      </footer>
    </div>
  );
}

/* ── Left Nav panel ───────────────────────────────────────────────────────── */
export default function LeftSideNav({ onSelectDivision, onSelectProgramme }) {
  const [open,      setOpen]      = useState(false);
  const [activeDiv, setActiveDiv] = useState(null);
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
                onClick={() => { setOpen(false); setActiveDiv(div); }}>
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

      {activeDiv && (
        <ProgrammeWheelPage
          division={activeDiv}
          divData={getDivData(activeDiv.id)}
          onSelect={handleWheelSelect}
          onClose={() => setActiveDiv(null)}
        />
      )}
    </>
  );
}
