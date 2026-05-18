import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { DIVISIONS, STATUS_CONFIG } from '../data/programs';

function getSummary() {
  let total = 0, red = 0, yellow = 0, green = 0;
  DIVISIONS.forEach(div => {
    div.programs.forEach(p => {
      total++;
      if (p.status === 'red') red++;
      else if (p.status === 'yellow') yellow++;
      else green++;
    });
  });
  return { total, red, yellow, green };
}

const STATUS_TEXT = { red: 'Critical', yellow: 'Caution', green: 'On Track' };

const DIV_ACCENT = {
  rch:  '#E8500A',
  ndcp: '#B83A0A',
  ncd:  '#7C3A0A',
  hss:  '#A0620A',
  hrh:  '#2C2520',
};

const DIV_BG = {
  rch:  'rgba(232,80,10,0.04)',
  ndcp: 'rgba(184,58,10,0.04)',
  ncd:  'rgba(124,58,10,0.04)',
  hss:  'rgba(160,98,10,0.04)',
  hrh:  'rgba(44,37,32,0.04)',
};

const DIV_DESC = {
  rch:  'Maternal, child & reproductive health',
  ndcp: 'TB, leprosy, vector-borne & communicable',
  ncd:  'Hypertension, diabetes, cancer & mental health',
  hss:  'Facilities, quality & digital health systems',
  hrh:  'Workforce staffing & capacity',
};

const PROG_LABEL = {
  'maternal-health':   'Maternal Health',
  'jsy':               'JSY',
  'cac':               'CAC',
  'pcpndt':            'PCPNDT',
  'child-health':      'Child Health',
  'immunization':      'Immunization',
  'adolescent-health': 'Adolescent Health',
  'family-planning':   'Family Planning',
  'nutrition':         'Nutrition',
  'nvhcp':             'NVHCP',
  'tb':                'TB Mukt Bharat',
  'nlep':              'NLEP',
  'ncvbdcp':           'NCVBDCP',
  'idsp':              'IDSP',
  'nscaem':            'NSCAEM & Blood Cell',
  'np-ncd':            'NP-NCD',
  'pmndp':             'PMNDP',
  'nppc':              'NPPC',
  'nmhp':              'NMHP',
  'nphce':             'NPHCE',
  'npcbvi':            'NPCBVI',
  'nppcd':             'NPPCD',
  'nohp':              'NOHP',
  'niddcp':            'NIDDCP',
  'ntcp':              'NTCP',
  'npcchh':            'NPCCHH',
  'hss-urban':         'Urban Health',
  'hss-rural':         'Rural Health',
  'drugs-diagnostics': 'Drugs & Diagnostics',
  'mpw':               'MPW (F+M)',
  'staff-nurse':       'Staff Nurse',
  'cho':               'CHO',
  'lab-tech':          'Lab Technicians',
  'pharmacist':        'Pharmacists',
  'medical-officer':   'Medical Officers',
  'specialist':        'Clinical Specialists',
  'pm-abhim':          'PM-ABHIM',
};

function matchesSearch(progId, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const label = (PROG_LABEL[progId] || progId).toLowerCase();
  return label.includes(q) || progId.toLowerCase().includes(q);
}

