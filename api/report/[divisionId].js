import { KD_TREE } from '../../src/data/kdData.js';

export const maxDuration = 60;

const VALID = new Set(['rch', 'ndcp', 'ncd', 'hss', 'hrh']);

const FAST_MODEL   = 'llama-3.1-8b-instant';
const STRONG_MODEL = 'llama-3.3-70b-versatile';

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

function buildSummary(divisionId) {
  const div = KD_TREE[divisionId];
  if (!div) return `No KD data for division: ${divisionId}`;

  const lines = [`DIVISION: ${div.fullName || divisionId.toUpperCase()}\n`];
  let totalKDs = 0, totalAch = 0, totalClose = 0, totalGap = 0;

  const gaps = [];

  for (const [progId, prog] of Object.entries(div.programmes || {})) {
    const kds = prog.kds || [];
    let pAch = 0, pClose = 0, pGap = 0, pNeutral = 0;

    lines.push(`\nPROGRAMME: ${prog.name} (${progId})`);
    lines.push(`${'─'.repeat(50)}`);

    for (const kd of kds) {
      const st = kdStatus(kd);
      if (st === 'neutral') { pNeutral++; continue; }
      if (st === 'achieved') pAch++;
      else if (st === 'close') pClose++;
      else pGap++;

      const ratio = kd.achievement != null && kd.target
        ? (kd.achievement / kd.target * 100).toFixed(1)
        : 'N/A';
      const flag = st === 'gap' ? '[CRITICAL]' : st === 'close' ? '[CAUTION]' : '[OK]';
      lines.push(
        `  KD${kd.no || ''} ${flag} ${kd.indicator}: ${kd.achievedLabel ?? kd.achievement} / target ${kd.targetLabel ?? kd.target} (${ratio}% of target)${kd.lowerIsBetter ? ' [lower is better]' : ''}`
      );

      if (st === 'gap' && kd.achievement != null) {
        const deficit = kd.lowerIsBetter
          ? (kd.achievement / kd.target - 1) * 100
          : (1 - kd.achievement / kd.target) * 100;
        gaps.push({ indicator: kd.indicator, programme: prog.name, deficit, achieved: kd.achievedLabel ?? kd.achievement, target: kd.targetLabel ?? kd.target });
      }
    }

    lines.push(`  Summary: ${pAch} achieved, ${pClose} caution, ${pGap} critical, ${pNeutral} no data`);
    totalKDs   += pAch + pClose + pGap;
    totalAch   += pAch;
    totalClose += pClose;
    totalGap   += pGap;
  }

  gaps.sort((a, b) => b.deficit - a.deficit);

  lines.unshift(
    `SNAPSHOT: ${totalKDs} KDs total — ${totalAch} achieved, ${totalClose} caution, ${totalGap} critical\n` +
    `TOP CRITICAL GAPS:\n` +
    gaps.slice(0, 5).map((g, i) =>
      `  ${i + 1}. ${g.indicator} (${g.programme}): ${g.achieved} vs target ${g.target} — ${g.deficit.toFixed(0)}% gap`
    ).join('\n')
  );

  return lines.join('\n');
}

