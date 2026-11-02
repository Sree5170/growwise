process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123456';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/growwise_test';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const { default: mongoose } = await import('mongoose');
const { connectDb, disconnectDb } = await import('../src/config/db.js');
const { createApp } = await import('../src/app.js');
export const { User } = await import('../src/modules/auth/user.model.js');
export const { Child } = await import('../src/modules/children/child.model.js');
export const { Activity } = await import('../src/modules/activities/activity.model.js');
export const { AssignedTask } = await import('../src/modules/tasks/task.model.js');
export const { SafetyLesson } = await import('../src/modules/safetyAcademy/safetyLesson.model.js');
const { hashPassword } = await import('../src/modules/auth/auth.service.js');
export const rec = await import('../src/modules/recommendations/recommendation.engine.js');

let server; let base;
export async function startTestApp() {
  await connectDb();
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
}
export async function stopTestApp() { await new Promise((r) => server.close(r)); await mongoose.connection.dropDatabase(); await disconnectDb(); }
export const resetDb = async () => { for (const m of Object.values(mongoose.models)) await m.deleteMany({}); };

// Tiny cookie-jar client
export class Client {
  constructor() { this.cookie = ''; }
  async req(method, path, body, headers = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Origin: 'http://localhost:5173', ...(this.cookie ? { Cookie: this.cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) { const pair = setCookie.split(';')[0]; this.cookie = pair.endsWith('=') ? '' : pair; }
    let json = null; try { json = await res.json(); } catch { /* empty */ }
    return { status: res.status, body: json, data: json?.data, headers: res.headers };
  }
  async raw(method, path, rawBody) {
    const res = await fetch(base + path, { method, body: rawBody, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(this.cookie ? { Cookie: this.cookie } : {}) } });
    return { status: res.status, body: await res.json().catch(() => null) };
  }
  get(p) { return this.req('GET', p); }
  post(p, b = {}) { return this.req('POST', p, b); }
  patch(p, b) { return this.req('PATCH', p, b); }
  del(p, b) { return this.req('DELETE', p, b); }
}

export const PASSWORD = 'Passw0rd-test';
let n = 0;
export async function registerParent(name = 'Parent') {
  const c = new Client(); n += 1;
  const email = `parent${n}-${Date.now()}@example.com`;
  const r = await c.post('/api/auth/register', { name, email, password: PASSWORD });
  return { client: c, user: r.data.user, email };
}
export async function makeAdmin() {
  const c = new Client(); const email = `admin${++n}@example.com`;
  await User.create({ name: 'Admin', email, role: 'admin', passwordHash: await hashPassword(PASSWORD) });
  await c.post('/api/auth/login', { email, password: PASSWORD });
  return c;
}
export const newChild = (client, over = {}) => client.post('/api/children', { displayName: 'Kid', ageGroup: '6-8', interests: ['art'], goals: ['creativity'], ...over }).then((r) => r.data);

const base_activity = { title: 'Test', description: 'A test activity for unit tests', category: 'creativity', minimumAge: 6, maximumAge: 9, durationMinutes: 20,
  difficulty: 'easy', materials: [], instructions: ['Do it'], safetyNotes: [], requiresAdultSupervision: false, points: 10, tags: [], isIndoor: true, needsOutdoorSpace: false, isPublished: true };
export const makeActivity = (over = {}) => Activity.create({ ...base_activity, ...over });
export const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
export const iso = (d) => new Date(d).toISOString();
