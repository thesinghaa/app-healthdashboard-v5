// NCD / NTCP — edit here to update this programme's data and source links
export default {
  id: 'ntcp',
  name: 'National Tobacco Control Programme',
  status: 'red',
  keyMetric: 'Male tobacco use: 60%',
  statusReason: 'Men tobacco 60%, alcohol 59% — highest NCD risk combination in AP',
  summary:
    'Tobacco use among men stands at 60% in NFHS-4 — among the highest in India. Combined with alcohol use at 59%, NCD and oral cancer burden is set to escalate without urgent NTCP intervention.',
  keyMetrics: [
    { label: 'Men Using Tobacco (NFHS-4)', value: '60.0%', change: null, changeDir: null, source: 'NFHS-4 (2015-16)' },
    { label: 'Women Using Tobacco', value: '17.7%', change: null, changeDir: null, source: 'NFHS-4 (2015-16)' },
    { label: 'Men Consuming Alcohol', value: '59.0%', change: null, changeDir: null, source: 'NFHS-4 (2015-16)' },
    { label: 'NFHS-5 Data', value: 'Not available', change: null, changeDir: null, source: 'NFHS-5' },
  ],
  observations: [
    'Male tobacco use at 60% — one of the highest rates nationally (NFHS-4)',
    'Female tobacco use at 17.7% — significantly above national average',
    'Alcohol consumption in men at 59% — compounding NCD and liver disease risk',
    'NFHS-5 did not collect tobacco/alcohol data for Arunachal Pradesh',
    'High tobacco use is directly linked to elevated hypertension rates (men 33.1%)',
    'Tribal and local forms of tobacco (betel quid, khaini) prevalent — culturally embedded',
  ],
  actions: [
    'Launch district-level COTPA enforcement drives covering shops near schools',
    'Integrate tobacco cessation counselling at all OPD and NCD clinic touchpoints',
    'Deploy NTCP cessation centres at district hospitals with pharmacotherapy',
    'Conduct cultural-context-specific IEC targeting local tobacco use practices',
    'Train all ASHA and ANM workers in brief tobacco cessation advice',
  ],
  nfhsData: [
    { label: 'Men using any tobacco', nfhs4: 60.0, nfhs5: null, unit: '%', lowerIsBetter: true },
    { label: 'Women using any tobacco', nfhs4: 17.7, nfhs5: null, unit: '%', lowerIsBetter: true },
    { label: 'Men consuming alcohol', nfhs4: 59.0, nfhs5: null, unit: '%', lowerIsBetter: true },
    { label: 'Women consuming alcohol', nfhs4: 26.3, nfhs5: null, unit: '%', lowerIsBetter: true },
    { label: 'Men — elevated BP (≥140/90)', nfhs4: null, nfhs5: 33.1, unit: '%', lowerIsBetter: true },
    { label: 'Men — high blood sugar (>140 mg/dl)', nfhs4: 7.6, nfhs5: 6.7, unit: '%', lowerIsBetter: true },
  ],
};
