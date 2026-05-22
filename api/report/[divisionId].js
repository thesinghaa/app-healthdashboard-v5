import { KD_TREE } from '../../src/data/kdData.js';

export const maxDuration = 60;

const VALID        = new Set(['rch', 'ndcp', 'ncd', 'hss', 'hrh']);
const STRONG_MODEL = 'llama-3.3-70b-versatile';

/* ─────────────────────────────────────────────────────────────────
   STATUS HELPERS
───────────────────────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const r = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return r <= 1.00 ? 'achieved' : r <= 1.33 ? 'close' : 'gap';
  return r >= 1.00 ? 'achieved' : r >= 0.75 ? 'close' : 'gap';
}

function kdDeficit(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 0;
  const r = kd.achievement / kd.target;
  return kd.lowerIsBetter ? r - 1 : 1 - r;
}

/* ─────────────────────────────────────────────────────────────────
   COMPUTE DIVISION DATA FROM KD_TREE
───────────────────────────────────────────────────────────────── */
function computeDivData(divisionId) {
  const div = KD_TREE[divisionId];
  if (!div) return null;

  let totalAch = 0, totalClose = 0, totalGap = 0;
  const programmes = [];

  for (const [progId, prog] of Object.entries(div.programmes || {})) {
    const kds = prog.kds || [];
    let pAch = 0, pClose = 0, pGap = 0;
    const gapKDs = [], closeKDs = [], achKDs = [];

    for (const kd of kds) {
      const st = kdStatus(kd);
      if (st === 'gap')      { pGap++;   gapKDs.push(kd);   }
      else if (st === 'close')  { pClose++; closeKDs.push(kd); }
      else if (st === 'achieved'){ pAch++;  achKDs.push(kd);  }
    }
    gapKDs.sort((a, b)   => kdDeficit(b) - kdDeficit(a));
    achKDs.sort((a, b)   => (b.achievement / b.target) - (a.achievement / a.target));

    const progStatus = pGap > 0 ? 'red' : pClose > 0 ? 'yellow' : pAch > 0 ? 'green' : 'neutral';
    const worstKD    = gapKDs[0] || closeKDs.sort((a,b)=>kdDeficit(b)-kdDeficit(a))[0];

    programmes.push({
      id: progId, name: prog.name, status: progStatus,
      kds, counts: { achieved: pAch, close: pClose, gap: pGap },
      gapKDs: gapKDs.slice(0, 5),
      achKDs:  achKDs.slice(0, 3),
      worstKD,
      total: pAch + pClose + pGap,
    });

    totalAch   += pAch;
    totalClose += pClose;
    totalGap   += pGap;
  }

  return {
    fullName: div.fullName || divisionId.toUpperCase(),
    programmes,
    totals: { achieved: totalAch, close: totalClose, gap: totalGap, total: totalAch + totalClose + totalGap },
  };
}

