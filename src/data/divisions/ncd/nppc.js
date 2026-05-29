// NCD / NPPC — edit here to update this programme's data and source links
export default {
  id: 'nppc',
  name: 'National Programme for Palliative Care',
  status: 'yellow',
  keyMetric: 'Palliative care access',
  statusReason: 'Cancer screening critically low: cervix 8.5%, breast 5.9%',
  summary: 'National Programme for Palliative Care has limited reach in remote districts of Arunachal Pradesh.',
  keyMetrics: [
    { label: 'CHCs with Palliative Services', value: 'Limited', change: null, changeDir: null, source: 'NHM' },
    { label: 'Districts Covered', value: 'Partial', change: null, changeDir: null, source: 'State NHM' },
    { label: 'Cancer Screening (Cervix)', value: '8.5%', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Cancer Screening (Breast)', value: '5.9%', change: null, changeDir: null, source: 'NFHS-5' },
  ],
  observations: [
    'Palliative care infrastructure is concentrated in district HQs',
    'Cancer screening (cervix 8.5%, breast 5.9%) extremely low — early detection gap',
    'Rural areas have near-zero access to palliative or cancer screening services',
  ],
  actions: [
    'Integrate cancer screening with existing maternal health visits',
    'Establish NPPC referral pathways from PHC to district hospital',
    'Train CHO/HWC staff in basic palliative assessment',
  ],
  nfhsData: [
    { label: 'Women screened for cervical cancer', nfhs4: null, nfhs5: 8.5, unit: '%', lowerIsBetter: false },
    { label: 'Women screened for breast cancer', nfhs4: null, nfhs5: 5.9, unit: '%', lowerIsBetter: false },
  ],
};
