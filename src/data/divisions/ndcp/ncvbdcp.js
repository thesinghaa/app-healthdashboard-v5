// NDCP / NCVBDCP — edit here to update this programme's data and source links
export default {
  id: 'ncvbdcp',
  name: 'National Centre for Vector Borne Disease Control',
  status: 'yellow',
  keyMetric: 'NE endemic zone',
  statusReason: 'NE endemic zone for Japanese Encephalitis, filariasis and dengue',
  summary:
    'Arunachal Pradesh falls in the NE endemic zone for multiple vector and climate-sensitive diseases. Japanese Encephalitis and Lymphatic Filariasis require ongoing programme attention.',
  keyMetrics: [
    { label: 'JE Vaccination Coverage', value: 'UIP tracked', change: null, changeDir: null, source: 'UIP' },
    { label: 'Filariasis MDA', value: 'Annual rounds', change: null, changeDir: null, source: 'NVBDCP' },
    { label: 'Scrub Typhus Cases', value: 'Surveillance', change: null, changeDir: null, source: 'IDSP' },
    { label: 'Dengue Sentinel Sites', value: 'Active', change: null, changeDir: null, source: 'NVHCP' },
  ],
  observations: [
    'JE vaccination coverage tracked under Universal Immunisation Programme',
    'Lymphatic filariasis MDA rounds conducted annually in endemic districts',
    'Scrub typhus has seasonal spikes in forested districts — differential diagnosis gap',
    'Climate variability increasing disease burden in border districts',
  ],
  actions: [
    'Ensure full coverage of JE vaccine in all endemic districts',
    'Maintain 100% MDA coverage for filariasis elimination in endemic areas',
    'Train health workers in differential diagnosis for scrub typhus and fever syndromes',
  ],
  currentStatus: {
    type: 'malaria',
    source: 'MoHFW NPCC May 2026 · NCVBDCP',
    eliminationTarget: 'National Framework for Malaria Elimination 2016-2030 — Zero indigenous cases by 2027',
    totalCases2025: '32',
    caseBreakdown2025: 'Pv-21, Pf-11 | Imported: 15; Indigenous: 17',
    casesTrend: [
      { year: '2021', total: 8,  pv: 6,  pf: 2,  indigenous: 7,  imported: 1,  deaths: 0 },
      { year: '2022', total: 18, pv: 15, pf: 3,  indigenous: 13, imported: 5,  deaths: 0 },
      { year: '2023', total: 11, pv: 6,  pf: 5,  indigenous: 5,  imported: 6,  deaths: 0 },
      { year: '2024', total: 19, pv: 17, pf: 2,  indigenous: 10, imported: 9,  deaths: 0 },
      { year: '2025', total: 32, pv: 21, pf: 11, indigenous: 17, imported: 15, deaths: 0 },
    ],
    keyPoints: [
      '16 districts eligible for Sub-National Malaria Elimination Verification (2022-24): Longding, Kurung Kumey, Kra Daadi, Lower Subansiri, Kamle, Pakke Kessang, East Siang, Lower Dibang Valley, East Kameng, Tawang, Dibang Valley, Upper Subansiri, Anjaw, West Kameng, Leprada and Siang. State has submitted 16 draft dossier.',
      '5 more districts (Lower Siang, Shi Yomi, Upper Siang, West Siang and Namsai) reported zero indigenous cases (2023-2025).',
      'State has two functional entomological zones: Kimin and Miao (Miao East zone regularly shares reports).',
      'Treatment completion and treatment outcome data entered for 93.8% of cases on IHIP portal.',
    ],
  },
  nfhsData: [],
};
