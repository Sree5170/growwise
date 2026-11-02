import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, stopTestApp, Client, registerParent, PASSWORD, User } from './helpers.js';

before(startTestApp); after(stopTestApp);

test('registration creates a parent, sets an httpOnly cookie and never returns the password hash', async () => {
  const c = new Client();
  const r = await c.post('/api/auth/register', { name: 'Asha Rao', email: 'asha@example.com', password: PASSWORD });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.role, 'parent');
  assert.equal(r.data.user.passwordHash, undefined);
  assert.match(r.headers.get('set-cookie'), /HttpOnly/i);
  const stored = await User.findOne({ email: 'asha@example.com' }).select('+passwordHash');
  assert.notEqual(stored.passwordHash, PASSWORD);
  assert.match(stored.passwordHash, /^\$2[aby]\$/);
});

test('registration cannot choose a role (admin escalation is rejected)', async () => {
  const r = await new Client().post('/api/auth/register', { name: 'Evil', email: 'evil@example.com', password: PASSWORD, role: 'admin' });
  assert.equal(r.status, 422);
  assert.equal(await User.countDocuments({ email: 'evil@example.com' }), 0);
});

test('password validation: too short, no number, no letter, too long', async () => {
  for (const [password, field] of [['Short1', 'password'], ['NoNumbersHere', 'password'], ['12345678', 'password'], ['a1'.repeat(40), 'password']]) {
    const r = await new Client().post('/api/auth/register', { name: 'Pw Test', email: `pw${Math.random()}@example.com`, password });
    assert.equal(r.status, 422, `expected rejection for ${password}`);
    assert.ok(r.body.error.details.some((d) => d.field === field));
  }
});

test('invalid email and duplicate email are rejected', async () => {
  const bad = await new Client().post('/api/auth/register', { name: 'Bad Mail', email: 'nope', password: PASSWORD });
  assert.equal(bad.status, 422);
  await registerParent('Dup');
  const { email } = await registerParent('First');
  const dup = await new Client().post('/api/auth/register', { name: 'Second', email: email.toUpperCase(), password: PASSWORD });
  assert.equal(dup.status, 409);
});

test('login succeeds with correct credentials and fails generically otherwise', async () => {
  const { email } = await registerParent('Login');
  const good = new Client();
  assert.equal((await good.post('/api/auth/login', { email, password: PASSWORD })).status, 200);
  const wrongPw = await new Client().post('/api/auth/login', { email, password: 'Wrong-pass1' });
  const noUser = await new Client().post('/api/auth/login', { email: 'ghost@example.com', password: 'Wrong-pass1' });
  assert.equal(wrongPw.status, 401); assert.equal(noUser.status, 401);
  assert.equal(wrongPw.body.error.message, noUser.body.error.message); // no account enumeration
});

test('GET /me requires authentication; logout clears the session', async () => {
  assert.equal((await new Client().get('/api/auth/me')).status, 401);
  const { client } = await registerParent('Me');
  const me = await client.get('/api/auth/me');
  assert.equal(me.status, 200); assert.equal(me.data.mode, 'parent');
  await client.post('/api/auth/logout');
  assert.equal((await client.get('/api/auth/me')).status, 401);
});

test('tampered or garbage tokens are rejected', async () => {
  const c = new Client(); c.cookie = 'gw_token=not.a.jwt';
  assert.equal((await c.get('/api/auth/me')).status, 401);
});

test('CSRF layer: state-changing requests need the custom header and a trusted origin', async () => {
  const { client } = await registerParent('Csrf');
  const noHeader = await client.req('POST', '/api/auth/logout', {}, { 'X-Requested-With': '' });
  assert.equal(noHeader.status, 403);
  const badOrigin = await client.req('POST', '/api/children', { displayName: 'X', ageGroup: '6-8' }, { Origin: 'https://evil.example' });
  assert.equal(badOrigin.status, 403);
});

test('malformed JSON returns a safe 400 without a stack trace', async () => {
  const { client } = await registerParent('Json');
  const r = await client.raw('POST', '/api/children', '{"displayName": ');
  assert.equal(r.status, 400);
  assert.equal(r.body.error.message, 'Malformed JSON body');
  assert.equal(JSON.stringify(r.body).includes('node_modules'), false);
});
