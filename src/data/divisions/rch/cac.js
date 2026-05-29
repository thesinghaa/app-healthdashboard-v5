// RCH / CAC — edit here to update this programme's data and source links
export default {
  id: 'cac',
  name: 'Comprehensive Abortion Care',
  status: 'yellow',
  keyMetric: 'C-section: 14.8%',
  statusReason: 'C-section rate rising to 14.8% — private facilities at 47.3%',
  summary:
    'Comprehensive Abortion Care access remains limited in rural areas. Caesarean section rates rising, warranting quality review to distinguish medically indicated procedures.',
  keyMetrics: [
    { label: 'Caesarean Section Rate', value: '14.8%', change: '+5.9 pp', changeDir: 'up', source: 'NFHS-5' },
    { label: 'Private Facility C-section', value: '47.3%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Public Facility C-section', value: '17.0%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Rural Inst. Births', value: '77.3%', change: null, changeDir: null, source: 'NFHS-5' },
  ],
  observations: [
    'C-section rate rose from 8.9% to 14.8% — private facilities at 47.3% warrants audit',
    'Rural access to safe abortion services remains infrastructure-dependent',
    'PCPNDT implementation data not available at district level',
  ],
  actions: [
    'Audit C-section rates at private facilities against clinical indication criteria',
    'Strengthen CAC service availability at CHC and FRU level',
    'Ensure trained manpower for safe abortion services at block level',
  ],
  nfhsData: [
    { label: 'Births by caesarean section', nfhs4: 8.9, nfhs5: 14.8, unit: '%', lowerIsBetter: false },
    { label: 'C-section in private facility', nfhs4: 37.5, nfhs5: 47.3, unit: '%', lowerIsBetter: false },
    { label: 'C-section in public facility', nfhs4: 12.5, nfhs5: 17.0, unit: '%', lowerIsBetter: false },
  ],
};
