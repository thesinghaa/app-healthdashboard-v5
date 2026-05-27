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
          <p className="lsnav-heading">NHM Divisions</p>
          <p className="lsnav-sub">Select a division to explore</p>

          <div className="lsnav-divlist">
            {DIVISIONS.map((div, i) => (
              <button
                key={div.id}
                ref={el => rowRefs.current[i] = el}
                className="lsnav-div-row"
                style={{ '--dc': div.color, '--db': div.bg }}
                onClick={() => { setActiveDivision(div); }}
              >
                <span className="lsnav-div-dot" />
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
