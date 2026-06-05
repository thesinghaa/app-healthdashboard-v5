/* ═══════════════════════════════════════════════════════════════════════════
   LandingPage.jsx — V4 redesign
   Light-mode scrollable: Programme Overview → NHM Flow (Sankey) → Alerts
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useRef, lazy, Suspense, createContext, useContext, memo } from 'react';
import { gsap } from 'gsap';
import { DIVISIONS } from '../data/programs';
import { KD_TREE } from '../data/kdData';
import ThemeToggle from '../components/ThemeToggle';
import ReportModal from '../components/ReportModal';
import DivisionAccordion from '../components/DivisionAccordion';
import LeftSideNav from '../components/LeftSideNav';
import { getDivisionStats } from '../data/getDivisionStats';
import '../styles/landing-v4.css';

const NHMSankey              = lazy(() => import('../components/NHMSankey'));
const DistrictMap            = lazy(() => import('../components/DistrictMap'));
const ProgrammeProgressChart = lazy(() => import('../components/ProgrammeProgressChart'));


/* ── Division nav bar data ──────────────────────────────────────────────── */
const DIV_NAV = [
  { id: 'rch',  short: 'RCH',  name: 'Reproductive & Child Health',  color: '#1B6FF5', light: '#DBEAFE' },
  { id: 'ndcp', short: 'NDCP', name: 'National Disease Control Programmes', color: '#D97706', light: '#FEF3C7' },
  { id: 'ncd',  short: 'NCD',  name: 'Non-Communicable Diseases',     color: '#7C3AED', light: '#EDE9FE' },
  { id: 'hss',  short: 'HSS',  name: 'Health Systems Strengthening',  color: '#0F9B82', light: '#CCFBF1' },
  { id: 'hrh',  short: 'HRH',  name: 'Human Resources for Health',    color: '#DC4B2A', light: '#FEE2E2' },
];

/* ── Abbreviation hover context ─────────────────────────────────────────── */
const AbbrevCtx = createContext({ hovered: null, hoveredEl: null, setAbbrev: () => {} });

function AbbrevProvider({ children }) {
  const [hovered,   setHovered]   = useState(null);
  const [hoveredEl, setHoveredEl] = useState(null);

  const setAbbrev = (abbr) => {
    setHovered(abbr ?? null);
    setHoveredEl(null);
  };

  useEffect(() => {
    const onOver = e => {
      /* Ignore events from the legend itself — prevents scroll feedback loop
         where scrollIntoView brings a legend item under the cursor which fires
         another mouseover → another scrollIntoView → infinite drift.        */
      if (e.target.closest('.abbrev-legend')) return;
      /* Ignore synthetic (programmatic) events — only real user gestures     */
      if (!e.isTrusted) return;
      const el = e.target.closest('[data-abbr]');
      setHovered(el?.dataset.abbr ?? null);
      setHoveredEl(el ?? null);
    };
    /* Custom event fired by Sankey / other SVG components */
    const onCustom = e => {
      setHovered(e.detail?.abbr ?? null);
      setHoveredEl(null);
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('abbrev:set', onCustom);
    return () => {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('abbrev:set', onCustom);
    };
  }, []);
  return <AbbrevCtx.Provider value={{ hovered, hoveredEl, setAbbrev }}>{children}</AbbrevCtx.Provider>;
}

const ABBREV = {
  statStrip: [
    ['NHM',     'National Health Mission'],
    ['RCH',     'Reproductive & Child Health'],
    ['NDCP',    'National Disease Control Programmes'],
    ['NCD',     'Non-Communicable Diseases'],
    ['HSS',     'Health Systems Strengthening'],
    ['HRH',     'Human Resources for Health'],
    ['MO-MBBS', 'Medical Officer (MBBS)'],
    ['IPHS',    'Indian Public Health Standards'],
    ['DEIC',    'District Early Intervention Centre'],
    ['NQAS',    'National Quality Assurance Standards'],
    ['API',     'Annual Parasitic Incidence'],
    ['ICHH',    'Integrated Community Health Hub'],
  ],
  map: [
    ['FY',   'Financial Year'],
    ['Pop.', 'Population'],
    ['Avg',  'Average'],
    ['Est.', 'Estimate'],
  ],
  sankey: [
    ['JSY',      'Janani Suraksha Yojana'],
    ['CAC',      'Comprehensive Abortion Care'],
    ['PCPNDT',   'Pre-Conception & Pre-Natal Diagnostic Techniques'],
    ['NVHCP',    'National Viral Hepatitis Control Programme'],
    ['NLEP',     'National Leprosy Eradication Programme'],
    ['NCVBDCP',  'National Centre for Vector Borne Diseases Control Programme'],
    ['IDSP',     'Integrated Disease Surveillance Programme'],
    ['NSCAEM',   'National Sickle Cell Anaemia Elimination Mission'],
    ['NP-NCD',   'National Programme for Non-Communicable Diseases'],
    ['PMNDP',    'Pradhan Mantri National Dialysis Programme'],
    ['NPPC',     'National Programme for Prevention & Control of Cancer, Diabetes, CVD & Stroke'],
    ['NMHP',     'National Mental Health Programme'],
    ['NPHCE',    'National Programme for Health Care of the Elderly'],
    ['NPCBVI',   'National Programme for Control of Blindness & Visual Impairment'],
    ['NPPCD',    'National Programme for Prevention & Control of Deafness'],
    ['NOHP',     'National Oral Health Programme'],
    ['NIDDCP',   'National Iodine Deficiency Disorders Control Programme'],
    ['NTCP',     'National Tobacco Control Programme'],
    ['NPCCHH',   'National Programme on Climate Change & Human Health'],
    ['MPW',      'Multi-Purpose Worker'],
    ['CHO',      'Community Health Officer'],
    ['PM-ABHIM', 'Pradhan Mantri Ayushman Bharat Health Infrastructure Mission'],
    ['KD',       'Key Deliverable'],
  ],
  chart: [
    ['ANC',  'Antenatal Care'],
    ['HMIS', 'Health Management Information System'],
    ['FY',   'Financial Year'],
    ['RCH',  'Reproductive & Child Health'],
  ],
  updates: [
    ['HMIS', 'Health Management Information System'],
    ['NPCC', 'National Programme for Prevention & Control of Cancer'],
    ['NTEP', 'National Tuberculosis Elimination Programme'],
    ['IEC',  'Information, Education & Communication'],
    ['NLEP', 'National Leprosy Eradication Programme'],
    ['HRH',  'Human Resources for Health'],
  ],
};

/* ── Flat lookup of every abbreviation (all sections merged) ─────────────── */
const ALL_ABBREVS = Object.fromEntries(Object.values(ABBREV).flatMap(a => a));

/* ── Regex that matches any abbreviation as a whole word (longest first) ─── */
const ABBREV_PAT = new RegExp(
  `\\b(${
    Object.keys(ALL_ABBREVS)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length)
      .join('|')
  })\\b`,
  'g',
);

/* ── Mini label anchored below the hovered element ──────────────────────── */
function AbbrevMiniLabel() {
  const { hovered, hoveredEl } = useContext(AbbrevCtx);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!hoveredEl) { setPos(null); return; }
    const update = () => {
      const r = hoveredEl.getBoundingClientRect();
      setPos({ x: (r.left + r.right) / 2, y: r.bottom });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [hoveredEl]);

  if (!hovered || !pos || !ALL_ABBREVS[hovered]) return null;
  return (
    <div className="abbrev-mini-label" style={{ left: pos.x, top: pos.y + 4 }}>
      {ALL_ABBREVS[hovered]}
    </div>
  );
}

