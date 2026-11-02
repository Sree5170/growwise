import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, resetDb, registerParent, makeActivity } from './helpers.js';

before(async () => { await startTestApp(); });
after(stopTestApp);

test('activity library filters by age, category, duration, search and paginates; hides unpublished', async () => {
  await resetDb();
  const { client } = await registerParent();
  await makeActivity({ title: 'Toddler Dance', category: 'physical', minimumAge: 3, maximumAge: 5, durationMinutes: 10, tags: ['dance'] });
  await makeActivity({ title: 'Teen Circuit', category: 'physical', minimumAge: 13, maximumAge: 17, durationMinutes: 30 });
  await makeActivity({ title: 'Puzzle Time', category: 'brain-games', minimumAge: 6, maximumAge: 12, durationMinutes: 20, description: 'Logic puzzle with Sudoku grids' });
  await makeActivity({ title: 'Hidden Draft', category: 'creativity', isPublished: false });

  const all = await client.get('/api/activities');
  assert.equal(all.data.length, 3); assert.equal(all.body.meta.total, 3);
  assert.ok(!all.data.some((a) => a.title === 'Hidden Draft'));

  const age4 = await client.get('/api/activities?age=4');
  assert.deepEqual(age4.data.map((a) => a.title), ['Toddler Dance']);
  const age15 = await client.get('/api/activities?age=15');
  assert.deepEqual(age15.data.map((a) => a.title), ['Teen Circuit']);
  assert.deepEqual((await client.get('/api/activities?category=brain-games')).data.map((a) => a.title), ['Puzzle Time']);
  assert.deepEqual((await client.get('/api/activities?maxDuration=15')).data.map((a) => a.title), ['Toddler Dance']);
  assert.deepEqual((await client.get('/api/activities?q=sudoku')).data.map((a) => a.title), ['Puzzle Time']);
  assert.deepEqual((await client.get('/api/activities?q=dance')).data.map((a) => a.title), ['Toddler Dance']); // matches tag
  const page = await client.get('/api/activities?limit=2&page=2');
  assert.equal(page.data.length, 1); assert.equal(page.body.meta.pages, 2);
});

test('invalid filters are rejected and regex characters in search are safe', async () => {
  const { client } = await registerParent();
  assert.equal((await client.get('/api/activities?age=99')).status, 422);
  assert.equal((await client.get('/api/activities?category=nonsense')).status, 422);
  const r = await client.get('/api/activities?q=' + encodeURIComponent('(.*)+['));
  assert.equal(r.status, 200); assert.equal(r.data.length, 0);
  assert.equal((await client.get('/api/activities/not-an-id')).status, 422);
});
