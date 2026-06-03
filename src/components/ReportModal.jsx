import { useState } from 'react';

const API_BASE = import.meta.env.VITE_REPORT_API_URL || '';

/* Steps match real backend SSE events — idx 0-3 */
const STEPS = [
  { label: 'Computing KD data',      pct: 15  },
  { label: 'Analysing performance',  pct: 55  },
  { label: 'Building report',        pct: 90  },
  { label: 'Finalising',            pct: 100 },
];

export default function ReportModal({ divisionId, divisionName, divisionColor, onClose }) {
  const [phase,   setPhase]   = useState('idle'); // idle | loading | done | error
  const [stepIdx, setStepIdx] = useState(0);
  const [html,    setHtml]    = useState('');
  const [errMsg,  setErrMsg]  = useState('');

  /* SSE stream reader — real progress from backend, no fake timer */
  async function generate() {
    setPhase('loading');
    setStepIdx(0);
    try {
      const res = await fetch(`${API_BASE}/api/report/${divisionId}`, {
        method: 'POST',
      });
      /* Pre-SSE failures (404 / 405 / 500 before streaming starts) */
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Server error' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }
          if (event.type === 'step')  setStepIdx(event.idx);
          if (event.type === 'done')  { setHtml(event.html); setPhase('done'); }
          if (event.type === 'error') { setErrMsg(event.message); setPhase('error'); }
        }
      }
    } catch (e) {
      setErrMsg(e.message);
      setPhase('error');
    }
  }

  /* Blob URL — avoids deprecated document.write and popup-blocker issues */
  function handlePrint() {
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 400);
      });
    }
  }

  const step = STEPS[Math.min(stepIdx, STEPS.length - 1)];

  const accent = divisionColor || '#FF5500';

  return (
    <div className="rpt-overlay" style={{ '--rpt-accent': accent }} onClick={onClose}>
      <div className="rpt-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="rpt-header">
          <div>
            <p className="rpt-header-label">REPORT GENERATOR</p>
            <h2 className="rpt-header-title">{divisionName}</h2>
          </div>
          <div className="rpt-header-actions">
            {phase === 'done' && (
              <button className="rpt-btn rpt-btn--pdf" onClick={handlePrint}>
                Download PDF
              </button>
            )}
            <button className="rpt-btn rpt-btn--close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="rpt-body">

          {/* Idle */}
          {phase === 'idle' && (
            <div className="rpt-idle">
              <div className="rpt-idle-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="6" width="32" height="36" rx="4" stroke={accent} strokeWidth="2"/>
                  <path d="M16 16h16M16 22h16M16 28h10" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="36" cy="36" r="8" fill="#051c2c" stroke={accent} strokeWidth="1.5"/>
                  <path d="M33 36l2 2 4-4" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="rpt-idle-title">Generate Division Report</h3>
              <p className="rpt-idle-desc">
                3 AI agents will analyse all {divisionName} KDs and NFHS baselines —
                then write a 4–5 page executive report with recommendations.
                Takes ~40–60 seconds.
              </p>
              <div className="rpt-idle-pills">
                <span className="rpt-pill">KD Performance</span>
                <span className="rpt-pill">Gap Analysis</span>
                <span className="rpt-pill">NFHS Baseline</span>
                <span className="rpt-pill">Recommendations</span>
              </div>
              <button className="rpt-btn rpt-btn--generate" onClick={generate}>
                Generate Report
              </button>
            </div>
          )}

          {/* Loading */}
          {phase === 'loading' && (
            <div className="rpt-loading">
              <div className="rpt-spinner" />
              <p className="rpt-loading-step">{step.label}…</p>
              <div className="rpt-progress-bar">
                <div className="rpt-progress-fill" style={{ width: `${step.pct}%` }} />
              </div>
              <p className="rpt-loading-sub">
                Powered by Groq · {step.pct}% complete
              </p>
              <div className="rpt-agent-list">
                {STEPS.map((s, i) => (
                  <div key={i} className={`rpt-agent-step${i <= stepIdx ? ' rpt-agent-step--done' : ''}${i === stepIdx ? ' rpt-agent-step--active' : ''}`}>
                    <span className="rpt-agent-dot" />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="rpt-error">
              <p className="rpt-error-title">Report generation failed</p>
              <p className="rpt-error-msg">{errMsg}</p>
              <p className="rpt-error-hint">
                Ensure <code>GROQ_API_KEY</code> is set in Vercel environment variables.
                Timeout errors require Vercel Pro for 60-second function execution.
              </p>
              <button className="rpt-btn rpt-btn--generate" onClick={() => setPhase('idle')}>
                Try Again
              </button>
            </div>
          )}

          {/* Done — render HTML report */}
          {phase === 'done' && (
            <div className="rpt-report-frame">
              <iframe
                title="Division Report"
                srcDoc={html}
                className="rpt-iframe"
                sandbox="allow-same-origin"
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
