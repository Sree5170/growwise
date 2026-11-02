import { api, unwrap } from './api.js';
export const authService = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  logout: () => unwrap(api.post('/auth/logout', {})),
  me: () => unwrap(api.get('/auth/me')),
  exitChildMode: (password) => unwrap(api.post('/auth/exit-child-mode', { password })),
  updateProfile: (body) => unwrap(api.patch('/parents/me', body)),
  changePassword: (body) => unwrap(api.post('/parents/me/password', body)),
  deleteAccount: (password) => unwrap(api.delete('/parents/me', { data: { password } })),
};
