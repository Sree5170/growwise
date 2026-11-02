import { api, unwrapWithMeta, unwrap } from './api.js';
export const activityService = {
  list: (params) => unwrapWithMeta(api.get('/activities', { params })),
  get: (id) => unwrap(api.get(`/activities/${id}`)),
};
