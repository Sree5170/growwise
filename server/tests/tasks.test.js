import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, Client, registerParent, newChild, makeActivity, today, iso, AssignedTask } from './helpers.js';

before(startTestApp); after(stopTestApp);
const dayAfter = () => { const d = today(); d.setDate(d.getDate() + 1); return d; };
const assign = (client, child, act, over = {}) => client.post('/api/tasks', { childId: child._id, activityId: String(act._id), scheduledDate: iso(today()), dueDate: iso(dayAfter()), ...over });

async function setup(points = 10) {
  const p = await registerParent(); const child = await newChild(p.client, { ageGroup: '6-8' });
  const act = await makeActivity({ points, minimumAge: 6, maximumAge: 9 });
  const kid = new Client(); kid.cookie = p.client.cookie; await kid.post(`/api/children/${child._id}/session`);
  return { p, child, act, kid };
}

test('assignment: age mismatch, unknown activity, bad dates and duplicates are rejected', async () => {
  const { p, child, act } = await setup();
  const teen = await makeActivity({ title: 'Teen only', minimumAge: 14, maximumAge: 17 });
  assert.equal((await assign(p.client, child, teen)).status, 400);
  assert.equal((await assign(p.client, child, { _id: '64b000000000000000000000' })).status, 404);
  assert.equal((await assign(p.client, child, act, { dueDate: iso(new Date(today().getTime() - 86400000 * 2)) })).status, 400);
  assert.equal((await assign(p.client, child, act, { scheduledDate: 'not-a-date' })).status, 422);
  const ok = await assign(p.client, child, act);
  assert.equal(ok.status, 201); assert.equal(ok.data.status, 'assigned'); assert.equal(ok.data.pointsAwarded, 0);
  assert.equal((await assign(p.client, child, act)).status, 409);
});

test('client-supplied parent, status or points are rejected (never trusted)', async () => {
  const { p, child, act } = await setup();
  for (const extra of [{ pointsAwarded: 999 }, { status: 'approved' }, { parentId: '64b000000000000000000000' }]) assert.equal((await assign(p.client, child, act, extra)).status, 422);
});

test('full workflow: assign → child submits → parent approves → points come from the Activity record', async () => {
  const { p, child, act, kid } = await setup(12);
  const task = (await assign(p.client, child, act)).data;
  const mine = await kid.get('/api/tasks'); assert.equal(mine.data.length, 1); assert.equal(mine.data[0].activity.title, 'Test');
  const sub = await kid.post(`/api/tasks/${task._id}/submit`, { childNote: 'Done!', minutesSpent: 15 });
  assert.equal(sub.data.status, 'submitted'); assert.ok(sub.data.submittedAt);
  assert.equal((await kid.post(`/api/tasks/${task._id}/submit`, { childNote: 'again' })).status, 409); // double submit
  const ver = await p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve', parentNote: 'Great job' });
  assert.equal(ver.status, 200); assert.equal(ver.data.task.status, 'approved'); assert.equal(ver.data.task.pointsAwarded, 12);
  assert.equal(ver.data.points.total, 12); assert.ok(ver.data.newBadges.some((b) => b.id === 'first-mission'));
});

