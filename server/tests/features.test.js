import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, Client, registerParent, newChild, makeActivity, today, iso, SafetyLesson } from './helpers.js';
import { BANKS } from '../src/modules/games/questionBanks.js';

before(startTestApp); after(stopTestApp);
const kidOf = async (p, child) => { const k = new Client(); k.cookie = p.client.cookie; await k.post(`/api/children/${child._id}/session`); return k; };

// ---------- games ----------
test('games: question sets match the age group and are randomised; bank answers are scored by the SERVER', async () => {
  const p = await registerParent(); const child = await newChild(p.client, { ageGroup: '9-12' }); const kid = await kidOf(p, child);
  const q = await kid.get('/api/games/pattern-quiz/questions?count=5');
  assert.equal(q.data.questions.length, 5);
  assert.ok(q.data.questions.every((x) => x.ageGroup === '9-12' && x.options.includes(x.answer) && x.hint && x.explanation));
  // answer 3 right, 2 wrong
  const answers = q.data.questions.map((x, i) => ({ questionId: x.id, answer: i < 3 ? x.answer : x.options.find((o) => o !== x.answer) }));
  const res = await kid.post('/api/games/pattern-quiz/attempts', { answers, durationSeconds: 60, hintsUsed: 1, score: 5 }); // forged score field is rejected
  assert.equal(res.status, 422);
  const ok = await kid.post('/api/games/pattern-quiz/attempts', { answers, durationSeconds: 60, hintsUsed: 1 });
  assert.equal(ok.status, 201); assert.equal(ok.data.attempt.score, 3); assert.equal(ok.data.attempt.totalQuestions, 5);
  const prog = await kid.get(`/api/children/${child._id}/games/progress`);
  assert.equal(prog.data.totalAttempts, 1);
  assert.equal(prog.data.games.find((g) => g.type === 'pattern-quiz').bestPercent, 60);
});

test('games: invalid, duplicate or out-of-age answers are rejected; memory match is sanity-checked', async () => {
  const p = await registerParent(); const child = await newChild(p.client, { ageGroup: '6-8' }); const kid = await kidOf(p, child);
  const teenQ = BANKS['pattern-quiz'].find((x) => x.ageGroup === '13-17');
  assert.equal((await kid.post('/api/games/pattern-quiz/attempts', { answers: [{ questionId: teenQ.id, answer: teenQ.answer }] })).status, 400);
  assert.equal((await kid.post('/api/games/pattern-quiz/attempts', { answers: [{ questionId: 'zzz', answer: 'x' }] })).status, 400);
  const q = BANKS['riddle-challenge'].find((x) => x.ageGroup === '6-8');
  assert.equal((await kid.post('/api/games/riddle-challenge/attempts', { answers: [{ questionId: q.id, answer: q.answer }, { questionId: q.id, answer: q.answer }] })).status, 400);
  assert.equal((await kid.post('/api/games/nonsense/attempts', { answers: [] })).status, 422);
  assert.equal((await kid.post('/api/games/memory-match/attempts', { pairs: 6, moves: 3 })).status, 400);  // fewer moves than pairs is impossible
  assert.equal((await kid.post('/api/games/memory-match/attempts', { pairs: 2, moves: 5 })).status, 400);  // wrong pair count for age
  const mm = await kid.get('/api/games/memory-match/questions');
  assert.equal(mm.data.pairs, 6); assert.equal(mm.data.cards.length, 12);
  const ok = await kid.post('/api/games/memory-match/attempts', { pairs: 6, moves: 11, durationSeconds: 70 });
  assert.equal(ok.status, 201); assert.equal(ok.data.attempt.score, 6); assert.equal(ok.data.attempt.moves, 11);
});

