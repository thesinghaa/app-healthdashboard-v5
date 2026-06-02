/* ═══════════════════════════════════════════════════════════════════════════
   getDivisionStats.js — Top-3 positive KD stats per NHM division
   Used by StatCard3D to populate each face of the rotating prism.

   Algorithm (runs against KD_TREE at runtime — auto-updates when data changes):
     Only shows KDs that are visibly positive — achieved or close status,
     with a non-zero, non-"Not done" achievement value.

     Priority order:
       1. Achieved KDs — sorted by most over-target first
       2. Close KDs    — sorted by best ratio (closest to achieved)

     Zeros, "Not done", null values are excluded entirely.
     Pad to exactly 3 faces by cycling if fewer positives exist.

   Output per face: { value, label, programme, status, pct, targetLabel }
   ═══════════════════════════════════════════════════════════════════════════ */

import { KD_TREE } from './kdData.js';

/* ── Pinned face-0 config ────────────────────────────────────────────────────
   These are the featured stats shown on each frozen card (face 0).
   KD numbers are sourced from KD_TREE; fmt() formats the achievement value.
   ─────────────────────────────────────────────────────────────────────────── */
/* ── Helper: extract numerator from achievedLabel like "18024/19823" ──────── */
function numeratorFrom(kd) {
  const raw = (kd.achievedLabel || String(kd.achievement || '')).trim();
  const num = Number(raw.split('/')[0].replace(/[^0-9]/g, ''));
  return isNaN(num) ? raw : num;
}

const FACE0_PINNED = {
  rch:  { no: 28,  progId: 'immunization',    label: 'Children fully immunised against a target of 19,823',                    fmt: kd => (kd.numerator||kd.achievement).toLocaleString('en-IN') },
  ndcp: { no: 82,  progId: 'nvhcp',           label: 'Hepatitis C patients in treatment against a target of 2,995',           fmt: kd => (kd.numerator||kd.achievement).toLocaleString('en-IN') },
  ncd:  { no: 125, progId: 'nppcd',           label: 'Persons provided with hearing aids against a target of 251',            fmt: kd => (kd.numerator||kd.achievement).toLocaleString('en-IN') },
  hss:  { no: 154, progId: null,              label: 'Ayushman Arogya Mandirs delivering all 12 essential health services',   fmt: kd => (kd.numerator||kd.achievement).toLocaleString('en-IN') },
  hrh:  { no: 169, progId: 'medical-officer', label: 'MBBS Medical Officer positions filled as per IPHS norms',               fmt: () => '96%' },
};

/** Build pinned face-0 for a division, reading live value from KD_TREE. */
function buildPinnedFace(divId) {
  const pin = FACE0_PINNED[divId];
  if (!pin) return null;

  /* flatten all KDs for this division and find the pinned KD by number */
  const allKDs = [];
  const treeSrc = divId === 'hrh' ? KD_TREE['hss'] : KD_TREE[divId];
  if (!treeSrc) return null;
  Object.values(treeSrc.programmes || {}).forEach(prog =>
    (prog.kds || []).forEach(kd => allKDs.push(kd))
  );
  const kd = allKDs.find(k => k.no === pin.no);
  if (!kd) return null;

  return {
    value:  pin.fmt(kd),
    label:  pin.label,
    status: 'achieved',
    pct:    kd.target > 0 ? Math.round((kd.achievement / kd.target) * 100) : null,
    kd,
    progId: pin.progId,
  };
}

/* ── Status helpers ──────────────────────────────────────────────────────── */
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const r = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return r <= 1 ? 'achieved' : r <= 1.33 ? 'close' : 'gap';
  return r >= 1 ? 'achieved' : r >= 0.75 ? 'close' : 'gap';
}

/** Deficit score — negative = good (achieved), positive = bad (gap). */
function deficit(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return null;
  const r = kd.achievement / kd.target;
  return kd.lowerIsBetter ? r - 1 : 1 - r;
}

/**
 * Returns true when a KD has a meaningful positive value worth showing.
 * Excludes: zero achievements, "Not done", "0%", "0/x (0%)" patterns.
 */
