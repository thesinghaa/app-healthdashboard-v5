/* ═══════════════════════════════════════════════════════════════════════════
   LeftSideNav.jsx
   Slide-in left panel — 5 NHM division shortcuts + persona picker popup.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const DIVISIONS = [
  { id: 'rch',  short: 'RCH',  name: 'Reproductive & Child Health',   color: '#4F8EF7', bg: '#EBF3FF' },
  { id: 'ndcp', short: 'NDCP', name: 'National Disease Control',       color: '#F7B23B', bg: '#FFFBEB' },
  { id: 'ncd',  short: 'NCD',  name: 'Non-Communicable Diseases',      color: '#9B6FEB', bg: '#F3EEFF' },
  { id: 'hss',  short: 'HSS',  name: 'Health Systems Strengthening',   color: '#2DD4BF', bg: '#ECFDF5' },
  { id: 'hrh',  short: 'HRH',  name: 'Human Resources for Health',     color: '#F7614F', bg: '#FFF1EE' },
];

/* ── Per-division background icons ────────────────────────────────────────── */
const LSNAV_ICONS = {
  rch: (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#DBEAFE"/>
      <circle cx="18" cy="14" r="7" fill="#1D4ED8"/>
      <path d="M8 50 Q8 31 13 27 L18 25 L25 26 Q30 29 31 37 L31 50Z" fill="#1B6FF5"/>
      <ellipse cx="26" cy="35" rx="6" ry="5" fill="#93C5FD"/>
      <circle cx="39" cy="21" r="5.5" fill="#BFDBFE"/>
      <circle cx="39" cy="21" r="3.5" fill="#1D4ED8"/>
      <path d="M33 46 Q33 34 36 31 L39 29 L42 31 Q45 34 45 46Z" fill="#3B82F6"/>
    </svg>
  ),
  ndcp: (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#FEF3C7"/>
      <rect x="25" y="9" width="6" height="14" rx="3" fill="#92400E"/>
      <path d="M25 20 Q11 19 9 30 Q7 41 14 45 Q18 47 22 43 L24 36 L25 20Z" fill="#D97706"/>
      <path d="M31 20 Q45 19 47 30 Q49 41 42 45 Q38 47 34 43 L32 36 L31 20Z" fill="#D97706"/>
      <path d="M15 34 Q17 38 21 38" stroke="#FEF3C7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M41 34 Q39 38 35 38" stroke="#FEF3C7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <circle cx="16" cy="27" r="3.5" fill="#92400E" opacity="0.55"/>
      <circle cx="40" cy="25" r="3"   fill="#92400E" opacity="0.55"/>
    </svg>
  ),
  ncd: (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#EDE9FE"/>
      <path d="M28 43 C28 43 7 30 7 17 C7 11 12 7 17 7 C21 7 25 10 28 14 C31 10 35 7 39 7 C44 7 49 11 49 17 C49 30 28 43 28 43Z" fill="#7C3AED"/>
      <polyline points="9,26 15,26 18,18 22,34 26,23 29,28 32,21 36,26 47,26" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  hss: (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#CCFBF1"/>
      <rect x="9"  y="19" width="38" height="28" rx="2" fill="#0F9B82"/>
      <rect x="14" y="12" width="28" height="9"  rx="1.5" fill="#065F46"/>
      <rect x="23" y="25" width="10" height="3"  rx="1.5" fill="white"/>
      <rect x="26" y="21" width="4"  height="11" rx="2"   fill="white"/>
      <rect x="13" y="32" width="9"  height="8"  rx="1.5" fill="#CCFBF1"/>
      <rect x="34" y="32" width="9"  height="8"  rx="1.5" fill="#CCFBF1"/>
      <rect x="23" y="39" width="10" height="8"  rx="1"   fill="#065F46"/>
      <rect x="27" y="6"  width="2"  height="8"  rx="1"   fill="#065F46"/>
      <path d="M29 7 L35 10 L29 13Z" fill="#14B8A6"/>
    </svg>
  ),
  hrh: (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#FEE2E2"/>
      <path d="M13 52 Q13 35 17 31 L23 29 L28 28 L33 29 L39 31 Q43 35 43 52Z" fill="white"/>
      <path d="M19 31 L19 46" stroke="#DC4B2A" strokeWidth="1.8"/>
      <path d="M37 31 L37 46" stroke="#DC4B2A" strokeWidth="1.8"/>
      <path d="M19 31 L23 29 L28 28 L33 29 L37 31 L28 38Z" fill="#DC4B2A"/>
      <circle cx="28" cy="17" r="9.5" fill="#FECACA"/>
      <circle cx="28" cy="17" r="7.5" fill="#FCA5A5"/>
      <path d="M19 13 Q21 8 28 8 Q35 8 37 13 Q35 7 28 7 Q21 7 19 13Z" fill="#9B1C1C"/>
      <circle cx="24" cy="16" r="1.8" fill="#9B1C1C"/>
      <circle cx="32" cy="16" r="1.8" fill="#9B1C1C"/>
    </svg>
  ),
};

const PERSONAS = [
  {
    id: 'citizen',
    label: 'Citizen',
    desc: 'Public health outcomes & district data',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="7" r="4"/>
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    id: 'officer',
    label: 'Programme Officer',
    desc: 'KD targets, HMIS indicators & monitoring',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M9 21V9"/>
        <path d="M7 13h2M7 17h2M13 13h4M13 17h4"/>
      </svg>
    ),
  },
  {
    id: 'admin',
    label: 'Administrative Officer',
    desc: 'Division oversight, reports & governance',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    ),
  },
];

