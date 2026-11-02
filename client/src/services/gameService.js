import { api, unwrap } from './api.js';
export const gameService = {
  list: () => unwrap(api.get('/games')),
  questions: (type, params) => unwrap(api.get(`/games/${type}/questions`, { params })),
  submit: (type, body) => unwrap(api.post(`/games/${type}/attempts`, body)),
  progress: (childId) => unwrap(api.get(`/children/${childId}/games/progress`)),
};
