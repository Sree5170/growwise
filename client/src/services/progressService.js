import { api, unwrap } from './api.js';
export const progressService = {
  progress: (childId, range = 'week') => unwrap(api.get(`/children/${childId}/progress`, { params: { range } })),
  weeklyReport: (childId) => unwrap(api.get(`/children/${childId}/reports/weekly`)),
  physical: (childId, params) => unwrap(api.get(`/children/${childId}/physical-activity`, { params })),
  logPhysical: (body) => unwrap(api.post('/physical-activity', body)),
  verifyPhysical: (id) => unwrap(api.post(`/physical-activity/${id}/verify`, {})),
  removePhysical: (id) => unwrap(api.delete(`/physical-activity/${id}`)),
};
