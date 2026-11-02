import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, Client, registerParent, newChild, makeAdmin, makeActivity, PASSWORD, today, iso } from './helpers.js';

before(startTestApp); after(stopTestApp);

const assign = (client, child, activity) => client.post('/api/tasks', { childId: child._id, activityId: String(activity._id), scheduledDate: iso(today()), dueDate: iso(today()) });

test('child profile CRUD works for the owner and validates input', async () => {
  const { client } = await registerParent();
  const bad = await client.post('/api/children', { displayName: '', ageGroup: '99' });
  assert.equal(bad.status, 422);
  const child = await newChild(client, { displayName: 'Mia' });
  assert.equal(child.displayName, 'Mia');
  const upd = await client.patch(`/api/children/${child._id}`, { interests: ['music'] });
  assert.deepEqual(upd.data.interests, ['music']);
  assert.equal((await client.get('/api/children')).data.length, 1);
  const del = await client.del(`/api/children/${child._id}`);
  assert.equal(del.status, 200);
  assert.equal((await client.get(`/api/children/${child._id}`)).status, 404);
});

test("a parent cannot read, edit, delete or open another parent's child", async () => {
  const a = await registerParent('Parent A'); const b = await registerParent('Parent B');
  const child = await newChild(a.client);
  for (const [method, path, body] of [['get', `/api/children/${child._id}`], ['patch', `/api/children/${child._id}`, { displayName: 'Hacked' }], ['del', `/api/children/${child._id}`],
    ['get', `/api/children/${child._id}/tasks`], ['get', `/api/children/${child._id}/progress`], ['get', `/api/children/${child._id}/recommendations`],
    ['get', `/api/children/${child._id}/physical-activity`], ['get', `/api/children/${child._id}/games/progress`], ['get', `/api/children/${child._id}/reports/weekly`], ['post', `/api/children/${child._id}/session`]]) {
    const r = await b.client[method](path, body);
    assert.equal(r.status, 404, `${method} ${path} should hide the child (got ${r.status})`);
  }
  assert.equal((await a.client.get(`/api/children/${child._id}`)).status, 200); // still intact
});

test("assigning tasks / logging activity / games for another parent's child is rejected", async () => {
  const a = await registerParent('Parent A'); const b = await registerParent('Parent B');
  const child = await newChild(a.client); const act = await makeActivity();
  assert.equal((await assign(b.client, child, act)).status, 404);
  assert.equal((await b.client.post('/api/physical-activity', { childId: child._id, activityType: 'walking', durationMinutes: 10, activityDate: iso(today()) })).status, 404);
  assert.equal((await b.client.get(`/api/games/pattern-quiz/questions?childId=${child._id}`)).status, 404);
});

test('protected routes reject anonymous requests', async () => {
  const c = new Client();
  for (const p of ['/api/children', '/api/activities', '/api/tasks', '/api/games', '/api/safety-lessons', '/api/parents/me']) assert.equal((await c.get(p)).status, 401, p);
});

test('only admins can create or change activities', async () => {
  const { client } = await registerParent();
  const payload = { title: 'New Activity', description: 'Created in an authorization test', category: 'physical', minimumAge: 6, maximumAge: 9, durationMinutes: 10, instructions: ['Go'], points: 10 };
  assert.equal((await client.post('/api/activities', payload)).status, 403);
  const admin = await makeAdmin();
  const created = await admin.post('/api/activities', payload);
  assert.equal(created.status, 201);
  assert.equal((await client.patch(`/api/activities/${created.data._id}`, { points: 99 })).status, 403);
  assert.equal((await admin.patch(`/api/activities/${created.data._id}`, { points: 12 })).data.points, 12);
  const invalid = await admin.post('/api/activities', { ...payload, minimumAge: 12, maximumAge: 5 });
  assert.equal(invalid.status, 422);
});

test('child-mode session is locked to one child and cannot use parent-only actions', async () => {
  const p = await registerParent();
  const mia = await newChild(p.client, { displayName: 'Mia' }); const ben = await newChild(p.client, { displayName: 'Ben' });
  const act = await makeActivity();
  const task = (await assign(p.client, mia, act)).data;

  const kid = new Client(); kid.cookie = p.client.cookie;
  const start = await kid.post(`/api/children/${mia._id}/session`);
  assert.equal(start.data.mode, 'child');
  assert.equal((await kid.get('/api/auth/me')).data.mode, 'child');

  assert.equal((await kid.get(`/api/children/${mia._id}`)).status, 200);          // own profile ok
  assert.equal((await kid.get(`/api/children/${ben._id}`)).status, 403);          // sibling blocked
  assert.equal((await kid.get('/api/children')).status, 403);                     // cannot list profiles
  assert.equal((await kid.patch(`/api/children/${mia._id}`, { displayName: 'X' })).status, 403);
  assert.equal((await kid.del(`/api/children/${mia._id}`)).status, 403);
  assert.equal((await kid.post(`/api/tasks/${task._id}/verify`, { decision: 'approve' })).status, 403); // cannot approve own work
  assert.equal((await kid.post('/api/tasks', { childId: mia._id, activityId: String(act._id), scheduledDate: iso(today()), dueDate: iso(today()) })).status, 403);
  assert.equal((await kid.get('/api/parents/me')).status, 403);
  assert.equal((await kid.del('/api/parents/me', { password: PASSWORD })).status, 403);
  assert.equal((await kid.post(`/api/children/${ben._id}/session`)).status, 403);
  assert.equal((await kid.get(`/api/children/${mia._id}/reports/weekly`)).status, 403);
  assert.equal((await kid.get(`/api/games/pattern-quiz/questions?childId=${ben._id}`)).status, 403);

  // wrong password cannot leave child mode; correct password can
  assert.equal((await kid.post('/api/auth/exit-child-mode', { password: 'Nope-123456' })).status, 401);
  assert.equal((await kid.get('/api/auth/me')).data.mode, 'child');
  assert.equal((await kid.post('/api/auth/exit-child-mode', { password: PASSWORD })).data.mode, 'parent');
  assert.equal((await kid.get('/api/children')).status, 200);
});

test('parent settings: update profile, change password, delete account removes all child data', async () => {
  const p = await registerParent('Settings');
  const upd = await p.client.patch('/api/parents/me', { name: 'New Name', notificationPreferences: { dailyReminder: false, reminderTime: '18:30' } });
  assert.equal(upd.data.name, 'New Name'); assert.equal(upd.data.notificationPreferences.dailyReminder, false);
  assert.equal((await p.client.patch('/api/parents/me', { notificationPreferences: { reminderTime: '25:99' } })).status, 422);
  assert.equal((await p.client.patch('/api/parents/me', { role: 'admin' })).status, 422); // role is not updatable
  assert.equal((await p.client.post('/api/parents/me/password', { currentPassword: 'wrong', newPassword: 'Another-pass1' })).status, 400);
  assert.equal((await p.client.post('/api/parents/me/password', { currentPassword: PASSWORD, newPassword: 'Another-pass1' })).status, 200);
  assert.equal((await new Client().post('/api/auth/login', { email: p.email, password: 'Another-pass1' })).status, 200);

  const child = await newChild(p.client); await assign(p.client, child, await makeActivity());
  assert.equal((await p.client.del('/api/parents/me', { password: 'bad' })).status, 401);
  assert.equal((await p.client.del('/api/parents/me', { password: 'Another-pass1' })).status, 200);
  const { AssignedTask, Child } = await import('./helpers.js');
  assert.equal(await Child.countDocuments({ _id: child._id }), 0);
  assert.equal(await AssignedTask.countDocuments({ childId: child._id }), 0);
});
