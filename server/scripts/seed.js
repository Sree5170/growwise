// Usage: npm run seed            -> content (activities, safety lessons) + fictional demo accounts
//        npm run seed -- --demo  -> also adds demo progress history for the demo child (clearly fictional)
//        npm run seed -- --reset -> wipes ALL collections first (development only)
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Activity } from '../src/modules/activities/activity.model.js';
import { SafetyLesson } from '../src/modules/safetyAcademy/safetyLesson.model.js';
import { LessonProgress } from '../src/modules/safetyAcademy/lessonProgress.model.js';
import { User } from '../src/modules/auth/user.model.js';
import { Child } from '../src/modules/children/child.model.js';
import { AssignedTask } from '../src/modules/tasks/task.model.js';
import { PhysicalActivityRecord } from '../src/modules/physicalActivity/physicalActivity.model.js';
import { GameAttempt } from '../src/modules/games/gameAttempt.model.js';
import { Reward } from '../src/modules/rewards/reward.model.js';
import { hashPassword } from '../src/modules/auth/auth.service.js';
import { evaluateBadges } from '../src/modules/rewards/rewards.service.js';
import { allActivities } from './seedData/activities.js';
import { safetyLessons } from './seedData/safetyLessons.js';
import { addDays, startOfDay } from '../src/utils/dates.js';

const args = new Set(process.argv.slice(2));
if (env.isProd && !args.has('--force-prod')) { console.error('Refusing to seed in production without --force-prod'); process.exit(1); }
if (env.isProd && args.has('--reset')) { console.error('--reset is never allowed in production'); process.exit(1); }

await connectDb();
if (args.has('--reset')) {
  for (const M of [Reward, LessonProgress, GameAttempt, PhysicalActivityRecord, AssignedTask, Child, User, Activity, SafetyLesson]) await M.deleteMany({});
  console.log('All collections cleared.');
}

// Idempotent upserts keyed by title / slug
for (const a of allActivities) await Activity.updateOne({ title: a.title }, { $set: a }, { upsert: true });
const now = new Date();
for (const l of safetyLessons) await SafetyLesson.updateOne({ slug: l.slug }, { $set: { ...l, reviewedAt: now } }, { upsert: true });
console.log(`Activities: ${await Activity.countDocuments()}  Safety lessons: ${await SafetyLesson.countDocuments()}`);

// Fictional demo accounts. Password comes from SEED_DEMO_PASSWORD or is generated and printed once.
let password = process.env.SEED_DEMO_PASSWORD;
let generated = false;
if (!password) { password = `Gw-${crypto.randomBytes(6).toString('hex')}9`; generated = true; }
const hash = await hashPassword(password);
const ensureUser = async (name, email, role) => {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, role, passwordHash: hash });
};
const parent = await ensureUser('Demo Parent', 'demo.parent@growwise.test', 'parent');
await ensureUser('Demo Admin', 'demo.admin@growwise.test', 'admin');
if (!(await Child.exists({ parentId: parent._id }))) {
  await Child.create({ parentId: parent._id, displayName: 'Mia', ageGroup: '6-8', interests: ['art', 'animals', 'nature'], goals: ['move-more', 'creativity'], avatar: 'fox',
    preferences: { availableMinutes: 30, preferredCategories: ['creativity', 'outdoor'], materialsAvailable: ['paper', 'crayons', 'blanket', 'markers'], hasOutdoorSpace: true, adultAvailable: true } });
  await Child.create({ parentId: parent._id, displayName: 'Arjun', ageGroup: '13-17', interests: ['sports', 'music', 'puzzles'], goals: ['logical-thinking', 'life-skills'], avatar: 'comet',
    preferences: { availableMinutes: 45, preferredCategories: ['brain-games', 'physical'], materialsAvailable: ['mat', 'music player', 'paper', 'pencil'], hasOutdoorSpace: false, adultAvailable: true } });
}

if (args.has('--demo')) {
  const mia = await Child.findOne({ parentId: parent._id, displayName: 'Mia' });
  if (await AssignedTask.exists({ childId: mia._id })) console.log('Demo history already present; skipping.');
  else {
    const acts = await Activity.find({ minimumAge: { $lte: 8 }, maximumAge: { $gte: 6 }, isPublished: true });
    const pick = (cat, n) => acts.filter((a) => a.category === cat).slice(0, n);
    const chosen = [...pick('physical', 2), ...pick('creativity', 3), ...pick('outdoor', 2), ...pick('life-skills', 1), ...pick('disaster-preparedness', 1)];
    let i = 0;
    for (const a of chosen) {
      const day = addDays(startOfDay(now), -(i % 6));
      const status = i < 6 ? 'approved' : i === 6 ? 'submitted' : 'assigned';
      await AssignedTask.create({ childId: mia._id, parentId: parent._id, activityId: a._id, scheduledDate: day, dueDate: addDays(day, 1), status,
        ...(status !== 'assigned' ? { submittedAt: day } : {}), ...(status === 'approved' ? { verifiedAt: day, verifiedBy: parent._id, pointsAwarded: a.points } : {}) });
      i++;
    }
    for (let d = 0; d < 5; d++) await PhysicalActivityRecord.create({ childId: mia._id, parentId: parent._id, activityType: ['walking', 'playground-play', 'dance', 'cycling', 'yoga-stretching'][d], durationMinutes: 20 + d * 5, activityDate: addDays(startOfDay(now), -d), verificationStatus: d % 2 ? 'self-reported' : 'parent-verified', recordedBy: d % 2 ? 'child' : 'parent' });
    for (const [t, s, n] of [['pattern-quiz', 4, 6], ['riddle-challenge', 3, 5], ['memory-match', 6, 6]]) await GameAttempt.create({ childId: mia._id, gameType: t, score: s, totalQuestions: n, durationSeconds: 90, moves: t === 'memory-match' ? 11 : undefined });
    const lesson = await SafetyLesson.findOne({ slug: 'fire-safety' });
    await LessonProgress.create({ childId: mia._id, lessonId: lesson._id, quizScore: 3, totalQuestions: 4, pointsAwarded: lesson.points });
    await evaluateBadges(mia._id);
    console.log('Demo history added for the fictional child "Mia" (clearly demo data).');
  }
}

console.log('\nFictional demo accounts (development only):');
console.log('  Parent: demo.parent@growwise.test');
console.log('  Admin : demo.admin@growwise.test');
if (generated) console.log(`  Password (generated this run; existing accounts keep their old password): ${password}`);
else console.log('  Password: value of SEED_DEMO_PASSWORD');
await disconnectDb();
