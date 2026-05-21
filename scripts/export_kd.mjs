/**
 * Export kdData.js + division programme metadata to backend-py/kd_data.json
 * Run: node scripts/export_kd.mjs
 */
import { KD_TREE } from '../src/data/kdData.js';
import { DIVISIONS } from '../src/data/programs.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../backend-py/kd_data.json');

const combined = {};

for (const div of DIVISIONS) {
  const kdDiv = KD_TREE[div.id] || {};
  combined[div.id] = {
    id: div.id,
    label: div.label,
    fullName: div.fullName,
    programmes: {},
  };

  for (const prog of div.programs) {
    const kdProg = (kdDiv.programmes || {})[prog.id] || {};
    combined[div.id].programmes[prog.id] = {
      id:           prog.id,
      name:         prog.name,
      status:       prog.status        ?? 'yellow',
      keyMetric:    prog.keyMetric     ?? null,
      statusReason: prog.statusReason  ?? null,
      summary:      prog.summary       ?? null,
      observations: prog.observations  ?? [],
      actions:      prog.actions       ?? [],
      nfhsData:     prog.nfhsData      ?? [],
      hasCurrentStatus: !!(prog.currentStatus),
      kds:          kdProg.kds         ?? [],
    };
  }
}

fs.writeFileSync(outPath, JSON.stringify(combined, null, 2));
console.log(`Exported ${Object.keys(combined).length} divisions → ${outPath}`);
