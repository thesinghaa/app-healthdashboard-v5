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
  const all = flattenKDs(divId);
  if (!all.length) return [];

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

  /* Merge: achieved first, then close — pick 3 unique */
  const pool = [...achieved, ...closes];
  const used = new Set();
  const top3 = [];
  for (const kd of pool) {
    if (top3.length >= 3) break;
    if (!used.has(kd.no)) {
      top3.push(kd);
      used.add(kd.no);
    }
  }

  /* If nothing positive exists at all, fall back to best non-zero KD */
  if (!top3.length) {
    const fallback = all
      .filter(isPositive)
      .sort((a, b) => (deficit(a) ?? 0) - (deficit(b) ?? 0));
    if (fallback[0]) top3.push(fallback[0]);
  }

  if (!top3.length) return [];

  const faces = top3.map(buildFace);
  /* Pad to exactly 3 by cycling */
  return [0, 1, 2].map(i => faces[i % faces.length]);
}
