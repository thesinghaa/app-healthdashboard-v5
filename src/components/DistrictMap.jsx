/* ═══════════════════════════════════════════════════════════════════════════
   DistrictMap.jsx — Interactive AP District Choropleth
   Default: demographic heatmap with layer toggle (population / density)
   Click district: GSAP panel slides in with programme KD highlights
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import geoData from '../data/apDistricts.json';
import { KD_TREE } from '../data/kdData';
import { DIVISIONS } from '../data/programs';
import { DISTRICT_DEMOGRAPHY, STATE_POP_2021 } from '../data/districtDemography';

/* ── State-level demographic totals ────────────────────────────────────── */
const STATE_AREA   = Object.values(DISTRICT_DEMOGRAPHY).reduce((s, d) => s + d.areaSqKm, 0);
const STATE_DENSITY = Math.round(STATE_POP_2021 / STATE_AREA);

/* ── Layer configs ──────────────────────────────────────────────────────── */
const LAYERS = [
  { id: 'population', label: 'Population' },
  { id: 'density',    label: 'Pop. Density' },
];

/* Population quintile thresholds (pop2021) */
const POP_COLORS = [
  { max: 25000,    fill: '#d1fae5', stroke: '#a7f3d0' }, // very low
  { max: 50000,    fill: '#6ee7b7', stroke: '#34d399' }, // low
  { max: 80000,    fill: '#10b981', stroke: '#059669' }, // medium
  { max: 120000,   fill: '#047857', stroke: '#065f46' }, // high
  { max: Infinity, fill: '#064e3b', stroke: '#022c22' }, // very high
];

/* Density thresholds (/km²) */
const DEN_COLORS = [
  { max: 5,        fill: '#ede9fe', stroke: '#ddd6fe' }, // very sparse
  { max: 15,       fill: '#a78bfa', stroke: '#8b5cf6' }, // sparse
  { max: 35,       fill: '#7c3aed', stroke: '#6d28d9' }, // moderate
  { max: Infinity, fill: '#4c1d95', stroke: '#3b0764' }, // dense
];

const POP_LEGEND = [
  { label: '<25k',    fill: '#d1fae5' },
  { label: '25–50k',  fill: '#6ee7b7' },
  { label: '50–80k',  fill: '#10b981' },
  { label: '80–120k', fill: '#047857' },
  { label: '>120k',   fill: '#064e3b' },
];

const DEN_LEGEND = [
  { label: '<5/km²',  fill: '#ede9fe' },
  { label: '5–15',    fill: '#a78bfa' },
  { label: '15–35',   fill: '#7c3aed' },
  { label: '>35',     fill: '#4c1d95' },
];

function getLayerColor(name, layer) {
  const d = DISTRICT_DEMOGRAPHY[name];
  if (!d) return { fill: '#e5e7eb', stroke: '#d1d5db' };
  if (layer === 'population') {
    const v = d.pop2021;
    return POP_COLORS.find(c => v <= c.max) ?? POP_COLORS.at(-1);
  }
  const v = d.density2011;
  return DEN_COLORS.find(c => v <= c.max) ?? DEN_COLORS.at(-1);
}

