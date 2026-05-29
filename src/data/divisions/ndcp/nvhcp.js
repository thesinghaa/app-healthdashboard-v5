// NDCP / NVHCP — edit here to update this programme's data and source links
export default {
  id: 'nvhcp',
  name: 'National Viral Hepatitis Control Programme',
  status: 'yellow',
  keyMetric: 'Vector-borne endemic',
  statusReason: '79.6% forest cover — persistent endemic vector-borne disease zone',
  summary:
    'Arunachal Pradesh is endemic for malaria and kala-azar given its forest and border geography. Surveillance and treatment completion rates require sustained monitoring.',
  keyMetrics: [
    { label: 'Districts Endemic', value: '28', change: null, changeDir: null, source: 'State profile' },
    { label: 'Forest Cover (% area)', value: '79.6%', change: null, changeDir: null, source: 'FSI 2023' },
    { label: 'API Target', value: '<1', change: null, changeDir: null, source: 'NVHCP benchmark' },
    { label: 'HMIS Surveillance', value: 'Ongoing', change: null, changeDir: null, source: 'HMIS 2025-26' },
  ],
  observations: [
    'State has high forest cover (79.6%) — persistent vector-borne disease risk',
    'Border districts with Myanmar and Bhutan have cross-border transmission risk',
    'Kala-azar prevalence low but vigilance required in vulnerable blocks',
    'Dengue and chikungunya seasonal spikes reported in urban centres',
  ],
  actions: [
    'Maintain LLIN and IRS coverage in high-API districts',
    'Strengthen active case surveillance in border and forest fringe blocks',
    'Ensure 100% treatment completion tracking through ASHA network',
    'Cross-border coordination with Bhutan and Myanmar health authorities',
  ],
  nfhsData: [],
};
