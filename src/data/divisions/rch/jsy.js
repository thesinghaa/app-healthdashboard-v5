// RCH / JSY — edit here to update this programme's data and source links
export default {
  id: 'jsy',
  name: 'Janani Suraksha Yojana',
  status: 'yellow',
  keyMetric: 'Inst. Births: 79.2%',
  statusReason: 'Institutional births improved 52.3%→79.2%, rural gaps persist',
  summary:
    'Janani Suraksha Yojana has driven substantial improvement in institutional deliveries. However, post-delivery follow-up and rural coverage remain gaps.',
  keyMetrics: [
    { label: 'Institutional Births', value: '79.2%', change: '+26.9 pp', changeDir: 'up', source: 'NFHS-5' },
    { label: 'Births in Public Facility', value: '74.8%', change: '+32.1 pp', changeDir: 'up', source: 'NFHS-5' },
    { label: 'Postnatal Care 2 days', value: '56.4%', change: '+27.5 pp', changeDir: 'up', source: 'NFHS-5' },
    { label: 'Skilled Attendant at Birth', value: '82.1%', change: '+28.3 pp', changeDir: 'up', source: 'NFHS-5' },
  ],
  observations: [
    'Institutional delivery rate has improved significantly from 52.3% to 79.2%',
    'Rural institutional births still lag urban (77.3% vs 90.6%)',
    'Postnatal care within 2 days improved but 43.6% still not covered',
    'Home births with skilled personnel remain minimal at 4.0%',
  ],
  actions: [
    'Focus JSY outreach on rural and tribal blocks with low institutional delivery rates',
    'Ensure ASHA-led postnatal follow-up within 48 hours for all deliveries',
    'Review JSY beneficiary payments for timeliness and completeness',
  ],
  currentStatus: {
    type: 'family-planning',
    source: 'MoHFW NPCC May 2026',
    indicator: 'SDG 3.7.1 — Proportion of currently married women of reproductive age (15–49 years) who have their need for family planning satisfied with modern methods',
    stateStatus: '60.2%',
    sdgTarget: '74.2%',
    sdgTargetNote: '(National Average)',
  },
  nfhsData: [
    { label: 'Institutional births', nfhs4: 52.3, nfhs5: 79.2, unit: '%', lowerIsBetter: false },
    { label: 'Births in public facility', nfhs4: 42.7, nfhs5: 74.8, unit: '%', lowerIsBetter: false },
    { label: 'Births attended by skilled personnel', nfhs4: 53.8, nfhs5: 82.1, unit: '%', lowerIsBetter: false },
    { label: 'Postnatal care within 2 days', nfhs4: 28.9, nfhs5: 56.4, unit: '%', lowerIsBetter: false },
    { label: 'Home births with skilled personnel', nfhs4: 2.1, nfhs5: 4.0, unit: '%', lowerIsBetter: false },
  ],
};