/* ─────────────────────────────────────────────────────────────────
   LLM: ONE CALL — NARRATIVE SECTIONS ONLY
───────────────────────────────────────────────────────────────── */
function buildPrompt(divData) {
  const { fullName, programmes, totals } = divData;
  const criticalProgs = programmes.filter(p => p.status === 'red').slice(0, 5);

  const lines = [
    `DIVISION: ${fullName} | FY 2025-26 | NHM Arunachal Pradesh`,
    `OVERVIEW: ${totals.total} KDs — ${totals.achieved} achieved, ${totals.close} caution, ${totals.gap} critical\n`,
  ];

  for (const p of programmes) {
    const tag = p.status === 'red' ? 'CRITICAL' : p.status === 'yellow' ? 'CAUTION' : 'ON TRACK';
    lines.push(`\nPROGRAMME: ${p.name} [${p.id}] — ${tag} — ${p.counts.achieved}/${p.total} KDs achieved`);
    for (const kd of p.gapKDs.slice(0, 3)) {
      const gap = (kdDeficit(kd) * 100).toFixed(0);
      lines.push(`  GAP: ${kd.indicator}: ${kd.achievedLabel ?? kd.achievement} vs target ${kd.targetLabel ?? kd.target} (${gap}% gap)`);
    }
    for (const kd of p.achKDs.slice(0, 2)) {
      lines.push(`  ACHIEVED: ${kd.indicator}: ${kd.achievedLabel ?? kd.achievement}`);
    }
  }

  const analysisBlocks = criticalProgs
    .map(p => `ANALYSIS[${p.id}]: [3-4 sentences. Describe the current performance gaps in ${p.name} — specific contributing factors such as HR availability, supply chain constraints, training needs, or infrastructure requirements. What targeted actions are needed? Reference exact indicator names and numbers. Use neutral, constructive language only.]`)
    .join('\n\n');

  return `You are a senior public health analyst at Pahlé India Foundation writing for NHM Arunachal Pradesh senior officers.

LANGUAGE RULES (strictly mandatory):
- Use ONLY positive or neutral language throughout. Never use the words "failing", "failure", "is failing", "struggling", "poor performance", or any attacking/negative framing.
- Frame gaps as opportunities for improvement, not as failures.
- Example — WRONG: "X is failing due to..." | CORRECT: "X has significant scope for improvement, with..."

DATA:
${lines.join('\n')}

Write EXACTLY the sections below in EXACTLY this format. No extra text before or after.

EXEC_SUMMARY: [2-3 sentences. Overall division status, headline finding, priority areas. Use exact numbers. Neutral/positive tone.]

${analysisBlocks}

WORKING:
- [Bright spot 1 — specific indicator name and numbers]
- [Bright spot 2 — specific indicator name and numbers]
- [Bright spot 3 if applicable — specific numbers]

RECOMMENDATIONS:
1. [Specific action · Responsible: [party] · Timeline: [X months/weeks]]
2. [Specific action · Responsible: [party] · Timeline: [X months/weeks]]
3. [Specific action · Responsible: [party] · Timeline: [X months/weeks]]
4. [Specific action · Responsible: [party] · Timeline: [X months/weeks]]
5. [Specific action · Responsible: [party] · Timeline: [X months/weeks]]
6. [Specific action · Responsible: [party] · Timeline: [X months/weeks]]

Be specific and data-driven. Reference actual indicator names and numbers from the data.`;
}

function parseNarrative(text) {
  const get = (pattern) => (text.match(pattern) || [])[1]?.trim() || '';

  const exec = get(/EXEC_SUMMARY:\s*([\s\S]*?)(?=\n\nANALYSIS\[|\nWORKING:|\nRECOMMENDATIONS:|$)/);

  const analyses = {};
  for (const m of text.matchAll(/ANALYSIS\[([^\]]+)\]:\s*([\s\S]*?)(?=\n\nANALYSIS\[|\nWORKING:|\nRECOMMENDATIONS:|$)/g)) {
    analyses[m[1].trim()] = m[2].trim();
  }

  const working = get(/WORKING:\s*([\s\S]*?)(?=\n\nRECOMMENDATIONS:|$)/);
  const recs    = get(/RECOMMENDATIONS:\s*([\s\S]*?)$/);

  return { exec, analyses, working, recs };
}

async function groqCall(apiKey, model, systemMsg, userMsg, maxTokens) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, temperature: 0.25, max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).choices[0].message.content;
}

/* ─────────────────────────────────────────────────────────────────
   HTML COMPONENT BUILDERS
───────────────────────────────────────────────────────────────── */
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function statusBadge(status) {
  const map = {
    red:     ['badge-critical', 'Critical'],
    yellow:  ['badge-caution',  'Caution'],
    green:   ['badge-ontrack',  'On Track'],
    neutral: ['badge-neutral',  'No Data'],
  };
  const [cls, lbl] = map[status] || map.neutral;
  return `<span class="badge ${cls}">${lbl}</span>`;
}

function kdBadge(st) {
  const map = { gap: ['badge-critical','Critical'], close: ['badge-caution','Caution'], achieved: ['badge-ontrack','On Track'], neutral: ['badge-neutral','—'] };
  const [cls, lbl] = map[st] || map.neutral;
  return `<span class="badge ${cls}">${lbl}</span>`;
}

