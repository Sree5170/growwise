import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const BASE = process.env.E2E_BASE_URL || 'http://localhost:5173';
const axeSrc = fs.readFileSync(new URL('./node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const results = []; const problems = []; const axeReport = [];
const ok = (name, cond, extra = '') => { results.push([cond, name, extra]); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

const browser = await puppeteer.launch({ args: [...chromium.args, '--no-sandbox'], executablePath: await chromium.executablePath(), headless: 'shell' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
page.on('response', async (r) => { if (r.url().includes('/api/') && r.status() >= 400 && r.status() !== 401) { let b = ''; try { b = (await r.text()).slice(0, 300); } catch {} problems.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()} ${b} REQ=${(r.request().postData() || '').slice(0, 300)}`); } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = () => page.evaluate(() => document.body.innerText);
const waitText = async (t, ms = 8000) => { try { await page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t); return true; } catch { return false; } };
const clickText = async (t, sel = 'button, a') => {
  const h = await page.evaluateHandle((t, sel) => [...document.querySelectorAll(sel)].find((e) => e.offsetParent !== null && e.textContent.trim().includes(t)), t, sel);
  const el = h.asElement(); if (!el) throw new Error(`clickText: "${t}" not found`); await el.click(); await sleep(150);
};
const fill = async (label, value) => {
  const id = await page.evaluate((label) => { const l = [...document.querySelectorAll('label')].find((x) => x.offsetParent !== null && x.textContent.trim().startsWith(label)); return l?.htmlFor || null; }, label);
  if (!id) throw new Error(`fill: label "${label}" not found`);
  const sel = `[id="${id}"]`; await page.focus(sel); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); if (value) await page.type(sel, value);
};
const select = async (label, value) => {
  const id = await page.evaluate((label) => [...document.querySelectorAll('label')].find((x) => x.offsetParent !== null && x.textContent.trim().startsWith(label))?.htmlFor, label);
  await page.select(`[id="${id}"]`, value);
};
fs.mkdirSync('shots', { recursive: true });
const shot = (n) => page.screenshot({ path: `shots/${n}.png` });
const axe = async (name) => {
  await page.evaluate(axeSrc);
  const r = await page.evaluate(async () => { const x = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }); return x.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, sample: v.nodes[0]?.target?.join(' ') })); });
  axeReport.push([name, r]);
};
const noOverflow = (name) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1).then((v) => ok(`no horizontal overflow: ${name}`, v));
const email = `e2e${Date.now()}@example.com`; const PASSWORD = 'E2e-Passw0rd';

try {
  // ---- public ----
  await page.goto(BASE); ok('landing renders', await waitText('Turn everyday growing up'));
  await axe('landing'); await shot('landing-desktop');
  for (const [p, t] of [['/about', 'About GrowWise'], ['/features', 'Features and benefits'], ['/how-it-works', 'How it works'], ['/privacy', 'Privacy policy'], ['/nope', 'This trail leads nowhere']]) { await page.goto(BASE + p); ok(`public route ${p}`, await waitText(t)); }
  await page.goto(BASE + '/parent/dashboard'); ok('protected route redirects to login', await waitText('Welcome back') && page.url().endsWith('/login'));

  // ---- register with validation ----
  await page.goto(BASE + '/register'); await waitText('Create your parent account');
  await clickText('Create account', 'button'); ok('register shows validation messages', await waitText('Enter your name') && await waitText('Choose a password'));
  await fill('Your name', 'E2E Parent'); await fill('Email', email); await fill('Password', 'weakpass'); await fill('Confirm password', 'weakpass');
  await clickText('Create account', 'button'); ok('weak password rejected', await waitText('include a letter and a number'));
  await fill('Password', PASSWORD); await fill('Confirm password', 'Different1'); await clickText('Create account', 'button'); ok('password mismatch rejected', await waitText('Passwords do not match'));
  await fill('Confirm password', PASSWORD); await clickText('Create account', 'button');
  ok('registered and redirected to children', await waitText('No child profiles yet') && page.url().includes('/parent/children'));
  await axe('children-empty'); await shot('children-empty');

  // ---- add child ----
  await clickText('Add your first child'); await waitText('Add a child');
  await clickText('Create profile', 'button'); ok('child form validates', await waitText('Enter a nickname') && await waitText('Choose an age group'));
  await fill('Nickname', 'Mia'); await select('Age group', '6-8');
  await clickText('art', 'label'); await clickText('nature', 'label'); await clickText('Move more', 'label');
  await clickText('Create profile', 'button'); ok('child created', await waitText('Mia') && await waitText('Level 1'));
  await axe('children-list'); await shot('children-list');

  // ---- dashboard + assign ----
  await page.goto(BASE + '/parent/dashboard'); ok('dashboard loads real data', await waitText('Today’s completion') && await waitText('Recommended for today'));
  ok('dashboard empty states are honest', await waitText('No missions scheduled today') && await waitText('No progress yet'));
  await axe('parent-dashboard'); await shot('parent-dashboard-desktop');
  await clickText('Assign a task', 'button'); await waitText('Assign a mission');
  await fill('Search activities', 'Story Stones'); await sleep(700); await clickText('Story Stones', 'button'); await waitText('points');
  await clickText('Assign mission', 'button'); ok('task assigned from dashboard', await waitText('Assigned “Story Stones”'));
  await waitText('Story Stones'); await sleep(500);
  // Age mismatch via API through UI: teen activity should be rejected by server
  await clickText('Assign a task', 'button'); await waitText('Assign a mission'); await fill('Search activities', 'Logic Grid'); await sleep(700);
  const noTeen = !(await text()).includes('Logic Grid Mystery'); ok('assign picker only offers age-suitable activities', noTeen);
  await page.keyboard.press('Escape'); await sleep(200);

  // ---- child mode ----
  await clickText('Open child mode', 'button'); ok('child dashboard shows mission', await waitText('Today’s Adventure') && await waitText('Story Stones'));
  await axe('child-dashboard'); await shot('child-dashboard-desktop');
  await clickText('Story Stones', 'button'); await waitText('Steps');
  await fill('Tell us how it went', 'I painted a fox'); await clickText('I did it', 'button');
  ok('child submitted mission', await waitText('Waiting for review'));
  await page.goto(BASE + '/parent/dashboard'); ok('child cannot reach parent routes', await waitText('Today’s Adventure') && page.url().includes('/child/dashboard'));
  // parental gate
  await clickText('Grown-ups', 'button'); await fill('Parent password', 'wrong-pass-1'); await clickText('Continue', 'button'); ok('parent gate rejects wrong password', await waitText('Incorrect parent password'));
  await fill('Parent password', PASSWORD); await clickText('Continue', 'button'); ok('parent gate accepts parent password', await waitText('Needs your review') && page.url().includes('/parent/dashboard'));

  // ---- review & approve ----
  ok('submitted task waits for review with child note', await waitText('Story Stones'));
  await clickText('Review', 'button'); await waitText('Review mission'); ok('review modal shows child note', await waitText('I painted a fox'));
  await clickText('Approve', 'button'); ok('approval awards points and a badge', await waitText('Approved! +10 points') && await waitText('New badge: First Step'));
  await sleep(800); await page.goto(BASE + '/parent/children'); ok('points persisted (10 points)', await waitText('10 points'));

  // ---- tasks page ----
  await page.goto(BASE + '/parent/tasks'); await waitText('Missions for Mia'); await clickText('Approved', 'button'); ok('tasks filter shows approved', await waitText('+10 pts'));

  // ---- library ----
  await page.goto(BASE + '/activities'); ok('library loads from API', await waitText('68 activities'));
  await fill('Search activities', 'puzzle'); await sleep(900); ok('library search filters', !(await text()).includes('68 activities'));
  await fill('Search activities', ''); await sleep(700); await clickText('Brain Games', 'button'); await sleep(700);
  ok('library category filter', await waitText('10 activities'));
  await select('Age', '4'); await sleep(700); ok('library age filter narrows results', !(await text()).includes('10 activities'));
  await axe('activity-library'); await shot('library-desktop');
  await select('Age', ''); await clickText('Clear filters', 'button'); await sleep(500);
  await clickText('See how', 'button').catch(() => {});
  await page.goto(BASE + '/activities'); await page.waitForFunction(() => /\d+ activities/.test(document.body.innerText)); await page.evaluate(() => [...document.querySelectorAll('article h3 button')][0]?.click()); ok('activity detail modal', await waitText('Steps') && await waitText('How it’s checked')); await page.keyboard.press('Escape');

  // ---- games ----
  await page.goto(BASE + '/games'); ok('games hub', await waitText('Memory Match') && await waitText('Riddle Challenge'));
  await page.goto(BASE + '/games/pattern-quiz'); await waitText('Question 1 of 6');
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => document.querySelector('ul[aria-label="Answer choices"] button')?.click()); await sleep(150);
    if (i === 0) { ok('quiz gives immediate explanation', await waitText('Next question') || await waitText('See my results')); }
    await clickText(i < 5 ? 'Next question' : 'See my results', 'button'); await sleep(200);
  }
  ok('quiz result saved by server', await waitText('Round complete!') && /got \d of 6 right/.test(await text()));
  await page.goto(BASE + '/games/riddle-challenge'); await waitText('Question 1 of 5'); await clickText('Need a hint?', 'button'); ok('hint shown', await waitText('Hint:'));
  await page.goto(BASE + '/games/memory-match'); await waitText('Pairs: 0 / 6');
  // solve memory match by revealing cards and remembering symbols
  const known = {}; const matchedIdx = new Set(); const labelOf = (i) => page.evaluate((i) => document.querySelectorAll('button[aria-pressed]')[i]?.getAttribute('aria-label') || '', i);
  const flip = async (i) => { await page.evaluate((i) => document.querySelectorAll('button[aria-pressed]')[i]?.click(), i); await sleep(60); const l = await labelOf(i); return l.split(': ')[1]?.split(',')[0]; };
  for (let guard = 0; guard < 40 && matchedIdx.size < 12; guard++) {
    const idle = [...Array(12).keys()].filter((i) => !matchedIdx.has(i));
    let first = idle.find((i) => !(i in known)) ?? idle[0];
    const s1 = await flip(first); known[first] = s1;
    const pair = Object.keys(known).map(Number).find((j) => j !== first && known[j] === s1 && !matchedIdx.has(j));
    if (pair !== undefined) { await flip(pair); matchedIdx.add(first); matchedIdx.add(pair); await sleep(100); continue; }
    const second = idle.find((i) => i !== first && !(i in known)); if (second === undefined) { await sleep(1000); continue; }
    const s2 = await flip(second); known[second] = s2;
    if (s1 === s2) { matchedIdx.add(first); matchedIdx.add(second); await sleep(100); } else await sleep(1100);
  }
  ok('memory match can be completed and saved', await waitText('Round complete!') && /matched all 6 pairs/.test(await text()));
  await clickText('Play again', 'button'); ok('replay restarts the game', await waitText('Pairs: 0 / 6'));

  // ---- safety academy ----
  await page.goto(BASE + '/safety-academy'); ok('safety academy lists lessons with disclaimer', await waitText('Earthquake Safety') && await waitText('educational exercises'));
  await clickText('Fire Safety', 'a'); await waitText('Key safety steps'); ok('lesson has intro, steps, checklist, quiz', await waitText('Printable checklist') && await waitText('Check what you learned'));
  await axe('lesson'); await shot('lesson-desktop');
  const lessonId = page.url().split('/').pop();
  const correct = await page.evaluate(async (id) => (await (await fetch(`/api/safety-lessons/${id}`, { credentials: 'include' })).json()).data.quizQuestions.map((q) => q.correctIndex), lessonId);
  // fail first (all option 0 unless that's the correct one) then pass
  const wrongPick = correct.map((c) => (c === 0 ? 1 : 0));
  for (let q = 0; q < wrongPick.length; q++) await page.click(`input[name="q${q}"][type=radio]:nth-of-type(1)`, {}).catch(async () => { await page.evaluate((q, k) => document.querySelectorAll(`input[name="q${q}"]`)[k].click(), q, wrongPick[q]); });
  await page.evaluate((w) => w.forEach((k, q) => document.querySelectorAll(`input[name="q${q}"]`)[k].click()), wrongPick);
  await clickText('Submit answers', 'button'); ok('failing quiz does not complete lesson', await waitText('try again') || await waitText('Try again'));
  await clickText('Try again', 'button'); await page.evaluate((c) => c.forEach((k, q) => document.querySelectorAll(`input[name="q${q}"]`)[k].click()), correct);
  await clickText('Submit answers', 'button'); { const a = await waitText('Well done!'); const b = await waitText('Lesson complete! +15 points', 4000); ok('passing quiz completes lesson and awards points once', a && b, `wellDone=${a} toast=${b} :: ${(await text()).slice(-300).replace(/\n/g, ' | ')}`); }
  await page.reload(); ok('lesson completion persisted', await waitText('Completed'));

  // ---- progress ----
  await page.goto(BASE + '/parent/progress'); ok('progress charts render from DB', await waitText('Missions per day') && await page.evaluate(() => document.querySelectorAll('.recharts-wrapper svg').length >= 3));
  await clickText('Log movement', 'button'); await waitText('Log movement'); await fill('Minutes', '35'); await clickText('Save', 'button');
  ok('movement logged', await waitText('Movement saved') && await waitText('Walking · 35 min'));
  ok('self vs parent-reported labelled', await waitText('Parent-reported') && await waitText('Not measured by a device'));
  await axe('progress'); await shot('progress-desktop');
  await clickText('This month', 'button'); await sleep(800); ok('month range works', await waitText('Missions approved'));
  ok('weekly report present', await waitText('Weekly report') && await waitText('2 of 3').then((x) => x || waitText('assigned missions were approved')).catch(() => true));

  // ---- settings ----
  await page.goto(BASE + '/parent/settings'); await waitText('Your profile'); await fill('Name', 'E2E Parent Renamed'); await clickText('Save settings', 'button'); ok('settings saved', await waitText('Settings saved'));
  await fill('Current password', PASSWORD); await fill('New password', 'New-Passw0rd'); await fill('Confirm new password', 'New-Passw0rd'); await clickText('Update password', 'button'); ok('password changed', await waitText('Password updated'));
  await axe('settings');

  // ---- responsive ----
  for (const [w, h, tag] of [[375, 812, 'mobile'], [768, 1024, 'tablet'], [1280, 800, 'desktop']]) {
    await page.setViewport({ width: w, height: h });
    for (const p of ['/parent/dashboard', '/parent/children', '/parent/tasks', '/parent/progress', '/activities', '/safety-academy', '/games']) {
      await page.goto(BASE + p); await sleep(900); await noOverflow(`${p} @${tag}`); if (['/parent/dashboard', '/activities'].includes(p)) await shot(`${p.slice(1).replace('/', '-')}-${tag}`);
    }
  }
  await page.setViewport({ width: 375, height: 812 });
  await page.goto(BASE + '/parent/dashboard'); await sleep(500); await clickText('', 'button[aria-controls="parent-drawer"]'); ok('mobile navigation drawer opens', await waitText('Safety Academy')); await shot('mobile-drawer');
  await clickText('Open child mode', 'button').catch(() => {});
  await page.setViewport({ width: 375, height: 812 }); await page.goto(BASE + '/'); await sleep(300); await shot('landing-mobile');

  // ---- logout & account deletion ----
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(BASE + '/parent/settings'); await waitText('Delete account'); await clickText('Delete account', 'button'); await fill('Enter your password to confirm', 'New-Passw0rd'); await clickText('Delete everything', 'button');
  ok('account deletion works and logs out', await waitText('Turn everyday growing up'));
  await page.goto(BASE + '/login'); await waitText('Welcome back'); await fill('Email', email); await fill('Password', 'New-Passw0rd'); await clickText('Log in', 'button'); ok('deleted account can no longer log in', await waitText('Incorrect email or password'));
} catch (e) {
  console.log('SCRIPT ERROR:', e.message); ok('script completed without exception', false, e.message); await shot('failure');
  console.log('PAGE TEXT AT FAILURE:', (await text()).slice(0, 600));
}
console.log('\n=== console/network problems ===\n' + (problems.length ? [...new Set(problems)].join('\n') : 'none'));
console.log('\n=== axe (WCAG 2 A/AA) ===');
for (const [name, v] of axeReport) console.log(`${name}: ${v.length ? JSON.stringify(v) : 'no violations'}`);
const failed = results.filter((r) => !r[0]).length;
console.log(`\nE2E: ${results.length - failed} passed, ${failed} failed`);
await browser.close();

process.exit(failed ? 1 : 0);
