/* ═══════════════════════════════════════════════════════════════════════════
   LandingPage.jsx — V4 redesign
   Light-mode scrollable: Programme Overview → NHM Flow (Sankey) → Alerts
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useRef, lazy, Suspense, createContext, useContext } from 'react';
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

/* ── Abbreviation hover context ─────────────────────────────────────────── */
const AbbrevCtx = createContext({ hovered: null, hoveredEl: null });

function AbbrevProvider({ children }) {
  const [hovered,   setHovered]   = useState(null);
  const [hoveredEl, setHoveredEl] = useState(null);
  useEffect(() => {
    const onOver = e => {
      const el = e.target.closest('[data-abbr]');
      setHovered(el?.dataset.abbr ?? null);
      setHoveredEl(el ?? null);
    };
    document.addEventListener('mouseover', onOver);
    return () => document.removeEventListener('mouseover', onOver);
  }, []);
  return <AbbrevCtx.Provider value={{ hovered, hoveredEl }}>{children}</AbbrevCtx.Provider>;
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
      {items.map(([short, full]) => (
        <span
          key={short}
          className={`abbrev-legend-item${hovered === short ? ' abbrev-legend-item--active' : ''}`}
        >
          <span className="abbrev-legend-star">★</span>
          <strong className="abbrev-legend-short">{short}</strong>
          <span className="abbrev-legend-dash">—</span>
          <span className="abbrev-legend-full">{full}</span>
        </span>
      ))}
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
export default function LandingPage({ onSelectDivision, onViewSummary, onDirectKD }) {
  const [reportDiv, setReportDiv] = useState(null);
  const divStats = useDivStats();

  /* section refs for scroll-reveal */
  const overviewRef = useRef(null);
  const flowRef     = useRef(null);
  const alertsRef   = useRef(null);
  useReveal(overviewRef);
  useReveal(flowRef);
  useReveal(alertsRef);

  /* nav banner dissolve */
  const bannerRefs = useRef([]);
  const bannerIdx  = useRef(0);
  useEffect(() => {
    const slides = bannerRefs.current;
    if (!slides.length) return;
    gsap.set(slides[0], { opacity: 1 });
    slides.slice(1).forEach(s => gsap.set(s, { opacity: 0 }));
    const id = setInterval(() => {
      const prev = bannerIdx.current;
      const next = (prev + 1) % slides.length;
      gsap.to(slides[prev], { opacity: 0, duration: 1.4, ease: 'power2.inOut' });
      gsap.to(slides[next], { opacity: 1, duration: 1.4, ease: 'power2.inOut' });
      bannerIdx.current = next;
    }, 5000);
    return () => clearInterval(id);
  }, []);

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
      <LeftSideNav onSelectDivision={onSelectDivision} />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="v4l-nav">
        <div className="v4l-nav-inner">
          {/* ── Dissolve banner ─────────────────────────────────────────── */}
          <div className="v4l-nav-banner-dissolve">
            {[1, 2, 3].map((n, i) => (
              <img
                key={i}
                ref={el => bannerRefs.current[i] = el}
                src={`/banners/banner${n}.jpeg`}
                alt=""
                className="v4l-nav-banner-slide"
              />
            ))}
          </div>
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
          <div className="v5-role-btns">
            <button className="v5-role-btn v5-role-btn--active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="19" cy="7" r="2"/><path d="M23 21v-1a3 3 0 0 0-3-3"/></svg>
              Public
            </button>
            <button className="v5-role-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
              Programme Officers
            </button>
            <button className="v5-role-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Administrators
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Strip — static cards ────────────────────────────────────── */}
      <div className="v5-stat-strip">
        {DIVISIONS.map(div => {
          const face0 = getDivisionStats(div.id)[0];
          const accent = SC3D_ACCENTS[div.id];
          return (
            <div
              key={div.id}
              className="v5-stat-card"
              style={{ '--accent': accent }}
              onClick={() => onSelectDivision(div)}
            >
              <img src={`/statcards/${div.label}.png`} className="v5-stat-card-img" alt="" />
              <div className="v5-stat-number">{face0?.value ?? '—'}</div>
              <div className="v5-stat-label"><MarkAbbrev text={face0?.label ?? ''} /></div>
              <div className="v5-stat-prog" data-abbr={div.label}>{div.fullName}</div>
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
          <div className="v4l-section-tag"><MarkAbbrev text="NHM Programme Flow" /></div>
          <h2 className="v4l-section-title">How Programmes distribute across divisions and outcome status</h2>
          <p className="v4l-section-sub">
            <MarkAbbrev text="FY 2025-26 · Click any division or programme node to drill in" />
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
          <span className="abbrev-footnote">
            {[...ABBREV.statStrip, ...ABBREV.sankey].map(([short, full]) => (
              <span key={short} className="abbrev-fn-item">
                <span className="abbrev-fn-star">*</span>
                <span className="abbrev-fn-abbr">{short}</span>
                <span className="abbrev-fn-dash">—</span>
                <span className="abbrev-fn-full">{full}</span>
              </span>
            ))}
          </span>
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
                      onClick={() => onSelectDivision(div)}>
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
        <ReportModal division={reportDiv} onClose={() => setReportDiv(null)} />
      )}
      </div>
    </AbbrevProvider>
  );
}
