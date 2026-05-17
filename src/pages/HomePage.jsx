import { useEffect, useRef } from 'react';
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

const DIV_DESC = {
  rch:  'Maternal, child & reproductive health',
  ndcp: 'TB, leprosy, vector-borne & communicable diseases',
  ncd:  'Hypertension, diabetes, cancer & mental health',
  hss:  'Facilities, quality & digital health systems',
  hrh:  'Workforce staffing, deployment & capacity',
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
  'tb':                'TB Mukt Bharat Abhiyan',
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
  'cho':               'Comm. Health Officer',
  'lab-tech':          'Lab Technicians',
  'pharmacist':        'Pharmacists',
  'medical-officer':   'Medical Officers',
  'specialist':        'Clinical Specialists',
  'pm-abhim':          'PM-ABHIM',
};

export default function HomePage({ onSelectProgram, onSelectDivision }) {
  const rootRef = useRef(null);
  const summary = getSummary();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.lp-topbar', { y: -20, opacity: 0, duration: 0.45, ease: 'power3.out' });
      gsap.from('.lp-col', {
        y: 28, opacity: 0, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.15,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="lp-root" ref={rootRef}>

      {/* Topbar */}
      <div className="lp-topbar">
        <div className="lp-brand">
          <span className="lp-state">Arunachal Pradesh</span>
          <span className="lp-subtitle">NHM Health Dashboard — FY 2025-26</span>
        </div>
        <div className="lp-summary">
          <div className="lp-pill lp-pill--total">
            <span className="lp-pill-val">{summary.total}</span>
            <span className="lp-pill-lbl">Programmes</span>
          </div>
          <div className="lp-pill lp-pill--red">
            <span className="lp-pill-val">{summary.red}</span>
            <span className="lp-pill-lbl">Critical</span>
          </div>
          <div className="lp-pill lp-pill--yellow">
            <span className="lp-pill-val">{summary.yellow}</span>
            <span className="lp-pill-lbl">Caution</span>
          </div>
          <div className="lp-pill lp-pill--green">
            <span className="lp-pill-val">{summary.green}</span>
            <span className="lp-pill-lbl">On Track</span>
          </div>
        </div>
        <div className="lp-legend">
          <span className="lp-leg"><span className="lp-dot lp-dot--red" />Critical</span>
          <span className="lp-leg"><span className="lp-dot lp-dot--yellow" />Caution</span>
          <span className="lp-leg"><span className="lp-dot lp-dot--green" />On Track</span>
        </div>
      </div>

      {/* Five-column grid */}
      <div className="lp-grid">
        {DIVISIONS.map(div => {
          const accent = DIV_ACCENT[div.id] || '#E8500A';
          const counts = { red: 0, yellow: 0, green: 0 };
          div.programs.forEach(p => counts[p.status]++);

          return (
            <div key={div.id} className={`lp-col lp-col--${div.id}`}>

              {/* Division header */}
              <div className="lp-col-header" style={{ borderTopColor: accent }}>
                <div className="lp-col-header-top">
                  <span className="lp-div-tag" style={{ color: accent }}>{div.label}</span>
                  <button
                    className="lp-expand-btn"
                    onClick={() => onSelectDivision(div)}
                    title={`Expand ${div.fullName}`}
                  >
                    <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                      <path d="M1 5V1H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8V12H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 1L5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M12 12L7.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <h2 className="lp-div-name">{div.fullName}</h2>
                <p className="lp-div-desc">{DIV_DESC[div.id]}</p>
                <div className="lp-div-counts">
                  {counts.red    > 0 && <span className="lp-count lp-count--red">{counts.red} Critical</span>}
                  {counts.yellow > 0 && <span className="lp-count lp-count--yellow">{counts.yellow} Caution</span>}
                  {counts.green  > 0 && <span className="lp-count lp-count--green">{counts.green} On Track</span>}
                </div>
              </div>

              {/* Programme rows — each gets flex:1, divides column height equally */}
              <div className="lp-progs">
                {div.programs.map(prog => (
                  <button
                    key={prog.id}
                    className={`lp-prog lp-prog--${prog.status}`}
                    onClick={() => onSelectProgram(prog, div)}
                  >
                    <div className="lp-prog-inner">
                      <span className="lp-prog-name">
                        {PROG_LABEL[prog.id] || prog.name}
                      </span>
                      {prog.keyMetric && (
                        <span className="lp-prog-metric">{prog.keyMetric}</span>
                      )}
                    </div>
                    <span className={`lp-prog-badge lp-badge--${prog.status}`}>
                      {STATUS_TEXT[prog.status]}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
