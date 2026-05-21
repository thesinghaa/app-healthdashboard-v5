import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import ThemeToggle from '../components/ThemeToggle';
import ReportModal from '../components/ReportModal';
import { STATUS_CONFIG } from '../data/programs';
import { KD_TREE } from '../data/kdData';

const STATUS_CLASS = {
  red:    'status-critical',
  yellow: 'status-caution',
  green:  'status-on-track',
};

const STATUS_PILL = {
  red:    { cls: 'st-red',    label: 'Critical' },
  yellow: { cls: 'st-yellow', label: 'Caution'  },
  green:  { cls: 'st-green',  label: 'On Track' },
};

const GRID_CLASS = {
  rch:  'div-grid-2col',
  ndcp: 'div-grid-2col',
  ncd:  'div-grid-3col',
  hss:  'div-grid-1col',
};

const CHIP_COLOR = {
  rch:  '#00b5cc',
  ndcp: '#007a8f',
  ncd:  '#92400E',
  hss:  '#B45309',
};

function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const ratio = kd.achievement / kd.target;
  if (kd.lowerIsBetter) {
    if (ratio <= 1.00) return 'achieved';
    if (ratio <= 1.33) return 'close';
    return 'gap';
  }
  if (ratio >= 1.00) return 'achieved';
  if (ratio >= 0.75) return 'close';
  return 'gap';
}

function computeProgStatus(divisionId, progId) {
  const div = KD_TREE[divisionId];
  if (!div) return 'yellow';
  const prog = (div.programmes || {})[progId];
  if (!prog || !(prog.kds || []).length) return 'yellow';
  let achieved = 0, close = 0, gap = 0;
  prog.kds.forEach(kd => {
    const st = kdStatus(kd);
    if (st === 'neutral') return;
    if (st === 'achieved') achieved++;
    else if (st === 'close') close++;
    else gap++;
  });
  if (gap > 0) return 'red';
  if (close > 0) return 'yellow';
  if (achieved > 0) return 'green';
  return 'yellow';
}

export default function DivisionPage({ division, onBack, onSelectProgram, onCurrentStatus }) {
  const wrapRef = useRef(null);
  const [showReport, setShowReport] = useState(false);

  const statusMap = {};
  division.programs.forEach(p => { statusMap[p.id] = computeProgStatus(division.id, p.id); });

  const sorted = [...division.programs].sort(
    (a, b) => STATUS_CONFIG[statusMap[a.id]].order - STATUS_CONFIG[statusMap[b.id]].order,
  );
  const counts = { red: 0, yellow: 0, green: 0 };
  division.programs.forEach(p => counts[statusMap[p.id]]++);

  const chipColor = CHIP_COLOR[division.id] || '#00b5cc';

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.dv-prog-card', { y: 28, opacity: 0 });
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.dv-topbar',    { y: -16, opacity: 0, duration: 0.32 })
        .to('.dv-prog-card',  { y: 0, opacity: 1, duration: 0.40, stagger: 0.055 }, '-=0.12');
    }, wrapRef);
    return () => ctx.revert();
  }, [division.id]);

  return (
    <>
    <div ref={wrapRef} className="dv-root">

      {/* Teal gradient background */}
      <div className="dv-bg" />

      <div className="dv-layout">

        {/* ── Topbar ─────────────────────────────────────────────── */}
        <div className="dv-topbar">
          <button className="dv-back-btn" onClick={onBack}>
            <span className="dv-back-arrow">←</span> Dashboard
          </button>

          <div className="dv-topbar-center">
            <span className="dv-division-tag" style={{ background: chipColor }}>
              {division.label}
            </span>
            <span className="dv-division-name">{division.fullName}</span>
          </div>

          <div className="dv-counts">
            {counts.red    > 0 && <span className="count-pill cp-red">{counts.red}&nbsp;Critical</span>}
            {counts.yellow > 0 && <span className="count-pill cp-yellow">{counts.yellow}&nbsp;Caution</span>}
            {counts.green  > 0 && <span className="count-pill cp-green">{counts.green}&nbsp;On Track</span>}
            <button className="dv-report-btn" onClick={() => setShowReport(true)}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 4.5h5M4 6.5h5M4 8.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Generate Report
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Programme grid ─────────────────────────────────────── */}
        <div className={`dv-prog-grid ${GRID_CLASS[division.id] || 'div-grid-2col'}`}>
          {sorted.map(prog => (
            <div
              key={prog.id}
              className={`dv-prog-card ${STATUS_CLASS[statusMap[prog.id]]}`}
              onClick={() => onSelectProgram(prog, division)}
              role="button"
              tabIndex={0}
              title={`View ${prog.name} — key deliverables and indicators`}
              onKeyDown={e => e.key === 'Enter' && onSelectProgram(prog, division)}
            >
              {/* Header */}
              <div className="dv-card-header">
                <span className="dv-card-name">{prog.name}</span>
                <span className={`status-pill ${STATUS_PILL[statusMap[prog.id]].cls}`}>
                  {STATUS_PILL[statusMap[prog.id]].label}
                </span>
              </div>

              {/* Key metric */}
              {prog.keyMetric && (
                <div className="dv-card-metric">{prog.keyMetric}</div>
              )}

              {/* Status reason */}
              {prog.statusReason && (
                <p className="dv-card-reason">{prog.statusReason}</p>
              )}

              {/* Up to 3 metric chips */}
              {prog.keyMetrics && prog.keyMetrics.length > 0 && (
                <div className="dv-card-chips">
                  {prog.keyMetrics.slice(0, 3).map((m, i) => (
                    <div key={i} className="dv-chip">
                      <span className="dv-chip-val">{m.value}</span>
                      <span className="dv-chip-lbl">{m.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="dv-card-footer">
                <span className="dv-card-cta">View Indicators →</span>
                {prog.currentStatus && (
                  <button
                    className="dv-cs-btn"
                    onClick={e => { e.stopPropagation(); onCurrentStatus(prog, division); }}
                    onKeyDown={e => { e.stopPropagation(); e.key === 'Enter' && onCurrentStatus(prog, division); }}
                    tabIndex={0}
                  >
                    Current Status
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>

    {showReport && (
      <ReportModal
        divisionId={division.id}
        divisionName={division.fullName}
        onClose={() => setShowReport(false)}
      />
    )}
    </>
  );
}
