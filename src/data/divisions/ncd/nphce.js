// NCD / NPHCE — edit here to update this programme's data and source links
export default {
  id: 'nphce',
  name: 'National Programme for Health Care of Elderly',
  status: 'yellow',
  keyMetric: 'Elderly care access',
  statusReason: 'Geriatric services limited to district HQs — no block-level access',
  summary: 'National Programme for Health Care of Elderly requires strengthening in a state with improving longevity and growing NCD burden.',
  keyMetrics: [
    { label: 'Elderly Dedicated Wards', value: 'District hospitals', change: null, changeDir: null, source: 'NHM' },
    { label: 'NCD Burden 15-49', value: 'Growing', change: null, changeDir: null, source: 'NFHS-5' },
    { label: 'Hypertension 45+', value: 'High', change: null, changeDir: null, source: 'NFHS-5 trend' },
    { label: 'Geriatric Clinics', value: 'Limited', change: null, changeDir: null, source: 'State NHM' },
  ],
  observations: [
    'Geriatric care infrastructure limited to district HQs',
    'Growing hypertension and diabetes burden will increase elderly care demands',
    'NPHCE Outreach Camps in remote areas need scaling',
  ],
  actions: [
    'Establish dedicated elderly care OPD at all CHCs',
    'Train CHOs in geriatric health assessment',
    'Ensure NPHCE outreach camps in all blocks quarterly',
  ],
  nfhsData: [],
};