function isPositive(kd) {
  if (kd.achievement == null || kd.achievement === 0) return false;
  const lbl = (kd.achievedLabel || String(kd.achievement)).trim().toLowerCase();
  if (lbl === 'not done') return false;
  if (lbl === '0' || lbl === '0%') return false;
  /* "0/x (0%)" pattern */
  if (/^0\//.test(lbl)) return false;
  return true;
}

/* ── Flatten all KDs for a division ─────────────────────────────────────── */
function flattenKDs(divId) {
  /* HRH KDs live inside hss.programmes.hrh — not a top-level KD_TREE key */
  if (divId === 'hrh') {
    const hrhProg = KD_TREE['hss']?.programmes?.['hrh'];
    if (!hrhProg) return [];
    return (hrhProg.kds || [])
      .filter(kd => kd.achievement != null && kd.target != null && kd.target !== 0)
      .map(kd => ({ ...kd, progName: hrhProg.name || 'Human Resources for Health' }));
  }

  const tree = KD_TREE[divId];
  if (!tree) return [];
  const all = [];
  Object.entries(tree.programmes || {}).forEach(([, prog]) => {
    (prog.kds || []).forEach(kd => {
      if (kd.achievement == null || kd.target == null || kd.target === 0) return;
      all.push({ ...kd, progName: prog.name || prog.id || '' });
    });
  });
  return all;
}

/* ── Build a face object from a KD ─────────────────────────────────────── */
function buildFace(kd) {
  const status = kdStatus(kd);
  const pct    = Math.round((kd.achievement / kd.target) * 100);
  return {
    value:       kd.achievedLabel  || String(kd.achievement),
    label:       kd.indicator,
    programme:   kd.progName,
    status,
    pct,
    targetLabel: kd.targetLabel || String(kd.target),
  };
}

/* ── Main export ─────────────────────────────────────────────────────────── */
/**
 * Returns exactly 3 face objects for the given division.
 * Only surfaces positive, visibly-good KDs (achieved or close, non-zero).
 * Pads to 3 by cycling if fewer than 3 positives exist.
 */
export function getDivisionStats(divId) {
  /* Face 0 — always the pinned featured stat */
  const pinned = buildPinnedFace(divId);

  const all = flattenKDs(divId);
  if (!all.length) return pinned ? [pinned, pinned, pinned] : [];

  /* Keep only meaningful positive values */
  const positive = all.filter(isPositive);

  /* Achieved — most over-target first */
  const achieved = positive
    .filter(k => kdStatus(k) === 'achieved')
    .sort((a, b) => (deficit(a) ?? 0) - (deficit(b) ?? 0));

  /* Close — best ratio first (smallest deficit) */
  const closes = positive
    .filter(k => kdStatus(k) === 'close')
    .sort((a, b) => (deficit(a) ?? 0) - (deficit(b) ?? 0));

  /* Merge: achieved first, then close — skip pinned KD for faces 1 & 2 */
  const pinnedNo = FACE0_PINNED[divId]?.no;
  const pool = [...achieved, ...closes].filter(k => k.no !== pinnedNo);
  const used = new Set();
  const rest = [];
  for (const kd of pool) {
    if (rest.length >= 2) break;
    if (!used.has(kd.no)) {
      rest.push(kd);
      used.add(kd.no);
    }
  }

  /* If nothing positive exists at all, fall back to best non-zero KD */
  if (!rest.length) {
    const fallback = all
      .filter(k => isPositive(k) && k.no !== pinnedNo)
      .sort((a, b) => (deficit(a) ?? 0) - (deficit(b) ?? 0));
    if (fallback[0]) rest.push(fallback[0]);
    if (fallback[1]) rest.push(fallback[1]);
  }

  /* Build faces 1 & 2 from auto-algorithm; face 0 is always pinned */
  const face0 = pinned ?? (rest[0] ? buildFace(rest[0]) : null);
  const face1 = rest[0] ? buildFace(rest[0]) : face0;
  const face2 = rest[1] ? buildFace(rest[1]) : face1;

  if (!face0) return [];
  return [face0, face1, face2];
}
