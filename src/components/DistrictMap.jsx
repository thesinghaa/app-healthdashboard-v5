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

/* ── Curated programme highlights (4 items per division) ──────────────────── */
const HIGHLIGHTS = {
  rch: [
    { icon: '🤰', title: 'Institutional deliveries — 16,947 / 24,229', sub: 'Target 90% · 70% achieved · KD #6 · HMIS M2',                              pct: 70,  status: 'close'    },
    { icon: '🩺', title: '4+ ANC check-ups — 16,460 / 24,229',         sub: 'Target 80% · 1st trimester registration 64.8% · KD #3',                    pct: 68,  status: 'close'    },
    { icon: '💉', title: 'Full immunisation (FIC) — 18,024 / 19,823',  sub: 'Target 90% · MR-2 95% · Penta-1 to 3 dropout 0.3% · KD #28',              pct: 91,  status: 'achieved' },
    { icon: '👨‍⚕️', title: 'Male sterilisation — 0 conducted',            sub: '0% increase from 2022-23 baseline · PPIUCD acceptance 2.13% · KD #47',    label: 'Critical', status: 'gap' },
  ],
  ndcp: [
    { icon: '🦟', title: 'Malaria — 25/25 districts API<1',            sub: '18 districts certified malaria-free · ABER 10.76% · KD #89',               pct: 100, status: 'achieved' },
    { icon: '🫁', title: 'TB — Presumptive exam 2,205/lakh',           sub: '86% tested for Rifampicin resistance · NPY 95% · KD #72-73',               label: 'Above target', status: 'achieved' },
    { icon: '🐕', title: 'Rabies — ARV availability only 23%',         sub: 'Target 70% · RIG availability 9% · critical stock-out at PHC level · KD #79', label: 'Critical', status: 'gap' },
    { icon: '🩸', title: 'Hepatitis C — 2,314 patients treated',       sub: '77% of target · Hep B 47% · pregnant women screened 60% · KD #82-84',      pct: 77,  status: 'close'    },
  ],
  ncd: [
    { icon: '🩺', title: 'NCD screening — HTN/DM at 19%',             sub: '77% population registered · target 30% screened · KD #112-114',            label: 'Below target', status: 'close' },
    { icon: '💊', title: 'Dialysis (PMNDP) — 16/15 districts',        sub: '119% of session target · peritoneal dialysis 100% · KD #120-122',          pct: 107, status: 'achieved' },
    { icon: '👁️', title: 'Cataract ops — 2,642 of 4,500 target',      sub: '59% achievement · eye donation 0 of 10 target · KD #117-118',              pct: 59,  status: 'gap'      },
    { icon: '🧠', title: 'Mental Health — 16/28 districts functional', sub: '8,855 persons catered (Q3) · 79% of persons target · KD #107-108',         pct: 57,  status: 'close'    },
  ],
  hss: [
    { icon: '🏥', title: 'Ayushman Arogya Mandir — 412/582 functional', sub: '70.79% operational · 99% providing 12 expanded services · KD #153-154',  pct: 71,  status: 'close'    },
    { icon: '📋', title: 'NQAS certification — 10 nationally certified',sub: '6% of target · Kayakalp >70%: 45 of 126 facilities · KD #141-142',        label: 'Critical', status: 'gap' },
    { icon: '🔧', title: 'Biomedical equipment uptime (BMMP)',          sub: '9,040 equipment tagged · DH 99.96% · CHC 99.98% · PHC 99.99% · KD #171', pct: 100, status: 'achieved' },
    { icon: '🩸', title: 'Voluntary blood donation — 9,206 units',      sub: '88.6% of 10,392 target till Feb 2026 · component separator: 0/3 · KD #147', pct: 89, status: 'close'  },
  ],
  hrh: [
    { icon: '👥', title: 'NHM HR in position — 87% of approved posts',  sub: 'Target 100% · 13% vacancy gap across all cadres · KD #168',              pct: 87,  status: 'close'    },
    { icon: '👨‍⚕️', title: 'Medical Officers (MBBS) — 96% of IPHS norm', sub: 'Target 85% · exceeds benchmark · KD #169',                              pct: 96,  status: 'achieved' },
    { icon: '🔬', title: 'Clinical specialists — 47% of IPHS norm',     sub: 'Target 50% · marginally below benchmark · KD #169',                      pct: 47,  status: 'close'    },
    { icon: '💊', title: 'Pharmacists 97% · Lab technicians 100%',      sub: 'Pharmacist target 85% · Lab tech target 55% · both exceed norms · KD #169', label: 'On track', status: 'achieved' },
  ],
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

          {/* State 3 — district + programme → Highlights */}
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
                    {DIVISIONS.find(d => d.id === selectedDiv)?.label} Programme Highlights
                  </span>
                  <span className="v5-map-hl-sub">Selected key deliverable achievements · FY 2025-26</span>
                </div>

                <div className="v5-map-hl-list">
                  {(HIGHLIGHTS[selectedDiv] || []).map((item, i) => (
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
                * State-level data · FY 2025-26 · District-level breakdown coming soon
              </p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
