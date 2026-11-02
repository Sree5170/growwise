import { api, unwrap, unwrapWithMeta } from './api.js';
export const taskService = {
  list: (params) => unwrapWithMeta(api.get('/tasks', { params })),
  create: (body) => unwrap(api.post('/tasks', body)),
  update: (id, body) => unwrap(api.patch(`/tasks/${id}`, body)),
  submit: (id, body) => unwrap(api.post(`/tasks/${id}/submit`, body)),
  verify: (id, body) => unwrap(api.post(`/tasks/${id}/verify`, body)),
};