/* ── Legend strip — active item pulses when its abbreviation is hovered ───── */
function AbbrevLegend({ items }) {
  const { hovered } = useContext(AbbrevCtx);

  return (
    <div className="abbrev-legend">
      {items.map(([short, full]) => {
        const isActive = hovered === short;
        return (
          <span
            key={short}
            data-abbr={short}
            className={`abbrev-legend-item${isActive ? ' abbrev-legend-item--active' : ''}`}
          >
            <span className="abbrev-legend-star">★</span>
            <strong className="abbrev-legend-short">{short}</strong>
            <span className="abbrev-legend-dash">—</span>
            <span className="abbrev-legend-full">{full}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ── MarkAbbrev — scans prose, renders text normally, footnotes at end ─────── */
function MarkAbbrev({ text }) {
  const parts = [];
  const found = []; /* unique abbrevs in order of appearance */
  let last = 0;
  ABBREV_PAT.lastIndex = 0;
  let m;
  while ((m = ABBREV_PAT.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ abbr: m[0] });
    if (!found.includes(m[0])) found.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((t, i) =>
        typeof t === 'string'
          ? t
          : <span key={i} data-abbr={t.abbr} className="abbrev-mark">{t.abbr}</span>
      )}
      {found.length > 0 && (
        <span className="abbrev-footnote">
          {found.map(abbr => (
            <span key={abbr} className="abbrev-fn-item">
              <span className="abbrev-fn-star">*</span>
              <span className="abbrev-fn-abbr">{abbr}</span>
              <span className="abbrev-fn-dash">—</span>
              <span className="abbrev-fn-full">{ALL_ABBREVS[abbr]}</span>
            </span>
          ))}
        </span>
      )}
    </>
  );
}

/* ── Status helpers ─────────────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const r = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return r <= 1 ? 'achieved' : r <= 1.33 ? 'close' : 'gap';
  return r >= 1 ? 'achieved' : r >= 0.75 ? 'close' : 'gap';
}

function getDivBreakdown(divId) {
  const tree = KD_TREE[divId];
  if (!tree) return { achieved: 0, close: 0, gap: 0, neutral: 0, total: 0 };
  let achieved = 0, close = 0, gap = 0, neutral = 0;
  Object.values(tree.programmes || {}).forEach(p =>
    (p.kds || []).forEach(kd => {
      const s = kdStatus(kd);
      if (s === 'achieved') achieved++;
      else if (s === 'close') close++;
      else if (s === 'gap') gap++;
      else neutral++;
    })
  );
  return { achieved, close, gap, neutral, total: achieved + close + gap + neutral };
}

function getTopGaps(n = 5) {
  const all = [];
  DIVISIONS.forEach(div => {
    const tree = KD_TREE[div.id];
    if (!tree) return;
    Object.entries(tree.programmes || {}).forEach(([progId, prog]) => {
      (prog.kds || []).forEach(kd => {
        if (kdStatus(kd) !== 'gap') return;
        const r = kd.target > 0 ? kd.achievement / kd.target : 1;
        const deficit = kd.lowerIsBetter ? r - 1 : 1 - r;
        all.push({ ...kd, divId: div.id, divLabel: div.label, progName: prog.name || progId, deficit });
      });
    });
  });
  return all.sort((a, b) => b.deficit - a.deficit).slice(0, n);
}

/* ── Division accent colours ─────────────────────────────────────────────── */
const DIV_COLORS = {
  rch:  { main: '#4F8EF7', light: '#EBF3FF', text: '#1D4ED8' },
  ndcp: { main: '#F7B23B', light: '#FFFBEB', text: '#92400E' },
  ncd:  { main: '#9B6FEB', light: '#F3EEFF', text: '#5B21B6' },
  hss:  { main: '#2DD4BF', light: '#ECFDF5', text: '#065F46' },
  hrh:  { main: '#F7614F', light: '#FFF1EE', text: '#9B1C1C' },
};

/* ── Division SVG icons (3 per division for the illustration zone) ─────── */
const DIV_ICONS = {
  rch: [
    /* Mother & child */
    <svg key="rc1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="10" r="5" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 30 C7 22 10 18 15 18 C20 18 23 22 23 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="19" cy="26" rx="3.5" ry="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="29" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M24 33 C24 28 26 26 29 26 C32 26 34 28 34 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    /* Vaccine syringe */
    <svg key="rc2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="17" width="22" height="7" rx="3.5" stroke="currentColor" strokeWidth="2"/>
      <line x1="32" y1="20.5" x2="38" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="2" y1="20.5" x2="10" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="13" x2="16" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="13" x2="20" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="13" x2="24" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="24" x2="20" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    /* Heartbeat baby */
    <svg key="rc3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.6"/>
    </svg>,
  ],
  ndcp: [
    /* Microscope */
    <svg key="nd1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="6" width="8" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="20" y1="18" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 28 Q15 24 20 24 Q25 24 28 28" stroke="currentColor" strokeWidth="2"/>
      <line x1="10" y1="34" x2="30" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="12" r="2" fill="currentColor" opacity="0.4"/>
    </svg>,
    /* Lungs / TB */
    <svg key="nd2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="6" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 14 C20 14 10 14 8 20 C6 26 8 34 14 34 C17 34 20 30 20 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 14 C20 14 30 14 32 20 C34 26 32 34 26 34 C23 34 20 30 20 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    /* Test tube */
    <svg key="nd3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8 L14 28 Q14 36 20 36 Q26 36 26 28 L26 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="12" x2="28" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 26 Q17 28 20 26 Q23 24 26 26" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>,
  ],
  ncd: [
    /* Heart ECG */
    <svg key="nc1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 32 C20 32 6 24 6 14 C6 9 10 6 14 6 C17 6 20 9 20 9 C20 9 23 6 26 6 C30 6 34 9 34 14 C34 24 20 32 20 32Z" stroke="currentColor" strokeWidth="2"/>
      <polyline points="8,20 12,20 14,14 17,26 20,18 23,22 26,20 32,20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    /* Blood pressure meter */
    <svg key="nc2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 28 A14 14 0 0 1 32 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="28" x2="26" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="28" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="20" cy="28" r="2" fill="currentColor"/>
      <line x1="11" y1="28" x2="10" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    /* Eye */
    <svg key="nc3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20 C4 20 10 10 20 10 C30 10 36 20 36 20 C36 20 30 30 20 30 C10 30 4 20 4 20Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="20" cy="20" r="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="21" cy="19" r="2" fill="currentColor" opacity="0.5"/>
    </svg>,
  ],
  hss: [
    /* Hospital building */
    <svg key="hs1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
      <line x1="8" y1="36" x2="32" y2="36" stroke="currentColor" strokeWidth="2"/>
      <line x1="20" y1="18" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="15" y1="23" x2="25" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="16" y="6" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>,
    /* Pills */
    <svg key="hs2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="14" width="28" height="12" rx="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="20" y1="14" x2="20" y2="26" stroke="currentColor" strokeWidth="1.5"/>
      <ellipse cx="28" cy="28" rx="7" ry="5" stroke="currentColor" strokeWidth="1.5" transform="rotate(-30 28 28)"/>
    </svg>,
    /* Ambulance */
    <svg key="hs3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="14" width="28" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M32 18 L36 22 L36 30 L32 30" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="12" cy="32" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="28" cy="32" r="4" stroke="currentColor" strokeWidth="2"/>
      <line x1="10" y1="20" x2="10" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="23" x2="13" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
  ],
  hrh: [
    /* Stethoscope */
    <svg key="hr1" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 8 L10 20 C10 27 16 32 22 32 C28 32 32 27 32 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 8 L16 20 C16 27 16 32 22 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="32" cy="18" r="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="18" r="2" fill="currentColor" opacity="0.4"/>
    </svg>,
    /* Doctor figure */
    <svg key="hr2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="10" r="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 34 C10 24 13 20 20 20 C27 20 30 24 30 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="24" x2="20" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="27" x2="23" y2="27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    /* Clipboard */
    <svg key="hr3" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="20" height="26" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="16" y="6" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="14" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="25" x2="26" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="30" x2="21" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
  ],
};

/* positions for each of the 3 icons within a zone (top, left, bottom) */
const ICON_POSITIONS = [
  { top: '8%',  left: '15%' },
  { top: '10%', left: '58%' },
  { top: '48%', left: '35%' },
];

const SC3D_ACCENTS = {
  rch:  '#4F8EF7',
  ndcp: '#F7B23B',
  ncd:  '#9B6FEB',
  hss:  '#2DD4BF',
  hrh:  '#F7614F',
};

/* ── Computed summary stats ──────────────────────────────────────────────── */
function useDivStats() {
  return useMemo(() => {
    return DIVISIONS.map(div => {
      const brk = getDivBreakdown(div.id);
      const onTrackPct = brk.total > 0 ? Math.round((brk.achieved / brk.total) * 100) : 0;
      return { div, brk, onTrackPct };
    });
  }, []);
}

/* ── Reveal on scroll hook ───────────────────────────────────────────────── */
function useReveal(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('v4l-in'); obs.disconnect(); } },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function genCaptcha() {
  let text = '';
  for (let i = 0; i < 6; i++) text += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  return text;
}

function CaptchaCanvas({ text }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // Background
    ctx.fillStyle = '#f0f4ff';
    ctx.fillRect(0, 0, W, H);
    // Noise dots
    for (let i = 0; i < 80; i++) {
      ctx.beginPath();
      ctx.arc(Math.random()*W, Math.random()*H, Math.random()*1.5+0.3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${Math.random()*100|0},${Math.random()*100|0},${Math.random()*200|0},0.5)`;
      ctx.fill();
    }
    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random()*W, Math.random()*H);
      ctx.lineTo(Math.random()*W, Math.random()*H);
      ctx.strokeStyle = `rgba(${Math.random()*150|0},${Math.random()*150|0},${Math.random()*220|0},0.4)`;
      ctx.lineWidth = Math.random()*1.2+0.5;
      ctx.stroke();
    }
    // Characters
    const charW = W / (text.length + 1);
    const fonts = ['Arial','Georgia','Courier New','Verdana'];
    text.split('').forEach((ch, i) => {
      ctx.save();
      const x = charW * (i + 0.8) + Math.random()*4-2;
      const y = H/2 + Math.random()*6-3;
      ctx.translate(x, y);
      ctx.rotate((Math.random()-0.5)*0.45);
      ctx.font = `bold ${24+Math.random()*6|0}px ${fonts[i%fonts.length]}`;
      const r = 20+Math.random()*80|0, g = 20+Math.random()*60|0, b = 80+Math.random()*120|0;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }, [text]);
  return <canvas ref={canvasRef} width={200} height={56} style={{ borderRadius:'8px', display:'block' }} />;
}

/* ── Platform / biometric type detection ────────────────────────────────── */
function detectBioType() {
  const plat = (navigator.platform || '').toLowerCase();
  const ua   = (navigator.userAgent || '').toLowerCase();
  if (/mac|iphone|ipad|ipod/.test(plat) || /macintosh/.test(ua)) return 'fingerprint';
  if (/win/.test(plat) || /windows/.test(ua)) return 'face';
  return 'fingerprint';
}

/* ── Bio sounds via Web Audio API (no external files) ────────────────────── */
function playBioSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'touch-id') {
      /* Mac Touch ID: two soft click tones */
      [0, 0.10].forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 2200;
        osc.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = i === 0 ? 820 : 1100;
        gain.gain.setValueAtTime(0, ctx.currentTime + t);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + t + 0.009);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.09);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.12);
      });
    } else if (type === 'face-id') {
      /* Windows Face ID: soft ascending sweep */
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      /* Error: descending double tone */
      [0, 0.14].forEach((t, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = i === 0 ? 580 : 380;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.16);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.2);
      });
    }
  } catch(_) { /* silent fail on restricted AudioContext */ }
}

/* ── WebAuthn helpers ────────────────────────────────────────────────────── */
const WEBAUTHN_SUPPORTED = typeof window !== 'undefined' && !!window.PublicKeyCredential;

async function registerBiometric() {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'PIF Health Dashboard', id: location.hostname },
      user: { id: new Uint8Array(16), name: 'pif-admin', displayName: 'PIF Admin' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' },
      timeout: 60000,
    }
  });
  const id = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
  localStorage.setItem('bio_cred', JSON.stringify({ id }));
  return id;
}

async function authenticateBiometric() {
  const stored = JSON.parse(localStorage.getItem('bio_cred') || '{}');
  const raw = Uint8Array.from(atob(stored.id), c => c.charCodeAt(0));
  await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials: [{ id: raw, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    }
  });
}

/* ── BiometricModal ──────────────────────────────────────────────────────── */
function BiometricModal({ status, onUsePassword, onClose }) {
  const [bioType] = useState(() => detectBioType()); /* 'fingerprint' | 'face' */
  const isScanning = status === 'scanning';
  const isSuccess  = status === 'success';
  const isError    = status === 'error';

  /* play sound on status change */
  useEffect(() => {
    if (status === 'success') playBioSound(bioType === 'fingerprint' ? 'touch-id' : 'face-id');
    if (status === 'error')   playBioSound('error');
  }, [status, bioType]);

  const statusText = {
    idle:     'Preparing biometric…',
    scanning: bioType === 'fingerprint' ? 'Place finger on Touch ID sensor' : 'Look directly at the camera',
    success:  'Identity verified',
    error:    'Biometric failed. Try again or use password.',
  }[status] || '';

  const stateClass = isScanning ? ' v5-bio--scanning' : isSuccess ? ' v5-bio--success' : isError ? ' v5-bio--error' : '';

  return (
    <>
      <div className="v5-login-backdrop" onClick={onClose || undefined} />
      <div className={`v5-bio-modal v5-bio-modal--${bioType}`} style={{ zIndex: 10001 }}>
        <img src="/ap-emblem.svg" alt="AP" className="v5-bio-emblem" />
        <h2 className="v5-bio-title">{bioType === 'fingerprint' ? 'Touch ID' : 'Face ID'}</h2>

        <div className="v5-bio-icon-single">
          {bioType === 'fingerprint' ? (
            /* ── Fingerprint ── */
            <div className={`v5-bio-fp-wrap${stateClass}`}>
              <div className="v5-bio-fp-ring" />
              <div className="v5-bio-fp-ring v5-bio-fp-ring--2" />
              <svg className="v5-bio-fp-svg" viewBox="0 0 100 100" fill="none">
                <path className="v5-fpr v5-fpr--1" d="M50 14 C28 14 14 28 14 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--1" d="M50 14 C72 14 86 28 86 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--2" d="M24 50 C24 35 35 24 50 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--2" d="M76 50 C76 35 65 24 50 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--3" d="M34 50 C34 41 41 34 50 34" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--3" d="M66 50 C66 41 59 34 50 34" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--4" d="M50 34 L50 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--5" d="M16 63 C20 78 34 86 50 86 C66 86 80 78 84 63" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                <path className="v5-fpr v5-fpr--5" d="M28 58 C32 70 40 76 50 76" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                {isScanning && <line className="v5-bio-fp-scanline" x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>}
                {isSuccess  && <path className="v5-bio-checkmark" d="M28 50 L44 66 L72 34" stroke="#00C97A" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>}
              </svg>
            </div>
          ) : (
            /* ── Face ── */
            <div className={`v5-bio-face-wrap${stateClass}`}>
              <svg className="v5-bio-face-svg" viewBox="0 0 100 100" fill="none">
                {/* Corner brackets */}
                <path className="v5-fc v5-fc--tl" d="M14 36V16h20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path className="v5-fc v5-fc--tr" d="M66 16h20v20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path className="v5-fc v5-fc--br" d="M86 64v20H66"  stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path className="v5-fc v5-fc--bl" d="M34 84H14V64"  stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Face oval */}
                <ellipse cx="50" cy="52" rx="22" ry="26" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" opacity="0.3"/>
                {/* Landmark dots */}
                <circle className="v5-fld" cx="38" cy="45" r="3.5" fill="currentColor"/>
                <circle className="v5-fld" cx="62" cy="45" r="3.5" fill="currentColor"/>
                <circle className="v5-fld v5-fld--nose" cx="50" cy="56" r="2.5" fill="currentColor" opacity="0.7"/>
                <path  className="v5-fld v5-fld--mouth" d="M40 65 C44 71 56 71 60 65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
                {/* Scan line */}
                {isScanning && <line className="v5-bio-face-scanline" x1="14" y1="50" x2="86" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>}
                {isSuccess  && <path className="v5-bio-checkmark" d="M28 52 L44 68 L72 36" stroke="#00C97A" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>}
              </svg>
            </div>
          )}
        </div>

        <div className={`v5-bio-status${isSuccess ? ' v5-bio-status--ok' : ''}${isError ? ' v5-bio-status--err' : ''}`}>
          {isScanning && <span className="v5-bio-spinner" />}
          {isSuccess  && <span className="v5-bio-tick">✓</span>}
          {isError    && <span className="v5-bio-tick v5-bio-tick--err">✗</span>}
          <span>{statusText}</span>
        </div>

        <button className="v5-bio-fallback" onClick={onUsePassword}>
          Use password instead
        </button>
      </div>
    </>
  );
}

/* ── Enable Biometric prompt ─────────────────────────────────────────────── */
function EnableBioPrompt({ onEnable, onSkip }) {
  return (
    <>
      <div className="v5-login-backdrop" onClick={onSkip} />
      <div className="v5-bio-modal v5-enable-bio" style={{ zIndex: 10001 }}>
        <img src="/ap-emblem.svg" alt="AP" className="v5-bio-emblem" />
        <h2 className="v5-bio-title">Enable Biometric Login?</h2>
        <p className="v5-enable-bio-desc">Register your fingerprint or face for faster, secure access next time.</p>
        <div className="v5-enable-bio-btns">
          <button className="v5-gate-btn" onClick={onEnable}>Enable Now</button>
          <button className="v5-bio-fallback" onClick={onSkip}>Skip for now</button>
        </div>
      </div>
    </>
  );
}

/* ── Isolated banner carousel — own state, never re-renders parent ───────── */
const BANNERS = [
  { n: 1, pos: 'right 42%' },
  { n: 2, pos: 'right 36%' },
  { n: 3, pos: 'right 50%' },
  { n: 4, pos: 'right 35%' },
  { n: 5, pos: 'right 52%' },
  { n: 6, pos: 'right 20%' },
  { n: 8, pos: 'right 45%' },
];
const NavBanner = memo(function NavBanner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="v4l-nav-banner-dissolve">
      <img key={BANNERS[idx].n} src={`/banners/banner${BANNERS[idx].n}.png`} alt=""
        className="v4l-nav-banner-slide"
        style={{ objectPosition: BANNERS[idx].pos, opacity: 1 }} />
    </div>
  );
});

const LOGIN_DIVS = [
  { id: 'rch',  short: 'RCH',  name: 'Reproductive & Child Health', color: '#1B6FF5', icon: '/sidebar/RCH.png' },
  { id: 'ndcp', short: 'NDCP', name: 'National Disease Control',     color: '#D97706', icon: '/sidebar/NDCP.png' },
  { id: 'ncd',  short: 'NCD',  name: 'Non-Communicable Diseases',   color: '#7C3AED', icon: '/sidebar/NCD.png' },
  { id: 'hss',  short: 'HSS',  name: 'Health Systems Strengthening', color: '#0F9B82', icon: '/sidebar/HSS.png' },
  { id: 'hrh',  short: 'HRH',  name: 'Human Resources for Health',  color: '#DC4B2A', icon: '/sidebar/HRH.png' },
];

export default function LandingPage({ onSelectDivision, onViewSummary, onDirectKD, onSelectProgramme }) {
  const [reportDiv, setReportDiv] = useState(null);
  const [isLoggedIn, setIsLoggedIn]         = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showLoginGate, setShowLoginGate]   = useState(false);
  const [loginUser, setLoginUser]           = useState('');
  const [loginPass, setLoginPass]           = useState('');
  const [loginError, setLoginError]         = useState('');
  const [captchaAns, setCaptchaAns]         = useState('');
  const [captchaText, setCaptchaText]       = useState(() => genCaptcha());
  const [wheelTarget, setWheelTarget]       = useState(null);
  const [pendingDiv,  setPendingDiv]        = useState(null);
  const [divPillTarget, setDivPillTarget]  = useState(null);
  const [showBioModal, setShowBioModal]     = useState(false);
  const [bioStatus, setBioStatus]           = useState('idle');
  const [bioStored, setBioStored]           = useState(() => !!localStorage.getItem('bio_cred'));
  const [showEnableBio, setShowEnableBio]   = useState(false);
  const [loggedInUser,  setLoggedInUser]    = useState(null);
  const divStats = useDivStats();

  /* ── Login success handler ────────────────────────────────────────────── */
  /* pending is { kd, prog, divData } or null — passed explicitly to avoid stale closure */
  function handleLoginSuccess(pending) {
    const p = pending ?? pendingDiv;
    setIsLoggedIn(true);
    setShowLoginGate(false);
    setPendingDiv(null);
    if (p) {
      if (onDirectKD) onDirectKD(p.divData, p.prog.id, p.kd);
    } else if (WEBAUTHN_SUPPORTED && !bioStored) {
      setShowEnableBio(true);
    } else {
      setShowLoginPopup(true);
    }
  }

  /* ── Indicator-triggered login (pill clicked while not logged in) ─────── */
  function handleNeedLogin(payload) {
    setPendingDiv(payload);
    if (bioStored && WEBAUTHN_SUPPORTED) {
      setBioStatus('scanning');
      setShowBioModal(true);
      authenticateBiometric()
        .then(() => {
          setBioStatus('success');
          setTimeout(() => { setShowBioModal(false); setBioStatus('idle'); setLoggedInUser('PIF'); handleLoginSuccess(payload); }, 800);
        })
        .catch(() => {
          setBioStatus('error');
          setTimeout(() => {
            setShowBioModal(false); setBioStatus('idle');
            setLoginUser(''); setLoginPass(''); setLoginError(''); setCaptchaAns(''); setCaptchaText(genCaptcha());
            setShowLoginGate(true);
          }, 1400);
        });
    } else {
      setLoginUser(''); setLoginPass(''); setLoginError(''); setCaptchaAns(''); setCaptchaText(genCaptcha());
      setShowLoginGate(true);
    }
  }

  /* ── Login button handler — triggers biometric or password gate ──────── */
  function handleLoginClick() {
    if (bioStored && WEBAUTHN_SUPPORTED) {
      setBioStatus('scanning');
      setShowBioModal(true);
      authenticateBiometric()
        .then(() => {
          setBioStatus('success');
          setTimeout(() => { setShowBioModal(false); setBioStatus('idle'); setLoggedInUser('PIF'); handleLoginSuccess(null); }, 800);
        })
        .catch(() => {
          setBioStatus('error');
          setTimeout(() => { setShowBioModal(false); setBioStatus('idle'); setShowLoginGate(true); }, 1400);
        });
    } else {
      setLoginUser(''); setLoginPass(''); setLoginError(''); setCaptchaAns(''); setCaptchaText(genCaptcha());
      setShowLoginGate(true);
    }
  }

  /* section refs for scroll-reveal */
  const overviewRef = useRef(null);
  const flowRef     = useRef(null);
  const alertsRef   = useRef(null);
  useReveal(overviewRef);
  useReveal(flowRef);
  useReveal(alertsRef);


  /* overall totals for the hero strip */
  const totals = useMemo(() => {
    let achieved = 0, close = 0, gap = 0, total = 0;
    divStats.forEach(({ brk }) => {
      achieved += brk.achieved; close += brk.close;
      gap += brk.gap; total += brk.total;
    });
    return { achieved, close, gap, total };
  }, [divStats]);

  const onTrackPct = totals.total > 0 ? Math.round((totals.achieved / totals.total) * 100) : 0;

  return (
    <AbbrevProvider>
      <div className="v4l-root">

      {/* ── Left side navigation panel ──────────────────────────────────── */}
      <LeftSideNav onSelectDivision={onSelectDivision} onSelectProgramme={onSelectProgramme}
        openWheelDirect={wheelTarget}
        openDivDirect={divPillTarget}
        onNeedLogin={handleNeedLogin}
        onDirectKD={onDirectKD}
        isLoggedIn={isLoggedIn}
        loggedInUser={loggedInUser}
        onLogout={() => { setIsLoggedIn(false); setShowLoginPopup(false); setLoggedInUser(null); }}
        onReport={(divId, divName, divColor) => setReportDiv({ id: divId, name: divName, color: divColor })} />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="v4l-nav">
        <div className="v4l-nav-inner">
          {/* ── Banner — isolated component, no parent re-render ─────────── */}
          <NavBanner />
          {/* Gradient so brand text stays readable over images */}
          <div className="v4l-nav-banner-overlay" />

          <div className="v4l-brand">
            <img src="/ap-emblem.svg" alt="Arunachal Pradesh Emblem" className="v4l-brand-logo" />
            <div className="v4l-brand-divider" />
            <img src="/nhm-logo.png" alt="NHM" className="v4l-brand-nhm" />
            <div className="v4l-brand-text">
              <div className="v4l-brand-name">Arunachal Pradesh eHealth Unified Dashboard</div>
              <div className="v4l-brand-ministry">Ministry of Health and Family Welfare</div>
            </div>
          </div>
          <nav className="v4l-nav-links">
          </nav>
        </div>
      </header>


      {/* ── Hero identity bar ───────────────────────────────────────────── */}
      <div className="v5-hero-bar">
        <div className="v5-hero-left">
          <h1 className="v5-hero-title">Our state's health, district by district</h1>
        </div>
        <div className="v5-hero-right">
          {isLoggedIn ? (
            <button className="v5-login-btn" onClick={() => setShowLoginPopup(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Select Division
            </button>
          ) : (
            <button className="v5-login-btn" onClick={handleLoginClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Login
            </button>
          )}
        </div>
      </div>

      {/* ── Division nav bar ────────────────────────────────────────────── */}
      <div className="v5-div-bar">
        {DIV_NAV.map(div => (
          <button
            key={div.id}
            className="v5-div-pill"
            style={{ '--dc': div.color, '--dl': div.light }}
            onClick={() => setDivPillTarget(div.id)}
          >
            <span className="v5-div-pill-icon-wrap">
              <img src={`/sidebar/${div.short}.png`} alt="" className="v5-div-pill-icon" />
            </span>
            <span className="v5-div-pill-divider" />
            <span className="v5-div-pill-text">
              <span className="v5-div-pill-short">{div.short}</span>
              <span className="v5-div-pill-name">{div.name}</span>
            </span>
          </button>
        ))}
      </div>

      {/* ── Stat Strip — static cards ────────────────────────────────────── */}
      <div className="v5-stat-strip">
        <div className="v5-stat-strip-heading"><span>Highlights from Financial Year 2025-26</span></div>
        {DIVISIONS.map(div => {
          const face0 = getDivisionStats(div.id)[0];
          const accent = SC3D_ACCENTS[div.id];
          return (
            <div
              key={div.id}
              className="v5-stat-card"
              style={{ '--accent': accent }}
              onClick={() => {
                if (onDirectKD && face0?.kd) {
                  onDirectKD(div, face0.progId, face0.kd);
                } else {
                  onSelectDivision(div);
                }
              }}
            >
              <img src={`/statcards/${div.label}.png`} className="v5-stat-card-img" alt="" />
              <div className="v5-stat-number">{face0?.value ?? '—'}</div>
              <div className={`v5-stat-label${(face0?.label ?? '').length > 50 ? ' v5-stat-label--sm' : ''}`}>{face0?.label ?? ''}</div>
              <div className="v5-stat-prog" data-abbr={div.label}>
                {(() => {
                  const w = div.fullName.split(' ');
                  const mid = Math.ceil(w.length / 2);
                  return <>{w.slice(0, mid).join(' ')}<br />{w.slice(mid).join(' ')}</>;
                })()}
              </div>
            </div>
          );
        })}
      </div>
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — DISTRICT MAP
          ══════════════════════════════════════════════════════════════════ */}
      <div className="v4l-reveal" ref={overviewRef}>
        <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>Loading map…</div>}>
          <DistrictMap />
        </Suspense>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — NHM PROGRAMME FLOW (SANKEY)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="v4l-flow v4l-reveal" ref={flowRef}>
        <div className="v4l-section-header">
          <div className="v4l-section-tag">National Health Mission Programme Flow</div>
          <h2 className="v4l-section-title">How Programmes distribute across divisions and outcome status</h2>
          <p className="v4l-section-sub">
            Financial Year 2025-26 · Click any division or programme node to drill in
          </p>
        </div>

        {/* Legend */}
        <div className="v4l-flow-legend">
          {[
            { clr: '#00C97A', lbl: 'On Track' },
            { clr: '#FFB020', lbl: 'Caution' },
            { clr: '#FF3B5C', lbl: 'Critical Gap' },
            { clr: '#94A3B8', lbl: 'Not Mapped' },
          ].map(({ clr, lbl }) => (
            <div key={lbl} className="v4l-flow-leg-item">
              <span className="v4l-flow-leg-dot" style={{ background: clr }} />
              <span className="v4l-flow-leg-lbl">{lbl}</span>
            </div>
          ))}
        </div>

        {/* Sankey chart container */}
        <div className="v4l-sankey-outer">
          <Suspense fallback={<div className="v4l-sankey-loading">Loading flow diagram…</div>}>
            <NHMSankey
              onSelectDivision={onSelectDivision}
              onSelectProgramme={(prog, div) => {
                if (prog) {
                  /* navigate to kd-list for this programme */
                  onSelectDivision && onSelectDivision(div);
                } else {
                  onSelectDivision && onSelectDivision(div);
                }
              }}
              theme="light"
            />
          </Suspense>
        </div>

        <div className="v4l-section-source">
          Node width proportional to number of Indicators · HRH staffing Indicators pending mapping
        </div>

        {/* ── Sankey abbreviation footnotes ── */}
        <div className="sankey-abbrev-footnotes">
          <AbbrevLegend items={[...ABBREV.statStrip, ...ABBREV.sankey]} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2.5 — PROGRAMME PROGRESS CHART
          ══════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<div style={{ height: 200 }} />}>
        <ProgrammeProgressChart />
      </Suspense>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — UPDATES
          ══════════════════════════════════════════════════════════════════ */}
      <section className="v4l-updates v4l-reveal" ref={alertsRef}>
        <div className="v4l-section-header">
          <div className="v4l-section-tag">Updates</div>
          <h2 className="v4l-section-title">Latest from National Health Mission Arunachal Pradesh</h2>
          <p className="v4l-section-sub">News, circulars and notifications — Financial Year 2025-26</p>
        </div>

        <div className="v4l-updates-grid">

          {/* ── News ── */}
          <div className="v4l-updates-col">
            <div className="v4l-updates-col-hdr" style={{ '--uc': '#4F8EF7' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>
              News
            </div>
            {[
              { date: 'May 2026', title: 'National Health Mission (NHM) AP achieves 91% Full Immunization Coverage in Financial Year (FY) 2025-26', tag: 'RCH' },
              { date: 'Apr 2026', title: '408 Ayushman Arogya Mandirs now fully operational with 12-service package', tag: 'HSS' },
              { date: 'Mar 2026', title: 'Hepatitis C treatment scale-up: 2,314 patients under active treatment', tag: 'NDCP' },
              { date: 'Feb 2026', title: '255 persons rehabilitated with hearing aids under Non-Communicable Diseases (NCD) programme', tag: 'NCD' },
            ].map((item, i) => (
              <div key={i} className="v4l-updates-item">
                <span className="v4l-updates-date">{item.date}</span>
                <p className="v4l-updates-title">{item.title}</p>
                <span className="v4l-updates-tag" style={{ '--uc': '#4F8EF7' }}>{ALL_ABBREVS[item.tag] || item.tag}</span>
              </div>
            ))}
          </div>

          {/* ── Circulars ── */}
          <div className="v4l-updates-col">
            <div className="v4l-updates-col-hdr" style={{ '--uc': '#F7B23B' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Circulars
            </div>
            {[
              { date: 'May 2026', title: 'Annual Health Management Information System (HMIS) data validation — all districts to submit reports by 30 June 2026', tag: 'HSS' },
              { date: 'Apr 2026', title: 'Revised National Programme for Prevention & Control of Cancer (NPCC) targets for Q1 Financial Year (FY) 2026-27 shared with programme officers', tag: 'All' },
              { date: 'Mar 2026', title: 'National Tuberculosis Elimination Programme (NTEP): Updated drug management guidelines issued to district TB units', tag: 'NDCP' },
              { date: 'Feb 2026', title: 'Information, Education & Communication (IEC) materials for anaemia awareness campaign dispatched to all districts', tag: 'RCH' },
            ].map((item, i) => (
              <div key={i} className="v4l-updates-item">
                <span className="v4l-updates-date">{item.date}</span>
                <p className="v4l-updates-title">{item.title}</p>
                <span className="v4l-updates-tag" style={{ '--uc': '#F7B23B' }}>{ALL_ABBREVS[item.tag] || item.tag}</span>
              </div>
            ))}
          </div>

          {/* ── Notifications ── */}
          <div className="v4l-updates-col">
            <div className="v4l-updates-col-hdr" style={{ '--uc': '#9B6FEB' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Notifications
            </div>
            {[
              { date: 'May 2026', title: 'MusQan Certification drive — all districts to initiate certification by July 2026', tag: 'RCH' },
              { date: 'Apr 2026', title: 'Medical Officer MBBS (MO-MBBS) vacancy filling: remaining positions under active recruitment process', tag: 'HRH' },
              { date: 'Mar 2026', title: 'Non-Communicable Diseases (NCD) screening camps scheduled across 10 districts — June-July 2026', tag: 'NCD' },
              { date: 'Feb 2026', title: 'National Leprosy Eradication Programme (NLEP) district review meetings rescheduled — see updated calendar', tag: 'NDCP' },
            ].map((item, i) => (
              <div key={i} className="v4l-updates-item">
                <span className="v4l-updates-date">{item.date}</span>
                <p className="v4l-updates-title">{item.title}</p>
                <span className="v4l-updates-tag" style={{ '--uc': '#9B6FEB' }}>{ALL_ABBREVS[item.tag] || item.tag}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="v4l-footer">
        <div className="v4l-footer-inner">
          <div className="v4l-footer-brand">
            <span className="v4l-footer-name">Pahlé India Foundation</span>
            <span className="v4l-footer-sub"><MarkAbbrev text="NHM Arunachal Pradesh · FY 2025-26" /></span>
          </div>
          <nav className="v4l-footer-nav">
            {DIVISIONS.map(div => (
              <button key={div.id} className="v4l-footer-link" data-abbr={div.label}
                      onClick={() => setDivPillTarget(div.id)}>
                {div.label}
              </button>
            ))}
            <button className="v4l-footer-link" onClick={onViewSummary}>
              All Programmes
            </button>
          </nav>
        </div>
      </footer>

      {reportDiv && (
        <ReportModal divisionId={reportDiv.id} divisionName={reportDiv.name} divisionColor={reportDiv.color} onClose={() => setReportDiv(null)} />
      )}

      {/* ── Biometric modal ───────────────────────────────────────────── */}
      {showBioModal && (
        <BiometricModal
          status={bioStatus}
          onClose={null /* mandatory — cannot dismiss */}
          onUsePassword={() => {
            setShowBioModal(false); setBioStatus('idle');
            setShowLoginGate(true); setLoginUser(''); setLoginPass(''); setLoginError(''); setCaptchaAns(''); setCaptchaText(genCaptcha());
          }}
        />
      )}

      {/* ── Enable biometric prompt ───────────────────────────────────── */}
      {showEnableBio && (
        <EnableBioPrompt
          onEnable={async () => {
            try {
              await registerBiometric();
              setBioStored(true);
            } catch (e) { /* user cancelled — ignore */ }
            setShowEnableBio(false); setShowLoginPopup(true);
          }}
          onSkip={() => { setShowEnableBio(false); setShowLoginPopup(true); }}
        />
      )}

      {/* ── Login gate ───────────────────────────────────────────────── */}
      {showLoginGate && (
        <>
          <div className="v5-login-backdrop" onClick={() => setShowLoginGate(false)} />
          <div className="v5-login-gate">
            <div className="v5-gate-logo">
              <img src="/ap-emblem.svg" alt="Arunachal Pradesh" />
            </div>
            <h2 className="v5-gate-title">
              {pendingDiv?.kd
                ? `Login to view: ${pendingDiv.kd.indicator}`
                : 'Admin Login'}
            </h2>
            <div className="v5-gate-fields">
              <div className="v5-gate-field">
                <label className="v5-gate-label">Username</label>
                <input className="v5-gate-input" type="text" placeholder="Enter username"
                  value={loginUser} onChange={e => { setLoginUser(e.target.value); setLoginError(''); }} />
              </div>
              <div className="v5-gate-field">
                <label className="v5-gate-label">Password</label>
                <input className="v5-gate-input" type="password" placeholder="Enter password"
                  value={loginPass} onChange={e => { setLoginPass(e.target.value); setLoginError(''); }} />
              </div>
              <div className="v5-gate-field">
                <label className="v5-gate-label">Enter the characters shown below</label>
                <div className="v5-gate-captcha-row">
                  <CaptchaCanvas text={captchaText} />
                  <button className="v5-gate-captcha-refresh" title="Refresh captcha" onClick={() => { setCaptchaText(genCaptcha()); setCaptchaAns(''); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  </button>
                </div>
                <input className="v5-gate-input" type="text" placeholder="Type characters above"
                  value={captchaAns} onChange={e => { setCaptchaAns(e.target.value); setLoginError(''); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const ok = loginUser.trim() === 'PIF' && loginPass === '3000' && captchaAns.trim().toLowerCase() === captchaText.toLowerCase();
                      if (ok) { setLoggedInUser(loginUser || 'PIF'); handleLoginSuccess(); }
                      else { setLoginError('Invalid credentials or captcha. Try again.'); setCaptchaText(genCaptcha()); setCaptchaAns(''); }
                    }
                  }} />
              </div>
              {loginError && <p className="v5-gate-error">{loginError}</p>}
              <button className="v5-gate-btn" onClick={() => {
                const ok = loginUser.trim() === 'PIF' && loginPass === '3000' && captchaAns.trim().toLowerCase() === captchaText.toLowerCase();
                if (ok) { setLoggedInUser(loginUser || 'PIF'); handleLoginSuccess(); }
                else { setLoginError('Invalid credentials or captcha. Try again.'); setCaptchaText(genCaptcha()); setCaptchaAns(''); }
              }}>Sign In</button>
            </div>
          </div>
        </>
      )}

      {/* ── Division popup — fixed, outside nav overflow ──────────────── */}
      {showLoginPopup && (
        <>
          <div className="v5-login-backdrop" onClick={() => setShowLoginPopup(false)} />
          <div className="v5-login-popup">
            <p className="v5-login-popup-label">Select your division to begin</p>
            <div className="v5-login-popup-row">
              {LOGIN_DIVS.map(d => (
                <button key={d.id} className="v5-login-div-btn"
                  style={{ '--dlc': d.color }}
                  onClick={() => {
                    setShowLoginPopup(false);
                    setWheelTarget(null);
                    setTimeout(() => setWheelTarget(d.id), 50);
                  }}>
                  <span className="v5-login-div-icon">
                    <img src={d.icon} alt={d.short} />
                  </span>
                  <span className="v5-login-div-short">{d.short}</span>
                  <span className="v5-login-div-name">{d.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}


      </div>
    </AbbrevProvider>
  );
}