test('games: every age group has questions in every bank and all answers are among the options', () => {
  for (const bank of Object.values(BANKS)) for (const age of ['3-5', '6-8', '9-12', '13-17']) {
    const qs = bank.filter((x) => x.ageGroup === age); assert.ok(qs.length >= 5, `bank has too few ${age} questions`);
    for (const x of qs) assert.ok(x.options.includes(x.answer), `${x.id}: answer must be an option`);
  }
});

// ---------- physical activity ----------
test('physical activity: persists, validates, and separates self-reported from parent-verified', async () => {
  const p = await registerParent(); const child = await newChild(p.client); const kid = await kidOf(p, child);
  const body = { activityType: 'walking', durationMinutes: 30, activityDate: iso(today()), note: 'Park walk' };
  const byChild = await kid.post('/api/physical-activity', body);
  assert.equal(byChild.status, 201); assert.equal(byChild.data.verificationStatus, 'self-reported'); assert.equal(byChild.data.recordedBy, 'child');
  const byParent = await p.client.post('/api/physical-activity', { ...body, childId: child._id, activityType: 'cycling', durationMinutes: 20 });
  assert.equal(byParent.data.verificationStatus, 'parent-verified');
  assert.equal((await kid.post('/api/physical-activity', { ...body, durationMinutes: 0 })).status, 422);
  assert.equal((await kid.post('/api/physical-activity', { ...body, durationMinutes: 9999 })).status, 422);
  assert.equal((await kid.post('/api/physical-activity', { ...body, activityType: 'teleporting' })).status, 422);
  const future = new Date(); future.setDate(future.getDate() + 10);
  assert.equal((await kid.post('/api/physical-activity', { ...body, activityDate: iso(future) })).status, 400);
  assert.equal((await kid.post('/api/physical-activity', { ...body, verificationStatus: 'parent-verified' })).status, 422); // cannot self-verify
  const list = await p.client.get(`/api/children/${child._id}/physical-activity`);
  assert.equal(list.data.records.length, 2);
  assert.deepEqual([list.data.summary.totalMinutes, list.data.summary.selfReportedMinutes, list.data.summary.parentVerifiedMinutes], [50, 30, 20]);
  assert.match(list.data.disclaimer, /not measured by a device/);
  // parent verifies the child's record; child cannot
  assert.equal((await kid.post(`/api/physical-activity/${byChild.data._id}/verify`)).status, 403);
  assert.equal((await p.client.post(`/api/physical-activity/${byChild.data._id}/verify`)).data.verificationStatus, 'parent-verified');
  assert.equal((await kid.del(`/api/physical-activity/${byChild.data._id}`)).status, 403);
  assert.equal((await p.client.del(`/api/physical-activity/${byChild.data._id}`)).status, 200);
});

