import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import ThemeToggle from '../components/ThemeToggle';
import { KD_TREE } from '../data/kdData';
import { STATUS_CONFIG } from '../data/programs';
import CurrentStatusSection, { CSEntryBar } from './CurrentStatusSection';

/* ── Status helpers ──────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement === null || kd.achievement === undefined ||
      kd.target === null || kd.target === undefined) return 'neutral';
  const gap = kd.lowerIsBetter
    ? kd.target - kd.achievement
    : kd.achievement - kd.target;
  if (gap >= 0)   return 'achieved';
  if (gap >= -10) return 'close';
  return 'gap';
}

const STATUS_COLOR = {
  achieved: '#059669',
  close:    '#D97706',
  gap:      '#DC2626',
  neutral:  '#94A3B8',
};

const STATUS_LABEL = {
  achieved: 'Achieved',
  close:    'Near Target',
  gap:      'Gap',
  neutral:  '—',
};

/* ── Type ordering ───────────────────────────────────────────────── */
const TYPE_ORDER = ['Input', 'Process', 'Output', 'Outcome'];

/* ── Summary chips ───────────────────────────────────────────────── */
function SummaryChips({ kds }) {
  const total    = kds.length;
  const achieved = kds.filter(k => kdStatus(k) === 'achieved').length;
  const close    = kds.filter(k => kdStatus(k) === 'close').length;
  const gap      = kds.filter(k => kdStatus(k) === 'gap').length;

  const chips = [
    { label: 'Total KDs',    value: total,    color: '#334155', bg: '#F1F5F9' },
    { label: 'Achieved',     value: achieved, color: '#059669', bg: '#ECFDF5' },
    { label: 'Near Target',  value: close,    color: '#D97706', bg: '#FFFBEB' },
    { label: 'Gap',          value: gap,      color: '#DC2626', bg: '#FEF2F2' },
  ];

  return (
    <div className="kd-prog-status-bar">
      {chips.map(c => (
        <div key={c.label} className="kd-summary-chip" style={{ background: c.bg }}>
          <span className="kd-summary-num" style={{ color: c.color }}>{c.value}</span>
          <span className="kd-summary-lbl">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── NFHS strip ──────────────────────────────────────────────────── */
function NfhsStrip({ nfhsData }) {
  const rows = (nfhsData || [])
    .filter(d => d.nfhs4 !== null && d.nfhs5 !== null)
    .slice(0, 3);

  if (rows.length === 0) return null;

  return (
    <div className="kd-prog-section">
      <div className="kd-section-eyebrow">NFHS Baseline</div>
      <div className="kd-nfhs-strip">
        {rows.map((d, i) => {
          const improved = d.lowerIsBetter ? d.nfhs5 < d.nfhs4 : d.nfhs5 > d.nfhs4;
          const diff = (d.nfhs5 - d.nfhs4).toFixed(1);
          const arrowColor = improved ? '#059669' : '#DC2626';
          const arrowSign  = d.nfhs5 > d.nfhs4 ? '+' : '';
          return (
            <div key={i} className="kd-nfhs-item">
              <div className="kd-nfhs-label">{d.label}</div>
              <div className="kd-nfhs-values">
                <span className="kd-nfhs-val nfhs4">{d.nfhs4}{d.unit}</span>
                <span className="kd-nfhs-arrow">→</span>
                <span className="kd-nfhs-val nfhs5">{d.nfhs5}{d.unit}</span>
                <span className="kd-nfhs-diff" style={{ color: arrowColor }}>
                  {arrowSign}{diff}{d.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── KD Table row ────────────────────────────────────────────────── */
function KDRow({ kd, onSelectIndicator }) {
  const st = kdStatus(kd);
  const color = STATUS_COLOR[st];

  return (
    <div
      className={`kd-table-row${st === 'gap' ? ' kd-table-row--gap' : ''}`}
      onClick={() => onSelectIndicator(kd)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelectIndicator(kd)}
    >
      <div className="kd-ind-name">{kd.indicator}</div>
      <div className="kd-target-val">
        {kd.targetLabel ?? (kd.target !== null ? `${kd.target}${kd.unit}` : '—')}
      </div>
      <div className="kd-ach-val" style={{ color }}>
        {kd.achievedLabel ?? (kd.achievement !== null ? `${kd.achievement}${kd.unit}` : '—')}
      </div>
      <div className="kd-status-dot" style={{ background: color }} title={STATUS_LABEL[st]} />
      <div className="kd-drill-arrow">→</div>
    </div>
  );
}

/* ── Critical KDs callout ────────────────────────────────────────── */
function CriticalKDs({ kds }) {
  const gapKds = kds.filter(k => kdStatus(k) === 'gap');
  if (gapKds.length === 0) return null;

  return (
    <div className="kd-prog-section">
      <div className="kd-section-eyebrow">Requires Immediate Attention</div>
      <div style={{
        background: '#FEF2F2',
        border: '1.5px solid rgba(220,38,38,0.25)',
        borderLeft: '4px solid #DC2626',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {gapKds.map(kd => (
          <div key={kd.no} style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: '#1A1F36',
              flex: 1,
              minWidth: 180,
            }}>
              {kd.indicator}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#6B7280',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              Target: {kd.targetLabel ?? (kd.target != null ? `${kd.target}${kd.unit}` : '—')}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              color: '#DC2626',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              Achieved: {kd.achievedLabel ?? (kd.achievement != null ? `${kd.achievement}${kd.unit}` : '—')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function KDProgrammePage({ program, division, onBack, onSelectIndicator, onCurrentStatus }) {
  const wrapRef = useRef(null);

  /* Lookup KDs from KD_TREE */
  const kds = (() => {
    if (!KD_TREE) return [];
    const divNode = KD_TREE[division?.id];
    if (!divNode) return [];
    return divNode.programmes?.[program?.id]?.kds ?? [];
  })();

  /* Group by type */
  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const items = kds.filter(k => k.type === type);
    if (items.length) acc.push({ type, items });
    return acc;
  }, []);

  const cfg = STATUS_CONFIG[program?.status] ?? STATUS_CONFIG.yellow;

  /* GSAP entry */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(wrapRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.48, ease: 'power3.out' },
      );
      gsap.from('.kd-prog-section', {
        y: 22, opacity: 0, duration: 0.42,
        stagger: 0.07, ease: 'power3.out', delay: 0.1,
      });
    }, wrapRef);
    return () => ctx.revert();
  }, [program?.id, division?.id]);

  const handleBack = () => onBack();

  return (
    <div className="ncd-root" ref={wrapRef}>

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <div className="ncd-topbar">
        <div className="ncd-topbar-inner">
          <button className="back-btn" onClick={handleBack}>
            <span className="back-chevron">←</span> Back
          </button>
          <div className="detail-breadcrumb">
            <span className="detail-div-tag">{division?.label}</span>
            <span className="detail-prog-name">{program?.name}</span>
          </div>
          <div className={`status-pill st-${program?.status}`}>
            {cfg.shortLabel}
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="ncd-content">

        {/* Programme header */}
        <div className="kd-prog-section">
          <div className="kd-prog-header">
            <div className="kd-prog-header-left">
              <div className="kd-prog-name">{program?.name}</div>
              {program?.summary && (
                <div className="kd-prog-summary">{program.summary}</div>
              )}
            </div>
            <div className={`status-pill st-${program?.status}`} style={{ flexShrink: 0 }}>
              {cfg.label}
            </div>
          </div>
        </div>

        {/* KD summary chips — performance first so the official sees gap count immediately */}
        {kds.length > 0 && (
          <div className="kd-prog-section">
            <div className="kd-section-eyebrow">Performance Summary — FY 2025-26</div>
            <SummaryChips kds={kds} />
          </div>
        )}

        {/* Critical KDs callout — only rendered when gap KDs exist */}
        <CriticalKDs kds={kds} />

        {/* ── CURRENT STATUS — entry bar above KD table ─────────── */}
        {program?.currentStatus && onCurrentStatus && (
          <div className="kd-prog-section">
            <CSEntryBar
              program={program}
              onClick={() => onCurrentStatus(program, division)}
            />
          </div>
        )}

        {/* KD indicator table */}
        <div className="kd-prog-section">
          <div className="kd-section-eyebrow">Key Deliverable Indicators</div>

          {kds.length === 0 ? (
            <div className="kd-empty-state">
              KD data will be added for this programme.
            </div>
          ) : (
            <div className="kd-table">
              {/* Table header */}
              <div className="kd-table-head">
                <div>Indicator</div>
                <div>Target</div>
                <div>Achievement</div>
                <div>Status</div>
                <div />
              </div>

              {/* Grouped rows */}
              {grouped.map(({ type, items }) => (
                <div key={type}>
                  <div className="kd-type-divider">{type}</div>
                  {items.map(kd => (
                    <KDRow
                      key={`${kd.no}-${kd.indicator}`}
                      kd={kd}
                      onSelectIndicator={onSelectIndicator}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NFHS strip — baseline context, after table so it doesn't interrupt the performance view */}
        <NfhsStrip nfhsData={program?.nfhsData} />

      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="detail-footer">
        Sources: HMIS FY 2025-26 (April–December 2025). NHM NPCC Meeting, Arunachal Pradesh, 1 April 2026.
        NFHS-5 (2019-21) State Fact Sheet — Arunachal Pradesh, IIPS Mumbai.
      </footer>
    </div>
  );
}
