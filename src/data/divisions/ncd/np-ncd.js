// NCD / NP-NCD — edit here to update this programme's data and source links
export default {
  id: 'np-ncd',
  name: 'National Programme for Non-Communicable Diseases',
  status: 'red',
  keyMetric: 'Male hypertension: 33.1%',
  statusReason: 'Hypertension: men 33.1%, women 24.9% — growing NCD crisis',
  summary:
    'Hypertension is at critical levels — 33.1% of men and 24.9% of women have elevated blood pressure. Blood sugar levels are also elevated. NCD burden is growing against weak screening infrastructure.',
  keyMetrics: [
    { label: 'Men Elevated BP', value: '33.1%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Women Elevated BP', value: '24.9%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Men High Blood Sugar', value: '6.7%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Women High Blood Sugar', value: '4.6%', change: null, changeDir: null, source: 'NFHS-5' },
  ],
  observations: [
    'Men elevated blood pressure (≥140/90 mmHg) at 33.1% — near epidemic level',
    'Women elevated blood pressure at 24.9% — significant and growing burden',
    'Men high blood sugar (>140 mg/dl) at 6.7%, very high (>160) at 4.3%',
    'Women overweight/obese increased from 18.8% to 23.9% — NCD risk amplifier',
    'Hypertension was a noted cause of maternal death (hypertensive disorders: 5.51%)',
    'NPCC recommends strengthening NP-NCD screening and treatment at PHC level',
  ],
  actions: [
    'Launch universal BP and blood sugar screening at all facility contacts (30 years and above)',
    'Establish NCD clinics with treatment protocols at every CHC and above',
    'Train MOs and nursing staff on hypertension and diabetes management guidelines',
    'Integrate NCD screening with maternal health contact points for women',
    'Establish patient registries for hypertension and diabetes at district level',
  ],
  nfhsData: [
    { label: 'Women — elevated BP (≥140/90 mmHg)', nfhs4: null, nfhs5: 24.9, unit: '%', lowerIsBetter: true },
    { label: 'Men — elevated BP (≥140/90 mmHg)', nfhs4: null, nfhs5: 33.1, unit: '%', lowerIsBetter: true },
    { label: 'Women — mildly elevated BP (140-159/90-99)', nfhs4: 10.4, nfhs5: 16.4, unit: '%', lowerIsBetter: true },
    { label: 'Men — mildly elevated BP (140-159/90-99)', nfhs4: 15.5, nfhs5: 22.8, unit: '%', lowerIsBetter: true },
    { label: 'Women — high blood sugar (>140 mg/dl)', nfhs4: 4.8, nfhs5: 4.6, unit: '%', lowerIsBetter: true },
    { label: 'Men — high blood sugar (>140 mg/dl)', nfhs4: 7.6, nfhs5: 6.7, unit: '%', lowerIsBetter: true },
    { label: 'Women overweight or obese (BMI ≥25)', nfhs4: 18.8, nfhs5: 23.9, unit: '%', lowerIsBetter: true },
    { label: 'Men overweight or obese (BMI ≥25)', nfhs4: 20.6, nfhs5: 27.6, unit: '%', lowerIsBetter: true },
  ],
};
