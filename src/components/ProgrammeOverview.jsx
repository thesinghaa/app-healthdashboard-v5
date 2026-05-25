/* ═══════════════════════════════════════════════════════════════════════════
   ProgrammeOverview.jsx  — ICED-style interactive division zones
   5 columns: hover → others dim, bar chart slides up, stats float in
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo } from 'react';
import { DIVISIONS } from '../data/programs';
import { KD_TREE } from '../data/kdData';

/* ── helpers ──────────────────────────────────────────────────────────────── */
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

/* ── colour palette ───────────────────────────────────────────────────────── */
const DIV_COLORS = {
  rch:  { main: '#1B6FF5', light: '#DBEAFE', dark: '#1D4ED8' },
  ndcp: { main: '#D97706', light: '#FEF3C7', dark: '#92400E' },
  ncd:  { main: '#7C3AED', light: '#EDE9FE', dark: '#5B21B6' },
  hss:  { main: '#0F9B82', light: '#CCFBF1', dark: '#065F46' },
  hrh:  { main: '#DC4B2A', light: '#FEE2E2', dark: '#9B1C1C' },
};

/* ── filled SVG icons ─────────────────────────────────────────────────────── */
const ICONS = {
  rch: [
    /* Pregnant mother & child */
    <svg key="r1" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#DBEAFE"/>
      <circle cx="18" cy="14" r="7" fill="#1D4ED8"/>
      <path d="M8 50 Q8 31 13 27 L18 25 L25 26 Q30 29 31 37 L31 50Z" fill="#1B6FF5"/>
      <ellipse cx="26" cy="35" rx="6" ry="5" fill="#93C5FD"/>
      <circle cx="39" cy="21" r="5.5" fill="#BFDBFE"/>
      <circle cx="39" cy="21" r="3.5" fill="#1D4ED8"/>
      <path d="M33 46 Q33 34 36 31 L39 29 L42 31 Q45 34 45 46Z" fill="#3B82F6"/>
    </svg>,
    /* Baby with smile */
    <svg key="r2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#DBEAFE"/>
      <circle cx="28" cy="20" r="10" fill="#BFDBFE"/>
      <circle cx="28" cy="20" r="8"  fill="#93C5FD"/>
      <circle cx="24" cy="18.5" r="2" fill="#1D4ED8"/>
      <circle cx="32" cy="18.5" r="2" fill="#1D4ED8"/>
      <path d="M24 23 Q28 27 32 23" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <ellipse cx="28" cy="34" rx="13" ry="9" fill="#1B6FF5"/>
      <path d="M17 37 Q22 42 28 40 Q34 42 39 37 Q35 48 28 48 Q21 48 17 37Z" fill="#3B82F6" opacity="0.75"/>
    </svg>,
    /* Vaccination syringe */
    <svg key="r3" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#DBEAFE"/>
      <rect x="11" y="23" width="30" height="10" rx="5" fill="#1B6FF5"/>
      <rect x="41" y="25.5" width="9"  height="5"  rx="2.5" fill="#1D4ED8"/>
      <rect x="6"  y="24.5" width="7"  height="7"  rx="1.5" fill="#1D4ED8"/>
      <rect x="13" y="25.5" width="17" height="5"  rx="2.5" fill="#93C5FD"/>
      <line x1="23" y1="20" x2="23" y2="23" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="19" x2="29" y2="23" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="35" y1="20" x2="35" y2="23" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M50 33 Q52 38 49 38 Q46 38 47 33 Q48 31 49.5 31 Q51 31 50 33Z" fill="#93C5FD"/>
    </svg>,
  ],

  ndcp: [
    /* Lungs — TB / respiratory */
    <svg key="n1" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#FEF3C7"/>
      <rect x="25" y="9" width="6" height="14" rx="3" fill="#92400E"/>
      <path d="M25 20 Q11 19 9 30 Q7 41 14 45 Q18 47 22 43 L24 36 L25 20Z" fill="#D97706"/>
      <path d="M31 20 Q45 19 47 30 Q49 41 42 45 Q38 47 34 43 L32 36 L31 20Z" fill="#D97706"/>
      <path d="M15 34 Q17 38 21 38" stroke="#FEF3C7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M41 34 Q39 38 35 38" stroke="#FEF3C7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <circle cx="16" cy="27" r="3.5" fill="#92400E" opacity="0.55"/>
      <circle cx="40" cy="25" r="3"   fill="#92400E" opacity="0.55"/>
    </svg>,
    /* Mosquito — vector-borne / malaria */
    <svg key="n2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#FEF3C7"/>
      <circle cx="28" cy="18" r="5" fill="#92400E"/>
      <line x1="28" y1="23" x2="28" y2="13" stroke="#92400E" strokeWidth="1.5"/>
      <ellipse cx="28" cy="30" rx="5" ry="10" fill="#D97706"/>
      <ellipse cx="15" cy="24" rx="11" ry="5" fill="#FCD34D" opacity="0.75" transform="rotate(-15 15 24)"/>
      <ellipse cx="41" cy="24" rx="11" ry="5" fill="#FCD34D" opacity="0.75" transform="rotate(15 41 24)"/>
      <line x1="23" y1="28" x2="11" y2="34" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="23" y1="33" x2="13" y2="41" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="33" y1="28" x2="45" y2="34" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="33" y1="33" x2="43" y2="41" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>,
    /* Capsule pill — disease management */
    <svg key="n3" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#FEF3C7"/>
      <path d="M13 24 Q13 15 22 15 L28 15 L28 33 L22 33 Q13 33 13 24Z" fill="#D97706"/>
      <path d="M28 15 L34 15 Q43 15 43 24 Q43 33 34 33 L28 33Z" fill="#92400E"/>
      <line x1="28" y1="15" x2="28" y2="33" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      <ellipse cx="19" cy="41" rx="7.5" ry="4" fill="#F59E0B"/>
      <ellipse cx="37" cy="43" rx="6"   ry="3.5" fill="#92400E"/>
      <rect x="23" y="38.5" width="8"  height="2.5" rx="1.25" fill="white" opacity="0.6"/>
      <rect x="26" y="35.5" width="2.5" height="8"  rx="1.25" fill="white" opacity="0.6"/>
    </svg>,
  ],

  ncd: [
    /* Heart with ECG — cardiovascular */
    <svg key="nc1" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#EDE9FE"/>
      <path d="M28 43 C28 43 7 30 7 17 C7 11 12 7 17 7 C21 7 25 10 28 14 C31 10 35 7 39 7 C44 7 49 11 49 17 C49 30 28 43 28 43Z" fill="#7C3AED"/>
      <polyline points="9,26 15,26 18,18 22,34 26,23 29,28 32,21 36,26 47,26" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    /* Glucometer — diabetes */
    <svg key="nc2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#EDE9FE"/>
      <rect x="13" y="14" width="30" height="26" rx="6" fill="#7C3AED"/>
      <rect x="17" y="18" width="22" height="14" rx="3" fill="#EDE9FE"/>
      <rect x="18" y="19.5" width="20" height="2.5" rx="1.25" fill="#C4B5FD"/>
      <rect x="18" y="23.5" width="20" height="2.5" rx="1.25" fill="#C4B5FD"/>
      <rect x="18" y="27.5" width="13" height="2.5" rx="1.25" fill="#C4B5FD"/>
      <path d="M28 44 Q31 49 28 51 Q25 49 28 44Z" fill="#DC2626"/>
      <circle cx="28" cy="42" r="3.5" fill="#EF4444"/>
    </svg>,
    /* Eye — vision / blindness control */
    <svg key="nc3" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#EDE9FE"/>
      <path d="M5 28 C5 28 13 13 28 13 C43 13 51 28 51 28 C51 28 43 43 28 43 C13 43 5 28 5 28Z" fill="white"/>
      <circle cx="28" cy="28" r="11" fill="#7C3AED"/>
      <circle cx="28" cy="28" r="7"  fill="#4C1D95"/>
      <circle cx="31" cy="24.5" r="3" fill="white" opacity="0.65"/>
      <path d="M5 28 C5 28 13 13 28 13" stroke="#8B5CF6" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M28 13 C43 13 51 28 51 28" stroke="#8B5CF6" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>,
  ],

  hss: [
    /* Hospital building */
    <svg key="h1" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    </svg>,
    /* Medicine capsule */
    <svg key="h2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#CCFBF1"/>
      <path d="M9 28 Q9 17 20 17 L28 17 L28 39 L20 39 Q9 39 9 28Z" fill="#0F9B82"/>
      <path d="M28 17 L36 17 Q47 17 47 28 Q47 39 36 39 L28 39Z" fill="#065F46"/>
      <line x1="28" y1="17" x2="28" y2="39" stroke="rgba(255,255,255,0.55)" strokeWidth="2"/>
      <ellipse cx="17" cy="45" rx="8"  ry="4"   fill="#14B8A6" transform="rotate(-18 17 45)"/>
      <ellipse cx="39" cy="45" rx="7"  ry="3.5" fill="#0F9B82"  transform="rotate(15 39 45)"/>
      <rect x="22" y="9" width="12" height="8" rx="4" fill="#5EEAD4"/>
      <line x1="28" y1="9" x2="28" y2="17" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    </svg>,
    /* Ambulance */
    <svg key="h3" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#CCFBF1"/>
      <rect x="5"  y="22" width="33" height="18" rx="3" fill="#0F9B82"/>
      <path d="M38 26 L47 26 L47 40 L38 40Z" fill="#065F46"/>
      <path d="M38 26 L45 26 L45 31 L38 31Z" fill="#CCFBF1" opacity="0.5"/>
      <circle cx="14" cy="42" r="5.5" fill="#065F46"/>
      <circle cx="14" cy="42" r="2.5" fill="#CCFBF1"/>
      <circle cx="36" cy="42" r="5.5" fill="#065F46"/>
      <circle cx="36" cy="42" r="2.5" fill="#CCFBF1"/>
      <rect x="11" y="27" width="13" height="3"  rx="1.5" fill="white"/>
      <rect x="16" y="22" width="3"  height="13" rx="1.5" fill="white"/>
      <rect x="7"  y="20" width="7"  height="3"  rx="1.5" fill="#EF4444"/>
      <rect x="17" y="20" width="7"  height="3"  rx="1.5" fill="#1D4ED8"/>
    </svg>,
  ],

  hrh: [
    /* Doctor figure with coat */
    <svg key="hr1" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <path d="M24 38 Q20 46 20 50 Q20 54 24 54" stroke="#DC4B2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="24" cy="54" r="3.5" fill="#DC4B2A"/>
    </svg>,
    /* Medical team */
    <svg key="hr2" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#FEE2E2"/>
      <circle cx="28" cy="15" r="7.5" fill="#DC4B2A"/>
      <path d="M17 46 Q17 30 21 27 L28 25 L35 27 Q39 30 39 46Z" fill="#DC4B2A"/>
      <circle cx="13" cy="20" r="6" fill="#9B1C1C"/>
      <path d="M7  44 Q7  31 10 28 L13 27 L18 28 Q21 31 21 42" fill="#9B1C1C"/>
      <circle cx="43" cy="20" r="6" fill="#EF4444"/>
      <path d="M35 42 Q35 31 38 28 L43 27 L48 28 Q51 31 51 44" fill="#EF4444"/>
      <rect x="24" y="30" width="8" height="10" rx="2.5" fill="white" opacity="0.75"/>
      <rect x="26" y="32" width="4" height="1.8" rx="0.9" fill="#DC4B2A"/>
      <rect x="27.1" y="31" width="1.8" height="4" rx="0.9" fill="#DC4B2A"/>
    </svg>,
    /* Training clipboard */
    <svg key="hr3" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" fill="#FEE2E2"/>
      <rect x="11" y="13" width="34" height="38" rx="3.5" fill="#DC4B2A"/>
      <rect x="14" y="18" width="28" height="29" rx="2.5" fill="white"/>
      <rect x="22" y="9" width="12" height="8" rx="3.5" fill="#9B1C1C"/>
      <rect x="25" y="10.5" width="6" height="4" rx="2" fill="#FEE2E2"/>
      <rect x="18" y="24" width="20" height="2.5" rx="1.25" fill="#DC4B2A" opacity="0.35"/>
      <rect x="18" y="30" width="20" height="2.5" rx="1.25" fill="#DC4B2A" opacity="0.35"/>
      <rect x="18" y="36" width="14" height="2.5" rx="1.25" fill="#DC4B2A" opacity="0.35"/>
      <circle cx="41" cy="23" r="9"   fill="#059669" opacity="0.18"/>
      <polyline points="36,22 40,27 47,18" stroke="#059669" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
  ],
};

