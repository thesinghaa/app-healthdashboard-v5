// NCD / NMHP — edit here to update this programme's data and source links
export default {
  id: 'nmhp',
  name: 'National Mental Health Programme',
  status: 'yellow',
  keyMetric: 'Mental health access',
  statusReason: 'DMHP HR shortages persist; Tele-MANAS uptake limited in tribal areas',
  summary: 'National Mental Health Programme services are limited in Arunachal Pradesh. Tele-MANAS and district mental health teams require strengthening.',
  keyMetrics: [
    { label: 'Tele-MANAS', value: 'Active', change: null, changeDir: null, source: 'MoHFW' },
    { label: 'DMHP Coverage', value: 'Partial', change: null, changeDir: null, source: 'State NHM' },
    { label: 'Suicide Rate', value: 'HMIS tracked', change: null, changeDir: null, source: 'HMIS' },
    { label: 'Alcohol Use (Men)', value: '59.0%', change: null, changeDir: null, source: 'NFHS-4' },
  ],
  observations: [
    'Tele-MANAS operational but uptake in tribal areas requires community mobilisation',
    'High alcohol use (men 59% in NFHS-4) is linked to mental health burden',
    'District Mental Health teams face HR shortages',
    'Stigma remains a barrier to care-seeking in tribal communities',
  ],
  actions: [
    'Scale Tele-MANAS outreach through ASHA and community health workers',
    'Fill DMHP HR vacancies through contractual appointments',
    'Integrate mental health screening into NCD clinics at CHC level',
  ],
  nfhsData: [],
};