// ---------- safety academy ----------
async function lesson(over = {}) {
  return SafetyLesson.create({ title: 'Test Lesson', slug: `t-${Math.random().toString(36).slice(2)}`, hazardType: 'fire', introduction: 'intro', points: 15, ...over,
    quizQuestions: [
      { question: 'Q1', options: ['a', 'b', 'c'], correctIndex: 1, explanation: 'e' }, { question: 'Q2', options: ['a', 'b'], correctIndex: 0, explanation: 'e' },
      { question: 'Q3', options: ['a', 'b', 'c'], correctIndex: 2, explanation: 'e' }] });
}
test('safety lessons: completion needs the pass mark, awards points once, is server-scored and per-child', async () => {
  const p = await registerParent(); const child = await newChild(p.client); const kid = await kidOf(p, child); const l = await lesson();
  const list = await kid.get('/api/safety-lessons'); assert.ok(list.data.some((x) => String(x._id) === String(l._id) && x.completed === false));
  assert.equal(list.data[0].quizQuestions, undefined); // list view has no quiz payload
  const failing = await kid.post(`/api/safety-lessons/${l._id}/complete`, { answers: [{ questionIndex: 0, selectedIndex: 0 }, { questionIndex: 1, selectedIndex: 1 }, { questionIndex: 2, selectedIndex: 0 }] });
  assert.equal(failing.data.passed, false); assert.equal(failing.data.pointsAwarded, 0);
  assert.equal((await kid.get(`/api/safety-lessons/${l._id}`)).data.completed, false);
  assert.equal((await kid.post(`/api/safety-lessons/${l._id}/complete`, { answers: [{ questionIndex: 0, selectedIndex: 1 }] })).status, 400); // unanswered
  assert.equal((await kid.post(`/api/safety-lessons/${l._id}/complete`, { answers: [{ questionIndex: 7, selectedIndex: 1 }, { questionIndex: 0, selectedIndex: 1 }, { questionIndex: 1, selectedIndex: 0 }] })).status, 400);
  const good = [{ questionIndex: 0, selectedIndex: 1 }, { questionIndex: 1, selectedIndex: 0 }, { questionIndex: 2, selectedIndex: 2 }];
  const first = await kid.post(`/api/safety-lessons/${l._id}/complete`, { answers: good });
  assert.equal(first.data.passed, true); assert.equal(first.data.pointsAwarded, 15); assert.equal(first.data.points.total, 15);
  assert.ok(first.data.newBadges.some((b) => b.id === 'safety-starter'));
  const again = await kid.post(`/api/safety-lessons/${l._id}/complete`, { answers: good });
  assert.equal(again.data.pointsAwarded, 0); assert.equal(again.data.points.total, 15); assert.deepEqual(again.data.newBadges, []);
  const racers = await Promise.all(Array.from({ length: 4 }, () => kid.post(`/api/safety-lessons/${l._id}/complete`, { answers: good })));
  assert.ok(racers.every((r) => r.status === 200 && r.data.points.total === 15));
  assert.equal((await kid.get(`/api/safety-lessons/${l._id}`)).data.completed, true);
  const sibling = await newChild(p.client, { displayName: 'Sib' });
  assert.equal((await p.client.get(`/api/safety-lessons/${l._id}?childId=${sibling._id}`)).data.completed, false);
});

