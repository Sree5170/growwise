import { AssignedTask } from '../tasks/task.model.js';
import { Activity } from '../activities/activity.model.js';
import { PhysicalActivityRecord } from '../physicalActivity/physicalActivity.model.js';
import { GameAttempt } from '../games/gameAttempt.model.js';
import { LessonProgress } from '../safetyAcademy/lessonProgress.model.js';
import { SafetyLesson } from '../safetyAcademy/safetyLesson.model.js';
import { Reward } from './reward.model.js';
import { BADGES, BADGE_MAP, badgeView } from './badges.js';
import { startOfWeek, dayKey } from '../../utils/dates.js';

export const LEVELS = ['Seedling', 'Explorer', 'Trailblazer', 'Adventurer', 'Pathfinder', 'Navigator', 'Champion', 'Legend'];
export const POINTS_PER_LEVEL = 50;

export function levelInfo(points) {
  const index = Math.floor(points / POINTS_PER_LEVEL);
  const level = index + 1;
  return {
    level, name: LEVELS[Math.min(index, LEVELS.length - 1)],
    pointsIntoLevel: points % POINTS_PER_LEVEL, pointsForNextLevel: POINTS_PER_LEVEL,
  };
}

// Points are DERIVED from the immutable award records, so they can never drift or be double counted.
export async function getPoints(childId) {
  const [tasks, lessons] = await Promise.all([
    AssignedTask.find({ childId, status: 'approved' }).select('pointsAwarded'),
    LessonProgress.find({ childId }).select('pointsAwarded'),
  ]);
  const total = tasks.reduce((s, t) => s + (t.pointsAwarded || 0), 0) + lessons.reduce((s, l) => s + (l.pointsAwarded || 0), 0);
  return { total, ...levelInfo(total) };
}

export async function collectStats(childId) {
  const [approved, records, attempts, lessons, totalLessons] = await Promise.all([
    AssignedTask.find({ childId, status: 'approved' }).select('activityId verifiedAt'),
    PhysicalActivityRecord.find({ childId }).select('durationMinutes activityDate'),
    GameAttempt.find({ childId }).select('gameType'),
    LessonProgress.countDocuments({ childId }),
    SafetyLesson.countDocuments({ isPublished: true }),
  ]);
  const acts = await Activity.find({ _id: { $in: approved.map((t) => t.activityId) } }).select('category');
  const catById = Object.fromEntries(acts.map((a) => [String(a._id), a.category]));
  const approvedByCategory = {};
  for (const t of approved) { const c = catById[String(t.activityId)]; if (c) approvedByCategory[c] = (approvedByCategory[c] || 0) + 1; }
  const weekTotals = {};
  for (const r of records) { const k = dayKey(startOfWeek(r.activityDate)); weekTotals[k] = (weekTotals[k] || 0) + r.durationMinutes; }
  return {
    approvedTotal: approved.length,
    approvedDays: new Set(approved.filter((t) => t.verifiedAt).map((t) => dayKey(t.verifiedAt))).size,
    approvedByCategory,
    bestWeekMinutes: Math.max(0, ...Object.values(weekTotals)),
    gameAttempts: attempts.length,
    gameTypesPlayed: new Set(attempts.map((a) => a.gameType)).size,
    lessonsCompleted: lessons,
    totalLessons,
  };
}

// Idempotent: the unique (childId, badgeId) index guarantees a badge is stored once, even under races.
export async function evaluateBadges(childId) {
  const stats = await collectStats(childId);
  const have = new Set((await Reward.find({ childId }).select('badgeId')).map((r) => r.badgeId));
  const earned = [];
  for (const b of BADGES) {
    if (have.has(b.id) || !b.rule(stats)) continue;
    try { await Reward.create({ childId, badgeId: b.id }); earned.push(badgeView(b)); }
    catch (e) { if (e.code !== 11000) throw e; }
  }
  return earned;
}

export async function listBadges(childId) {
  const rewards = await Reward.find({ childId });
  const byId = Object.fromEntries(rewards.map((r) => [r.badgeId, r.earnedAt]));
  return BADGES.map((b) => ({ ...badgeView(b), earned: !!byId[b.id], earnedAt: byId[b.id] || null }));
}
export { BADGE_MAP };
