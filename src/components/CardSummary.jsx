import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { KD_TREE } from '../data/kdData';

function kdGap(kd) {
  if (kd.achievement == null || kd.target == null) return null;
  return kd.lowerIsBetter
    ? kd.target - kd.achievement
    : kd.achievement - kd.target;
}

function getMostCriticalKD(divisionId) {
  const div = KD_TREE[divisionId];
  if (!div) return null;
  let worst = null, worstGap = Infinity;
  Object.values(div.programmes || {}).forEach(prog => {
    (prog.kds || []).forEach(kd => {
      const g = kdGap(kd);
      if (g === null) return;
      if (g < worstGap) { worstGap = g; worst = kd; }
    });
  });
  return worst;
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
      if (g >= 0)    achieved++;
      else if (g >= -10) close++;
      else gap++;
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

export default function CardSummary({ divisionId, stats }) {
  const criticalKD  = useMemo(() => getMostCriticalKD(divisionId), [divisionId]);
  const kdBreakdown = useMemo(() => getKDBreakdown(divisionId),    [divisionId]);

  const achievePct = criticalKD?.target > 0
    ? Math.min(100, Math.max(0, (criticalKD.achievement / criticalKD.target) * 100))
    : 0;
  const gap = criticalKD ? kdGap(criticalKD) : null;

  const donutTrace = useMemo(() => [{
    type: 'pie',
    hole: 0.64,
    values: [stats.red, stats.yellow, stats.green],
    labels: ['Critical', 'Caution', 'On Track'],
    marker: {
      colors: ['#f87171', '#fbbf24', '#34d399'],
      line: { color: 'rgba(5,7,18,0.85)', width: 3 },
    },
    textinfo: 'none',
    hovertemplate: '<b>%{label}</b>: %{value}<extra></extra>',
    sort: false,
  }], [stats]);

  const donutLayout = useMemo(() => ({
    ...LAYOUT_BASE,
    width: 190,
    height: 190,
  }), []);

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

  return (
    <div className="lnd-summary">
      <div className="lnd-summary-rule" />

      {/* ── Stats strip ── */}
      <div className="lnd-ss-strip">
        {[
          { val: stats.total,  lbl: 'Programmes',    cls: '' },
          { val: stats.red,    lbl: 'Critical',       cls: 'red' },
          { val: stats.yellow, lbl: 'Caution',        cls: 'yellow' },
          { val: stats.green,  lbl: 'On Track',       cls: 'green' },
        ].map(({ val, lbl, cls }) => (
          <div key={lbl} className={`lnd-ss-cell ${cls ? `lnd-ss-${cls}` : ''}`}>
            <span className="lnd-ss-num">{val}</span>
            <span className="lnd-ss-lbl">{lbl}</span>
          </div>
        ))}
      </div>

      {/* ── Main two columns ── */}
      <div className="lnd-summary-body">

        {/* Left — Critical indicator + KD donut */}
        <div className="lnd-sb-left">
          <p className="lnd-sb-sect">Most Critical Indicator</p>

          {criticalKD ? (
            <>
              <p className="lnd-sb-kd-name">{criticalKD.indicator}</p>

              <div className="lnd-sb-bar-track">
                <div
                  className="lnd-sb-bar-fill"
                  style={{ width: `${achievePct}%` }}
                />
              </div>

              <div className="lnd-sb-kd-stats">
                <div>
                  <span className="lnd-sb-big">{criticalKD.achievement}{criticalKD.unit}</span>
                  <span className="lnd-sb-meta"> achieved</span>
                </div>
                <span className="lnd-sb-tgt">Target {criticalKD.target}{criticalKD.unit}</span>
              </div>

              {gap !== null && gap < 0 && (
                <span className="lnd-sb-gap-pill">
                  {Math.abs(gap).toFixed(1)}{criticalKD.unit} below target
                </span>
              )}
            </>
          ) : (
            <p className="lnd-sb-meta">No gap data available</p>
          )}

          {/* KD breakdown donut */}
          <div className="lnd-sb-kd-donut-wrap">
            <p className="lnd-sb-sect" style={{ marginTop: 0 }}>Key Deliverable Status</p>
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

        {/* Right — Programme status donut */}
        <div className="lnd-sb-right">
          <p className="lnd-sb-sect">Programme Status</p>
          <div className="lnd-sb-donut-wrap">
            <div style={{ position: 'relative', width: 190, height: 190 }}>
              <Plot
                data={donutTrace}
                layout={donutLayout}
                config={{ displayModeBar: false, responsive: false }}
              />
              <div className="lnd-sb-donut-center">
                <span className="lnd-sb-dc-num">{stats.total}</span>
                <span className="lnd-sb-dc-lbl">Prog.</span>
              </div>
            </div>
            <div className="lnd-sb-donut-legend">
              {[
                { lbl: 'Critical', val: stats.red,    c: '#f87171' },
                { lbl: 'Caution',  val: stats.yellow, c: '#fbbf24' },
                { lbl: 'On Track', val: stats.green,  c: '#34d399' },
              ].filter(d => d.val > 0).map(d => (
                <div key={d.lbl} className="lnd-sb-dl-row">
                  <span className="lnd-sb-dl-dot"  style={{ background: d.c }} />
                  <span className="lnd-sb-dl-val">{d.val}</span>
                  <span className="lnd-sb-dl-lbl">{d.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
