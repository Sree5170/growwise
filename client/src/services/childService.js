import { api, unwrap } from './api.js';
export const childService = {
  list: () => unwrap(api.get('/children')),
  get: (id) => unwrap(api.get(`/children/${id}`)),
  create: (body) => unwrap(api.post('/children', body)),
  update: (id, body) => unwrap(api.patch(`/children/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/children/${id}`)),
  startSession: (id) => unwrap(api.post(`/children/${id}/session`, {})),
  recommendations: (id, params) => unwrap(api.get(`/children/${id}/recommendations`, { params })),
  badges: (id) => unwrap(api.get(`/children/${id}/badges`)),
};