function fmtPop(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

/* ── KD helpers ─────────────────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const r = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return r <= 1 ? 'achieved' : r <= 1.33 ? 'close' : 'gap';
  return r >= 1 ? 'achieved' : r >= 0.75 ? 'close' : 'gap';
}

const DIV_COLORS = {
  rch:  { main: '#4F8EF7', light: '#EBF3FF' },
  ndcp: { main: '#F7B23B', light: '#FFFBEB' },
  ncd:  { main: '#9B6FEB', light: '#F3EEFF' },
  hss:  { main: '#2DD4BF', light: '#ECFDF5' },
  hrh:  { main: '#F7614F', light: '#FFF1EE' },
};

const PROG_ICONS = {
  'maternal-health': '🤰', 'child-health': '👶',   'immunization': '💉',
  'family-planning':  '👨‍👩‍👧', 'nutrition':    '🥗',   'adolescent-health': '🧑',
  'cac':              '✂️',  'pcpndt':       '⚖️',   'niddcp':         '🩺',
  'rch-portal':       '💻',
  'ntep':             '🫁',  'nvbdcp':       '🦟',   'nlep':           '🩹',
  'nvhcp':            '🐕',  'nrcp':         '🩸',   'idsp':           '📊',
  'ntcp':             '🚬',  'nmhp':         '🧠',   'nphce':          '🏥',
  'np-ncd':           '🩺',  'npcbvi':       '👁️',   'pmndp':          '💊',
  'nppcd':            '👂',  'nppc':         '🦷',   'nohp':           '👁️',
  'npcchh':           '❤️',
  'hss-urban':        '🏙️',  'qa':           '📋',   'blood-services': '🩸',
  'cphc':             '🏥',  'hrh':          '👥',   'bmmp':           '🔧',
  'hmis-reporting':   '📊',  'ambulance':    '🚑',
};

function getDivHighlights(divId) {
  const tree = KD_TREE[divId];
  if (!tree) return [];
  const all = [];
  Object.entries(tree.programmes || {}).forEach(([progId, prog]) => {
    (prog.kds || []).forEach(kd => all.push({ ...kd, progId }));
  });
  const rank = { gap: 0, close: 1, achieved: 2, neutral: 3 };
  all.sort((a, b) => rank[kdStatus(a)] - rank[kdStatus(b)]);
  const gaps     = all.filter(k => kdStatus(k) === 'gap').slice(0, 2);
  const closes   = all.filter(k => kdStatus(k) === 'close').slice(0, 1);
  const achieved = all.filter(k => kdStatus(k) === 'achieved').slice(0, 1);
  return [...gaps, ...closes, ...achieved].slice(0, 4).map(kd => {
    const s   = kdStatus(kd);
    const pct = (kd.achievement != null && kd.target)
      ? Math.round((kd.achievement / kd.target) * 100) : null;
    return {
      icon:   PROG_ICONS[kd.progId] || '📊',
      title:  kd.achievedLabel ? `${kd.indicator} — ${kd.achievedLabel}` : kd.indicator,
      sub:    [kd.targetLabel ? `Target ${kd.targetLabel}` : null, `KD #${kd.no}`].filter(Boolean).join(' · '),
      pct,
      label:  s === 'gap' ? 'Critical' : null,
      status: s,
    };
  });
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function DistrictMap() {
  const [activeLayer,      setActiveLayer]      = useState('population');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedDiv,      setSelectedDiv]      = useState(null);
  const [hoveredDistrict,  setHoveredDistrict]  = useState(null);
  const [tooltipPos,       setTooltipPos]       = useState({ x: 0, y: 0 });
  const [panelOpen,        setPanelOpen]        = useState(false);

  const bodyRef  = useRef(null);
  const panelRef = useRef(null);
  const mapRef   = useRef(null);

  /* ── Panel open/close animation ── */
  useEffect(() => {
    if (!panelRef.current || !mapRef.current) return;
    if (panelOpen) {
      gsap.fromTo(panelRef.current,
        { width: 0, opacity: 0, x: 60 },
        { width: '42%', opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }
      );
      gsap.to(mapRef.current, { width: '58%', duration: 0.45, ease: 'power3.out' });
    } else {
      gsap.to(panelRef.current, { width: 0, opacity: 0, x: 40, duration: 0.3, ease: 'power2.in' });
      gsap.to(mapRef.current,   { width: '100%', duration: 0.3, ease: 'power2.in' });
    }
  }, [panelOpen]);

  /* ── Animate panel content on district change ── */
  useEffect(() => {
    if (!panelRef.current || !selectedDistrict) return;
    gsap.fromTo(
      panelRef.current.querySelectorAll('.v5-map-prog-btn, .v5-map-district-name, .v5-map-district-hint'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.15 }
    );
  }, [selectedDistrict, selectedDiv]);

  function handleDistrictClick(name) {
    setSelectedDistrict(name);
    setSelectedDiv(null);
    if (!panelOpen) setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setTimeout(() => { setSelectedDistrict(null); setSelectedDiv(null); }, 300);
  }

  const legend = activeLayer === 'population' ? POP_LEGEND : DEN_LEGEND;
  const hovData = hoveredDistrict ? DISTRICT_DEMOGRAPHY[hoveredDistrict] : null;

  return (
    <section className="v5-map-section">

      {/* ── Section heading ── */}
      <h2 className="v5-map-section-heading">Demographic Distribution</h2>

      {/* ── Header ── */}
      <div className="v5-map-header">
        <div className="v5-map-header-left">
          <h2 className="v5-map-title">
            {selectedDistrict
              ? <><span className="v5-map-title-state">Arunachal Pradesh</span><span className="v5-map-title-sep"> — </span><span className="v5-map-title-district">{selectedDistrict}</span><span className="v5-map-title-perf"> Performance</span></>
              : 'Arunachal Pradesh Health Performance'
            }
          </h2>
          {!selectedDistrict && (
            <p className="v5-map-sub">Click any district to view programme indicators</p>
          )}
        </div>

        {/* Layer toggle — only in default state */}
        {!selectedDistrict && (
          <div className="v5-map-layer-toggle">
            {LAYERS.map(l => (
              <button
                key={l.id}
                className={`v5-map-layer-btn${activeLayer === l.id ? ' v5-map-layer-btn--active' : ''}`}
                onClick={() => setActiveLayer(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body: map + sliding panel ── */}
      <div className="v5-map-body" ref={bodyRef}>

        {/* LEFT — Choropleth map */}
        <div className="v5-map-left" ref={mapRef}>

          {/* Demographic info strip — top of map box */}
          <div className="v5-map-demobanner">
            <div className="v5-map-demostat">
              <span className="v5-map-demostat-val">{(STATE_POP_2021 / 100000).toFixed(1)}L</span>
              <span className="v5-map-demostat-lbl">Population (2021 est.)</span>
            </div>
            <div className="v5-map-demostat-div" />
            <div className="v5-map-demostat">
              <span className="v5-map-demostat-val">{(STATE_AREA / 1000).toFixed(0)}k km²</span>
              <span className="v5-map-demostat-lbl">Total Area</span>
            </div>
            <div className="v5-map-demostat-div" />
            <div className="v5-map-demostat">
              <span className="v5-map-demostat-val">{STATE_DENSITY}<span style={{fontSize:10,fontWeight:400}}>/km²</span></span>
              <span className="v5-map-demostat-lbl"><span data-abbr="Avg">Avg</span> Density</span>
            </div>
            <div className="v5-map-demostat-div" />
            <div className="v5-map-demostat">
              <span className="v5-map-demostat-val">27</span>
              <span className="v5-map-demostat-lbl">Districts</span>
            </div>
          </div>

          {/* Map canvas — flex:1, never overlaps scalebar */}
          <div className="v5-map-canvas">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [94.4, 28.1], scale: 7000 }}
              width={800}
              height={460}
              style={{ width: '100%', height: '100%' }}
            >
              <Geographies geography={geoData}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const name       = geo.properties.DISTRICT || '';
                    const isSelected = selectedDistrict === name;
                    const isHovered  = hoveredDistrict === name;
                    const clr        = getLayerColor(name, activeLayer);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleDistrictClick(name)}
                        onMouseEnter={e => {
                          setHoveredDistrict(name);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        style={{
                          default: {
                            fill:        isSelected ? '#0f5f2e' : clr.fill,
                            stroke:      isSelected ? '#fff' : clr.stroke,
                            strokeWidth: isSelected ? 1.8 : 0.7,
                            outline:     'none',
                            cursor:      'pointer',
                            opacity:     isSelected ? 1 : isHovered ? 1 : 0.88,
                            filter:      isSelected ? 'brightness(1.0)' : isHovered ? 'brightness(1.12)' : 'none',
                            transition:  'fill 0.2s, opacity 0.15s',
                          },
                          hover:   { fill: clr.fill, stroke: '#fff', strokeWidth: 1.2, outline: 'none', cursor: 'pointer', filter: 'brightness(1.15)' },
                          pressed: { fill: '#0f5f2e', outline: 'none' },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          {/* Color scale bar — normal flow below map, never overlaps */}
          <div className="v5-map-scalebar">
            <span className="v5-map-scalebar-title">
              {activeLayer === 'population' ? 'Population (2021 est.)' : 'Density per km² (2011)'}
            </span>
            <div className="v5-map-scalebar-track">
              {legend.map((l, i) => (
                <div key={i} className="v5-map-scalebar-seg" style={{ background: l.fill }}>
                  <span className="v5-map-scalebar-tick">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Sliding panel */}
        <div className="v5-map-right" ref={panelRef}>

          {selectedDistrict && !selectedDiv && (() => {
            const demo = DISTRICT_DEMOGRAPHY[selectedDistrict];
            return (
              <div className="v5-map-district-panel">
                <div className="v5-map-district-name">
                  <span className="v5-map-district-pin">📍</span>
                  {selectedDistrict}
                  <button className="v5-map-close-btn" onClick={handleClose}>✕</button>
                </div>

                {/* Demographic strip */}
                {demo && (
                  <div className="v5-map-demo-strip">
                    <div className="v5-map-demo-item">
                      <span className="v5-map-demo-val">{fmtPop(demo.pop2021)}</span>
                      <span className="v5-map-demo-lbl">Population (2021 est.)</span>
                    </div>
                    <div className="v5-map-demo-divider" />
                    <div className="v5-map-demo-item">
                      <span className="v5-map-demo-val">{demo.density2011}<span style={{fontSize:11,fontWeight:400}}>/km²</span></span>
                      <span className="v5-map-demo-lbl">Density (2011)</span>
                    </div>
                    <div className="v5-map-demo-divider" />
                    <div className="v5-map-demo-item">
                      <span className="v5-map-demo-val">{(demo.areaSqKm / 1000).toFixed(1)}k</span>
                      <span className="v5-map-demo-lbl">Area km²</span>
                    </div>
                  </div>
                )}

                <p className="v5-map-district-hint">Select a programme to view indicators</p>
                <div className="v5-map-prog-grid">
                  {DIVISIONS.map(div => {
                    const clr = DIV_COLORS[div.id];
                    return (
                      <button
                        key={div.id}
                        className="v5-map-prog-btn"
                        style={{ '--prog-main': clr.main, '--prog-light': clr.light }}
                        onClick={() => setSelectedDiv(div.id)}
                      >
                        <span className="v5-map-prog-icon">
                          <img src={`/sidebar/${div.label}.png`} alt="" />
                        </span>
                        <span className="v5-map-prog-text">
                          <span className="v5-map-prog-short">{div.label}</span>
                          <span className="v5-map-prog-name">{div.fullName}</span>
                        </span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {selectedDistrict && selectedDiv && (
            <div className="v5-map-kd-panel">
              <div className="v5-map-kd-header">
                <button className="v5-map-back-btn" onClick={() => setSelectedDiv(null)}>
                  ← Back
                </button>
                <div style={{ flex: 1 }}>
                  <div className="v5-map-kd-district">{selectedDistrict}</div>
                  <div className="v5-map-kd-prog-name" style={{ color: DIV_COLORS[selectedDiv].main }}>
                    {DIVISIONS.find(d => d.id === selectedDiv)?.fullName}
                  </div>
                </div>
                <button className="v5-map-close-btn" onClick={handleClose}>✕</button>
              </div>

              <div className="v5-map-hl-wrap">
                <div className="v5-map-hl-title-row">
                  <span className="v5-map-hl-title">
                    {(() => { const lbl = DIVISIONS.find(d => d.id === selectedDiv)?.label; return lbl ? <><span data-abbr={lbl}>{lbl}</span> Programme Highlights</> : 'Programme Highlights'; })()}
                  </span>
                  <span className="v5-map-hl-sub">Key deliverable achievements · <span data-abbr="FY">FY</span> 2025-26</span>
                </div>
                <div className="v5-map-hl-list">
                  {getDivHighlights(selectedDiv).map((item, i) => (
                    <div key={i} className={`v5-map-hl-row v5-map-hl-row--${item.status}`}>
                      <span className="v5-map-hl-icon">{item.icon}</span>
                      <div className="v5-map-hl-body">
                        <div className="v5-map-hl-name">{item.title}</div>
                        <div className="v5-map-hl-desc">{item.sub}</div>
                      </div>
                      <span className={`v5-map-hl-pill v5-map-hl-pill--${item.status}`}>
                        {item.label ?? `${item.pct}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="v5-map-data-note">
                * State-level data · <span data-abbr="FY">FY</span> 2025-26 · District-level breakdown coming soon
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Hover tooltip (portal-style, fixed to cursor) ── */}
      {hoveredDistrict && hovData && (
        <div
          className="v5-map-hover-tip"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10 }}
        >
          <div className="v5-map-hover-tip-name">{hoveredDistrict}</div>
          <div className="v5-map-hover-tip-row">
            <span>Population (2021)</span>
            <span>{hovData.pop2021.toLocaleString('en-IN')}</span>
          </div>
          <div className="v5-map-hover-tip-row">
            <span>Density</span>
            <span>{hovData.density2011}/km²</span>
          </div>
          <div className="v5-map-hover-tip-row">
            <span>HQ</span>
            <span>{hovData.hq}</span>
          </div>
        </div>
      )}

    </section>
  );
}
