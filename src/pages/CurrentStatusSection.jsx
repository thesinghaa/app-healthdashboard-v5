// CurrentStatusSection.jsx
// Standalone file — imported by KDProgrammePage (RCH/NDCP) and HRHCadrePage (PM-ABHIM)
// All Current Status chart components for each programme type

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Plot from 'react-plotly.js';

/* ── Theme ───────────────────────────────────────────────────────── */
const ORG  = '#00b5cc';
const NAVY = '#1A1F36';
const TEAL = '#0E9E8A';
const AMB  = '#D97706';
const SLT  = '#CBD5E1';
const PLOT_BASE = {
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { family: 'Inter, sans-serif', color: NAVY, size: 12 },
  margin: { t: 28, r: 20, b: 44, l: 20 },
  colorway: [ORG, NAVY, AMB, TEAL, SLT],
};
const PLOT_CFG = { displayModeBar: false, responsive: true };

/* ── GSAP animation hook ─────────────────────────────────────────── */
function useCSAnim(ref) {
  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' },
      );
      gsap.from(
        ref.current.querySelectorAll('.detail-card, .cs-plot-card'),
        { opacity: 0, y: 20, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.15 },
      );
    }, ref);
    return () => ctx.revert();
  }, []);
}

/* ── Shared card wrapper ─────────────────────────────────────────── */
function CSPlotCard({ title, note, children, half }) {
  return (
    <div className={`cs-plot-card${half ? ' cs-plot-card--half' : ''}`}>
      <div className="detail-card-header">
        <h3 className="cs-plot-title">{title}</h3>
        {note && <span className="detail-card-note">{note}</span>}
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  MMR — Maternal Mortality Ratio                                   */
/* ══════════════════════════════════════════════════════════════════ */
function MMRStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  return (
    <div ref={ref}>
      <div className="cs-plot-row">
        {/* Stats card */}
        <div className="detail-card cs-card" style={{ flex: 1 }}>
          <div className="cs-sdg-strip">
            <div className="cs-sdg-col cs-sdg-col--label">
              <span className="cs-value-muted">SDG Indicator</span>
              <span className="cs-sdg-indicator-name">3.1.1 Maternal Mortality Ratio</span>
            </div>
            <div className="cs-sdg-col">
              <span className="cs-value-muted">State Status</span>
              <span className="cs-value-na">N/A</span>
            </div>
            <div className="cs-sdg-col">
              <span className="cs-value-muted">SDG Target</span>
              <span className="cs-value-good">Less than 70</span>
            </div>
          </div>
          <div className="cs-stats-3" style={{ marginTop: 20 }}>
            <div className="cs-stat-block">
              <div className="cs-stat-val">28</div>
              <div className="cs-stat-lbl">Total Districts</div>
            </div>
            <div className="cs-stat-block">
              <div className="cs-stat-val cs-red">3</div>
              <div className="cs-stat-lbl">Maternal Deaths — HMIS 2024-25</div>
            </div>
            <div className="cs-stat-block cs-stat-wide">
              <div className="cs-stat-lbl cs-stat-lbl--header">Major Cause (HMIS)</div>
              <div className="cs-stat-cause">Others / Unknown — 64.3% (2 deaths)</div>
              <div className="cs-stat-cause">Hypertensive Disorder in Pregnancy — 5.51% (1 death)</div>
            </div>
          </div>
          <div className="cs-highlights">
            <div className="cs-hl-row">
              <span className="cs-hl-label">Districts with most MDs (2024-25)</span>
              <span className="cs-hl-value">East Siang (2); Namsai (1)</span>
            </div>
            <div className="cs-hl-row">
              <span className="cs-hl-label">Place of Deaths</span>
              <span className="cs-hl-value">Facility deaths (100%)</span>
            </div>
          </div>
        </div>
        {/* District donut */}
        <CSPlotCard title="Maternal Deaths by District" note="FY 2024-25 · HMIS" half>
          <Plot
            data={[{
              type: 'pie', hole: 0.58,
              labels: ['East Siang', 'Namsai', '26 other districts — 0 deaths'],
              values: [2, 1, 25],
              marker: { colors: [ORG, AMB, '#E2E8F0'], line: { color: '#fff', width: 2 } },
              textinfo: 'label+value',
              textfont: { size: 12, color: NAVY },
              hovertemplate: '<b>%{label}</b><br>Deaths: %{value}<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE,
              height: 290,
              showlegend: false,
              annotations: [{
                text: '<b>3</b><br><span style="font-size:12px">Deaths</span>',
                x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
                showarrow: false,
                font: { size: 22, color: ORG },
              }],
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Child Health                                                      */
/* ══════════════════════════════════════════════════════════════════ */
function ChildHealthStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const sncuColors = [ORG, NAVY, AMB, SLT];
  const imrColors  = [ORG, AMB, TEAL, SLT];
  return (
    <div ref={ref}>
      {/* SDG indicators + facility stats */}
      <div className="detail-card cs-card">
        <table className="cs-table">
          <thead>
            <tr>
              <th>S No</th><th>SDG Indicator</th><th>State</th>
              <th>National</th><th>SDG Target 2030</th>
            </tr>
          </thead>
          <tbody>
            {cs.sdgIndicators.map((row, i) => (
              <tr key={i}>
                <td>{row.no}</td><td>{row.name}</td>
                <td className="cs-val-teal">{row.state}</td>
                <td>{row.national}</td><td>{row.sdgTarget}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cs-stats-3" style={{ marginTop: 20 }}>
          <div className="cs-stat-block">
            <div className="cs-stat-val">{cs.totalDistricts}</div>
            <div className="cs-stat-lbl">Total Districts</div>
          </div>
          <div className="cs-stat-block">
            <div className="cs-stat-val">{cs.sncuNicus}</div>
            <div className="cs-stat-lbl">SNCU / NICUs</div>
          </div>
          <div className="cs-stat-block">
            <div className="cs-stat-val">{cs.deics}</div>
            <div className="cs-stat-lbl">DEICs</div>
          </div>
        </div>
      </div>

      {/* Mortality cause donuts */}
      <div className="cs-plot-row">
        <CSPlotCard title="SNCU / NICU Mortality Causes" note="27 Neonatal Deaths · FBNC Portal Apr–Dec 2025" half>
          <Plot
            data={[{
              type: 'pie', hole: 0.55,
              labels: ['Resp. Distress Syndrome', 'Birth Asphyxia', 'Meconium Aspiration', 'Any Other (FBNC)'],
              values: [18.5, 14.8, 7.4, 55.6],
              marker: { colors: sncuColors, line: { color: '#fff', width: 2 } },
              textinfo: 'percent', textfont: { size: 11 },
              hovertemplate: '<b>%{label}</b><br>%{percent}<extra></extra>',
            }]}
            layout={{ ...PLOT_BASE, height: 300, showlegend: true, legend: { orientation: 'h', y: -0.18, font: { size: 10 } } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
        <CSPlotCard title="Infant Mortality Causes" note="52 Infant Deaths · HMIS Apr–Dec 2025" half>
          <Plot
            data={[{
              type: 'pie', hole: 0.55,
              labels: ['Prematurity', 'Asphyxia', 'Sepsis', 'Other (HMIS)'],
              values: [23.1, 11.5, 5.8, 57.7],
              marker: { colors: imrColors, line: { color: '#fff', width: 2 } },
              textinfo: 'percent', textfont: { size: 11 },
              hovertemplate: '<b>%{label}</b><br>%{percent}<extra></extra>',
            }]}
            layout={{ ...PLOT_BASE, height: 300, showlegend: true, legend: { orientation: 'h', y: -0.18, font: { size: 10 } } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>

      {/* High-mortality districts */}
      {cs.mortalityRows.map((row, i) => (
        <div key={i} className="detail-card cs-card">
          <div className="cs-mort-label">{row.label}</div>
          <div className="cs-mort-two">
            <div>
              <div className="cs-mort-head">Districts with High Mortality</div>
              <div className="cs-mort-val">{row.highDistricts}</div>
            </div>
            <div>
              <div className="cs-mort-head">Main Reasons of Mortality</div>
              <div className="cs-mort-val">{row.causes}</div>
            </div>
          </div>
        </div>
      ))}

      {/* RBSK */}
      <CSPlotCard title="RBSK — Functionality of DEIC" note="Overall availability · MoHFW NPCC May 2026">
        <div className="cs-plot-row" style={{ alignItems: 'flex-start', gap: 24 }}>
          <Plot
            data={[{
              type: 'bar', orientation: 'h',
              x: [52, 67],
              y: ['HR Available', 'Equipment Available'],
              marker: { color: [ORG, TEAL], opacity: 0.9 },
              text: ['52%', '67%'], textposition: 'outside',
              textfont: { size: 14, color: NAVY, family: 'JetBrains Mono, monospace' },
              hovertemplate: '%{y}: %{x}%<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE, height: 160,
              margin: { t: 12, r: 60, b: 28, l: 140 },
              xaxis: { range: [0, 110], ticksuffix: '%', gridcolor: '#F1F5F9', showgrid: true },
              yaxis: { tickfont: { size: 13 } },
              showlegend: false,
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
          <div style={{ paddingTop: 12 }}>
            <div className="cs-stat-lbl cs-stat-lbl--header" style={{ marginBottom: 8 }}>
              Bottom 30% Districts
            </div>
            {cs.rbsk.bottom30.map((d, j) => (
              <div key={j} className="cs-stat-cause cs-red" style={{ fontSize: 15, fontWeight: 700 }}>{d}</div>
            ))}
          </div>
        </div>
      </CSPlotCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Family Planning — SDG 3.7.1                                      */
/* ══════════════════════════════════════════════════════════════════ */
function FPStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  return (
    <div ref={ref}>
      <div className="cs-plot-row">
        <div className="detail-card cs-card" style={{ flex: 1 }}>
          <div className="cs-fp-indicator">{cs.indicator}</div>
          <div className="cs-stats-3" style={{ marginTop: 20 }}>
            <div className="cs-stat-block">
              <div className="cs-stat-val cs-red">{cs.stateStatus}</div>
              <div className="cs-stat-lbl">State Status</div>
            </div>
            <div className="cs-stat-block">
              <div className="cs-stat-val cs-value-good-lg">{cs.sdgTarget}</div>
              <div className="cs-stat-lbl">SDG Target {cs.sdgTargetNote}</div>
            </div>
          </div>
        </div>
        <CSPlotCard title="Family Planning Satisfaction — vs Target" note="SDG 3.7.1 · NFHS-5" half>
          <Plot
            data={[{
              type: 'indicator', mode: 'gauge+number+delta',
              value: 60.2,
              delta: {
                reference: 74.2, valueformat: '.1f', suffix: ' pp gap',
                increasing: { color: TEAL }, decreasing: { color: ORG },
              },
              number: { suffix: '%', font: { size: 44, color: ORG, family: 'JetBrains Mono, monospace' } },
              gauge: {
                axis: { range: [0, 100], ticksuffix: '%', tickfont: { size: 11 } },
                bar: { color: ORG, thickness: 0.28 },
                bgcolor: '#F8FAFC',
                borderwidth: 0,
                steps: [
                  { range: [0, 60.2],  color: 'rgba(0,181,204,0.12)'   },
                  { range: [60.2, 74.2], color: 'rgba(16,185,129,0.12)' },
                ],
                threshold: { line: { color: TEAL, width: 3 }, thickness: 0.8, value: 74.2 },
              },
            }]}
            layout={{ ...PLOT_BASE, height: 270, margin: { t: 28, r: 20, b: 16, l: 20 } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
          <div className="cs-gauge-target">
            <span className="cs-gauge-target-val">Target: 74.2%</span>
            <span className="cs-gauge-target-note">(National Average)</span>
          </div>
        </CSPlotCard>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  TB — NTEP / TB Mukt Bharat Abhiyan                               */
/* ══════════════════════════════════════════════════════════════════ */
function TBStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const metricVals   = cs.abhiyanMetrics.map(m => parseFloat(m.value));
  const metricLabels = cs.abhiyanMetrics.map(m =>
    m.label.length > 32 ? m.label.slice(0, 30) + '…' : m.label
  );
  return (
    <div ref={ref}>
      {/* Incidence + mortality gauges */}
      <div className="cs-plot-row">
        <CSPlotCard title="TB Incidence" note="per lakh population · State vs Target" half>
          <Plot
            data={[{
              type: 'indicator', mode: 'gauge+number',
              value: parseInt(cs.incidence),
              number: { font: { size: 52, color: ORG, family: 'JetBrains Mono, monospace' } },
              gauge: {
                axis: { range: [0, 250], tickfont: { size: 10 } },
                bar: { color: ORG, thickness: 0.3 },
                bgcolor: '#F8FAFC', borderwidth: 0,
                steps: [
                  { range: [0, 47],  color: 'rgba(16,185,129,0.15)' },
                  { range: [47, 250], color: 'rgba(0,181,204,0.08)' },
                ],
                threshold: { line: { color: TEAL, width: 3 }, thickness: 0.8, value: 47 },
              },
            }]}
            layout={{ ...PLOT_BASE, height: 230, margin: { t: 28, r: 20, b: 16, l: 20 } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
          <div className="cs-gauge-target">
            <span className="cs-gauge-target-val">Target: 47 / lakh</span>
            <span className="cs-gauge-target-note">(80% reduction)</span>
          </div>
        </CSPlotCard>
        <CSPlotCard title="TB Mortality" note="per lakh population · State vs Target" half>
          <Plot
            data={[{
              type: 'indicator', mode: 'gauge+number',
              value: parseInt(cs.mortality),
              number: { font: { size: 52, color: NAVY, family: 'JetBrains Mono, monospace' } },
              gauge: {
                axis: { range: [0, 30], tickfont: { size: 10 } },
                bar: { color: NAVY, thickness: 0.3 },
                bgcolor: '#F8FAFC', borderwidth: 0,
                steps: [
                  { range: [0, 3], color: 'rgba(16,185,129,0.15)' },
                  { range: [3, 30], color: 'rgba(26,31,54,0.08)' },
                ],
                threshold: { line: { color: TEAL, width: 3 }, thickness: 0.8, value: 3 },
              },
            }]}
            layout={{ ...PLOT_BASE, height: 230, margin: { t: 28, r: 20, b: 16, l: 20 } }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
          <div className="cs-gauge-target">
            <span className="cs-gauge-target-val">Target: 3 / lakh</span>
            <span className="cs-gauge-target-note">(90% reduction)</span>
          </div>
        </CSPlotCard>
      </div>

      {/* District notification + death rate */}
      <div className="cs-plot-row">
        <CSPlotCard
          title="Notification vs Estimates — District Achievement"
          note={`Factors: ${cs.factors.notification}`}
          half
        >
          <Plot
            data={[{
              type: 'bar',
              x: [cs.notifVsEst.above90, cs.notifVsEst.mid, cs.notifVsEst.below50],
              y: ['>90%', '50–90%', '<50%'],
              orientation: 'h',
              marker: { color: [TEAL, AMB, ORG] },
              text: [
                `${cs.notifVsEst.above90} districts`,
                `${cs.notifVsEst.mid} districts`,
                `${cs.notifVsEst.below50} districts`,
              ],
              textposition: 'outside',
              textfont: { size: 13, color: NAVY, family: 'JetBrains Mono, monospace' },
              hovertemplate: '%{y}: %{x} districts<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE, height: 180,
              margin: { t: 12, r: 80, b: 32, l: 56 },
              xaxis: { range: [0, 12], showgrid: false },
              yaxis: { tickfont: { size: 13 } },
              showlegend: false,
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
        <CSPlotCard
          title="Death Rate — District Achievement"
          note={`Factors: ${cs.factors.deathRate}`}
          half
        >
          <Plot
            data={[{
              type: 'bar',
              x: [cs.deathRate.above5, cs.deathRate.mid, cs.deathRate.below3],
              y: ['>5%', '3–5%', '<3%'],
              orientation: 'h',
              marker: { color: [ORG, AMB, TEAL] },
              text: [
                `${cs.deathRate.above5} districts`,
                `${cs.deathRate.mid} districts`,
                `${cs.deathRate.below3} districts`,
              ],
              textposition: 'outside',
              textfont: { size: 13, color: NAVY, family: 'JetBrains Mono, monospace' },
              hovertemplate: '%{y}: %{x} districts<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE, height: 180,
              margin: { t: 12, r: 80, b: 32, l: 56 },
              xaxis: { range: [0, 12], showgrid: false },
              yaxis: { tickfont: { size: 13 } },
              showlegend: false,
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>

      {/* Abhiyan progress */}
      <CSPlotCard title="TB Mukt Bharat Abhiyan Progress" note={cs.abhiyanPeriod}>
        <Plot
          data={[{
            type: 'bar', orientation: 'h',
            x: metricVals,
            y: metricLabels,
            marker: { color: metricVals.map(v => v >= 50 ? TEAL : v >= 25 ? AMB : ORG), opacity: 0.9 },
            text: cs.abhiyanMetrics.map(m => `${m.value}  ${m.detail}`),
            textposition: 'outside',
            textfont: { size: 11, color: '#374151' },
            hovertemplate: '<b>%{y}</b><br>%{x}%<extra></extra>',
          }]}
          layout={{
            ...PLOT_BASE, height: 340,
            margin: { t: 12, r: 220, b: 40, l: 240 },
            xaxis: { range: [0, 130], ticksuffix: '%', gridcolor: '#F1F5F9' },
            yaxis: { tickfont: { size: 12 }, automargin: true },
            showlegend: false,
          }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
        <div className="cs-tb-infra" style={{ marginTop: 12 }}>
          {cs.infrastructure.map((inf, i) => (
            <div key={i} className="cs-hl-row">
              <span className="cs-hl-label">{inf.label}</span>
              <span className="cs-hl-value">
                <strong>{inf.value}</strong> — {inf.detail}
              </span>
            </div>
          ))}
        </div>
      </CSPlotCard>

      {/* Ni-kshay Poshan Yojana */}
      <CSPlotCard title="Ni-kshay Poshan Yojana" note="Eligible vs Paid vs Pending beneficiaries">
        <Plot
          data={[
            {
              type: 'bar', name: 'Paid All Benefits',
              x: cs.nikshayYojana.map(r => r.year),
              y: cs.nikshayYojana.map(r => r.paidAll),
              marker: { color: TEAL },
              text: cs.nikshayYojana.map(r => r.paidAll.toLocaleString()),
              textposition: 'outside', textfont: { size: 13, color: TEAL },
            },
            {
              type: 'bar', name: 'To Be Paid',
              x: cs.nikshayYojana.map(r => r.year),
              y: cs.nikshayYojana.map(r => r.toBePaid),
              marker: { color: ORG },
              text: cs.nikshayYojana.map(r => r.toBePaid.toLocaleString()),
              textposition: 'outside', textfont: { size: 13, color: ORG },
            },
          ]}
          layout={{
            ...PLOT_BASE, height: 260, barmode: 'group',
            margin: { t: 16, r: 20, b: 40, l: 60 },
            xaxis: { tickfont: { size: 14 } },
            yaxis: { title: 'Beneficiaries', gridcolor: '#F1F5F9' },
            legend: { orientation: 'h', y: -0.2, font: { size: 12 } },
          }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
      </CSPlotCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Leprosy — NLEP                                                    */
/* ══════════════════════════════════════════════════════════════════ */
function LeprosyStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const elimAchieved = cs.eliminationAchieved ?? 0;
  const iotAchieved  = cs.iotAchieved ?? 0;
  return (
    <div ref={ref}>
      <div className="cs-plot-row">
        {/* District milestone donut — IOT vs Elimination */}
        <CSPlotCard
          title="District Elimination Progress"
          note="IOT = Interruption of Transmission · NSP 2023-27 target"
          half
        >
          <Plot
            data={[{
              type: 'pie', hole: 0.6,
              labels: ['IOT Status', 'Elimination Status'],
              values: [iotAchieved, elimAchieved],
              marker: { colors: [ORG, TEAL], line: { color: '#fff', width: 2 } },
              textinfo: 'label+value',
              textfont: { size: 13 },
              hovertemplate: '<b>%{label}</b><br>%{value} districts<extra></extra>',
            }]}
            layout={{
              ...PLOT_BASE, height: 300,
              showlegend: true,
              legend: { orientation: 'h', y: -0.12, font: { size: 12 } },
              annotations: [{
                text: `<b>${cs.totalDistricts}</b><br><span style="font-size:11px">all districts</span>`,
                x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
                showarrow: false, font: { size: 20, color: NAVY },
              }],
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>

        {/* Annual cases grouped bar */}
        <CSPlotCard title="Annual Case Data — Arunachal Pradesh" note="New cases, G2D and Child cases by FY" half>
          <Plot
            data={[
              {
                type: 'bar', name: 'Total New Cases',
                x: cs.annualData.map(r => r.fy),
                y: cs.annualData.map(r => r.newCases),
                marker: { color: ORG },
                text: cs.annualData.map(r => r.newCases),
                textposition: 'outside', textfont: { size: 15, color: ORG },
              },
              {
                type: 'bar', name: 'G2D Cases',
                x: cs.annualData.map(r => r.fy),
                y: cs.annualData.map(r => r.g2dCases),
                marker: { color: NAVY },
                text: cs.annualData.map(r => r.g2dCases),
                textposition: 'outside', textfont: { size: 13, color: NAVY },
              },
              {
                type: 'bar', name: 'Child Cases',
                x: cs.annualData.map(r => r.fy),
                y: cs.annualData.map(r => r.childCases),
                marker: { color: AMB },
                text: cs.annualData.map(r => r.childCases),
                textposition: 'outside', textfont: { size: 13, color: AMB },
              },
            ]}
            layout={{
              ...PLOT_BASE, height: 300, barmode: 'group',
              margin: { t: 20, r: 20, b: 40, l: 48 },
              xaxis: { tickfont: { size: 13 } },
              yaxis: { gridcolor: '#F1F5F9', title: 'Cases' },
              legend: { orientation: 'h', y: -0.22, font: { size: 11 } },
            }}
            config={PLOT_CFG} style={{ width: '100%' }}
          />
        </CSPlotCard>
      </div>

      {/* District lists */}
      <div className="detail-card cs-card">
        <div className="cs-mort-head" style={{ marginBottom: 8 }}>
          IOT Districts — 13 (50–60% range)
        </div>
        <div className="cs-iot-districts">{cs.iotDistricts50_60}</div>

        {cs.eliminationDistricts && (
          <>
            <div className="cs-mort-head" style={{ marginTop: 16, marginBottom: 8, color: TEAL }}>
              Elimination Status Districts — {elimAchieved}
            </div>
            <div className="cs-iot-districts" style={{ color: TEAL }}>{cs.eliminationDistricts}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Malaria — NCVBDCP                                                 */
/* ══════════════════════════════════════════════════════════════════ */
function MalariaStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const years = cs.casesTrend.map(r => r.year);
  return (
    <div ref={ref}>
      {/* Elimination target + 2025 summary */}
      <div className="detail-card cs-card">
        <div className="cs-stats-3">
          <div className="cs-stat-block cs-stat-wide">
            <div className="cs-stat-lbl cs-stat-lbl--header">National Framework Target</div>
            <div className="cs-stat-cause">{cs.eliminationTarget}</div>
          </div>
          <div className="cs-stat-block">
            <div className="cs-stat-val cs-amber">{cs.totalCases2025}</div>
            <div className="cs-stat-lbl">Total Cases 2025</div>
            <div className="cs-stat-sub">{cs.caseBreakdown2025}</div>
          </div>
        </div>
      </div>

      {/* Stacked bar: indigenous + imported */}
      <CSPlotCard
        title="Annual Case Trend — Indigenous vs Imported"
        note="Pv = P. vivax · Pf = P. falciparum · Zero deaths across all years"
      >
        <Plot
          data={[
            {
              type: 'bar', name: 'Indigenous',
              x: years, y: cs.casesTrend.map(r => r.indigenous),
              marker: { color: ORG },
              text: cs.casesTrend.map(r => r.indigenous),
              textposition: 'inside', textfont: { size: 13, color: '#fff' },
            },
            {
              type: 'bar', name: 'Imported',
              x: years, y: cs.casesTrend.map(r => r.imported),
              marker: { color: NAVY },
              text: cs.casesTrend.map(r => r.imported),
              textposition: 'inside', textfont: { size: 13, color: '#fff' },
            },
          ]}
          layout={{
            ...PLOT_BASE, height: 300, barmode: 'stack',
            margin: { t: 16, r: 20, b: 40, l: 48 },
            xaxis: { tickfont: { size: 14 } },
            yaxis: { title: 'Cases', gridcolor: '#F1F5F9' },
            legend: { orientation: 'h', y: -0.2, font: { size: 13 } },
          }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />

        {/* Species + key points */}
        <div className="cs-plot-row" style={{ marginTop: 16 }}>
          <CSPlotCard title="Species Breakdown" note="P. vivax vs P. falciparum" half>
            <Plot
              data={[
                { type: 'bar', name: 'P. vivax (Pv)',       x: years, y: cs.casesTrend.map(r => r.pv), marker: { color: AMB } },
                { type: 'bar', name: 'P. falciparum (Pf)',  x: years, y: cs.casesTrend.map(r => r.pf), marker: { color: TEAL } },
              ]}
              layout={{
                ...PLOT_BASE, height: 220, barmode: 'group',
                margin: { t: 8, r: 16, b: 40, l: 40 },
                xaxis: { tickfont: { size: 13 } },
                yaxis: { gridcolor: '#F1F5F9' },
                legend: { orientation: 'h', y: -0.28, font: { size: 11 } },
              }}
              config={PLOT_CFG} style={{ width: '100%' }}
            />
          </CSPlotCard>
          <div className="detail-card cs-card" style={{ flex: 1 }}>
            <div className="detail-card-header">
              <h3>Programme Status</h3>
              <span className="detail-card-note">NCVBDCP · MoHFW NPCC May 2026</span>
            </div>
            <ul className="obs-list">
              {cs.keyPoints.map((pt, i) => (
                <li key={i} className="obs-item"><span className="obs-marker" />{pt}</li>
              ))}
            </ul>
          </div>
        </div>
      </CSPlotCard>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  PM-ABHIM — Physical & Financial Progress                          */
/* ══════════════════════════════════════════════════════════════════ */
function PMABHIMStatus({ cs }) {
  const ref = useRef(null);
  useCSAnim(ref);
  const fyrs     = cs.financialYears;
  const totalRow = cs.financialProgress.find(r => r.isTotal);
  return (
    <div ref={ref}>
      {/* Physical progress */}
      <CSPlotCard title="Physical Progress" note="FY 2021-22 to FY 2025-26">
        <Plot
          data={[
            { type: 'bar', name: 'Approved',     x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.approved),   marker: { color: SLT } },
            { type: 'bar', name: 'Work Started',  x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.started),   marker: { color: AMB } },
            { type: 'bar', name: 'Completed',     x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.completed), marker: { color: TEAL } },
            { type: 'bar', name: 'Functional',    x: cs.physicalProgress.map(r => r.component.replace('District Integrated Public Health Labs', 'IPHL')), y: cs.physicalProgress.map(r => r.functional), marker: { color: ORG } },
          ]}
          layout={{
            ...PLOT_BASE, height: 300, barmode: 'group',
            margin: { t: 16, r: 20, b: 60, l: 56 },
            xaxis: { tickfont: { size: 13 } },
            yaxis: { title: 'Units', gridcolor: '#F1F5F9' },
            legend: { orientation: 'h', y: -0.28, font: { size: 12 } },
          }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
      </CSPlotCard>

      {/* XV-FC total bar */}
      <CSPlotCard title="XV-FC Financial Progress — TOTAL" note="Rs. in Crore · Approval vs Release by FY">
        <Plot
          data={[
            {
              type: 'bar', name: 'Approval',
              x: fyrs, y: fyrs.map(yr => totalRow?.[yr]?.approval ?? 0),
              marker: { color: NAVY },
              text: fyrs.map(yr => totalRow?.[yr]?.approval ? `${totalRow[yr].approval}` : ''),
              textposition: 'outside', textfont: { size: 11, color: NAVY },
            },
            {
              type: 'bar', name: 'Release',
              x: fyrs, y: fyrs.map(yr => totalRow?.[yr]?.release ?? 0),
              marker: { color: ORG },
              text: fyrs.map(yr => totalRow?.[yr]?.release ? `${totalRow[yr].release}` : '—'),
              textposition: 'outside', textfont: { size: 11, color: ORG },
            },
          ]}
          layout={{
            ...PLOT_BASE, height: 300, barmode: 'group',
            margin: { t: 24, r: 20, b: 48, l: 60 },
            xaxis: { tickfont: { size: 13 } },
            yaxis: { title: 'Rs. Crore', gridcolor: '#F1F5F9' },
            legend: { orientation: 'h', y: -0.22, font: { size: 13 } },
          }}
          config={PLOT_CFG} style={{ width: '100%' }}
        />
        <p className="hrh-prod-note" style={{ marginTop: 8 }}>
          % Expenditure (as on March 2026) is against the amount released.
        </p>
      </CSPlotCard>

      {/* Component-wise financial table */}
      <div className="detail-card cs-card">
        <div className="detail-card-header">
          <h3>XV-FC Component-wise Detail</h3>
          <span className="detail-card-note">Rs. in Crore</span>
        </div>
        <div className="cs-table-scroll">
          <table className="cs-table cs-table--finance">
            <thead>
              <tr>
                <th rowSpan={2} className="cs-th-component">Component</th>
                {fyrs.map(yr => <th key={yr} colSpan={2} className="cs-th-yr">{yr}</th>)}
              </tr>
              <tr>
                {fyrs.map(yr => [
                  <th key={yr + 'a'} className="cs-th-sub">Appr.</th>,
                  <th key={yr + 'r'} className="cs-th-sub">Rel.</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {cs.financialProgress.map((row, i) => (
                <tr key={i} className={row.isTotal ? 'cs-row-total' : ''}>
                  <td>{row.component}</td>
                  {fyrs.map(yr => [
                    <td key={yr + 'a'}>{row[yr]?.approval ?? '—'}</td>,
                    <td key={yr + 'r'} className={row[yr]?.release == null ? 'cs-val-muted' : ''}>
                      {row[yr]?.release ?? '—'}
                    </td>,
                  ])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  CSEntryBar — clickable bar that opens CurrentStatusDetailPage    */
/*  Named export — used in KDProgrammePage and HRHCadrePage          */
/* ══════════════════════════════════════════════════════════════════ */
const TYPE_META = {
  'mmr':             { label: 'Maternal Mortality Ratio', source: 'SDG 3.1.1 · MoHFW NPCC May 2026' },
  'child-health':    { label: 'Child Health Outcomes',    source: 'IMR · SBR · SNCU · RBSK · MoHFW NPCC May 2026' },
  'family-planning': { label: 'Safe Motherhood & FP',     source: 'SDG 3.7.1 · MoHFW NPCC May 2026' },
  'tb':              { label: 'TB Elimination (NTEP)',     source: 'Incidence · Mortality · Abhiyan · Ni-kshay · May 2026' },
  'leprosy':         { label: 'Leprosy Elimination (NLEP)',source: 'IOT Districts · Elimination Status · MoHFW NPCC May 2026' },
  'malaria':         { label: 'Malaria Control (NCVBDCP)', source: '5-Year Case Trend · Species Mix · MoHFW NPCC May 2026' },
  'pm-abhim':        { label: 'PM-ABHIM Infrastructure',  source: 'IPHL · PHC/CHC Progress · XV-FC Financial · May 2026' },
};

export function CSEntryBar({ program, onClick }) {
  const cs = program?.currentStatus;
  if (!cs) return null;
  const meta = TYPE_META[cs.type] ?? { label: 'Current Status', source: 'MoHFW NPCC May 2026' };

  return (
    <button className="cs-entry-bar" onClick={onClick} type="button">
      <div className="cs-entry-bar-left">
        <span className="cs-entry-bar-dot" />
        <div className="cs-entry-bar-text">
          <span className="cs-entry-bar-eyebrow">Current Status</span>
          <span className="cs-entry-bar-label">{meta.label}</span>
        </div>
        <span className="cs-entry-bar-source">{meta.source}</span>
      </div>
      <div className="cs-entry-bar-cta">
        View Full Report
        <span className="cs-entry-bar-arrow">&#8594;</span>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  Main dispatcher — exported default                               */
/* ══════════════════════════════════════════════════════════════════ */
export default function CurrentStatusSection({ program }) {
  const cs = program?.currentStatus;
  if (!cs) return null;
  switch (cs.type) {
    case 'mmr':              return <MMRStatus cs={cs} />;
    case 'child-health':     return <ChildHealthStatus cs={cs} />;
    case 'family-planning':  return <FPStatus cs={cs} />;
    case 'tb':               return <TBStatus cs={cs} />;
    case 'leprosy':          return <LeprosyStatus cs={cs} />;
    case 'malaria':          return <MalariaStatus cs={cs} />;
    case 'pm-abhim':         return <PMABHIMStatus cs={cs} />;
    default:                 return null;
  }
}
