import { useMemo, useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { gsap } from 'gsap';
import { KD_TREE } from '../data/kdData';

/* ── helpers ────────────────────────────────────────────────────── */
function kdGap(kd) {
  if (kd.achievement == null || kd.target == null) return null;
  return kd.lowerIsBetter
    ? kd.target - kd.achievement
    : kd.achievement - kd.target;
}

function getMostCriticalKD(divisionId) {
  const div = KD_TREE[divisionId];
  if (!div) return null;
  let worst = null, worstGap = Infinity, worstProgId = null;
  Object.entries(div.programmes || {}).forEach(([progId, prog]) => {
    (prog.kds || []).forEach(kd => {
      const g = kdGap(kd);
      if (g === null) return;
      if (g < worstGap) { worstGap = g; worst = kd; worstProgId = progId; }
    });
  });
  return worst ? { kd: worst, programmeId: worstProgId } : null;
}

function getKDBreakdown(divisionId) {
  const div = KD_TREE[divisionId];
  if (!div) return { achieved: 0, close: 0, gap: 0, total: 0 };
  let achieved = 0, close = 0, gap = 0, total = 0;
  Object.values(div.programmes || {}).forEach(prog => {
    (prog.kds || []).forEach(kd => {
      total++;
      const g = kdGap(kd);
      if (g === null) return;
      if (g >= 0)        achieved++;
      else if (g >= -10) close++;
      else               gap++;
    });
  });
  return { achieved, close, gap, total };
}

const LAYOUT_BASE = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(0,0,0,0)',
  margin: { t: 0, b: 0, l: 0, r: 0, pad: 0 },
  showlegend: false,
  hoverlabel: {
    bgcolor: 'rgba(5,7,18,0.96)',
    bordercolor: 'rgba(0,181,204,0.40)',
    font: { color: '#ffffff', size: 12, family: 'JetBrains Mono' },
  },
};

