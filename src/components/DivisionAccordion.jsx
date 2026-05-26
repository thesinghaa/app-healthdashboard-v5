/* ═══════════════════════════════════════════════════════════════════════════
   DivisionAccordion.jsx
   5 vertical coloured bars. Click to expand → overview stats + AP map.
   Others compress to thin slivers with rotated label. Click × to close.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { DIVISIONS } from '../data/programs';
import { KD_TREE } from '../data/kdData';
import geoData from '../data/apDistricts.json';

/* ── helpers ──────────────────────────────────────────────────────────────── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

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

/* ── palette ──────────────────────────────────────────────────────────────── */
/* Colors grounded in global health programme conventions:
   RCH  → rose-pink   (Safe Motherhood ribbon, UNICEF maternal)
   NDCP → amber       (Stop TB orange, disease-alert amber)
   NCD  → crimson     (World Heart Day red, cardiovascular dominant)
   HSS  → royal blue  (WHO institutional blue, health systems)
   HRH  → forest green (public health human development green)  */
const DIV_COLORS = {
  rch:  { main: '#A31545', dark: '#280610', light: '#FCE4EC', mid: '#D96080' },
  ndcp: { main: '#B45309', dark: '#271100', light: '#FEF3C7', mid: '#E07820' },
  ncd:  { main: '#B01010', dark: '#1C0000', light: '#FEE2E2', mid: '#DC4040' },
  hss:  { main: '#1A44C8', dark: '#030B24', light: '#E0EAFF', mid: '#5A84F0' },
  hrh:  { main: '#166534', dark: '#041208', light: '#DCFCE7', mid: '#3DAA5E' },
};

/* ── hero icons (white on coloured background) ────────────────────────────── */
const HERO_ICONS = {
  rch: (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mother */}
      <circle cx="26" cy="20" r="12" fill="white"/>
      <path d="M10 74 Q10 48 16 42 L26 38 L37 40 Q44 46 45 60 L45 74Z" fill="white"/>
      <ellipse cx="40" cy="56" rx="9" ry="8" fill="rgba(255,255,255,0.45)"/>
      {/* Child */}
      <circle cx="62" cy="30" r="10" fill="rgba(255,255,255,0.82)"/>
      <path d="M53 72 Q53 55 57 50 L62 48 L67 50 Q71 55 71 72Z" fill="rgba(255,255,255,0.82)"/>
    </svg>
  ),
  ndcp: (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trachea */}
      <rect x="40" y="10" width="8" height="18" rx="4" fill="white"/>
      {/* Left lung */}
      <path d="M40 24 Q22 22 18 36 Q14 50 22 60 Q28 65 34 58 L39 50 L40 24Z" fill="white"/>
      {/* Right lung */}
      <path d="M48 24 Q66 22 70 36 Q74 50 66 60 Q60 65 54 58 L49 50 L48 24Z" fill="white"/>
      <circle cx="24" cy="42" r="5" fill="rgba(0,0,0,0.12)"/>
      <circle cx="64" cy="40" r="4" fill="rgba(0,0,0,0.12)"/>
    </svg>
  ),
  ncd: (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Heart */}
      <path d="M44 72 C44 72 8 50 8 26 C8 16 16 10 25 10 C32 10 38 15 44 22 C50 15 56 10 63 10 C72 10 80 16 80 26 C80 50 44 72 44 72Z" fill="white"/>
      {/* ECG line */}
      <polyline points="12,40 20,40 24,28 30,52 35,32 41,46 47,28 53,40 76,40"
        stroke="rgba(0,0,0,0.18)" strokeWidth="3.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  hss: (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Building */}
      <rect x="12" y="30" width="64" height="46" rx="3" fill="white"/>
      {/* Roof */}
      <rect x="20" y="18" width="48" height="14" rx="2" fill="rgba(255,255,255,0.72)"/>
      {/* H cross */}
      <rect x="36" y="42" width="16" height="4"  rx="2" fill="rgba(0,0,0,0.15)"/>
      <rect x="42" y="36" width="4"  height="16" rx="2" fill="rgba(0,0,0,0.15)"/>
      {/* Windows */}
      <rect x="16" y="52" width="14" height="12" rx="2" fill="rgba(0,0,0,0.10)"/>
      <rect x="58" y="52" width="14" height="12" rx="2" fill="rgba(0,0,0,0.10)"/>
      {/* Door */}
      <rect x="36" y="62" width="16" height="14" rx="2" fill="rgba(0,0,0,0.12)"/>
    </svg>
  ),
  hrh: (
    <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="44" cy="22" r="14" fill="white"/>
      {/* White coat body */}
      <path d="M20 78 Q20 52 27 46 L38 42 L44 40 L50 42 L61 46 Q68 52 68 78Z"
        fill="rgba(255,255,255,0.90)"/>
      {/* Coat lapels */}
      <path d="M38 42 L38 60" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5"/>
      <path d="M50 42 L50 60" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5"/>
      {/* Stethoscope */}
      <path d="M36 48 Q30 60 30 66 Q30 74 36 74"
        stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <circle cx="36" cy="74" r="5" fill="white"/>
    </svg>
  ),
};