/* ── icon positions within each zone (fixed 3 slots) ─────────────────────── */
const ICON_LAYOUTS = [
  { top: 16, left: 12,  size: 72 },   /* top-left  */
  { top: 14, right: 12, size: 62 },   /* top-right */
  { top: 188, left: 18, size: 66 },   /* mid-left  */
];

/* ── bar chart ────────────────────────────────────────────────────────────── */
function DivBarChart({ brk }) {
  const bars = [
    { label: 'On Track',   count: brk.achieved, color: '#059669' },
    { label: 'Caution',    count: brk.close,    color: '#D97706' },
    { label: 'Critical',   count: brk.gap,      color: '#DC2626' },
    { label: 'Not Mapped', count: brk.neutral,  color: '#71717A' },
  ].filter(b => b.count > 0);
  const maxV = Math.max(...bars.map(b => b.count), 1);
  return (
    <div className="pov-chart">
      <div className="pov-chart-title">KD Breakdown</div>
      {bars.map(b => (
        <div key={b.label} className="pov-bar-row">
          <div className="pov-bar-label">{b.label}</div>
          <div className="pov-bar-track">
            <div
              className="pov-bar-fill"
              style={{ '--bar-w': `${(b.count / maxV) * 100}%`, background: b.color }}
            />
          </div>
          <div className="pov-bar-count">{b.count}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ProgrammeOverview({ onSelectDivision, totalKDs = 0 }) {
  const [hoveredDiv, setHoveredDiv] = useState(null);

  const divData = useMemo(() =>
    DIVISIONS.map(div => ({
      div,
      brk: getDivBreakdown(div.id),
      clr: DIV_COLORS[div.id] || DIV_COLORS.rch,
    })),
  []);

  return (
    <div className="pov-wrap">

      <div className="v4l-section-header">
        <div className="v4l-section-tag">NHM Programme Overview</div>
        <h2 className="v4l-section-title">5 Divisions · 37 Programmes · {totalKDs} Key Deliverables</h2>
        <p className="v4l-section-sub">Arunachal Pradesh · FY 2025-26 · Hover a division to explore KD breakdown</p>
      </div>

      {/* ── Icon zones ─────────────────────────────────────────────────── */}
      <div className={`pov-zones${hoveredDiv ? ' pov-has-active' : ''}`}>
        {divData.map(({ div, brk, clr }) => {
          const isActive = hoveredDiv === div.id;
          const icons = ICONS[div.id] || [];
          const onTrackPct = brk.total > 0 ? Math.round((brk.achieved / brk.total) * 100) : 0;

          return (
            <div
              key={div.id}
              className={`pov-zone${isActive ? ' pov-zone--active' : ''}`}
              style={{ '--zclr': clr.main, '--zlight': clr.light, '--zdark': clr.dark }}
              onMouseEnter={() => setHoveredDiv(div.id)}
              onMouseLeave={() => setHoveredDiv(null)}
              onClick={() => onSelectDivision(div)}
            >
              {/* Scattered icons */}
              {icons.map((icon, i) => {
                const pos = ICON_LAYOUTS[i];
                if (!pos) return null;
                return (
                  <div
                    key={i}
                    className="pov-icon-wrap"
                    style={{
                      top:   pos.top,
                      left:  pos.left,
                      right: pos.right,
                      width: pos.size,
                      height: pos.size,
                    }}
                  >
                    {icon}
                  </div>
                );
              })}

              {/* Division label box (ICED-style bordered box) */}
              <div className="pov-div-box">
                <span className="pov-div-lbl">{div.label}</span>
                <span className="pov-div-full">{div.fullName}</span>
              </div>

              {/* Floating stats — appear on hover */}
              <div className="pov-stats-row">
                <div className="pov-stat">
                  <span className="pov-stat-val" style={{ color: clr.main }}>{brk.total}</span>
                  <span className="pov-stat-lbl">KDs</span>
                </div>
                <div className="pov-stat">
                  <span className="pov-stat-val" style={{ color: '#059669' }}>{onTrackPct}%</span>
                  <span className="pov-stat-lbl">On Track</span>
                </div>
                {brk.gap > 0 && (
                  <div className="pov-stat">
                    <span className="pov-stat-val" style={{ color: '#DC2626' }}>{brk.gap}</span>
                    <span className="pov-stat-lbl">Critical</span>
                  </div>
                )}
              </div>

              {/* Bar chart slides up from bottom */}
              <DivBarChart brk={brk} />
            </div>
          );
        })}
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="pov-cards">
        {divData.map(({ div, brk, clr }) => {
          const onTrackPct = brk.total > 0 ? Math.round((brk.achieved / brk.total) * 100) : 0;
          return (
            <div
              key={div.id}
              className="pov-card"
              style={{ '--card-clr': clr.main, '--card-bg': clr.light, '--card-txt': clr.dark }}
              onClick={() => onSelectDivision(div)}
            >
              <div className="pov-card-top">
                <span className="pov-card-lbl">{div.label}</span>
                {brk.gap > 0 && <span className="pov-card-alert">{brk.gap} Critical</span>}
              </div>
              <div className="pov-card-name">{div.fullName}</div>
              <div className="pov-card-metric">
                <span className="pov-card-num">{onTrackPct}%</span>
                <span className="pov-card-unit"> On Track</span>
              </div>
              <div className="pov-card-sub">{brk.achieved} of {brk.total} KDs achieved</div>
              <div className="pov-card-bar">
                {brk.total > 0 && <>
                  <div style={{ width: `${(brk.achieved / brk.total) * 100}%`, background: '#059669' }} />
                  <div style={{ width: `${(brk.close   / brk.total) * 100}%`, background: '#D97706' }} />
                  <div style={{ width: `${(brk.gap     / brk.total) * 100}%`, background: '#DC2626' }} />
                </>}
              </div>
              <div className="pov-card-foot">
                <span style={{ color: '#059669' }}>{brk.achieved} on track</span>
                <span style={{ color: '#D97706' }}>{brk.close} caution</span>
                <span style={{ color: '#DC2626' }}>{brk.gap} gap</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="v4l-section-source">
        Source: NPCC Document (NHM Arunachal Pradesh, April 2026) · HMIS FY 2025-26
      </div>
    </div>
  );
}
