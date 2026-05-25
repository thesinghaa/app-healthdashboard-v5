/* ═══════════════════════════════════════════════════════════════════════════
   LandingPage.jsx — NHM Arunachal Pradesh Command Center
   Dark-first, scrollable story: Hero → Map → Divisions → Alerts → NFHS
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { DIVISIONS } from '../data/programs';
import { KD_TREE } from '../data/kdData';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import ReportModal from '../components/ReportModal';
import '../styles/landing-v4.css';

/* ── Status helpers ──────────────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const r = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return r <= 1 ? 'achieved' : r <= 1.33 ? 'close' : 'gap';
  return r >= 1 ? 'achieved' : r >= 0.75 ? 'close' : 'gap';
}

function getDivBreakdown(divId) {
  const tree = KD_TREE[divId];
  if (!tree) return { achieved: 0, close: 0, gap: 0, total: 0 };
  let achieved = 0, close = 0, gap = 0, total = 0;
  Object.values(tree.programmes || {}).forEach(p =>
    (p.kds || []).forEach(kd => {
      const s = kdStatus(kd);
      if (s === 'neutral') return;
      total++;
      if (s === 'achieved') achieved++;
      else if (s === 'close') close++;
      else gap++;
    })
  );
  return { achieved, close, gap, total };
}

function getTopGaps(divId, n = 4) {
  const tree = KD_TREE[divId];
  if (!tree) return [];
  const all = [];
  Object.entries(tree.programmes || {}).forEach(([progId, prog]) => {
    (prog.kds || []).forEach(kd => {
      if (kdStatus(kd) !== 'gap') return;
      const r = kd.target > 0 ? kd.achievement / kd.target : 1;
      const deficit = kd.lowerIsBetter ? r - 1 : 1 - r;
      all.push({ ...kd, progId, deficit });
    });
  });
  return all.sort((a, b) => b.deficit - a.deficit).slice(0, n);
}

function getSpotKDs(divId, specs) {
  return specs.map(({ prog, name }) => {
    const p = (KD_TREE[divId]?.programmes || {})[prog];
    if (!p) return null;
    const kd = name
      ? (p.kds || []).find(k => k.indicator === name)
      : (p.kds || [])[0];
    return kd ? { ...kd, progId: prog } : null;
  }).filter(Boolean);
}

/* ── District health scores (composite proxy) ────────────────────────────── */
const DIST_SCORES = {
  'Anjaw': 27, 'Bichom': 40, 'Changlang': 39, 'Dibang Valley': 32,
  'East Kameng': 38, 'East Siang': 60, 'Kamle': 35, 'Keyi Panyor': 38,
  'Kra Daadi': 31, 'Kurung Kumey': 28, 'Leparada': 39, 'Lohit': 46,
  'Longding': 35, 'Lower Dibang Valley': 50, 'Lower Siang': 36,
  'Lower Subansiri': 42, 'Namsai': 52, 'Pakke Kessang': 44,
  'Papum Pare': 68, 'Shi Yomi': 30, 'Siang': 41, 'Tawang': 62,
  'Tirap': 33, 'Upper Siang': 43, 'Upper Subansiri': 48,
  'West Kameng': 55, 'West Siang': 57,
};
const distColor = s => s >= 55 ? '#00C97A' : s >= 40 ? '#FFB020' : '#FF3B5C';

