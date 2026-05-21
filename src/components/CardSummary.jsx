import { useMemo, useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { gsap } from 'gsap';
import { KD_TREE } from '../data/kdData';

/* ── helpers ────────────────────────────────────────────────────── */
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

function kdDeficit(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return null;
  const ratio = kd.achievement / kd.target;
  return kd.lowerIsBetter ? ratio - 1.0 : 1.0 - ratio;
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

function getDivKDBreakdown(divisionId) {
  const div = KD_TREE[divisionId];
  if (!div) return { achieved: 0, close: 0, gap: 0, total: 0 };
  let achieved = 0, close = 0, gap = 0, total = 0;
  Object.values(div.programmes || {}).forEach(prog => {
    (prog.kds || []).forEach(kd => {
      const st = kdStatus(kd);
      if (st === 'neutral') return;
      total++;
      if (st === 'achieved') achieved++;
      else if (st === 'close') close++;
      else gap++;
    });
  });
  return { achieved, close, gap, total };
}

function getTopKDsByStatus(divisionId, status, n = 3) {
  const div = KD_TREE[divisionId];
  if (!div) return [];
  const results = [];
  Object.entries(div.programmes || {}).forEach(([progId, prog]) => {
    (prog.kds || []).forEach(kd => {
      const st = kdStatus(kd);
      if (st !== status) return;
      const deficit = kdDeficit(kd);
      results.push({ ...kd, programmeId: progId, _deficit: deficit ?? 0 });
    });
  });
  results.sort((a, b) => {
    if (status === 'gap')   return b._deficit - a._deficit;
    if (status === 'close') return a._deficit - b._deficit;
    return a._deficit - b._deficit;
  });
  return results.slice(0, n);
}

function getProgKDBrk(divisionId, progId) {
  const div = KD_TREE[divisionId];
  if (!div) return { achieved: 0, close: 0, gap: 0 };
  const prog = (div.programmes || {})[progId];
  if (!prog) return { achieved: 0, close: 0, gap: 0 };
  let achieved = 0, close = 0, gap = 0;
  (prog.kds || []).forEach(kd => {
    const st = kdStatus(kd);
    if (st === 'neutral') return;
    if (st === 'achieved') achieved++;
    else if (st === 'close') close++;
    else gap++;
  });
  return { achieved, close, gap };
}

/* Returns KDs for a programme filtered by status */
function getProgKDsByStatus(divisionId, progId, status) {
  const div = KD_TREE[divisionId];
  if (!div) return [];
  const prog = (div.programmes || {})[progId];
  if (!prog) return [];
  return (prog.kds || []).filter(kd => kdStatus(kd) === status);
}

/* Returns the single worst KD for a programme (gap > close > achieved, then by deficit) */
function getWorstKD(divisionId, progId) {
  const div = KD_TREE[divisionId];
  if (!div) return null;
  const prog = (div.programmes || {})[progId];
  if (!prog) return null;
  const kds = (prog.kds || []).filter(kd => kdStatus(kd) !== 'neutral');
  if (!kds.length) return null;
  const priority = { gap: 0, close: 1, achieved: 2 };
  return [...kds].sort((a, b) => {
    const pa = priority[kdStatus(a)] ?? 3;
    const pb = priority[kdStatus(b)] ?? 3;
    if (pa !== pb) return pa - pb;
    return (kdDeficit(b) ?? 0) - (kdDeficit(a) ?? 0);
  })[0];
}

const SEG_COLORS = {
  gap:      '#E5293D',   // vivid crimson-red
  close:    '#D97706',   // vivid amber
  achieved: '#16A34A',   // vivid green
};

const SEG_GLOW = {
  gap:      'rgba(229,41,61,',
  close:    'rgba(217,119,6,',
  achieved: 'rgba(22,163,74,',
};

const SEG_LABELS = {
  gap:      'Critical',
  close:    'Caution',
  achieved: 'On Track',
};

const LAYOUT_BASE = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(0,0,0,0)',
  margin: { t: 0, b: 0, l: 0, r: 0, pad: 0 },
  showlegend: false,
  hoverlabel: {
    bgcolor: 'rgba(5,7,18,0.96)',
    bordercolor: 'rgba(0,181,204,0.40)',
    font: { color: '#ffffff', size: 11, family: 'JetBrains Mono' },
  },
};

/* ── component ──────────────────────────────────────────────────── */
export default function CardSummary({ divisionId, programmes = [], activeFilter, isActive, onKDClick, onExploreDivision }) {
  const [selectedSeg, setSelectedSeg] = useState(null);
  const top3Ref = useRef(null);
  const indDonutRef = useRef(null);
  const totalNumRef = useRef(null);
  const legNumRefs = useRef([null, null, null]);
  const progDonutRefs = useRef([]);

  /* ── division-level KD breakdown ───────────────────────────── */
  const brk = useMemo(() => getDivKDBreakdown(divisionId), [divisionId]);

  /* ── resolved filter + filtered progs — must be before effects ── */
  const resolvedFilter = useMemo(() => {
    if (activeFilter) return activeFilter;
    if (programmes.some(p => computeProgStatus(divisionId, p.id) === 'red'))    return 'red';
    if (programmes.some(p => computeProgStatus(divisionId, p.id) === 'yellow')) return 'yellow';
    return 'green';
  }, [activeFilter, programmes, divisionId]);

  const filteredProgs = useMemo(
    () => programmes.filter(p => computeProgStatus(divisionId, p.id) === resolvedFilter),
    [programmes, resolvedFilter, divisionId],
  );

  const n = filteredProgs.length;
  const progCardStyle = n > 0 && n <= 4 ? { flex: 1, minWidth: 0 } : { width: '220px', flexShrink: 0 };

  const sectionLabel =
    resolvedFilter === 'red'    ? 'CRITICAL PROGRAMMES' :
    resolvedFilter === 'yellow' ? 'CAUTION PROGRAMMES'  :
    'ON TRACK PROGRAMMES';

  /* Auto-select most critical segment when card becomes active; clear when inactive */
  useEffect(() => {
    if (!isActive) {
      setSelectedSeg(null);
    } else {
      if (brk.gap > 0)        setSelectedSeg('gap');
      else if (brk.close > 0) setSelectedSeg('close');
      else                    setSelectedSeg('achieved');
    }
  }, [isActive, brk.gap, brk.close, brk.achieved]);

  /* GSAP: animate top-3 panel in when selectedSeg becomes non-null */
  useEffect(() => {
    if (!selectedSeg || !top3Ref.current) return;
    gsap.fromTo(
      top3Ref.current,
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
    );
  }, [selectedSeg]);

  /* GSAP: entrance animations on card activate */
  useEffect(() => {
    if (!isActive) {
      // Clean up mask if card deactivates mid-animation
      if (indDonutRef.current) {
        indDonutRef.current.style.maskImage = '';
        indDonutRef.current.style.webkitMaskImage = '';
      }
      return;
    }

    // Indicator donut — speedometer sweep (conic-gradient mask, 0→360° clockwise)
    if (indDonutRef.current) {
      const el = indDonutRef.current;
      const obj = { a: 0 };
      el.style.maskImage = 'conic-gradient(from -90deg, #000 0deg 0deg, transparent 0deg 360deg)';
      el.style.webkitMaskImage = 'conic-gradient(from -90deg, #000 0deg 0deg, transparent 0deg 360deg)';
      gsap.to(obj, {
        a: 360, duration: 1.0, ease: 'power2.inOut', delay: 0.05,
        onUpdate() {
          const m = `conic-gradient(from -90deg, #000 0deg ${obj.a}deg, transparent ${obj.a}deg 360deg)`;
          el.style.maskImage = m;
          el.style.webkitMaskImage = m;
        },
        onComplete() { el.style.maskImage = ''; el.style.webkitMaskImage = ''; },
      });
    }

    // Total KD counter
    if (totalNumRef.current) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: brk.total, duration: 0.9, ease: 'power3.out', delay: 0.12,
        onUpdate() { if (totalNumRef.current) totalNumRef.current.textContent = Math.round(obj.val); },
      });
    }

    // Legend number counters — staggered
    const segs = ['gap', 'close', 'achieved'];
    segs.forEach((seg, i) => {
      const el = legNumRefs.current[i];
      if (!el) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: brk[seg], duration: 0.75, ease: 'power2.out', delay: 0.22 + i * 0.07,
        onUpdate() { if (el) el.textContent = Math.round(obj.val); },
      });
    });
  }, [isActive]);

  /* GSAP: prog donut entrances — staggered speedometer sweep */
  useEffect(() => {
    if (!isActive) {
      progDonutRefs.current.forEach(el => {
        if (!el) return;
        el.style.maskImage = '';
        el.style.webkitMaskImage = '';
      });
      return;
    }
    progDonutRefs.current.forEach((el, i) => {
      if (!el) return;
      const obj = { a: 0 };
      el.style.maskImage = 'conic-gradient(from -90deg, #000 0deg 0deg, transparent 0deg 360deg)';
      el.style.webkitMaskImage = 'conic-gradient(from -90deg, #000 0deg 0deg, transparent 0deg 360deg)';
      gsap.to(obj, {
        a: 360, duration: 0.75, ease: 'power2.inOut', delay: 0.1 + i * 0.08,
        onUpdate() {
          const m = `conic-gradient(from -90deg, #000 0deg ${obj.a}deg, transparent ${obj.a}deg 360deg)`;
          el.style.maskImage = m;
          el.style.webkitMaskImage = m;
        },
        onComplete() { el.style.maskImage = ''; el.style.webkitMaskImage = ''; },
      });
    });
  }, [isActive, filteredProgs]);

  /* ── dominant segment glow for indicator donut ─────────────── */
  const indGlow = useMemo(() => {
    if (brk.gap >= brk.close && brk.gap >= brk.achieved) return 'gap';
    if (brk.close >= brk.achieved) return 'close';
    return 'achieved';
  }, [brk]);

  /* ── indicator status donut traces ─────────────────────────── */
  const indTrace = useMemo(() => [{
    type: 'pie',
    hole: 0.65,
    values: [
      Math.max(0.01, brk.gap),
      Math.max(0.01, brk.close),
      Math.max(0.01, brk.achieved),
    ],
    labels: ['Gap', 'Close', 'Achieved'],
    marker: {
      colors: [SEG_COLORS.gap, SEG_COLORS.close, SEG_COLORS.achieved],
      line: {
        color: [SEG_COLORS.gap, SEG_COLORS.close, SEG_COLORS.achieved],
        width: 1.5,
      },
    },
    textinfo: 'none',
    hovertemplate: '<b>%{label}</b>: %{value}<extra></extra>',
    sort: false,
    direction: 'clockwise',
    rotation: -90,
  }], [brk]);

  const indLayout = useMemo(() => ({
    ...LAYOUT_BASE,
    width: 160,
    height: 160,
  }), []);

  /* ── top-3 KDs for selected segment ────────────────────────── */
  const top3 = useMemo(() => {
    if (!selectedSeg) return [];
    return getTopKDsByStatus(divisionId, selectedSeg);
  }, [divisionId, selectedSeg]);

  /* ── Plotly pie click handler ───────────────────────────────── */
  function handleIndClick(data) {
    if (!isActive) return;
    const labelRaw = data.points[0]?.label;
    const map = { Achieved: 'achieved', Close: 'close', Gap: 'gap' };
    const seg = map[labelRaw];
    if (!seg) return;
    setSelectedSeg(prev => prev === seg ? null : seg);
  }

  /* ── status display per KD ──────────────────────────────────── */
  function gapColor(kd) {
    const st = kdStatus(kd);
    if (st === 'neutral') return 'rgba(255,255,255,0.40)';
    return SEG_COLORS[st];
  }

  /* ── top-3 header label ─────────────────────────────────────── */
  const top3HeaderColor =
    selectedSeg === 'gap'      ? SEG_COLORS.gap :
    selectedSeg === 'close'    ? SEG_COLORS.close :
    selectedSeg === 'achieved' ? SEG_COLORS.achieved :
    'rgba(255,255,255,0.45)';

  const top3HeaderText =
    selectedSeg === 'gap'      ? 'TOP CRITICAL' :
    selectedSeg === 'close'    ? 'TOP CAUTION'  :
    'TOP ON TRACK';

  return (
    <>
      {/* ── INDICATOR STATUS CARD ──────────────────────────────── */}
      <div className="lnd-ind-card">
        <div className="lnd-ind-header">
          <span className="lnd-ind-title">INDICATOR STATUS</span>
        </div>

        {/* Donut */}
        <div ref={indDonutRef} style={{ position: 'relative', width: 160, height: 160, margin: '0 auto', filter: `drop-shadow(0 0 10px ${SEG_GLOW[indGlow]}0.18)) drop-shadow(0 0 4px ${SEG_GLOW[indGlow]}0.28))` }}>
          <Plot
            data={indTrace}
            layout={indLayout}
            config={{ displayModeBar: false, responsive: false }}
            onClick={isActive ? handleIndClick : undefined}
          />
          <div className="lnd-ind-center">
            <span ref={totalNumRef} className="lnd-ind-total-num">{brk.total}</span>
            <span className="lnd-ind-total-lbl">Indicators</span>
          </div>
        </div>

        {/* Legend rows */}
        <div className="lnd-ind-legend">
          {(['gap', 'close', 'achieved']).map(seg => {
            const count = brk[seg];
            const isRowActive = selectedSeg === seg;
            return (
              <div
                key={seg}
                className={`lnd-ind-leg-row${isRowActive ? ' lnd-ind-leg-row--active' : ''}${isActive ? '' : ''}`}
                style={{ cursor: isActive ? 'pointer' : 'default' }}
                onClick={(e) => {
                  if (!isActive) return;
                  e.stopPropagation();
                  setSelectedSeg(prev => prev === seg ? null : seg);
                }}
              >
                <span className="lnd-ind-leg-dot" style={{ background: SEG_COLORS[seg] }} />
                <span ref={el => { legNumRefs.current[['gap','close','achieved'].indexOf(seg)] = el; }} className="lnd-ind-leg-num">{count}</span>
                <span className="lnd-ind-leg-lbl">{SEG_LABELS[seg]}</span>
              </div>
            );
          })}
        </div>

        {/* Top-3 panel */}
        {selectedSeg && (
          <div ref={top3Ref} className="lnd-ind-top3" style={{ opacity: 0 }}>
            <div
              className="lnd-ind-top3-header"
              style={{ color: top3HeaderColor }}
            >
              {top3HeaderText}
            </div>
            {top3.map((kd, i) => (
              <div
                key={i}
                className="lnd-ind-kd-row"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onKDClick) onKDClick(kd, kd.programmeId);
                }}
              >
                <span className="lnd-ind-kd-name">{kd.indicator}</span>
              </div>
            ))}
          </div>
        )}

        {/* Explore Division CTA — bottom of panel */}
        {onExploreDivision && (
          <button
            className="lnd-ind-cta"
            onClick={(e) => { e.stopPropagation(); onExploreDivision(); }}
          >
            <span>Explore Division</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* ── PROGRAMME GRID ─────────────────────────────────────── */}
      <div className="lnd-prog-section">
        <p className="lnd-prog-section-label">{sectionLabel}</p>
        <div className="lnd-prog-scroll">
          {filteredProgs.length === 0 && (
            <p className="lnd-prog-empty">No programmes</p>
          )}
          {filteredProgs.map((prog, i) => {
            const pb         = getProgKDBrk(divisionId, prog.id);
            const worstKD    = getWorstKD(divisionId, prog.id);
            const progStatus = computeProgStatus(divisionId, prog.id);
            const sc         = SEG_COLORS[progStatus === 'red' ? 'gap' : progStatus === 'yellow' ? 'close' : 'achieved'];
            const glowSeg    = pb.gap > 0 ? 'gap' : pb.close > 0 ? 'close' : 'achieved';

            /* Build hover text per segment — list of KD indicator names */
            const hoverText = ['gap', 'close', 'achieved'].map(seg => {
              const kds = getProgKDsByStatus(divisionId, prog.id, seg);
              if (!kds.length) return 'None';
              return kds.map(k => `• ${k.indicator}`).join('<br>');
            });

            const progTrace = [{
              type: 'pie',
              hole: 0.62,
              values: [Math.max(0.01, pb.gap), Math.max(0.01, pb.close), Math.max(0.01, pb.achieved)],
              labels: ['Critical', 'Caution', 'On Track'],
              customdata: hoverText,
              hovertemplate: '<b>%{label}: %{value} KDs</b><br>%{customdata}<extra></extra>',
              marker: {
                colors: [SEG_COLORS.gap, SEG_COLORS.close, SEG_COLORS.achieved],
                line: { color: [SEG_COLORS.gap, SEG_COLORS.close, SEG_COLORS.achieved], width: 2 },
              },
              textinfo: 'none',
              sort: false,
              direction: 'clockwise',
              rotation: -90,
            }];

            const progLayout = { ...LAYOUT_BASE, width: 120, height: 120 };
            const totalKDs = pb.gap + pb.close + pb.achieved;

            return (
              <div
                key={prog.id}
                className={`lnd-prog-card lnd-prog-card--${progStatus}`}
                style={{ ...progCardStyle, '--pc-clr': sc }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (worstKD && onKDClick) onKDClick(worstKD, prog.id);
                }}
              >
                {/* Donut with hover */}
                <div
                  ref={el => { progDonutRefs.current[i] = el; }}
                  style={{
                    position: 'relative', width: 120, height: 120, flexShrink: 0,
                    filter: `drop-shadow(0 0 8px ${SEG_GLOW[glowSeg]}0.22)) drop-shadow(0 0 3px ${SEG_GLOW[glowSeg]}0.32))`,
                  }}
                >
                  <Plot
                    data={progTrace}
                    layout={progLayout}
                    config={{ displayModeBar: false, responsive: false }}
                  />
                  {/* Center label */}
                  <div className="lnd-prog-donut-center">
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{totalKDs}</span>
                    <span className="lnd-prog-dc-lbl">KDs</span>
                  </div>
                </div>

                {/* Programme name */}
                <p className="lnd-pc-name">{prog.label || prog.name}</p>

                {/* Worst KD indicator */}
                {worstKD && (
                  <p className="lnd-pc-kd-name">{worstKD.indicator}</p>
                )}

                {/* Mini counts */}
                <div className="lnd-pc-counts">
                  {pb.gap      > 0 && <span style={{ color: SEG_COLORS.gap      }}>{pb.gap} gap</span>}
                  {pb.close    > 0 && <span style={{ color: SEG_COLORS.close    }}>{pb.close} caution</span>}
                  {pb.achieved > 0 && <span style={{ color: SEG_COLORS.achieved }}>{pb.achieved} ok</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
