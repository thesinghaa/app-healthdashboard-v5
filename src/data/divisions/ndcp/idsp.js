// NDCP / IDSP — edit here to update this programme's data and source links
export default {
  id: 'idsp',
  name: 'Integrated Disease Surveillance Programme',
  status: 'red',
  keyMetric: '17 districts: 0 deaths reported',
  statusReason: 'MPCDSR shows 0 infant deaths vs 52 reported in HMIS',
  summary:
    'The Integrated Disease Surveillance Programme faces a systemic reporting crisis in Arunachal Pradesh. 17 of 28 districts reported zero infant deaths against HMIS data showing 52 deaths — indicating near-complete non-reporting in MPCDSR.',
  keyMetrics: [
    { label: 'Districts with 0 Deaths (MPCDSR)', value: '17 / 28', change: null, changeDir: null, source: 'NPCC Apr 2026' },
    { label: 'MPCDSR vs HMIS Deaths', value: '0 vs 52', change: null, changeDir: null, source: 'NPCC Apr 2026' },
    { label: 'Maternal Deaths Reported', value: '3', change: null, changeDir: null, source: 'HMIS 2024-25' },
    { label: 'IDSP Sentinel Sites', value: 'Active', change: null, changeDir: null, source: 'IDSP network' },
  ],
  observations: [
    '17 of 28 districts reported zero infant deaths in HMIS Apr–Dec 2025 — a clear data gap',
    'MPCDSR shows zero infant deaths vs 52 in HMIS — reporting portal is functionally inactive',
    'Maternal death under-reporting likely mirrors child death under-reporting pattern',
    'Cause-of-death attribution is weak: "Others/Unknown" accounts for 64.3% of maternal deaths',
  ],
  actions: [
    'Issue immediate state directive mandating MPCDSR reporting for all 28 districts',
    'Deploy IDSP supervisors to non-reporting districts for ground-level capacity building',
    'Integrate death notification with Aadhaar-linked civil registration at facility level',
    'Conduct state-level MDSR committee review for all 3 maternal deaths in 2024-25',
  ],
  nfhsData: [],
};
