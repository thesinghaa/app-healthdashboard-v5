import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { DIVISIONS, STATUS_CONFIG } from '../data/programs';
import { KD_TREE } from '../data/kdData';

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
  rch:  '#00b5cc',
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

const PROG_ALIASES = {
  'maternal-health':   ['mh', 'anc', 'mmr', 'rch', 'maternal'],
  'jsy':               ['janani suraksha', 'cash transfer', 'institutional delivery'],
  'cac':               ['abortion', 'contraception'],
  'pcpndt':            ['sex ratio', 'srb', 'gender'],
  'child-health':      ['rbsk', 'imr', 'child', 'newborn', 'sncu'],
  'immunization':      ['uip', 'vaccine', 'vaccination', 'bcg', 'pentavalent'],
  'adolescent-health': ['rksk', 'adolescent', 'sabla', 'kishori'],
  'family-planning':   ['fp', 'contraceptive', 'sterilisation', 'iucd', 'ppiucd'],
  'nutrition':         ['poshan', 'anaemia', 'stunting', 'wasting', 'ifa'],
  'nvhcp':             ['vector', 'endemic', 'kala azar', 'visceral'],
  'tb':                ['ntep', 'tuberculosis', 'tb mukt', 'nikshay', 'dots'],
  'nlep':              ['leprosy', 'hansen'],
  'ncvbdcp':           ['malaria', 'dengue', 'chikungunya', 'filaria', 'snv'],
  'idsp':              ['surveillance', 'disease', 'outbreak'],
  'nscaem':            ['sickle cell', 'blood cell', 'thalassemia'],
  'np-ncd':            ['ncd', 'non communicable', 'hypertension', 'htn'],
  'pmndp':             ['diabetes', 'blood sugar', 'ncd'],
  'nppc':              ['palliative', 'pain'],
  'nmhp':              ['mental health', 'psychiatry', 'psychology'],
  'nphce':             ['elderly', 'geriatric', 'ageing'],
  'npcbvi':            ['blindness', 'cataract', 'vision', 'eye'],
  'nppcd':             ['deafness', 'hearing', 'ear'],
  'nohp':              ['oral', 'dental', 'teeth'],
  'niddcp':            ['iodine', 'iodised salt', 'goitre'],
  'ntcp':              ['tobacco', 'smoking', 'cotpa'],
  'npcchh':            ['climate', 'heat', 'environment', 'air quality'],
  'hss-urban':         ['urban', 'city', 'nuhm'],
  'hss-rural':         ['rural', 'hwc', 'ayushman arogya'],
  'drugs-diagnostics': ['drugs', 'diagnostics', 'medicine', 'lab', 'supply chain'],
  'mpw':               ['multipurpose worker', 'asha', 'community worker'],
  'staff-nurse':       ['nurse', 'nursing', 'sn'],
  'cho':               ['community health officer', 'cho'],
  'lab-tech':          ['lab technician', 'laboratory', 'lt'],
  'pharmacist':        ['pharmacy', 'pharma'],
  'medical-officer':   ['doctor', 'mbbs', 'mo', 'physician'],
  'specialist':        ['specialist', 'surgeon', 'gynaecologist', 'paediatrician'],
  'pm-abhim':          ['abhim', 'health infrastructure', 'iphl', 'xv fc', '15th finance'],
};

// Build full-text search index from all KD indicators + statements
const PROG_KD_INDEX = (() => {
  const index = {};
  Object.values(KD_TREE).forEach(divData => {
    Object.entries(divData.programmes || {}).forEach(([progId, progData]) => {
      const terms = [];
      (progData.kds || []).forEach(kd => {
        if (kd.indicator) terms.push(kd.indicator.toLowerCase());
        if (kd.statement) terms.push(kd.statement.toLowerCase());
        if (kd.type)      terms.push(kd.type.toLowerCase());
        if (kd.unit)      terms.push(kd.unit.toLowerCase());
        if (kd.source)    terms.push(kd.source.toLowerCase());
      });
      index[progId] = terms;
    });
  });
  return index;
})();

function matchesSearch(progId, query) {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const label = (PROG_LABEL[progId] || progId).toLowerCase();
  if (label.includes(q) || progId.toLowerCase().includes(q)) return true;
  if ((PROG_ALIASES[progId] || []).some(alias => alias.includes(q) || q.includes(alias))) return true;
  return (PROG_KD_INDEX[progId] || []).some(term => term.includes(q));
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
                  <stop offset="0%"   stopColor="#00cce5" stopOpacity="0.38"/>
                  <stop offset="50%"  stopColor="#00b5cc" stopOpacity="0.28"/>
                  <stop offset="100%" stopColor="#00cce5" stopOpacity="0.38"/>
                </linearGradient>
              </defs>
              <path d="M0,55 C240,95 480,25 720,60 C960,95 1200,35 1440,65 L1440,130 L0,130 Z" fill="url(#wg1)"/>
            </svg>
            <svg viewBox="0 0 1440 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#00b5cc" stopOpacity="0.45"/>
                  <stop offset="50%"  stopColor="#007a8f" stopOpacity="0.32"/>
                  <stop offset="100%" stopColor="#00b5cc" stopOpacity="0.45"/>
                </linearGradient>
              </defs>
              <path d="M0,85 C180,48 360,108 540,78 C720,48 900,98 1080,72 C1260,46 1380,90 1440,82 L1440,130 L0,130 Z" fill="url(#wg2)"/>
            </svg>
            <svg viewBox="0 0 1440 130" preserveAspectRatio="none">
              <path d="M0,108 C300,80 600,118 900,98 C1100,82 1300,110 1440,102 L1440,130 L0,130 Z" fill="rgba(0,181,204,0.50)"/>
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
              <div className="home-right">
                <div className="home-legend">
                  <span className="hl-item"><span className="hl-dot hl-red" />Immediate Attention</span>
                  <span className="hl-item"><span className="hl-dot hl-yellow" />Under Review</span>
                  <span className="hl-item"><span className="hl-dot hl-green" />On Track</span>
                </div>
                <div className="home-nav-search">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="hns-icon">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="hns-input"
                    type="text"
                    placeholder="Search here for programme…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="hns-clear" onClick={() => setSearchQuery('')}>×</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Five-column grid ── */}
        <div className="home-grid lp-grid">
          {DIVISIONS.map(div => {
            const accent = DIV_ACCENT[div.id] || '#00b5cc';
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
