/* ═══════════════════════════════════════════════════════════════════════════
   getDivisionStats.js — Dynamic top-3 KD stats per NHM division
   Used by StatCard3D to populate each face of the rotating prism.

   Algorithm (runs against KD_TREE at runtime — auto-updates when data changes):
     Face 0 — Most critical gap KD (biggest deficit vs NHM target)
     Face 1 — Best achieved KD (highest % over target)
     Face 2 — Best caution/close KD (in progress); falls back to 2nd achieved

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

/**
 * Deficit score — positive = worse performance.
 * gap KDs have positive deficit; achieved have negative.
 */
function deficit(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return null;
  const r = kd.achievement / kd.target;
  return kd.lowerIsBetter ? r - 1 : 1 - r;
}

/* ── Flatten all KDs for a division ─────────────────────────────────────── */
function flattenKDs(divId) {
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
 * Falls back gracefully if there aren't enough distinct KDs.
 */
export function getDivisionStats(divId) {
  const all = flattenKDs(divId);
  if (!all.length) return [];

  /* Separate by status, sort each bucket */
  const gaps  = all
    .filter(k => kdStatus(k) === 'gap')
    .sort((a, b) => (deficit(b) ?? 0) - (deficit(a) ?? 0));   // worst first

  const closes = all
    .filter(k => kdStatus(k) === 'close')
    .sort((a, b) => (deficit(b) ?? 0) - (deficit(a) ?? 0));   // closest-to-gap first

  const achieved = all
    .filter(k => kdStatus(k) === 'achieved')
    .sort((a, b) => (deficit(a) ?? 0) - (deficit(b) ?? 0));   // most over-achieved first

  /* Face 0 — most critical gap KD */
  const face0KD = gaps[0] ?? closes[0] ?? achieved[0];

  /* Face 1 — best achieved KD (pick first that isn't face0) */
  const usedNos = new Set([face0KD?.no]);
  const face1KD = achieved.find(k => !usedNos.has(k.no))
                ?? closes.find(k => !usedNos.has(k.no))
                ?? gaps.find(k => !usedNos.has(k.no));

  /* Face 2 — best close/caution KD (pick first unused) */
  usedNos.add(face1KD?.no);
  const face2KD = closes.find(k => !usedNos.has(k.no))
                ?? achieved.find(k => !usedNos.has(k.no))
                ?? gaps.find(k => !usedNos.has(k.no));

  return [face0KD, face1KD, face2KD]
    .filter(Boolean)
    .map(buildFace);
}