async function groqCall(apiKey, model, systemMsg, userMsg, maxTokens = 2000) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user',   content: userMsg   },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${model} error ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { divisionId } = req.query;
  if (!VALID.has(divisionId)) return res.status(404).json({ detail: `Unknown division: ${divisionId}` });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ detail: 'GROQ_API_KEY not configured' });

  const divData = KD_TREE[divisionId];
  const divName = divData?.fullName || divisionId.toUpperCase();
  const kdSummary = buildSummary(divisionId);

  try {
    // Agent 1 — DataCollector: structure the data
    const briefing = await groqCall(
      apiKey, FAST_MODEL,
      `You are a data analyst at Pahlé India Foundation embedded with the NHM Arunachal Pradesh team. ` +
      `You read KD achievement data and produce precise, structured performance briefings.`,
      `Produce a structured data briefing for ${divName} division (NHM Arunachal Pradesh FY 2025-26).\n\n` +
      `KD DATA:\n${kdSummary}\n\n` +
      `Include:\n` +
      `1. Division snapshot (total programmes, KD counts by status)\n` +
      `2. Per-programme table (name, status, KD achieved/caution/critical, key concern)\n` +
      `3. Top 5 most critical KD gaps with exact numbers\n` +
      `4. Top 3 best-performing KDs\n` +
      `Be precise with numbers. No commentary yet.`,
      1500,
    );

    // Agent 2 — Analyst: interpret priorities and recommendations
    const analysis = await groqCall(
      apiKey, STRONG_MODEL,
      `You are a senior public health programme analyst with 10 years in NHM monitoring in India. ` +
      `You write clear, actionable analyses for district-level health officers in Arunachal Pradesh.`,
      `Using the data briefing below, produce a strategic analysis for ${divName} division.\n\n` +
      `DATA BRIEFING:\n${briefing}\n\n` +
      `Include:\n` +
      `1. TOP 3 CRITICAL PRIORITIES — what the data shows and likely root causes (HR, supply chain, training, infra)\n` +
      `2. POSITIVE FINDINGS — what is working and why it matters\n` +
      `3. SYSTEMIC PATTERNS — cross-programme issues\n` +
      `4. RISK ASSESSMENT — highest risk to beneficiaries and SDG targets\n` +
      `5. STRATEGIC RECOMMENDATIONS — 5-7 specific, actionable steps with responsible party and timeline\n` +
      `Write in officer-facing language. Be specific, not generic.`,
      2000,
    );

    // Agent 3 — ReportWriter: produce final HTML report
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const htmlReport = await groqCall(
      apiKey, STRONG_MODEL,
      `You write executive health reports for government health departments in India. ` +
      `Your reports are polished, data-driven, and structured so a busy district officer can act on them. ` +
      `You produce clean, self-contained HTML with inline CSS — no external dependencies except Google Fonts.`,
      `Write a complete HTML report for ${divName} division (NHM Arunachal Pradesh).\n\n` +
      `DATA BRIEFING:\n${briefing}\n\n` +
      `ANALYSIS:\n${analysis}\n\n` +
      `REPORT STRUCTURE (all sections required):\n` +
      `1. Header — "${divName}", "NHM Arunachal Pradesh", date "${today}", "Pahlé India Foundation"\n` +
      `2. Executive Summary — 2-3 sentences on overall health of the division\n` +
      `3. Division Scorecard — HTML table: Programme | Status badge | Key concern | KDs achieved/total\n` +
      `4. Critical Priorities — 1 card per critical programme: issue, data, what must change\n` +
      `5. What is Working — 2-3 bright spots with numbers\n` +
      `6. Strategic Recommendations — numbered, 5-7 items, responsible party + timeline\n` +
      `7. Appendix — full KD table: Programme | Indicator | Target | Achievement | Status badge\n\n` +
      `STYLING:\n` +
      `- Self-contained HTML, ALL CSS in a <style> block\n` +
      `- Load Inter from Google Fonts\n` +
      `- Light background #f8f9fa, PIF orange #FF5500 for headings/accents\n` +
      `- Status badges: critical=bg #fee2e2 text #991b1b, caution=bg #fef3c7 text #92400e, on-track=bg #d1fae5 text #065f46\n` +
      `- Max-width 900px centered, A4-friendly padding for print\n` +
      `- Professional look — this will be printed and shared with senior NHM officials\n` +
      `- DO NOT use markdown, only valid HTML starting with <!DOCTYPE html>`,
      4000,
    );

    // Extract clean HTML — model sometimes wraps in code fences
    let html = htmlReport.trim();
    if (html.startsWith('```')) {
      html = html.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
    }
    if (!html.startsWith('<!')) {
      const idx = html.indexOf('<!DOCTYPE');
      if (idx > -1) html = html.slice(idx);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ html, division: divName });

  } catch (e) {
    console.error('Report generation error:', e);
    return res.status(500).json({ detail: e.message || 'Report generation failed' });
  }
}
