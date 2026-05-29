// NCD / NOHP — edit here to update this programme's data and source links
export default {
  id: 'nohp',
  name: 'National Oral Health Programme',
  status: 'yellow',
  keyMetric: 'Oral health coverage',
  statusReason: 'Oral cancer screening 17.5%; tobacco use among men at 60%',
  summary: 'National Oral Health Programme services require integration with existing platforms at Sub-centre and PHC level.',
  keyMetrics: [
    { label: 'Oral Cancer Screening (Women)', value: '17.5%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Dental Units at CHCs', value: 'Partial', change: null, changeDir: null, source: 'IPHS audit' },
    { label: 'Tobacco Use (Men)', value: '60.0%', change: null, changeDir: null, source: 'NFHS-4' },
    { label: 'Alcohol Use (Men)', value: '59.0%', change: null, changeDir: null, source: 'NFHS-4' },
  ],
  observations: [
    'Oral cancer screening only 17.5% among women — well below required coverage',
    'High tobacco (60%) and alcohol (59%) use among men significantly elevates oral cancer risk',
    'Dental services concentrated at district HQs',
  ],
  actions: [
    'Integrate oral cancer screening into existing maternal and NCD health contacts',
    'Equip all CHC dental units with basic oral cancer screening supplies',
    'Leverage NTCP infrastructure for dual tobacco-oral cancer counselling sessions',
  ],
  nfhsData: [
    { label: 'Women screened for oral cancer', nfhs4: null, nfhs5: 17.5, unit: '%', lowerIsBetter: false },
  ],
};
