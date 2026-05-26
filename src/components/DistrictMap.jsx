/* ═══════════════════════════════════════════════════════════════════════════
   DistrictMap.jsx — Interactive AP District Choropleth
   Full-width map → click district → GSAP panel slides in from right
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import geoData from '../data/apDistricts.json';
import { KD_TREE } from '../data/kdData';
import { DIVISIONS } from '../data/programs';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
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

const STATUS_COLORS = {
  achieved: { bg: '#dcfce7', text: '#166534', label: 'On Track' },
  close:    { bg: '#fef9c3', text: '#854d0e', label: 'Caution'  },
  gap:      { bg: '#fee2e2', text: '#991b1b', label: 'Gap'      },
  neutral:  { bg: '#f1f5f9', text: '#475569', label: 'No Data'  },
};

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function DistrictMap() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedDiv, setSelectedDiv]           = useState(null);
  const [hoveredDistrict, setHoveredDistrict]   = useState(null);
  const [panelOpen, setPanelOpen]               = useState(false);

  const bodyRef  = useRef(null);
  const panelRef = useRef(null);
  const mapRef   = useRef(null);

  /* All KDs for the selected division */
  const divKDs = selectedDiv
    ? Object.values(KD_TREE[selectedDiv]?.programmes || {}).flatMap(p => p.kds || [])
    : [];

  /* ── Animate panel open ── */
  useEffect(() => {
    if (!panelRef.current || !mapRef.current) return;

    if (panelOpen) {
      /* Slide panel in from right, shrink map */
      gsap.fromTo(
        panelRef.current,
        { width: 0, opacity: 0, x: 60 },
        { width: '42%', opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }
      );
      gsap.to(mapRef.current, { width: '58%', duration: 0.45, ease: 'power3.out' });
    } else {
      /* Collapse panel, restore map to full width */
      gsap.to(panelRef.current, {
        width: 0, opacity: 0, x: 40, duration: 0.3, ease: 'power2.in',
      });
      gsap.to(mapRef.current, { width: '100%', duration: 0.3, ease: 'power2.in' });
    }
  }, [panelOpen]);

  /* Animate content inside panel when district changes */
  useEffect(() => {
    if (!panelRef.current || !selectedDistrict) return;
    gsap.fromTo(
      panelRef.current.querySelectorAll('.v5-map-prog-btn, .v5-map-district-name, .v5-map-district-hint'),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.15 }
    );
  }, [selectedDistrict, selectedDiv]);

  function handleDistrictClick(name) {
    const opening = !panelOpen;
    setSelectedDistrict(name);
    setSelectedDiv(null);
    if (opening) setPanelOpen(true);
  }

  function handleClose() {
    setPanelOpen(false);
    setTimeout(() => {
      setSelectedDistrict(null);
      setSelectedDiv(null);
    }, 300);
  }

  return (
    <section className="v5-map-section">

      {/* ── Section header ── */}
      <div className="v5-map-header">
        <h2 className="v5-map-title">
          {selectedDistrict
            ? <><span className="v5-map-title-state">Arunachal Pradesh</span><span className="v5-map-title-sep"> — </span><span className="v5-map-title-district">{selectedDistrict}</span><span className="v5-map-title-perf"> Performance</span></>
            : 'Arunachal Pradesh Health Performance'
          }
        </h2>
        {!selectedDistrict && (
          <span className="v5-map-cta-pill">Select a district to begin</span>
        )}
      </div>

      {/* ── Body: map + sliding panel ── */}
      <div className="v5-map-body" ref={bodyRef}>

        {/* LEFT — Choropleth map */}
        <div className="v5-map-left" ref={mapRef}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [94.5, 27.9], scale: 5500 }}
            style={{ width: '100%', height: '100%' }}
          >
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const name = geo.properties.DISTRICT || '';
                  const isSelected = selectedDistrict === name;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleDistrictClick(name)}
                      onMouseEnter={() => setHoveredDistrict(name)}
                      onMouseLeave={() => setHoveredDistrict(null)}
                      style={{
                        default: {
                          fill: isSelected ? '#0f6b30' : '#4aab6d',
                          stroke: '#fff',
                          strokeWidth: isSelected ? 1.8 : 0.6,
                          outline: 'none',
                          cursor: 'pointer',
                          opacity: isSelected ? 1 : 0.82,
                        },
                        hover: {
                          fill: '#17823e',
                          stroke: '#fff',
                          strokeWidth: 1,
                          outline: 'none',
                          cursor: 'pointer',
                          opacity: 1,
                        },
                        pressed: { fill: '#0f6b30', outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {hoveredDistrict && (
            <div className="v5-map-tooltip">{hoveredDistrict}</div>
          )}
        </div>

        {/* RIGHT — Sliding panel */}
        <div className="v5-map-right" ref={panelRef}>

          {/* State 2 — district selected, pick programme */}
          {selectedDistrict && !selectedDiv && (
            <div className="v5-map-district-panel">
              <div className="v5-map-district-name">
                <span className="v5-map-district-pin">📍</span>
                {selectedDistrict}
                <button className="v5-map-close-btn" onClick={handleClose}>✕</button>
              </div>
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
                      <span className="v5-map-prog-dot" />
                      {div.fullName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* State 3 — district + programme → KD table */}
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

              <div className="v5-map-kd-table-wrap">
                <table className="v5-map-kd-table">
                  <thead>
                    <tr>
                      <th>Indicator</th>
                      <th>Achievement</th>
                      <th>Target</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divKDs.map((kd, i) => {
                      const s  = kdStatus(kd);
                      const sc = STATUS_COLORS[s];
                      return (
                        <tr key={i}>
                          <td className="v5-kd-indicator">{kd.indicator}</td>
                          <td className="v5-kd-val">{kd.achievedLabel ?? '—'}</td>
                          <td className="v5-kd-val">{kd.targetLabel ?? '—'}</td>
                          <td>
                            <span className="v5-kd-badge" style={{ background: sc.bg, color: sc.text }}>
                              {sc.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="v5-map-data-note">
                * State-level data — district-level breakdown coming soon
              </p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
