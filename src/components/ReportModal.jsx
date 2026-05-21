import { useState, useRef } from 'react';

const API_BASE = import.meta.env.VITE_REPORT_API_URL || 'http://localhost:8000';

const STEPS = [
  { label: 'Collecting programme data', pct: 20 },
  { label: 'Fetching HMIS live trends', pct: 38 },
  { label: 'Generating charts',         pct: 52 },
  { label: 'Analysing performance',     pct: 70 },
  { label: 'Writing report',            pct: 90 },
  { label: 'Finalising',               pct: 100 },
];

export default function ReportModal({ divisionId, divisionName, onClose }) {
  const [phase, setPhase]     = useState('idle'); // idle | loading | done | error
  const [stepIdx, setStepIdx] = useState(0);
  const [html, setHtml]       = useState('');
  const [errMsg, setErrMsg]   = useState('');
  const intervalRef           = useRef(null);

  function advanceSteps() {
    let i = 0;
    setStepIdx(0);
    intervalRef.current = setInterval(() => {
      i += 1;
      if (i < STEPS.length - 1) setStepIdx(i);
      else clearInterval(intervalRef.current);
    }, 6000);
  }

  async function generate() {
    setPhase('loading');
    setStepIdx(0);
    advanceSteps();
    try {
      const res = await fetch(`${API_BASE}/api/report/${divisionId}`, {
        method: 'POST',
      });
      clearInterval(intervalRef.current);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Server error' }));
        throw new Error(err.detail || 'Server error');
      }
      const data = await res.json();
      setHtml(data.html);
      setStepIdx(STEPS.length - 1);
      setPhase('done');
    } catch (e) {
      clearInterval(intervalRef.current);
      setErrMsg(e.message);
      setPhase('error');
    }
  }

  function handlePrint() {
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  const step = STEPS[Math.min(stepIdx, STEPS.length - 1)];

  return (
    <div className="rpt-overlay" onClick={onClose}>
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
                  <rect x="8" y="6" width="32" height="36" rx="4" stroke="#FF5500" strokeWidth="2"/>
                  <path d="M16 16h16M16 22h16M16 28h10" stroke="#FF5500" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="36" cy="36" r="8" fill="#051c2c" stroke="#FF5500" strokeWidth="1.5"/>
                  <path d="M33 36l2 2 4-4" stroke="#FF5500" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="rpt-idle-title">Generate Division Report</h3>
              <p className="rpt-idle-desc">
                3 AI agents will analyse all {divisionName} KDs, HMIS live trends, and
                NFHS baselines — then write a 4–5 page executive report with embedded charts.
                Takes ~40–60 seconds.
              </p>
              <div className="rpt-idle-pills">
                <span className="rpt-pill">KD Performance</span>
                <span className="rpt-pill">HMIS Trends</span>
                <span className="rpt-pill">NFHS Baseline</span>
                <span className="rpt-pill">Charts</span>
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
                Powered by Groq + CrewAI · {step.pct}% complete
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
                Make sure the backend is running: <code>cd backend-py && uvicorn server:app --reload</code>
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