/* ── Division metadata ───────────────────────────────────────────────────── */
const DIV_META = {
  rch: {
    color: '#4F8EF7', colorDim: 'rgba(79,142,247,0.12)',
    colorDim2: 'rgba(79,142,247,0.20)', colorBorder: 'rgba(79,142,247,0.28)',
    heroVal: '95%', heroLbl: 'ANC Coverage',
    spots: [
      { prog: 'maternal-health', name: 'ANC Coverage' },
      { prog: 'maternal-health', name: '1st Trimester ANC' },
      { prog: 'immunization', name: 'Full Immunization Coverage' },
    ],
  },
  ndcp: {
    color: '#F7B23B', colorDim: 'rgba(247,178,59,0.12)',
    colorDim2: 'rgba(247,178,59,0.20)', colorBorder: 'rgba(247,178,59,0.28)',
    heroVal: '191', heroLbl: 'TB per Lakh',
    spots: [
      { prog: 'tb', name: null },
      { prog: 'nlep', name: null },
      { prog: 'ncvbdcp', name: null },
    ],
  },
  ncd: {
    color: '#9B6FEB', colorDim: 'rgba(155,111,235,0.12)',
    colorDim2: 'rgba(155,111,235,0.20)', colorBorder: 'rgba(155,111,235,0.28)',
    heroVal: '11', heroLbl: 'Active Programmes',
    spots: [],
  },
  hss: {
    color: '#2DD4BF', colorDim: 'rgba(45,212,191,0.12)',
    colorDim2: 'rgba(45,212,191,0.20)', colorBorder: 'rgba(45,212,191,0.28)',
    heroVal: '27', heroLbl: 'Districts Covered',
    spots: [],
  },
  hrh: {
    color: '#F7614F', colorDim: 'rgba(247,97,79,0.12)',
    colorDim2: 'rgba(247,97,79,0.20)', colorBorder: 'rgba(247,97,79,0.28)',
    heroVal: '5/22', heroLbl: 'IPHLs Operational',
    spots: [],
  },
};