test('points cannot be forged in the verify request', async () => {
  const { p, child, act, kid } = await setup(10);
  const task = (await assign(p.client, child, act)).data; await kid.post(`/api/tasks/${task._id}/submit`, {});
  assert.equal((await p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve', pointsAwarded: 5000 })).status, 422);
  const ok = await p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve' });
  assert.equal(ok.data.task.pointsAwarded, 10);
});

test('duplicate / concurrent approval awards points exactly once', async () => {
  const { p, child, act, kid } = await setup(10);
  const task = (await assign(p.client, child, act)).data; await kid.post(`/api/tasks/${task._id}/submit`, {});
  const results = await Promise.all(Array.from({ length: 6 }, () => p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve' })));
  const wins = results.filter((r) => r.status === 200); const conflicts = results.filter((r) => r.status === 409);
  assert.equal(wins.length, 1, 'exactly one request may win'); assert.equal(conflicts.length, 5);
  const summary = (await p.client.get(`/api/children/${child._id}`)).data.summary;
  assert.equal(summary.points.total, 10);
  assert.equal((await p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve' })).status, 409); // later repeat
});

test('cannot verify a task that was never submitted; reject → needs-revision → resubmit → approve', async () => {
  const { p, child, act, kid } = await setup(10);
  const task = (await assign(p.client, child, act)).data;
  assert.equal((await p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve' })).status, 409);
  await kid.post(`/api/tasks/${task._id}/submit`, {});
  const rej = await p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'reject', parentNote: 'Please finish the last step' });
  assert.equal(rej.data.task.status, 'needs-revision'); assert.equal(rej.data.task.parentNote, 'Please finish the last step'); assert.equal(rej.data.points.total, 0);
  assert.equal((await kid.post(`/api/tasks/${task._id}/submit`, { childNote: 'Fixed' })).data.status, 'submitted');
  assert.equal((await p.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve' })).data.points.total, 10);
});

test('pending tasks can be edited or cancelled; cancelled/approved tasks cannot', async () => {
  const { p, child, act, kid } = await setup();
  const t1 = (await assign(p.client, child, act)).data;
  const edit = await p.client.patch(`/api/tasks/${t1._id}`, { parentNote: 'Bring a pencil', dueDate: iso(new Date(today().getTime() + 3 * 86400000)) });
  assert.equal(edit.data.parentNote, 'Bring a pencil');
  assert.equal((await p.client.patch(`/api/tasks/${t1._id}`, { dueDate: iso(new Date(today().getTime() - 5 * 86400000)) })).status, 400);
  assert.equal((await p.client.patch(`/api/tasks/${t1._id}`, { status: 'approved' })).status, 422);
  assert.equal((await p.client.patch(`/api/tasks/${t1._id}`, { status: 'cancelled' })).data.status, 'cancelled');
  assert.equal((await kid.post(`/api/tasks/${t1._id}/submit`, {})).status, 409);
  assert.equal((await p.client.patch(`/api/tasks/${t1._id}`, { parentNote: 'x' })).status, 409);
});

test("another parent or another child cannot touch a task", async () => {
  const { p, child, act } = await setup();
  const task = (await assign(p.client, child, act)).data;
  const other = await registerParent('Other');
  for (const r of [await other.client.post(`/api/tasks/${task._id}/submit`, {}), await other.client.post(`/api/tasks/${task._id}/verify`, { decision: 'approve' }), await other.client.patch(`/api/tasks/${task._id}`, { parentNote: 'x' })]) assert.equal(r.status, 404);
  const sibling = await newChild(p.client, { displayName: 'Sib' });
  const sibKid = new Client(); sibKid.cookie = p.client.cookie; await sibKid.post(`/api/children/${sibling._id}/session`);
  assert.equal((await sibKid.post(`/api/tasks/${task._id}/submit`, {})).status, 404);
  assert.equal((await sibKid.get('/api/tasks')).data.length, 0);
  assert.equal((await AssignedTask.findById(task._id)).status, 'assigned');
});

test('task list supports status filter and pagination', async () => {
  const { p, child } = await setup();
  for (let i = 0; i < 3; i++) await assign(p.client, child, await makeActivity({ title: `Act ${i}`, minimumAge: 6, maximumAge: 9 }));
  const page1 = await p.client.get('/api/tasks?limit=2'); assert.equal(page1.data.length, 2); assert.equal(page1.body.meta.total, 3);
  assert.equal((await p.client.get('/api/tasks?status=approved')).data.length, 0);
  assert.equal((await p.client.get('/api/tasks?status=bogus')).status, 422);
});