/* ── Persona Modal ─────────────────────────────────────────────────────────── */
function PersonaModal({ division, onClose, onSelect }) {
  const overlayRef = useRef(null);
  const cardRef    = useRef(null);

  useEffect(() => {
    gsap.fromTo(overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.2 }
    );
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 24, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'power3.out' }
    );
  }, []);

  function close() {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18 });
    gsap.to(cardRef.current, { opacity: 0, y: 16, duration: 0.18, onComplete: onClose });
  }

  function handleSelect(persona) {
    onSelect(division, persona);
    close();
  }

  return (
    <div className="lsnav-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && close()}>
      <div className="lsnav-modal" ref={cardRef}>

        {/* Header */}
        <div className="lsnav-modal-header" style={{ borderColor: division.color }}>
          <span className="lsnav-modal-div-chip" style={{ background: division.bg, color: division.color }}>
            {division.short}
          </span>
          <div className="lsnav-modal-heading">
            <p className="lsnav-modal-title">Select your role</p>
            <p className="lsnav-modal-sub">{division.name}</p>
          </div>
          <button className="lsnav-modal-close" onClick={close}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Persona cards */}
        <div className="lsnav-persona-list">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              className="lsnav-persona-card"
              style={{ '--p-color': division.color, '--p-bg': division.bg }}
              onClick={() => handleSelect(p)}
            >
              <span className="lsnav-persona-icon" style={{ color: division.color }}>
                {p.icon}
              </span>
              <span className="lsnav-persona-body">
                <span className="lsnav-persona-label">{p.label}</span>
                <span className="lsnav-persona-desc">{p.desc}</span>
              </span>
              <svg className="lsnav-persona-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */
export default function LeftSideNav({ onSelectDivision }) {
  const [open,          setOpen]          = useState(false);
  const [activeDivision, setActiveDivision] = useState(null);
  const panelRef   = useRef(null);
  const rowRefs    = useRef([]);

  /* force off-screen on mount before any animation */
  useEffect(() => {
    gsap.set(panelRef.current, { x: -280 });
  }, []);

  /* slide panel in/out */
  useEffect(() => {
    if (!panelRef.current) return;
    if (open) {
      gsap.to(panelRef.current, { x: 0, duration: 0.38, ease: 'power3.out' });
      gsap.fromTo(
        rowRefs.current.filter(Boolean),
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.07, ease: 'power2.out', delay: 0.1 }
      );
    } else {
      gsap.to(panelRef.current, { x: -280, duration: 0.3, ease: 'power2.in' });
    }
  }, [open]);

  function handlePersonaSelect(division, persona) {
    setOpen(false);
    if (onSelectDivision) {
      /* find the matching division object from programs.js */
      onSelectDivision({ id: division.id, fullName: division.name, label: division.short });
    }
  }

  return (
    <>
      {/* ── Panel ── */}
      <div className="lsnav-panel" ref={panelRef}>

        {/* Toggle tab — visible at left edge when panel is closed */}
        <button
          className={`lsnav-tab${open ? ' lsnav-tab--open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close navigation' : 'Open division navigation'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {open
              ? <path d="M15 18l-6-6 6-6"/>
              : <path d="M9 18l6-6-6-6"/>
            }
          </svg>
        </button>

        {/* Panel inner content */}
        <div className="lsnav-inner">

          {/* Header with banner */}
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
              <button
                key={div.id}
                ref={el => rowRefs.current[i] = el}
                className="lsnav-div-row"
                style={{ '--dc': div.color, '--db': div.bg }}
                onClick={() => { setActiveDivision(div); }}
              >
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

      {/* ── Backdrop ── */}
      {open && (
        <div className="lsnav-backdrop" onClick={() => setOpen(false)} />
      )}

      {/* ── Persona modal ── */}
      {activeDivision && (
        <PersonaModal
          division={activeDivision}
          onClose={() => setActiveDivision(null)}
          onSelect={handlePersonaSelect}
        />
      )}
    </>
  );
}