export default function HomePage({ onSelectProgram, onSelectDivision }) {
  const rootRef = useRef(null);
  const summary = getSummary();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.glass-navbar',    { y: -32, opacity: 0, duration: 0.55 })
        .from('.home-state-name', { y: 12,  opacity: 0, duration: 0.45 }, '-=0.25')
        .from('.home-state-sub',  { y: 8,   opacity: 0, duration: 0.38 }, '-=0.30')
        .from('.hs-pill',         { y: 10,  opacity: 0, duration: 0.38, stagger: 0.07 }, '-=0.25')
        .from('.hl-item',         { x: 8,   opacity: 0, duration: 0.32, stagger: 0.06 }, '-=0.20')
        .from('.lp-breather',     { opacity: 0, duration: 0.30 }, '-=0.10')
        .from('.lp-card',         { y: 24,  opacity: 0, duration: 0.50, stagger: 0.08 }, '-=0.15');

      gsap.to('.hs-red .hs-val', {
        opacity: 0.65, duration: 1.4, repeat: -1, yoyo: true, ease: 'power1.inOut', delay: 1.5,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="home-root" ref={rootRef}>
      <div className="home-bg-gradient" />
      <div className="home-content">

        {/* ── Original navbar — waves + glass pill ── */}
        <div className="home-header">
          <div className="header-waves">
            <svg viewBox="0 0 1440 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#FF7733" stopOpacity="0.38"/>
                  <stop offset="50%"  stopColor="#FF5500" stopOpacity="0.28"/>
                  <stop offset="100%" stopColor="#FF7733" stopOpacity="0.38"/>
                </linearGradient>
              </defs>
              <path d="M0,55 C240,95 480,25 720,60 C960,95 1200,35 1440,65 L1440,130 L0,130 Z" fill="url(#wg1)"/>
            </svg>
            <svg viewBox="0 0 1440 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#FF5500" stopOpacity="0.45"/>
                  <stop offset="50%"  stopColor="#C2410C" stopOpacity="0.32"/>
                  <stop offset="100%" stopColor="#FF5500" stopOpacity="0.45"/>
                </linearGradient>
              </defs>
              <path d="M0,85 C180,48 360,108 540,78 C720,48 900,98 1080,72 C1260,46 1380,90 1440,82 L1440,130 L0,130 Z" fill="url(#wg2)"/>
            </svg>
            <svg viewBox="0 0 1440 130" preserveAspectRatio="none">
              <path d="M0,108 C300,80 600,118 900,98 C1100,82 1300,110 1440,102 L1440,130 L0,130 Z" fill="rgba(255,85,0,0.50)"/>
            </svg>
          </div>
          <div className="home-header-inner">
            <div className="glass-navbar">
              <div className="home-brand">
                <span className="home-state-name">Arunachal Pradesh</span>
                <span className="home-state-sub">NHM Health Dashboard Demo</span>
              </div>
              <div className="home-summary">
                <div className="hs-pill hs-total"><span className="hs-val">{summary.total}</span><span className="hs-lbl">Programmes</span></div>
                <div className="hs-pill hs-red"><span className="hs-val">{summary.red}</span><span className="hs-lbl">Critical</span></div>
                <div className="hs-pill hs-yellow"><span className="hs-val">{summary.yellow}</span><span className="hs-lbl">Caution</span></div>
                <div className="hs-pill hs-green"><span className="hs-val">{summary.green}</span><span className="hs-lbl">On Track</span></div>
              </div>
              <div className="home-search">
                <svg className="home-search-icon" width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input
                  className="home-search-input"
                  type="text"
                  placeholder="Search programme…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="home-search-clear" onClick={() => setSearchQuery('')}>×</button>
                )}
              </div>
              <div className="home-legend">
                <span className="hl-item"><span className="hl-dot hl-red" />Immediate Attention</span>
                <span className="hl-item"><span className="hl-dot hl-yellow" />Under Review</span>
                <span className="hl-item"><span className="hl-dot hl-green" />On Track</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Five-column grid ── */}
        <div className="home-grid lp-grid">
          {DIVISIONS.map(div => {
            const accent = DIV_ACCENT[div.id] || '#E8500A';
            const bg     = DIV_BG[div.id]     || 'rgba(232,80,10,0.04)';
            const counts = { red: 0, yellow: 0, green: 0 };
            div.programs.forEach(p => counts[p.status]++);

            return (
              <div key={div.id} className={`lp-card lp-card--${div.id}`} style={{ '--accent': accent, '--card-bg': bg }}>

                {/* Division header */}
                <div className="lp-card-header">
                  <div className="lp-card-header-row">
                    <span className="lp-div-tag">{div.label}</span>
                    <button
                      className="lp-expand-btn"
                      onClick={() => onSelectDivision(div)}
                      title={`Expand ${div.fullName}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 13 13" fill="none">
                        <path d="M1 5V1H5"       stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 8V12H8"     stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1 1L5.5 5.5"   stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        <path d="M12 12L7.5 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                  <h2 className="lp-div-name">{div.fullName}</h2>
                  <div className="lp-div-counts">
                    {counts.red    > 0 && <span className="lp-count lp-count--red">{counts.red} Critical</span>}
                    {counts.yellow > 0 && <span className="lp-count lp-count--yellow">{counts.yellow} Caution</span>}
                    {counts.green  > 0 && <span className="lp-count lp-count--green">{counts.green} On Track</span>}
                  </div>
                </div>

                {/* Divider */}
                <div className="lp-card-divider" />

                {/* Programme list */}
                <div className="lp-progs">
                  {div.programs.map(prog => {
                    const matched = matchesSearch(prog.id, searchQuery);
                    return (
                    <button
                      key={prog.id}
                      className={`lp-prog lp-prog--${prog.status}${searchQuery && !matched ? ' lp-prog--dimmed' : ''}${searchQuery && matched ? ' lp-prog--highlighted' : ''}`}
                      onClick={() => onSelectProgram(prog, div)}
                    >
                      <div className="lp-prog-left">
                        <div className="lp-prog-text">
                          <span className="lp-prog-name">{PROG_LABEL[prog.id] || prog.name}</span>
                          {prog.keyMetric && <span className="lp-prog-metric">{prog.keyMetric}</span>}
                        </div>
                      </div>
                      <span className={`lp-prog-badge lp-badge--${prog.status}`}>
                        {STATUS_TEXT[prog.status]}
                      </span>
                    </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
