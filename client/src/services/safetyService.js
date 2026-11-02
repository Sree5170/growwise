import { api, unwrap } from './api.js';
export const safetyService = {
  list: (childId) => unwrap(api.get('/safety-lessons', { params: childId ? { childId } : {} })),
  get: (id, childId) => unwrap(api.get(`/safety-lessons/${id}`, { params: childId ? { childId } : {} })),
  complete: (id, body) => unwrap(api.post(`/safety-lessons/${id}/complete`, body)),
};