/* ── Division icons ──────────────────────────────────────────────────────── */
const DIV_ICONS = {
  rch: (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
      <path d="M10 17S3 12.65 3 7.5a5 5 0 0 1 7-4.57A5 5 0 0 1 17 7.5C17 12.65 10 17 10 17z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="10" cy="7.5" r="1.8" fill="currentColor" opacity=".5"/>
    </svg>
  ),
  ndcp: (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6.5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 3.5L5 2M13 3.5L15 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  ncd: (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
      <path d="M2 10h3l2.5-5 3 10 2.5-6.5L15 10h3"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  hss: (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
      <rect x="2" y="7" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 18v-6h8v6M10 3v4M7.5 3h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  hrh: (
    <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 18c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

/* ── AP Emblem ───────────────────────────────────────────────────────────── */
function APEmblem({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <path id="arc1v4" d="M15,50 A35,35 0 0,1 85,50"/>
        <path id="arc2v4" d="M13,56 A37,37 0 0,0 87,56"/>
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke="#C8952A" strokeWidth="2"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(200,149,42,0.3)" strokeWidth="0.8"/>
      <text fontSize="5.8" fill="#C8952A" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1.2">
        <textPath href="#arc1v4" startOffset="8%">GOVT. OF ARUNACHAL PRADESH</textPath>
      </text>
      <text fontSize="5.4" fill="rgba(200,149,42,0.7)" fontFamily="Inter,sans-serif" fontWeight="600" letterSpacing="0.9">
        <textPath href="#arc2v4" startOffset="20%">NATIONAL HEALTH MISSION</textPath>
      </text>
      <path d="M24,72 L34,50 L42,62 L50,36 L58,56 L66,44 L76,72 Z"
        fill="rgba(200,149,42,0.18)" stroke="#C8952A" strokeWidth="1" strokeLinejoin="round"/>
      <circle cx="50" cy="43" r="9" fill="rgba(200,149,42,0.18)" stroke="#C8952A" strokeWidth="1.2"/>
      <circle cx="50" cy="43" r="4.5" fill="rgba(200,149,42,0.5)"/>
      {[0,45,90,135,180,225,270,315].map((d, i) => {
        const rad = d * Math.PI / 180;
        return (
          <line key={i}
            x1={50 + 11 * Math.cos(rad)} y1={43 + 11 * Math.sin(rad)}
            x2={50 + 15 * Math.cos(rad)} y2={43 + 15 * Math.sin(rad)}
            stroke="#C8952A" strokeWidth="0.9" strokeLinecap="round"/>
        );
      })}
    </svg>
  );
}

/* ── Section header ──────────────────────────────────────────────────────── */
function SectionHead({ tag, title, sub }) {
  return (
    <div className="v4c-section-head v4c-reveal">
      <div className="v4c-section-tag">{tag}</div>
      <h2 className="v4c-section-title">{title}</h2>
      {sub && <p className="v4c-section-sub">{sub}</p>}
    </div>
  );
}

/* ── Progress ring (CSS conic) ───────────────────────────────────────────── */
function ProgressRing({ pct, color, size = 74 }) {
  const bg = `conic-gradient(${color} ${pct}%, var(--v4-s2) ${pct}%)`;
  return (
    <div className="v4c-ring" style={{ width: size, height: size, background: bg }}>
      <div className="v4c-ring-hole">
        <span className="v4c-ring-pct" style={{ color }}>{pct}%</span>
        <span className="v4c-ring-sub">on track</span>
      </div>
    </div>
  );
}

/* ── Mini KD bar ─────────────────────────────────────────────────────────── */
function MiniKDBar({ kd }) {
  if (!kd || kd.target == null || kd.target === 0) return null;
  const pct   = Math.min(100, Math.round((kd.achievement / kd.target) * 100));
  const st    = kdStatus(kd);
  const color = st === 'achieved' ? '#00C97A' : st === 'close' ? '#FFB020' : '#FF3B5C';
  const lbl   = kd.indicator.length > 24 ? kd.indicator.slice(0, 22) + '…' : kd.indicator;
  const val   = kd.achievedLabel || `${kd.achievement}${kd.unit || ''}`;
  return (
    <div className="v4c-kdb">
      <span className="v4c-kdb-label">{lbl}</span>
      <div className="v4c-kdb-row">
        <div className="v4c-kdb-track">
          <div className="v4c-kdb-fill" style={{ width: `${pct}%`, background: color }}/>
        </div>
        <span className="v4c-kdb-val" style={{ color }}>{val}</span>
      </div>
    </div>
  );
}

/* ── Division card ───────────────────────────────────────────────────────── */
function DivCard({ div, meta, brk, kds, onExplore }) {
  const st = brk.gap > 0 ? 'gap' : brk.close > 0 ? 'close' : 'ok';
  const stLabel = { gap: 'Critical', close: 'Caution', ok: 'On Track' }[st];
  const onTrackPct = brk.total > 0 ? Math.round((brk.achieved / brk.total) * 100) : 0;

  return (
    <div
      className="v4c-div-card v4c-reveal"
      style={{
        '--dc':       meta.color,
        '--dc-dim':   meta.colorDim,
        '--dc-dim2':  meta.colorDim2,
        '--dc-border': meta.colorBorder,
      }}
    >
      <div className="v4c-dc-head">
        <div className="v4c-dc-icon">{DIV_ICONS[div.id]}</div>
        <div className={`v4c-dc-status v4c-dcs--${st}`}>{stLabel}</div>
      </div>
      <div>
        <div className="v4c-dc-name">{meta.label || div.label}</div>
        <div className="v4c-dc-full">{div.fullName || div.label}</div>
      </div>

      <div className="v4c-ring-row">
        <ProgressRing pct={onTrackPct} color={meta.color} size={74} />
        <div className="v4c-ring-info">
          <div className="v4c-ring-hero-val">{meta.heroVal}</div>
          <div className="v4c-ring-hero-lbl">{meta.heroLbl}</div>
        </div>
      </div>

      <div className="v4c-kd-bars">
        {kds.slice(0, 3).map((kd, i) => <MiniKDBar key={i} kd={kd} />)}
        {kds.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--v4-ink3)' }}>
            <span style={{ color: 'var(--v4-gap)' }}>{brk.gap}</span> gap ·{' '}
            <span style={{ color: 'var(--v4-close)' }}>{brk.close}</span> caution ·{' '}
            <span style={{ color: 'var(--v4-ok)' }}>{brk.achieved}</span> on track
          </div>
        )}
      </div>

      <button className="v4c-dc-explore" onClick={onExplore}>
        Explore Division
        <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

/* ── District row ────────────────────────────────────────────────────────── */
function DistRow({ name, score, rank }) {
  const color = distColor(score);
  return (
    <div className="v4c-dist-row">
      <span className="v4c-dist-rank">#{rank}</span>
      <span className="v4c-dist-name">{name}</span>
      <div className="v4c-dist-bar-wrap">
        <div className="v4c-dist-bar-fill" style={{ width: `${score}%`, background: color }}/>
      </div>
      <span className="v4c-dist-score" style={{ color }}>{score}%</span>
    </div>
  );
}

/* ── Alert row ───────────────────────────────────────────────────────────── */
function AlertRow({ kd, divLabel, divColor }) {
  const ratio  = kd.target > 0 ? kd.achievement / kd.target : 0;
  const gapPct = Math.abs(Math.round((1 - ratio) * 100));
  const progName = kd.progId ? kd.progId.replace(/-/g, ' ') : '';
  return (
    <div className="v4c-at-row">
      <div>
        <span className="v4c-at-divtag"
          style={{ background: divColor + '18', color: divColor }}>
          {divLabel}
        </span>
      </div>
      <div>
        <div className="v4c-at-ind">{kd.indicator}</div>
        <div className="v4c-at-prog">{progName}</div>
      </div>
      <div className="v4c-at-val">{kd.achievedLabel || kd.achievement}</div>
      <div className="v4c-at-tgt">{kd.targetLabel || kd.target}</div>
      <div className="v4c-at-gap">-{gapPct}%</div>
    </div>
  );
}

/* ── NFHS data ───────────────────────────────────────────────────────────── */
const NFHS_CHART = [
  { name: 'Institutional Births',    nfhs4: 52.3, nfhs5: 79.2 },
  { name: 'Skilled Birth Attendance', nfhs4: 53.8, nfhs5: 82.1 },
  { name: 'PNC within 2 days',       nfhs4: 28.9, nfhs5: 56.4 },
  { name: '4+ ANC Visits',           nfhs4: 26.8, nfhs5: 36.5 },
  { name: 'IFA 100+ days (PW)',      nfhs4: 8.3,  nfhs5: 23.8 },
];

const WINS = [
  { delta: '+26.9 pp', lbl: 'Institutional Births', sub: '52.3% → 79.2%', color: '#00C97A' },
  { delta: '+27.5 pp', lbl: 'Postnatal Care within 2 days', sub: '28.9% → 56.4%', color: '#4F8EF7' },
  { delta: 'IMR ↓44%', lbl: 'Infant Mortality Rate', sub: '23 → 12.9 per 1,000 LB', color: '#FFB020' },
];

/* ── Custom recharts tooltip ─────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="v4c-tooltip">
      <div className="v4c-tt-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="v4c-tt-row">
          <span className="v4c-tt-dot" style={{ background: p.fill }}/>
          <span>{p.name}</span>
          <span className="v4c-tt-val">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage({ onSelectDivision, onViewSummary, onDirectKD }) {
  /* ── State ───────────────────────────────────────────────────────────── */
  const [hoveredDist, setHoveredDist] = useState(null);
  const [reportDiv,   setReportDiv]   = useState(null);

  /* refs */
  const rootRef  = useRef(null);
  const scoreRef = useRef(null);

  /* ── Computed data ───────────────────────────────────────────────────── */
  const divData = useMemo(() =>
    DIVISIONS.map(div => {
      const meta = DIV_META[div.id] || {};
      const brk  = getDivBreakdown(div.id);
      const kds  = meta.spots?.length ? getSpotKDs(div.id, meta.spots) : getTopGaps(div.id, 3);
      return { div, meta, brk, kds };
    }), []
  );

  const totals = useMemo(() =>
    divData.reduce((acc, d) => ({
      total:    acc.total    + d.brk.total,
      gap:      acc.gap      + d.brk.gap,
      close:    acc.close    + d.brk.close,
      achieved: acc.achieved + d.brk.achieved,
    }), { total: 0, gap: 0, close: 0, achieved: 0 }),
    [divData]
  );

  const onTrackPct = totals.total > 0 ? Math.round((totals.achieved / totals.total) * 100) : 0;

  const allCritical = useMemo(() => {
    const rows = [];
    divData.forEach(({ div, meta }) =>
      getTopGaps(div.id, 3).forEach(kd => rows.push({ kd, div, meta }))
    );
    return rows.sort((a, b) => b.kd.deficit - a.kd.deficit).slice(0, 10);
  }, [divData]);

  const sortedDistricts = useMemo(() =>
    Object.entries(DIST_SCORES).sort(([, a], [, b]) => b - a),
    []
  );
  const stateAvg = useMemo(() =>
    Math.round(Object.values(DIST_SCORES).reduce((a, b) => a + b, 0) / Object.values(DIST_SCORES).length),
    []
  );

  /* ── Hero entry animation + score count-up ───────────────────────────── */
  useLayoutEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.v4c-nav',        { y: -36, autoAlpha: 0, duration: 0.45 })
      .from('.v4c-hero-badge', { y: 18, autoAlpha: 0, duration: 0.38 }, '<0.18')
      .from('.v4c-headline',   { y: 26, autoAlpha: 0, duration: 0.48 }, '<0.10')
      .from('.v4c-score-display', { scale: 0.88, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.4)' }, '<0.12')
      .from('.v4c-status-strip',  { y: 18, autoAlpha: 0, duration: 0.40 }, '<0.18')
      .from('.v4c-kpi-strip',     { y: 14, autoAlpha: 0, duration: 0.36 }, '<0.10')
      .from('.v4c-scroll-hint',   { autoAlpha: 0, duration: 0.40 }, '<0.20');

    /* count-up the hero score */
    if (scoreRef.current) {
      const obj = { n: 0 };
      tl.to(obj, {
        n: onTrackPct,
        duration: 2.0,
        ease: 'power2.out',
        onUpdate() { if (scoreRef.current) scoreRef.current.textContent = Math.round(obj.n); },
      }, '<0.30');
    }
    return () => tl.kill();
  }, [onTrackPct]);

  /* ── Scroll-reveal ───────────────────────────────────────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.v4c-reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('v4c-in'); obs.unobserve(e.target); }
      }),
      { threshold: 0.10 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="v4c-root" ref={rootRef}>

      {/* ══════════════════════════════════════════════════════════════════
          STICKY NAVBAR
          ══════════════════════════════════════════════════════════════════ */}
      <nav className="v4c-nav">
        <div className="v4c-nav-brand">
          <APEmblem size={32}/>
          <div>
            <div className="v4c-nav-title">NHM Arunachal Pradesh</div>
            <div className="v4c-nav-sub">Health Command Center · FY 2025-26</div>
          </div>
        </div>

        <div className="v4c-nav-links">
          {DIVISIONS.map(d => (
            <button key={d.id} className="v4c-nav-link"
              style={{ '--dc': DIV_META[d.id]?.color }}
              onClick={() => onSelectDivision(d)}>
              {d.label}
            </button>
          ))}
          <button className="v4c-nav-link v4c-nav-link--all" onClick={onViewSummary}>
            All Programmes
          </button>
        </div>

        <div className="v4c-nav-right">
          <div className="v4c-live-dot"/>
          <span className="v4c-live-label">NPCC · May 2026</span>
          <ThemeToggle/>
          <button className="v4c-nav-report-btn" onClick={() => setReportDiv(DIVISIONS[0])}>
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
              <path d="M11 8.5V12H3V2h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M7 2h4v4M11 2L7 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            AI Report
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════════════════ */}
      <section className="v4c-hero">
        <div className="v4c-hero-noise"/>
        <div className="v4c-hero-glow"/>
        <div className="v4c-hero-grid"/>
        <div className="v4c-hero-divider"/>

        <div className="v4c-hero-content">
          {/* Badge */}
          <div className="v4c-hero-badge">
            <span className="v4c-badge-dot"/>
            Government of Arunachal Pradesh · National Health Mission
          </div>

          {/* Headline */}
          <h1 className="v4c-headline">
            State Health
            <span className="v4c-headline-accent">Command Center</span>
          </h1>

          {/* Score */}
          <div className="v4c-score-display">
            <div className="v4c-score-num-row">
              <span className="v4c-score-num" ref={scoreRef}>0</span>
              <span className="v4c-score-pct">%</span>
            </div>
            <span className="v4c-score-lbl">of key indicators on track</span>
          </div>

          {/* Status counts */}
          <div className="v4c-status-strip">
            <div className="v4c-ss-item v4c-ss--gap">
              <span className="v4c-ss-num">{totals.gap}</span>
              <span className="v4c-ss-lbl">Critical</span>
            </div>
            <div className="v4c-ss-sep"/>
            <div className="v4c-ss-item v4c-ss--close">
              <span className="v4c-ss-num">{totals.close}</span>
              <span className="v4c-ss-lbl">Caution</span>
            </div>
            <div className="v4c-ss-sep"/>
            <div className="v4c-ss-item v4c-ss--ok">
              <span className="v4c-ss-num">{totals.achieved}</span>
              <span className="v4c-ss-lbl">On Track</span>
            </div>
          </div>

          {/* KPI strip */}
          <div className="v4c-kpi-strip">
            <div className="v4c-kpi"><span>{totals.total}</span>Key Deliverables</div>
            <div className="v4c-kpi-sep"/>
            <div className="v4c-kpi"><span>37</span>Programmes</div>
            <div className="v4c-kpi-sep"/>
            <div className="v4c-kpi"><span>27</span>Districts</div>
            <div className="v4c-kpi-sep"/>
            <div className="v4c-kpi"><span>5</span>Divisions</div>
          </div>

          {/* Scroll hint */}
          <div className="v4c-scroll-hint">
            <div className="v4c-scroll-mouse"><div className="v4c-scroll-wheel"/></div>
            <span>Scroll to explore</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          DISTRICT HEALTH INTELLIGENCE (MAP)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="v4c-section-alt">
        <div className="v4c-section-alt-inner">
          <SectionHead
            tag="Intelligence"
            title="District Health Index"
            sub={`27 districts · Composite performance score · Hover to explore · State average: ${stateAvg}%`}
          />
          <div className="v4c-map-layout">
            {/* Left — choropleth */}
            <div className="v4c-map-card v4c-reveal">
              <div className="v4c-map-card-hd">Arunachal Pradesh — FY 2025-26</div>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ center: [94.483, 28.056], scale: 2780 }}
                width={460} height={200}
                style={{ width: '100%', height: 'auto' }}
              >
                <Geographies geography="/ap-districts.geojson">
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const name  = geo.properties.DISTRICT;
                      const score = DIST_SCORES[name] ?? 42;
                      const fill  = distColor(score);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="var(--v4-bg)"
                          strokeWidth={0.8}
                          onMouseEnter={() => setHoveredDist({ name, score })}
                          onMouseLeave={() => setHoveredDist(null)}
                          style={{
                            default: { outline: 'none', opacity: 0.86, transition: 'opacity 0.12s' },
                            hover:   { outline: 'none', opacity: 1, filter: 'brightness(1.18)' },
                            pressed: { outline: 'none' },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>

              {hoveredDist && (
                <div className="v4c-map-tooltip">
                  <div className="v4c-mtt-name">{hoveredDist.name}</div>
                  <div className="v4c-mtt-score" style={{ color: distColor(hoveredDist.score) }}>
                    {hoveredDist.score}% on track
                  </div>
                  <div className="v4c-mtt-bar">
                    <div className="v4c-mtt-bar-fill"
                      style={{ width: `${hoveredDist.score}%`, background: distColor(hoveredDist.score) }}/>
                  </div>
                </div>
              )}

              <div className="v4c-map-legend">
                {[['#00C97A','On Track (≥55%)'],['#FFB020','Caution (40–54%)'],['#FF3B5C','Critical (<40%)']].map(([c,l]) => (
                  <div key={l} className="v4c-ml-item">
                    <span className="v4c-ml-dot" style={{ background: c }}/>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — district leaderboard */}
            <div className="v4c-dist-panel">
              <div className="v4c-dist-block v4c-reveal v4c-reveal--d1">
                <div className="v4c-dp-label">Top Performers</div>
                {sortedDistricts.slice(0, 5).map(([name, score], i) => (
                  <DistRow key={name} name={name} score={score} rank={i + 1}/>
                ))}
              </div>

              <div className="v4c-dist-block v4c-reveal v4c-reveal--d2">
                <div className="v4c-dp-label">Needs Immediate Attention</div>
                {[...sortedDistricts].reverse().slice(0, 5).map(([name, score], i) => (
                  <DistRow key={name} name={name} score={score} rank={Object.keys(DIST_SCORES).length - i}/>
                ))}
              </div>

              <div className="v4c-avg-card v4c-reveal v4c-reveal--d3">
                <div className="v4c-avg-left">
                  <div className="v4c-avg-label">State Average</div>
                  <div className="v4c-avg-sub">Composite health performance</div>
                </div>
                <div className="v4c-avg-val">{stateAvg}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FIVE DIVISION CARDS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="v4c-section">
        <SectionHead
          tag="Performance"
          title="Programme Health by Division"
          sub="Key deliverables tracked across all 5 NHM divisions · Click any card to deep-dive"
        />
        <div className="v4c-div-grid">
          {divData.map(({ div, meta, brk, kds }, i) => (
            <DivCard
              key={div.id}
              div={div} meta={meta} brk={brk} kds={kds}
              onExplore={() => onSelectDivision(div)}
            />
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CRITICAL ALERTS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="v4c-section-alt">
        <div className="v4c-section-alt-inner">
          <div className="v4c-section-tag" style={{ marginBottom: 0 }}>Alerts</div>
          <div className="v4c-alert-hd" style={{ marginTop: 12 }}>
            <div className="v4c-alert-pulse"/>
            <span className="v4c-alert-title">Immediate Attention Required</span>
            <span className="v4c-alert-badge">{totals.gap} indicators</span>
          </div>
          <p className="v4c-alert-sub">
            Indicators below 75% of national target, ranked by performance deficit
          </p>

          <div className="v4c-alert-table v4c-reveal">
            <div className="v4c-at-head">
              <span>Division</span>
              <span>Indicator</span>
              <span>Achievement</span>
              <span>Target</span>
              <span style={{ textAlign: 'right' }}>Gap</span>
            </div>
            {allCritical.map(({ kd, div, meta }, i) => (
              <AlertRow key={i} kd={kd} divLabel={meta.label || div.label} divColor={meta.color}/>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          NFHS PROGRESS STORY
          ══════════════════════════════════════════════════════════════════ */}
      <div className="v4c-section">
        <SectionHead
          tag="Progress Story"
          title="How Far Has Arunachal Pradesh Come?"
          sub="NFHS-4 (2015-16) → NFHS-5 (2019-21) · Key health indicators showing state progress"
        />
        <div className="v4c-nfhs-layout">
          {/* Chart */}
          <div className="v4c-nfhs-chart-card v4c-reveal">
            <div className="v4c-nfhs-chart-hd">NFHS-4 vs NFHS-5 · Selected Indicators (%)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={NFHS_CHART}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
                barGap={3}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--v4-border)"/>
                <XAxis
                  type="number" domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'var(--v4-ink3)', fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis
                  type="category" dataKey="name" width={170}
                  tick={{ fontSize: 11, fill: 'var(--v4-ink2)' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTip/>} cursor={{ fill: 'var(--v4-border)' }}/>
                <Bar dataKey="nfhs4" name="NFHS-4 (2015-16)" fill="rgba(238,244,255,0.18)" radius={[0,3,3,0]} maxBarSize={12}/>
                <Bar dataKey="nfhs5" name="NFHS-5 (2019-21)" fill="#0099FF" radius={[0,3,3,0]} maxBarSize={12}/>
              </BarChart>
            </ResponsiveContainer>
            <div className="v4c-nfhs-legend">
              <div className="v4c-nl-item">
                <span className="v4c-nl-dot" style={{ background: 'rgba(238,244,255,0.25)' }}/>
                NFHS-4 (2015-16)
              </div>
              <div className="v4c-nl-item">
                <span className="v4c-nl-dot" style={{ background: '#0099FF' }}/>
                NFHS-5 (2019-21)
              </div>
            </div>
          </div>

          {/* Win callouts */}
          <div className="v4c-wins">
            {WINS.map((w, i) => (
              <div key={i} className={`v4c-win-card v4c-reveal v4c-reveal--d${i + 1}`}
                style={{ '--wc': w.color }}>
                <div className="v4c-win-delta">{w.delta}</div>
                <div className="v4c-win-lbl">{w.lbl}</div>
                <div className="v4c-win-sub">{w.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════════ */}
      <footer className="v4c-footer">
        <div className="v4c-footer-brand">
          <APEmblem size={28}/>
          <div>
            <div className="v4c-footer-title">NHM Arunachal Pradesh · Health Dashboard</div>
            <div className="v4c-footer-sub">
              Data: NPCC April 2026 · HMIS FY 2025-26 · NFHS-5 (2019-21)
            </div>
          </div>
        </div>
        <div className="v4c-footer-right">
          <span className="v4c-footer-pif">Built by Pahlé India Foundation</span>
          <button className="v4c-footer-btn" onClick={() => setReportDiv(DIVISIONS[0])}>
            Generate AI Report
          </button>
        </div>
      </footer>

      {reportDiv && <ReportModal division={reportDiv} onClose={() => setReportDiv(null)}/>}
    </div>
  );
}
