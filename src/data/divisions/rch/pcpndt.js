// RCH / PCPNDT — edit here to update this programme's data and source links
export default {
  id: 'pcpndt',
  name: 'Pre-Conception & Pre-Natal Diagnostic',
  status: 'yellow',
  keyMetric: 'SRB: 979 (↑ from 926)',
  statusReason: 'Sex ratio at birth 979 — still below parity target of 1,000',
  summary:
    'Sex ratio at birth has improved from 926 to 979 per 1,000 males across survey rounds, but remains below parity. Vigilance on sex-selective practices must continue.',
  keyMetrics: [
    { label: 'Sex Ratio at Birth', value: '979', change: '+53', changeDir: 'up', source: 'NFHS-5' },
    { label: 'Sex Ratio Total Pop.', value: '997', change: '+39', changeDir: 'up', source: 'NFHS-5' },
    { label: 'Registered Births <5yr', value: '87.7%', change: '+25 pp', changeDir: 'up', source: 'NFHS-5' },
    { label: 'Women Literate (15-49)', value: '71.3%', change: '+5.7 pp', changeDir: 'up', source: 'NFHS-5' },
  ],
  observations: [
    'Sex ratio at birth improved from 926 to 979 — positive trend but below 1000 target',
    'Total population sex ratio improved from 958 to 997',
    'Child birth registration improved significantly to 87.7%',
    'Female literacy improvement supports reduced son preference over time',
  ],
  actions: [
    'Continue stringent PCPNDT inspections at diagnostic centres',
    'Expand birth registration infrastructure in tribal and remote areas',
    'Track inter-district variation in sex ratio at birth quarterly',
  ],
  nfhsData: [
    { label: 'Sex ratio of total population (F per 1,000 M)', nfhs4: 958, nfhs5: 997, unit: '', lowerIsBetter: false },
    { label: 'Sex ratio at birth (last 5 years)', nfhs4: 926, nfhs5: 979, unit: '', lowerIsBetter: false },
    { label: 'Children under 5 with birth registered', nfhs4: 62.9, nfhs5: 87.7, unit: '%', lowerIsBetter: false },
  ],
};
