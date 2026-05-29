// NDCP / NSCAEM & Blood Cell — edit here to update this programme's data and source links
export default {
  id: 'nscaem',
  name: 'Sickle Cell Anaemia Elimination Mission',
  status: 'yellow',
  keyMetric: 'Sickle cell screening',
  statusReason: 'Tribal majority population at sickle cell risk; anaemia 56.6%',
  summary:
    'Sickle cell anaemia and blood disorders require specific attention given the tribal population. NSCAEM programme implementation needs district-level data verification.',
  keyMetrics: [
    { label: 'Tribal Population Share', value: '~68%', change: null, changeDir: null, source: 'Census 2011' },
    { label: 'Child Anaemia Rate', value: '56.6%', change: '+5.9 pp', changeDir: 'up', source: 'NFHS-5' },
    { label: 'All Women Anaemia', value: '40.3%', change: '0 pp', changeDir: null, source: 'NFHS-5' },
    { label: 'Blood Bank Coverage', value: 'HMIS tracked', change: null, changeDir: null, source: 'HMIS 2025' },
  ],
  observations: [
    'Highlighted in bold in NPCC Apr 2026 — indicates pending action at programme level',
    'High tribal population proportion increases sickle cell trait prevalence risk',
    'Child and adult anaemia rates are critical — sickle cell screening must be integrated',
    'Blood bank availability and quality at district hospitals needs audit',
  ],
  actions: [
    'Establish universal neonatal sickle cell screening in all tribal-majority districts',
    'Integrate NSCAEM counselling with existing maternal health and immunisation contacts',
    'Ensure blood bank functionality at all District Hospitals (28 districts)',
    'Link sickle cell carrier data with family planning counselling services',
  ],
  nfhsData: [
    { label: 'Children 6-59 months anaemic', nfhs4: 50.7, nfhs5: 56.6, unit: '%', lowerIsBetter: true },
    { label: 'All women (15-49) anaemic', nfhs4: 40.3, nfhs5: 40.3, unit: '%', lowerIsBetter: true },
    { label: 'Men (15-49) anaemic', nfhs4: 16.9, nfhs5: 21.4, unit: '%', lowerIsBetter: true },
  ],
};
