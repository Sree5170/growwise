import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, resetDb, registerParent, newChild, makeActivity, rec, today, iso } from './helpers.js';

before(startTestApp); after(stopTestApp);

const act = (o) => ({ _id: Math.random().toString(16).slice(2), isPublished: true, minimumAge: 6, maximumAge: 9, durationMinutes: 15, category: 'creativity', materials: [], tags: [], requiresAdultSupervision: false, needsOutdoorSpace: false, isIndoor: true, title: 'x', ...o });
const child = (o = {}) => ({ ageGroup: '6-8', interests: [], preferences: { availableMinutes: 30, hasOutdoorSpace: true, adultAvailable: true, materialsAvailable: [], preferredCategories: [] }, ...o });

test('engine: hard filters (age, time, outdoor space, adult supervision, materials, unpublished)', () => {
  const c = child({ preferences: { availableMinutes: 20, hasOutdoorSpace: false, adultAvailable: false, materialsAvailable: ['paper'], preferredCategories: [] } });
  const good = act({ title: 'good', materials: ['paper'] });
  const pool = [good, act({ title: 'too old', minimumAge: 13, maximumAge: 17 }), act({ title: 'too young', minimumAge: 3, maximumAge: 4 }), act({ title: 'long', durationMinutes: 45 }),
    act({ title: 'outdoor', needsOutdoorSpace: true, isIndoor: false }), act({ title: 'needs adult', requiresAdultSupervision: true }), act({ title: 'no materials', materials: ['drum', 'glue', 'robot'] }), act({ title: 'draft', isPublished: false })];
  assert.deepEqual(rec.eligibleActivities(c, pool).map((a) => a.title), ['good']);
  assert.deepEqual(rec.recommend({ child: c, activities: pool }).map((r) => r.activity.title), ['good']);
});

test('engine: interests boost ranking and every recommendation has a reason', () => {
  const c = child({ interests: ['music'] });
  const out = rec.recommend({ child: c, activities: [act({ title: 'plain', category: 'life-skills' }), act({ title: 'musical', category: 'life-skills', tags: ['music'] })] });
  assert.equal(out[0].activity.title, 'musical'); assert.match(out[0].reason, /interest in music/);
  assert.ok(out.every((r) => r.reason.length > 10));
});

test('engine: avoids repetition and balances domains across the week', () => {
  const now = new Date();
  const a1 = act({ title: 'art', category: 'creativity' }); const a2 = act({ title: 'run', category: 'physical' }); const a3 = act({ title: 'safe', category: 'disaster-preparedness' });
  const recent = [{ activityId: a1._id, status: 'approved', scheduledDate: new Date(now - 2 * 86400000) }, { activityId: a1._id, status: 'assigned', scheduledDate: now }];
  const out = rec.recommend({ child: child(), activities: [a1, a2, a3], recentTasks: recent, now });
  assert.ok(!out.some((r) => r.activity.title === 'art'), 'recent activity must not repeat within a week');
  const art2 = act({ title: 'art2', category: 'creativity' });
  const threeCreative = [0, 1, 2].map((i) => ({ activityId: a1._id, status: 'approved', scheduledDate: new Date(now - i * 3600000) }));
  const balanced = rec.recommend({ child: child(), activities: [a1, art2, a2], recentTasks: threeCreative, now });
  assert.equal(balanced[0].activity.title, 'run', 'an under-represented domain (physical) should rank above creative after 3 creative tasks');
  assert.match(balanced[0].reason, /physical/);
  const mixed = rec.recommend({ child: child(), activities: [a2, a3, act({ title: 'b', category: 'brain-games' }), act({ title: 'c', category: 'creativity' }), act({ title: 'd', category: 'creativity' }), act({ title: 'e', category: 'creativity' })], now, limit: 6 });
  assert.ok(mixed.filter((r) => r.activity.category === 'creativity').length <= 2, 'max two per domain keeps the list varied');
});

test('engine: offers an indoor alternative for outdoor picks and an AI-style reranker cannot add ineligible items', () => {
  const outdoor = act({ title: 'trail', category: 'outdoor', needsOutdoorSpace: true, isIndoor: false, tags: ['nature'] });
  const indoor = act({ title: 'yoga', category: 'physical' });
  const out = rec.recommend({ child: child({ interests: ['nature'] }), activities: [outdoor, indoor] });
  const trail = out.find((r) => r.activity.title === 'trail'); assert.equal(trail.indoorAlternative.title, 'yoga');
  const tooOld = act({ title: 'adult-only', minimumAge: 14, maximumAge: 17 });
  const hacked = rec.recommend({ child: child(), activities: [indoor, tooOld], rerank: (list) => [{ activity: tooOld, score: 99, reasons: ['sneaky'], domain: 'creative' }, ...list] });
  assert.ok(!hacked.some((r) => r.activity.title === 'adult-only'));
});

test('endpoint: recommendations respect age and adult-supervision constraints end to end', async () => {
  await resetDb();
  const p = await registerParent(); const c = await newChild(p.client, { ageGroup: '3-5', preferences: { availableMinutes: 30, adultAvailable: false, hasOutdoorSpace: true } });
  await makeActivity({ title: 'Toddler art', minimumAge: 3, maximumAge: 5 });
  await makeActivity({ title: 'Teen coding', minimumAge: 13, maximumAge: 17 });
  await makeActivity({ title: 'Needs adult', minimumAge: 3, maximumAge: 8, requiresAdultSupervision: true });
  const r = await p.client.get(`/api/children/${c._id}/recommendations`);
  assert.equal(r.status, 200); assert.deepEqual(r.data.recommendations.map((x) => x.activity.title), ['Toddler art']);
  assert.equal((await p.client.get(`/api/children/${c._id}/recommendations?minutes=5`)).data.recommendations.length, 0);
});