/* ── AP map sub-component ─────────────────────────────────────────────────── */
function APDivMap({ fillColor, strokeColor }) {
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ center: [94.5, 27.9], scale: 5500 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Geographies geography={geoData}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={0.7}
              style={{
                default: { outline: 'none' },
                hover:   { fill: strokeColor, outline: 'none', opacity: 0.80 },
                pressed: { outline: 'none' },
              }}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  );
}

/* ── expanded card content ────────────────────────────────────────────────── */
function ExpandedContent({ div, brk, clr, onClose, onExplore }) {
  const onTrackPct = brk.total > 0 ? Math.round((brk.achieved / brk.total) * 100) : 0;
  return (
    <div className="dacc-expanded">

      {/* Close */}
      <button className="dacc-close-btn" onClick={e => { e.stopPropagation(); onClose(); }}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"
             strokeLinecap="round">
          <line x1="4" y1="4" x2="16" y2="16"/>
          <line x1="16" y1="4" x2="4" y2="16"/>
        </svg>
      </button>

      {/* Header */}
      <div className="dacc-exp-head">
        <div className="dacc-exp-label">{div.label}</div>
        <div className="dacc-exp-name">{div.fullName}</div>
      </div>

      {/* Body: two columns */}
      <div className="dacc-exp-body">

        {/* Left — overview */}
        <div className="dacc-exp-left">

          {/* Big stat numbers */}
          <div className="dacc-exp-stats">
            <div className="dacc-exp-stat">
              <span className="dacc-exp-stat-num">{brk.total}</span>
              <span className="dacc-exp-stat-lbl">Key Deliverables</span>
            </div>
            <div className="dacc-exp-stat">
              <span className="dacc-exp-stat-num">{onTrackPct}%</span>
              <span className="dacc-exp-stat-lbl">On Track</span>
            </div>
            <div className="dacc-exp-stat dacc-stat--crit">
              <span className="dacc-exp-stat-num">{brk.gap}</span>
              <span className="dacc-exp-stat-lbl">Critical</span>
            </div>
            <div className="dacc-exp-stat">
              <span className="dacc-exp-stat-num">{div.programs?.length || 0}</span>
              <span className="dacc-exp-stat-lbl">Programmes</span>
            </div>
          </div>

          {/* KD breakdown bar */}
          <div className="dacc-exp-bar-wrap">
            <div className="dacc-exp-bar-ttl">KD Status Breakdown</div>
            <div className="dacc-exp-kd-bar">
              {brk.total > 0 && <>
                <div style={{ width: `${(brk.achieved / brk.total) * 100}%`, background: '#059669' }}/>
                <div style={{ width: `${(brk.close   / brk.total) * 100}%`, background: '#D97706' }}/>
                <div style={{ width: `${(brk.gap     / brk.total) * 100}%`, background: '#DC2626' }}/>
                <div style={{ width: `${(brk.neutral / brk.total) * 100}%`, background: 'rgba(255,255,255,0.22)' }}/>
              </>}
            </div>
            <div className="dacc-exp-legend">
              <span><i style={{ background: '#059669' }}/> On Track&nbsp;({brk.achieved})</span>
              <span><i style={{ background: '#D97706' }}/> Caution&nbsp;({brk.close})</span>
              <span><i style={{ background: '#DC2626' }}/> Critical&nbsp;({brk.gap})</span>
            </div>
          </div>

          {/* Programme chips */}
          <div className="dacc-exp-prog-ttl">Programmes</div>
          <div className="dacc-exp-progs">
            {(div.programs || []).slice(0, 8).map(p => (
              <span key={p.id} className="dacc-exp-prog-chip">{p.name || p.id}</span>
            ))}
            {(div.programs || []).length > 8 && (
              <span className="dacc-exp-prog-chip dacc-chip--more">
                +{(div.programs || []).length - 8} more
              </span>
            )}
          </div>

          {/* CTA */}
          <button className="dacc-exp-cta" onClick={onExplore}>
            Explore Division
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <line x1="3" y1="8" x2="13" y2="8"/>
              <polyline points="9,4 13,8 9,12"/>
            </svg>
          </button>
        </div>

        {/* Right — AP map */}
        <div className="dacc-exp-right">
          <div className="dacc-exp-map-ttl">Arunachal Pradesh</div>
          <div className="dacc-exp-map-wrap">
            <APDivMap fillColor={clr.light} strokeColor={clr.main} />
          </div>
          <div className="dacc-exp-map-note">27 districts · FY 2025-26</div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DivisionAccordion({ onSelectDivision, totalKDs = 0 }) {
  const [activeId, setActiveId] = useState(null);

  const divData = useMemo(() =>
    DIVISIONS.map(div => ({
      div,
      brk: getDivBreakdown(div.id),
      clr: DIV_COLORS[div.id] || DIV_COLORS.rch,
    })),
  []);

  const hasActive = activeId !== null;

  return (
    <div className="dacc-wrap">

      <div className="dacc-section-bar">NHM Programmes</div>
      <div className="v4l-section-header">
        <h2 className="v4l-section-title">5 Divisions · 37 Programmes · {totalKDs} Key Deliverables</h2>
        <p className="v4l-section-sub">
          Arunachal Pradesh · FY 2025-26 · Click a division to explore its overview
        </p>
      </div>

      <div className="dacc-track">
        {divData.map(({ div, brk, clr }) => {
          const isActive  = activeId === div.id;
          const isOther   = hasActive && !isActive;

          return (
            <div
              key={div.id}
              className={[
                'dacc-bar',
                isActive ? 'dacc-bar--active'     : '',
                isOther  ? 'dacc-bar--compressed'  : '',
              ].filter(Boolean).join(' ')}
              style={{
                '--bclr':  clr.main,
                '--bdark': clr.dark,
                '--bmid':  clr.mid,
                '--blight': clr.light,
                '--brgb':  hexToRgb(clr.main),
              }}
              onClick={!isActive ? () => setActiveId(div.id) : undefined}
            >
              {/* ── Collapsed face (shown when NOT active) ── */}
              {!isActive && (
                <div className={`dacc-face${isOther ? ' dacc-face--slim' : ''}`}>
                  <div className="dacc-face-icon">
                    {HERO_ICONS[div.id]}
                  </div>
                  <div className="dacc-face-label">
                    {isOther ? div.label : div.fullName}
                  </div>
                  {!hasActive && (
                    <>
                      <div className="dacc-face-kpi">
                        {brk.total > 0
                          ? `${Math.round((brk.achieved / brk.total) * 100)}% on track`
                          : `${div.programs?.length || 0} programmes`}
                      </div>
                      <button
                        className="dacc-face-explore"
                        onClick={e => { e.stopPropagation(); onSelectDivision(div); }}
                      >
                        Explore
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             width="11" height="11">
                          <line x1="2" y1="7" x2="12" y2="7"/>
                          <polyline points="8,3 12,7 8,11"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Expanded content ── */}
              {isActive && (
                <ExpandedContent
                  div={div}
                  brk={brk}
                  clr={clr}
                  onClose={() => setActiveId(null)}
                  onExplore={() => onSelectDivision(div)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
