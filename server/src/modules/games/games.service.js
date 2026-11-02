import { GameAttempt } from './gameAttempt.model.js';
import { BANKS, GAMES, MEMORY_CONFIG } from './questionBanks.js';
import { badRequest } from '../../utils/AppError.js';
import { evaluateBadges } from '../rewards/rewards.service.js';

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function getQuestions(type, ageGroup, count = 6) {
  if (type === 'memory-match') {
    const cfg = MEMORY_CONFIG[ageGroup];
    const cards = shuffle([...cfg.symbols, ...cfg.symbols].map((symbol, i) => ({ symbol, key: `${i}` })));
    return { type, pairs: cfg.pairs, cards: cards.map((c, i) => ({ id: i, symbol: c.symbol })) };
  }
  const bank = BANKS[type].filter((x) => x.ageGroup === ageGroup);
  const picked = shuffle(bank).slice(0, count).map((x) => ({ ...x, options: shuffle(x.options) }));
  return { type, questions: picked };
}

// The server recomputes the score from the submitted answers; a client-supplied score is ignored.
export async function recordAttempt(child, type, body) {
  let score; let total; let moves;
  if (type === 'memory-match') {
    const pairs = MEMORY_CONFIG[child.ageGroup].pairs;
    if (body.pairs !== pairs) throw badRequest('Unexpected number of pairs for this age group');
    if (body.moves < pairs) throw badRequest('Move count is not possible for this game');
    score = pairs; total = pairs; moves = body.moves;
  } else {
    const bank = Object.fromEntries(BANKS[type].filter((x) => x.ageGroup === child.ageGroup).map((x) => [x.id, x]));
    const seen = new Set();
    score = 0;
    for (const a of body.answers) {
      const question = bank[a.questionId];
      if (!question) throw badRequest('Unknown question for this age group');
      if (seen.has(a.questionId)) throw badRequest('Duplicate answer submitted');
      seen.add(a.questionId);
      if (a.answer === question.answer) score += 1;
    }
    total = body.answers.length;
  }
  const attempt = await GameAttempt.create({
    childId: child._id, gameType: type, score, totalQuestions: total, durationSeconds: body.durationSeconds ?? 0,
    hintsUsed: body.hintsUsed ?? 0, ...(moves !== undefined ? { moves } : {}),
  });
  const newBadges = await evaluateBadges(child._id);
  return { attempt, newBadges };
}

export async function gameProgress(childId) {
  const attempts = await GameAttempt.find({ childId }).sort({ completedAt: -1 });
  const games = GAMES.map((g) => {
    const mine = attempts.filter((a) => a.gameType === g.type);
    const pct = mine.map((a) => (a.score / a.totalQuestions) * 100);
    return {
      ...g, attempts: mine.length,
      bestPercent: pct.length ? Math.round(Math.max(...pct)) : null,
      averagePercent: pct.length ? Math.round(pct.reduce((s, v) => s + v, 0) / pct.length) : null,
      lastPlayed: mine[0]?.completedAt ?? null,
      bestMoves: g.type === 'memory-match' && mine.length ? Math.min(...mine.map((a) => a.moves ?? Infinity)) : null,
    };
  });
  return { totalAttempts: attempts.length, games, recent: attempts.slice(0, 10) };
}
