// NCD / NIDDCP — edit here to update this programme's data and source links
export default {
  id: 'niddcp',
  name: 'National Iodine Deficiency Disorders Control',
  status: 'green',
  keyMetric: 'Iodised salt: 99.2%',
  statusReason: 'Iodised salt coverage 99.2% — IDD effectively controlled',
  summary:
    'National Iodine Deficiency Disorders Control Programme shows near-universal iodised salt coverage at 99.2%, effectively controlling IDD-related disorders in the population.',
  keyMetrics: [
    { label: 'Iodised Salt Coverage', value: '99.2%', change: '−0.1 pp', changeDir: 'down', source: 'NFHS-5' },
    { label: 'Urban Coverage', value: '99.4%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Rural Coverage', value: '99.2%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'IDD Status', value: 'Controlled', change: null, changeDir: null, source: 'NIDDCP' },
  ],
  observations: [
    'Iodised salt coverage maintained at 99.2% — effectively controlled',
    'Marginal rural-urban gap (99.2% vs 99.4%) — negligible',
    'Continued salt iodisation quality testing required at manufacturer and retail level',
  ],
  actions: [
    'Maintain routine salt iodisation quality surveillance',
    'Conduct periodic urinary iodine monitoring in school children as sentinel survey',
  ],
  nfhsData: [
    { label: 'Households using iodised salt', nfhs4: 99.3, nfhs5: 99.2, unit: '%', lowerIsBetter: false },
  ],
};