function achBar(achieved, total) {
  if (!total) return '<span style="color:#94a3b8">—</span>';
  const pct = Math.round(achieved / total * 100);
  const fill = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  return `<div class="prog-bar-wrap">
    <div class="prog-bar"><div class="prog-bar-fill" style="width:${pct}%;background:${fill}"></div></div>
    <span class="prog-bar-text">${achieved}/${total}</span>
  </div>`;
}

/* ─────────────────────────────────────────────────────────────────
   THE CSS TEMPLATE — same for every division
───────────────────────────────────────────────────────────────── */
const REPORT_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;font-size:14px;line-height:1.6;color:#1e293b;background:#f1f5f9}

/* ── Cover ──────────────────────────────────────────────────────── */
.cover{background:linear-gradient(135deg,#0a1628 0%,#1e3a5f 60%,#0f2a40 100%);color:#fff;padding:52px 56px;display:flex;justify-content:space-between;align-items:center;min-height:220px;position:relative;overflow:hidden}
.cover::before{content:'';position:absolute;right:-80px;top:-80px;width:360px;height:360px;border-radius:50%;background:rgba(255,85,0,0.08);pointer-events:none}
.cover::after{content:'';position:absolute;right:60px;bottom:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.04);pointer-events:none}
.cover-left{position:relative;z-index:1;flex:1}
.cover-tag{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:10px}
.cover-sub{font-size:13px;color:rgba(255,255,255,.60);margin-bottom:22px}
.cover-title{font-size:34px;font-weight:800;color:#fff;line-height:1.15;margin-bottom:14px}
.cover-title span{color:#FF5500}
.cover-date{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.40);letter-spacing:.06em}

/* Cover KPI boxes */
.cover-kpis{display:flex;flex-direction:column;gap:10px;min-width:180px;position:relative;z-index:1}
.kpi-box{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 18px;text-align:center}
.kpi-box--red{border-color:rgba(220,38,38,.40);background:rgba(220,38,38,.10)}
.kpi-box--green{border-color:rgba(22,163,74,.40);background:rgba(22,163,74,.10)}
.kpi-val{font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:#FF5500;line-height:1}
.kpi-val--red{color:#f87171}
.kpi-val--green{color:#4ade80}
.kpi-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.10em;color:rgba(255,255,255,.45);margin-top:4px}

/* ── Content wrapper ────────────────────────────────────────────── */
.content{max-width:900px;margin:0 auto;padding:44px 48px 60px;background:#fff}

/* ── Section ────────────────────────────────────────────────────── */
.section{margin-bottom:44px}
.section-header{display:flex;align-items:center;gap:12px;margin-bottom:22px;padding-bottom:14px;border-bottom:2px solid #FF5500}
.section-num{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#FF5500;background:rgba(255,85,0,.09);padding:3px 9px;border-radius:4px;letter-spacing:.06em}
.section-title{font-size:17px;font-weight:700;color:#0a1628}

/* ── Executive summary ──────────────────────────────────────────── */
.exec-card{background:linear-gradient(135deg,rgba(255,85,0,.04),rgba(30,58,95,.05));border:1px solid rgba(255,85,0,.18);border-left:4px solid #FF5500;border-radius:10px;padding:22px 26px;font-size:14.5px;line-height:1.8;color:#334155}

/* ── Scorecard table ────────────────────────────────────────────── */
.scorecard-table{width:100%;border-collapse:collapse;font-size:13px}
.scorecard-table thead tr{background:#0a1628}
.scorecard-table th{padding:11px 14px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:rgba(255,255,255,.55)}
.scorecard-table td{padding:13px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
.scorecard-table tbody tr:last-child td{border-bottom:none}
.scorecard-table tbody tr:hover td{background:#fafafa}
.prog-name{font-weight:600;color:#0f172a}
.key-concern{font-size:12px;color:#64748b;max-width:200px}

/* ── Progress bar ───────────────────────────────────────────────── */
.prog-bar-wrap{display:flex;align-items:center;gap:8px}
.prog-bar{flex:1;height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;min-width:60px}
.prog-bar-fill{height:100%;border-radius:3px;transition:width .3s}
.prog-bar-text{font-family:'JetBrains Mono',monospace;font-size:11px;color:#64748b;white-space:nowrap}

/* ── Status badges ──────────────────────────────────────────────── */
.badge{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;white-space:nowrap;border:1px solid transparent}
.badge-critical{background:#fef2f2;color:#991b1b;border-color:#fca5a5}
.badge-caution{background:#fffbeb;color:#92400e;border-color:#fcd34d}
.badge-ontrack{background:#f0fdf4;color:#166534;border-color:#86efac}
.badge-neutral{background:#f8fafc;color:#64748b;border-color:#e2e8f0}

/* KD breakdown chips */
.kd-chips{display:flex;gap:5px;flex-wrap:wrap}
.kd-chip{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;border:1px solid;white-space:nowrap}
.kd-chip-red{background:#fef2f2;color:#991b1b;border-color:#fca5a5}
.kd-chip-yellow{background:#fffbeb;color:#92400e;border-color:#fcd34d}
.kd-chip-green{background:#f0fdf4;color:#166534;border-color:#86efac}

/* ── Priority cards ─────────────────────────────────────────────── */
.priority-card{border:1px solid #e2e8f0;border-top:4px solid #dc2626;border-radius:10px;padding:24px 26px;margin-bottom:18px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.priority-card--caution{border-top-color:#d97706}
.priority-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.priority-prog-name{font-size:15px;font-weight:700;color:#0a1628}
.kd-data-table{width:100%;border-collapse:collapse;font-size:12px;margin:12px 0 16px}
.kd-data-table th{background:#f8fafc;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:7px 12px;text-align:left;border-bottom:2px solid #e2e8f0}
.kd-data-table td{padding:9px 12px;border-bottom:1px solid #f1f5f9;color:#374151;vertical-align:top}
.kd-data-table tr:last-child td{border-bottom:none}
.mono{font-family:'JetBrains Mono',monospace;font-size:11.5px}
.gap-pct{font-family:'JetBrains Mono',monospace;font-size:11px;color:#dc2626;font-weight:600}
.priority-analysis{font-size:13.5px;line-height:1.75;color:#374151;padding-top:14px;border-top:1px solid #f1f5f9;font-style:italic}

/* ── What is working ────────────────────────────────────────────── */
.working-list{list-style:none;display:flex;flex-direction:column;gap:10px}
.working-item{display:flex;gap:14px;align-items:flex-start;padding:14px 18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:9px}
.working-icon{flex-shrink:0;width:22px;height:22px;background:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:1px}
.working-icon svg{width:12px;height:12px}
.working-text{font-size:13.5px;line-height:1.65;color:#14532d}

/* ── Recommendations ────────────────────────────────────────────── */
.rec-list{display:flex;flex-direction:column;gap:10px}
.rec-item{display:grid;grid-template-columns:44px 1fr;gap:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.rec-num-col{background:#FF5500;display:flex;align-items:center;justify-content:center;padding:18px 0}
.rec-num-val{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#fff}
.rec-body{padding:16px 20px}
.rec-text{font-size:13.5px;line-height:1.65;color:#1e293b;font-weight:500}
.rec-meta{display:flex;gap:18px;margin-top:9px;flex-wrap:wrap}
.rec-tag{font-size:11px;color:#64748b;display:flex;align-items:center;gap:5px}
.rec-tag-label{font-weight:700;color:#0a1628}
.rec-tag-dot{width:3px;height:3px;background:#cbd5e1;border-radius:50%;flex-shrink:0}

/* ── Appendix ───────────────────────────────────────────────────── */
.appendix-table{width:100%;border-collapse:collapse;font-size:12px}
.appendix-table th{background:#f8fafc;color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:8px 12px;border-top:1px solid #e2e8f0;border-bottom:2px solid #e2e8f0;text-align:left}
.appendix-table td{padding:9px 12px;border-bottom:1px solid #f8fafc;color:#374151;vertical-align:middle}
.appendix-table tr.prog-divider td{background:#f1f5f9;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#0a1628;border-top:2px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:8px 12px}
.appendix-table tr:last-child td{border-bottom:none}
.kd-no{font-family:'JetBrains Mono',monospace;font-size:10px;color:#94a3b8}

/* ── Footer ─────────────────────────────────────────────────────── */
.report-footer{margin-top:48px;padding-top:18px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;font-family:'JetBrains Mono',monospace}
.footer-pif{color:#FF5500;font-weight:700}

/* ── Print ───────────────────────────────────────────────────────── */
@media print{
  body{background:#fff}
  .cover{page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .section{page-break-inside:avoid}
  .priority-card{page-break-inside:avoid}
  .rec-item{page-break-inside:avoid}
  .content{padding:0}
  @page{size:A4;margin:18mm 20mm}
}
`;

/* ─────────────────────────────────────────────────────────────────
   HTML SECTION ASSEMBLERS
───────────────────────────────────────────────────────────────── */
function cover(divName, today, totals) {
  const name = divName.includes(' ') ? divName : divName;
  const words = divName.split(' ');
  const titleHtml = words.length >= 3
    ? words.slice(0, -1).join(' ') + ' <span>' + words.at(-1) + '</span>'
    : `<span>${divName}</span>`;

  return `<div class="cover">
  <div class="cover-left">
    <div class="cover-tag">Pahlé India Foundation</div>
    <div class="cover-sub">NHM Arunachal Pradesh &nbsp;·&nbsp; FY 2025–26 Performance Review</div>
    <h1 class="cover-title">${titleHtml}</h1>
    <div class="cover-date">Report generated ${today}</div>
  </div>
  <div class="cover-kpis">
    <div class="kpi-box">
      <div class="kpi-val">${totals.total}</div>
      <div class="kpi-lbl">KDs Tracked</div>
    </div>
    <div class="kpi-box kpi-box--red">
      <div class="kpi-val kpi-val--red">${totals.gap}</div>
      <div class="kpi-lbl">Critical Gaps</div>
    </div>
    <div class="kpi-box kpi-box--green">
      <div class="kpi-val kpi-val--green">${totals.achieved}</div>
      <div class="kpi-lbl">On Track</div>
    </div>
  </div>
</div>`;
}

function execSection(text) {
  return `<div class="section">
  <div class="section-header">
    <span class="section-num">01</span>
    <span class="section-title">Executive Summary</span>
  </div>
  <div class="exec-card">${esc(text) || 'Performance data compiled. See division scorecard for programme-level detail.'}</div>
</div>`;
}

function scorecardSection(programmes) {
  const rows = programmes.map(p => {
    const chips = [
      p.counts.gap    > 0 ? `<span class="kd-chip kd-chip-red">${p.counts.gap} critical</span>`    : '',
      p.counts.close  > 0 ? `<span class="kd-chip kd-chip-yellow">${p.counts.close} caution</span>` : '',
      p.counts.achieved > 0 ? `<span class="kd-chip kd-chip-green">${p.counts.achieved} on track</span>` : '',
    ].filter(Boolean).join('');

    return `<tr>
      <td><span class="prog-name">${esc(p.name)}</span></td>
      <td>${statusBadge(p.status)}</td>
      <td><div class="kd-chips">${chips || '<span style="color:#94a3b8">—</span>'}</div></td>
      <td><span class="key-concern">${esc(p.worstKD?.indicator ?? '—')}</span></td>
      <td>${achBar(p.counts.achieved, p.total)}</td>
    </tr>`;
  }).join('');

  return `<div class="section">
  <div class="section-header">
    <span class="section-num">02</span>
    <span class="section-title">Programme Performance Overview</span>
  </div>
  <table class="scorecard-table">
    <thead><tr>
      <th>Programme</th><th>Status</th><th>KD Breakdown</th><th>Key Concern</th><th>Progress</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function prioritySection(programmes, analyses) {
  const critical = programmes.filter(p => p.status === 'red' || p.status === 'yellow');
  if (!critical.length) {
    return `<div class="section">
      <div class="section-header"><span class="section-num">04</span><span class="section-title">Areas Requiring Attention</span></div>
      <div class="exec-card" style="border-left-color:#16a34a;background:rgba(22,163,74,.04)">No critical programmes identified. Division is performing within targets.</div>
    </div>`;
  }

  const cards = critical.map(p => {
    const isCritical = p.status === 'red';
    const cardClass  = isCritical ? 'priority-card' : 'priority-card priority-card--caution';
    const kdTableRows = p.gapKDs.map(kd => {
      const ratio  = kd.target ? (kd.achievement / kd.target * 100).toFixed(0) : null;
      const gapPct = kd.target ? (kdDeficit(kd) * 100).toFixed(0) : null;
      return `<tr>
        <td>${esc(kd.indicator)}</td>
        <td class="mono">${esc(kd.achievedLabel ?? kd.achievement ?? '—')}</td>
        <td class="mono">${esc(kd.targetLabel ?? kd.target ?? '—')}</td>
        <td class="mono">${ratio ? ratio + '%' : '—'}</td>
        <td class="gap-pct">${gapPct ? '–' + gapPct + '%' : '—'}</td>
        <td>${kdBadge('gap')}</td>
      </tr>`;
    }).join('');

    const analysis = analyses[p.id];

    return `<div class="${cardClass}">
      <div class="priority-card-header">
        <span class="priority-prog-name">${esc(p.name)}</span>
        ${statusBadge(p.status)}
      </div>
      <div class="kd-chips" style="margin-bottom:12px">
        ${p.counts.gap    > 0 ? `<span class="kd-chip kd-chip-red">${p.counts.gap} critical KDs</span>`    : ''}
        ${p.counts.close  > 0 ? `<span class="kd-chip kd-chip-yellow">${p.counts.close} caution KDs</span>` : ''}
        ${p.counts.achieved > 0 ? `<span class="kd-chip kd-chip-green">${p.counts.achieved} on track</span>` : ''}
      </div>
      ${p.gapKDs.length ? `<table class="kd-data-table">
        <thead><tr><th>Indicator</th><th>Achievement</th><th>Target</th><th>% of Target</th><th>Gap</th><th>Status</th></tr></thead>
        <tbody>${kdTableRows}</tbody>
      </table>` : ''}
      ${analysis ? `<div class="priority-analysis">${esc(analysis)}</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="section">
  <div class="section-header">
    <span class="section-num">04</span>
    <span class="section-title">Areas Requiring Attention</span>
  </div>
  ${cards}
</div>`;
}

function workingSection(workingText, programmes) {
  const checkIcon = `<svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  let bullets = workingText
    .split('\n')
    .map(l => l.replace(/^[-•*]\s*/, '').trim())
    .filter(l => l.length > 4);

  // Data fallback if LLM gave nothing
  if (!bullets.length) {
    bullets = programmes
      .flatMap(p => p.achKDs.map(kd => `${p.name}: ${kd.indicator} — ${kd.achievedLabel ?? kd.achievement} achieved`))
      .slice(0, 4);
  }

  if (!bullets.length) bullets = ['No programmes have met all targets in the current reporting period.'];

  const items = bullets.slice(0, 5).map(b => `
    <li class="working-item">
      <div class="working-icon">${checkIcon}</div>
      <span class="working-text">${esc(b)}</span>
    </li>`).join('');

  return `<div class="section">
  <div class="section-header">
    <span class="section-num">03</span>
    <span class="section-title">What is Working</span>
  </div>
  <ul class="working-list">${items}</ul>
</div>`;
}

function recsSection(recsText) {
  const items = recsText
    .split('\n')
    .filter(l => /^\d+\./.test(l.trim()))
    .map(l => l.trim().replace(/^\d+\.\s*/, ''));

  if (!items.length) return '';

  const cards = items.map((item, i) => {
    const respM = item.match(/Responsible:\s*([^·\n·]+)/i);
    const timeM = item.match(/Timeline:\s*([^·\n·]+)/i);
    const text  = item.replace(/[·•]\s*Responsible:.*$/i, '').replace(/[·•]\s*Timeline:.*$/i, '').trim();

    return `<div class="rec-item">
      <div class="rec-num-col"><span class="rec-num-val">${String(i + 1).padStart(2,'0')}</span></div>
      <div class="rec-body">
        <div class="rec-text">${esc(text)}</div>
        ${(respM || timeM) ? `<div class="rec-meta">
          ${respM ? `<span class="rec-tag"><span class="rec-tag-label">Responsible</span><span class="rec-tag-dot"></span>${esc(respM[1].replace(/[·]/g,'').trim())}</span>` : ''}
          ${timeM ? `<span class="rec-tag"><span class="rec-tag-label">Timeline</span><span class="rec-tag-dot"></span>${esc(timeM[1].replace(/[·]/g,'').trim())}</span>` : ''}
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="section">
  <div class="section-header">
    <span class="section-num">05</span>
    <span class="section-title">Suggestive AI-Based Recommendations</span>
  </div>
  <div class="rec-list">${cards}</div>
</div>`;
}

function appendixSection(programmes) {
  const rows = programmes.flatMap(p => {
    const dividerRow = `<tr class="prog-divider"><td colspan="6">${esc(p.name)}</td></tr>`;
    const kdRows = p.kds.map(kd => {
      const st     = kdStatus(kd);
      const ratio  = kd.target ? (kd.achievement / kd.target * 100).toFixed(1) + '%' : '—';
      return `<tr>
        <td class="kd-no">KD${kd.no ?? ''}</td>
        <td>${esc(kd.indicator)}</td>
        <td class="mono">${esc(kd.targetLabel ?? kd.target ?? '—')}</td>
        <td class="mono">${esc(kd.achievedLabel ?? kd.achievement ?? '—')}</td>
        <td class="mono">${ratio}</td>
        <td>${kdBadge(st)}</td>
      </tr>`;
    }).join('');
    return dividerRow + kdRows;
  }).join('');

  return `<div class="section">
  <div class="section-header">
    <span class="section-num">A</span>
    <span class="section-title">Appendix — Full Key Deliverables</span>
  </div>
  <table class="appendix-table">
    <thead><tr><th>KD</th><th>Indicator</th><th>Target</th><th>Achievement</th><th>% of Target</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

/* ─────────────────────────────────────────────────────────────────
   ASSEMBLE FULL HTML DOCUMENT
───────────────────────────────────────────────────────────────── */
function buildDocument(divData, today, narrative) {
  const { fullName, programmes, totals } = divData;
  const parsed = parseNarrative(narrative);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullName)} — NHM Arunachal Pradesh Performance Report FY 2025–26</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>${REPORT_CSS}</style>
</head>
<body>
${cover(fullName, today, totals)}
<div class="content">
  ${execSection(parsed.exec)}
  ${scorecardSection(programmes)}
  ${workingSection(parsed.working, programmes)}
  ${prioritySection(programmes, parsed.analyses)}
  ${recsSection(parsed.recs)}
  ${appendixSection(programmes)}
  <footer class="report-footer">
    <span class="footer-pif">Pahlé India Foundation</span>
    <span>${esc(fullName)} · NHM Arunachal Pradesh</span>
    <span>${today} · Confidential</span>
  </footer>
</div>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────
   REQUEST HANDLER — SSE STREAMING
───────────────────────────────────────────────────────────────── */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ detail: 'Method not allowed' });

  const { divisionId } = req.query;
  if (!VALID.has(divisionId))
    return res.status(404).json({ detail: `Unknown division: ${divisionId}` });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ detail: 'GROQ_API_KEY not configured' });

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');

  const send = data => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    /* Step 0 — compute KD data */
    send({ type: 'step', idx: 0 });
    const divData = computeDivData(divisionId);
    if (!divData) throw new Error(`No KD data for division: ${divisionId}`);

    /* Step 1 — LLM: narrative analysis */
    send({ type: 'step', idx: 1 });
    const prompt = buildPrompt(divData);
    const narrative = await groqCall(
      apiKey, STRONG_MODEL,
      'You are a senior public health analyst at Pahlé India Foundation. Follow the section format EXACTLY as instructed.',
      prompt,
      2500,
    );

    /* Step 2 — build HTML from template */
    send({ type: 'step', idx: 2 });
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = buildDocument(divData, today, narrative);

    /* Step 3 — done */
    send({ type: 'step', idx: 3 });
    send({ type: 'done', html, division: divData.fullName });
    res.end();

  } catch (e) {
    console.error('Report error:', e);
    send({ type: 'error', message: e.message || 'Report generation failed' });
    res.end();
  }
}