/* ── component ──────────────────────────────────────────────────── */
export default function CardSummary({ divisionId, stats, isActive, onKDClick }) {
  const criticalResult = useMemo(() => getMostCriticalKD(divisionId), [divisionId]);
  const criticalKD     = criticalResult?.kd;
  const programmeId    = criticalResult?.programmeId;
  const kdBreakdown    = useMemo(() => getKDBreakdown(divisionId), [divisionId]);

  const cardRef = useRef(null);
  const [displayPct, setDisplayPct] = useState(0);

  const achievePct = criticalKD?.target > 0
    ? Math.min(100, Math.max(0, (criticalKD.achievement / criticalKD.target) * 100))
    : 0;
  const gap = criticalKD ? kdGap(criticalKD) : null;
  const isBelowTarget = gap !== null && gap < 0;

  /* ── GSAP: animate product card on becoming active ────────────── */
  useEffect(() => {
    if (!isActive || !cardRef.current) return;
    gsap.killTweensOf(cardRef.current);
    gsap.fromTo(
      cardRef.current,
      { x: 28, opacity: 0, scale: 0.93 },
      { x: 0, opacity: 1, scale: 1, duration: 0.52, ease: 'power3.out', delay: 0.08 },
    );
    const obj = { val: 0 };
    gsap.to(obj, {
      val: achievePct,
      duration: 0.85,
      delay: 0.18,
      ease: 'power2.out',
      onUpdate: () => setDisplayPct(Math.round(obj.val)),
    });
  }, [isActive, achievePct]);

  useEffect(() => { if (!isActive) setDisplayPct(0); }, [isActive]);

  /* ── Plotly: district perf donut (target vs achieved) ─────────── */
  const perfTrace = useMemo(() => [{
    type: 'pie',
    hole: 0.70,
    values: [Math.max(0.01, displayPct), Math.max(0, 100 - displayPct)],
    labels: ['Achieved', 'Gap'],
    marker: {
      colors: ['#00b5cc', 'rgba(255,255,255,0.06)'],
      line: { color: 'rgba(0,0,0,0)', width: 0 },
    },
    textinfo: 'none',
    hovertemplate: '<b>%{label}</b>: %{value:.0f}%<extra></extra>',
    sort: false,
    direction: 'clockwise',
    rotation: -90,
  }], [displayPct]);

  const perfLayout = useMemo(() => ({
    ...LAYOUT_BASE,
    width: 148,
    height: 148,
  }), []);

  /* ── KD breakdown donut (left col) ────────────────────────────── */
  const kdDonutTrace = useMemo(() => [{
    type: 'pie',
    hole: 0.60,
    values: [kdBreakdown.achieved, kdBreakdown.close, kdBreakdown.gap],
    labels: ['Achieved', 'Close', 'Gap'],
    marker: {
      colors: ['#34d399', '#fbbf24', '#f87171'],
      line: { color: 'rgba(5,7,18,0.85)', width: 3 },
    },
    textinfo: 'none',
    hovertemplate: '<b>%{label}</b>: %{value} KDs<extra></extra>',
    sort: false,
  }], [kdBreakdown]);

  const kdDonutLayout = useMemo(() => ({
    ...LAYOUT_BASE,
    width: 130,
    height: 130,
  }), []);

  /* ── ref label ─────────────────────────────────────────────────── */
  const refLabel = criticalKD
    ? (criticalKD.hmisCode ? `HMIS ${criticalKD.hmisCode}` : `KD-${String(criticalKD.no).padStart(2, '0')}`)
    : 'N/A';

  return (
    <div className="lnd-summary">
      <div className="lnd-summary-rule" />

      {/* ── Stats strip ────────────────────────────────────────── */}
      <div className="lnd-ss-strip">
        {[
          { val: stats.total,  lbl: 'Programmes', cls: '' },
          { val: stats.red,    lbl: 'Critical',   cls: 'red' },
          { val: stats.yellow, lbl: 'Caution',    cls: 'yellow' },
          { val: stats.green,  lbl: 'On Track',   cls: 'green' },
        ].map(({ val, lbl, cls }) => (
          <div key={lbl} className={`lnd-ss-cell ${cls ? `lnd-ss-${cls}` : ''}`}>
            <span className="lnd-ss-num">{val}</span>
            <span className="lnd-ss-lbl">{lbl}</span>
          </div>
        ))}
      </div>

      {/* ── Two-column body ────────────────────────────────────── */}
      <div className="lnd-summary-body">

        {/* Left — KD breakdown donut */}
        <div className="lnd-sb-left">
          <p className="lnd-sb-sect">Key Deliverable Status</p>
          <div className="lnd-sb-kd-donut-wrap">
            <div className="lnd-sb-kd-donut-row">
              <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
                <Plot
                  data={kdDonutTrace}
                  layout={kdDonutLayout}
                  config={{ displayModeBar: false, responsive: false }}
                />
                <div className="lnd-sb-kd-center">
                  <span>{kdBreakdown.total}</span>
                  <span>KDs</span>
                </div>
              </div>
              <div className="lnd-sb-kd-legend">
                {[
                  { lbl: 'Achieved', val: kdBreakdown.achieved, c: '#34d399' },
                  { lbl: 'Close',    val: kdBreakdown.close,    c: '#fbbf24' },
                  { lbl: 'Gap',      val: kdBreakdown.gap,      c: '#f87171' },
                ].map(d => (
                  <div key={d.lbl} className="lnd-sb-kd-leg-row">
                    <span style={{ background: d.c }} className="lnd-sb-kd-leg-dot" />
                    <span className="lnd-sb-kd-leg-num">{d.val}</span>
                    <span className="lnd-sb-kd-leg-lbl">{d.lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right — District performance product card */}
        <div
          ref={cardRef}
          className={`lnd-perf-card${isBelowTarget ? ' lnd-perf-card--crit' : ''}`}
          style={{ opacity: isActive ? undefined : 0, pointerEvents: isActive ? 'auto' : 'none' }}
          onClick={(e) => {
            e.stopPropagation();
            if (criticalKD && onKDClick) onKDClick(criticalKD, programmeId);
          }}
          role="button"
          tabIndex={isActive ? 0 : -1}
          aria-label={`View indicator: ${criticalKD?.indicator}`}
        >
          {/* Header */}
          <div className="lnd-pc-header">
            <span className="lnd-pc-cat">DISTRICT PERFORMANCE</span>
            <span className="lnd-pc-dot" />
            <span className="lnd-pc-ref">{refLabel}</span>
          </div>
          <p className="lnd-pc-title">{criticalKD?.indicator || 'No data'}</p>
          <div className="lnd-pc-rule" />

          {/* Donut + stats side-by-side */}
          <div className="lnd-pc-body">
            <div style={{ position: 'relative', width: 148, height: 148, flexShrink: 0 }}>
              <Plot
                data={perfTrace}
                layout={perfLayout}
                config={{ displayModeBar: false, responsive: false }}
              />
              <div className="lnd-pc-donut-center">
                <span className="lnd-pc-pct">{displayPct}%</span>
                <span className="lnd-pc-pct-lbl">of target</span>
              </div>
            </div>

            <div className="lnd-pc-stat-col">
              <div className="lnd-pc-stat-row">
                <span className="lnd-pc-stat-lbl">Achievement</span>
                <span className="lnd-pc-stat-val">
                  {criticalKD?.achievement != null ? `${criticalKD.achievement}${criticalKD.unit}` : '—'}
                </span>
              </div>
              <div className="lnd-pc-stat-sep" />
              <div className="lnd-pc-stat-row">
                <span className="lnd-pc-stat-lbl">Target</span>
                <span className="lnd-pc-stat-val">
                  {criticalKD?.target != null ? `${criticalKD.target}${criticalKD.unit}` : '—'}
                </span>
              </div>
              <div className="lnd-pc-stat-sep" />
              <div className="lnd-pc-stat-row">
                <span className="lnd-pc-stat-lbl">Gap</span>
                <span className={`lnd-pc-stat-val${isBelowTarget ? ' lnd-pc-stat--gap' : ' lnd-pc-stat--ok'}`}>
                  {isBelowTarget
                    ? `${Math.abs(gap).toFixed(1)}${criticalKD.unit} below`
                    : 'On track'}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="lnd-pc-cta">
            <span>VIEW INDICATOR</span>
            <span className="lnd-pc-cta-arrow">&#x2192;</span>
          </div>
          <p className="lnd-pc-fine">Click to open full indicator breakdown</p>
        </div>

      </div>
    </div>
  );
}