// ---------- progress, reports, badges ----------
test('progress: empty state is honest; numbers come from real records', async () => {
  const p = await registerParent(); const child = await newChild(p.client, { weeklyGoalMinutes: 60 });
  const empty = await p.client.get(`/api/children/${child._id}/progress?range=week`);
  assert.equal(empty.data.hasData, false); assert.equal(empty.data.tasks.assigned, 0); assert.equal(empty.data.physical.totalMinutes, 0); assert.equal(empty.data.tasks.approvalRate, null);
  assert.equal(empty.data.daily.length, 7); assert.equal(empty.data.weeklyTrend.length, 8);
  assert.ok(empty.data.weeklyTrend.every((w) => w.assigned === 0 && w.physicalMinutes === 0));

  const kid = await kidOf(p, child);
  const creative = await makeActivity({ title: 'Make art', category: 'creativity', durationMinutes: 25, points: 10 });
  const outdoor = await makeActivity({ title: 'Walk', category: 'outdoor', durationMinutes: 30, points: 15, needsOutdoorSpace: true, isIndoor: false });
  const open = await makeActivity({ title: 'Still open', category: 'physical', durationMinutes: 10 });
  const mk = async (a) => (await p.client.post('/api/tasks', { childId: child._id, activityId: String(a._id), scheduledDate: iso(today()), dueDate: iso(today()) })).data;
  const t1 = await mk(creative); const t2 = await mk(outdoor); await mk(open);
  await kid.post(`/api/tasks/${t1._id}/submit`, { minutesSpent: 40 }); await kid.post(`/api/tasks/${t2._id}/submit`, {});
  await p.client.post(`/api/tasks/${t1._id}/verify`, { decision: 'approve' }); await p.client.post(`/api/tasks/${t2._id}/verify`, { decision: 'approve' });
  await kid.post('/api/physical-activity', { activityType: 'dance', durationMinutes: 45, activityDate: iso(today()) });
  await p.client.post('/api/physical-activity', { childId: child._id, activityType: 'walking', durationMinutes: 30, activityDate: iso(today()) });
  const bq = BANKS['riddle-challenge'].find((x) => x.ageGroup === '6-8');
  await kid.post('/api/games/riddle-challenge/attempts', { answers: [{ questionId: bq.id, answer: bq.answer }] });

  const pr = (await p.client.get(`/api/children/${child._id}/progress?range=week`)).data;
  assert.equal(pr.hasData, true);
  assert.deepEqual([pr.tasks.assigned, pr.tasks.approved, pr.tasks.open, pr.tasks.approvalRate], [3, 2, 1, 67]);
  assert.equal(pr.byCategory.find((c) => c.category === 'creativity').minutes, 40);   // uses minutes the child reported
  assert.equal(pr.byCategory.find((c) => c.category === 'outdoor').minutes, 30);      // falls back to activity duration
  assert.deepEqual([pr.physical.totalMinutes, pr.physical.selfReportedMinutes, pr.physical.parentVerifiedMinutes], [75, 45, 30]);
  assert.equal(pr.games.attempts, 1); assert.equal(pr.games.byGame.find((g) => g.gameType === 'riddle-challenge').averagePercent, 100);
  assert.equal(pr.points.total, 25);
  assert.equal(pr.creativeAndLifeSkills.creativity, 1);
  assert.equal(pr.daily.reduce((s, d) => s + d.physicalMinutes, 0), 75);
  assert.equal(pr.weeklyTrend.at(-1).approved, 2);

  const summary = (await p.client.get(`/api/children/${child._id}`)).data.summary;
  assert.deepEqual([summary.today.total, summary.today.done, summary.today.percent], [3, 2, 67]);
  assert.deepEqual([summary.week.physicalMinutes, summary.week.goalMinutes, summary.week.screenFreeActivities, summary.week.gameAttempts], [75, 60, 4, 1]);

  const day = (await p.client.get(`/api/children/${child._id}/progress?range=day`)).data; assert.equal(day.tasks.assigned, 3);
  const month = (await p.client.get(`/api/children/${child._id}/progress?range=month`)).data; assert.equal(month.tasks.approved, 2);
  const report = await p.client.get(`/api/children/${child._id}/reports/weekly`);
  assert.equal(report.status, 200); assert.ok(report.data.highlights.some((h) => h.includes('2 of 3'))); assert.match(report.data.disclaimer, /not a medical/);
  assert.equal(report.data.comparison.approvedTasks.previous, 0);
  const badges = (await p.client.get(`/api/children/${child._id}/badges`)).data;
  assert.ok(badges.badges.find((b) => b.id === 'first-mission').earned);
  assert.equal(badges.badges.find((b) => b.id === 'ten-missions').earned, false);
  assert.equal(badges.badges.filter((b) => b.earned).length, new Set(badges.badges.filter((b) => b.earned).map((b) => b.id)).size);
});

test('weekly report includes child notes unless the parent hides them (privacy setting)', async () => {
  const p = await registerParent(); const child = await newChild(p.client); const kid = await kidOf(p, child);
  const a = await makeActivity({ title: 'Noted' });
  const t = (await p.client.post('/api/tasks', { childId: child._id, activityId: String(a._id), scheduledDate: iso(today()), dueDate: iso(today()) })).data;
  await kid.post(`/api/tasks/${t._id}/submit`, { childNote: 'I loved it' });
  assert.deepEqual((await p.client.get(`/api/children/${child._id}/reports/weekly`)).data.childNotes, ['I loved it']);
  await p.client.patch('/api/parents/me', { privacySettings: { hideChildNotesInReports: true } });
  assert.deepEqual((await p.client.get(`/api/children/${child._id}/reports/weekly`)).data.childNotes, []);
});
