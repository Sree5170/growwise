import { AssignedTask } from '../tasks/task.model.js';
import { Activity } from '../activities/activity.model.js';
import { PhysicalActivityRecord } from '../physicalActivity/physicalActivity.model.js';
import { GameAttempt } from '../games/gameAttempt.model.js';
import { LessonProgress } from '../safetyAcademy/lessonProgress.model.js';
import { SafetyLesson } from '../safetyAcademy/safetyLesson.model.js';
import { Reward } from '../rewards/reward.model.js';
import { summarize } from '../physicalActivity/physicalActivity.service.js';
import { getPoints, listBadges } from '../rewards/rewards.service.js';
import { CATEGORIES, CATEGORY_LABELS } from '../../utils/constants.js';
import { startOfDay, endOfDay, startOfWeek, addDays, dayKey } from '../../utils/dates.js';

export function rangeBounds(range = 'week', now = new Date()) {
  if (range === 'day') return { from: startOfDay(now), to: endOfDay(now) };
  if (range === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  const from = startOfWeek(now); return { from, to: endOfDay(addDays(from, 6)) };
}

const inRange = (d, from, to) => d && d >= from && d <= to;

// Longest run of consecutive active days. Informational only: nothing is lost or "reset" for missing a day.
export function longestRun(dayKeys) {
  const days = [...new Set(dayKeys)].sort();
  let best = 0; let run = 0; let prev = null;
  for (const k of days) {
    const d = new Date(`${k}T00:00:00`);
    run = prev && Math.round((d - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}

export async function buildProgress(child, range = 'week', now = new Date()) {
  const { from, to } = rangeBounds(range, now);
  const trendFrom = addDays(startOfWeek(now), -7 * 7); // 8 weeks incl. current
  const [tasks, records, attempts, lessonProgress, lessons, badges, points] = await Promise.all([
    AssignedTask.find({ childId: child._id, scheduledDate: { $gte: trendFrom, $lte: addDays(to, 0) } }).lean(),
    PhysicalActivityRecord.find({ childId: child._id, activityDate: { $gte: trendFrom } }).lean(),
    GameAttempt.find({ childId: child._id, completedAt: { $gte: trendFrom } }).lean(),
    LessonProgress.find({ childId: child._id }).lean(),
    SafetyLesson.find({ isPublished: true }).select('title hazardType emoji').lean(),
    Reward.find({ childId: child._id }).lean(),
    getPoints(child._id),
  ]);
  const acts = await Activity.find({ _id: { $in: [...new Set(tasks.map((t) => String(t.activityId)))] } }).select('category durationMinutes title').lean();
  const actById = Object.fromEntries(acts.map((a) => [String(a._id), a]));

  const windowTasks = tasks.filter((t) => inRange(t.scheduledDate, from, to) && t.status !== 'cancelled');
  const approved = windowTasks.filter((t) => t.status === 'approved');
  const countBy = (s) => windowTasks.filter((t) => t.status === s).length;

  const catMap = Object.fromEntries(CATEGORIES.map((c) => [c, { category: c, label: CATEGORY_LABELS[c], minutes: 0, approved: 0 }]));
  for (const t of tasks.filter((x) => x.status === 'approved' && inRange(x.verifiedAt, from, to))) {
    const a = actById[String(t.activityId)]; if (!a) continue;
    catMap[a.category].approved += 1; catMap[a.category].minutes += t.minutesSpent ?? a.durationMinutes;
  }
  const byCategory = Object.values(catMap);

  const windowRecords = records.filter((r) => inRange(r.activityDate, from, to));
  const windowAttempts = attempts.filter((a) => inRange(a.completedAt, from, to));
  const gameTypes = ['memory-match', 'pattern-quiz', 'riddle-challenge'];
  const byGame = gameTypes.map((g) => {
    const mine = windowAttempts.filter((a) => a.gameType === g);
    return { gameType: g, attempts: mine.length, averagePercent: mine.length ? Math.round(mine.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / mine.length) : null };
  });

  // daily series across the window
  const days = []; for (let d = new Date(from); d <= to; d = addDays(d, 1)) days.push(new Date(d));
  const daily = days.map((d) => {
    const k = dayKey(d);
    return {
      date: k,
      assigned: windowTasks.filter((t) => dayKey(t.scheduledDate) === k).length,
      approved: approved.filter((t) => dayKey(t.scheduledDate) === k).length,
      physicalMinutes: windowRecords.filter((r) => dayKey(r.activityDate) === k).reduce((s, r) => s + r.durationMinutes, 0),
      games: windowAttempts.filter((a) => dayKey(a.completedAt) === k).length,
    };
  });

  const weeklyTrend = [];
  for (let i = 7; i >= 0; i--) {
    const ws = addDays(startOfWeek(now), -7 * i); const we = endOfDay(addDays(ws, 6));
    const wt = tasks.filter((t) => inRange(t.scheduledDate, ws, we) && t.status !== 'cancelled');
    weeklyTrend.push({
      weekStart: dayKey(ws), assigned: wt.length, approved: wt.filter((t) => t.status === 'approved').length,
      physicalMinutes: records.filter((r) => inRange(r.activityDate, ws, we)).reduce((s, r) => s + r.durationMinutes, 0),
      games: attempts.filter((a) => inRange(a.completedAt, ws, we)).length,
    });
  }

  const activeKeys = [
    ...tasks.filter((t) => t.status === 'approved' && t.verifiedAt).map((t) => dayKey(t.verifiedAt)),
    ...records.map((r) => dayKey(r.activityDate)), ...attempts.map((a) => dayKey(a.completedAt)),
  ];
  const doneLessons = new Set(lessonProgress.map((l) => String(l.lessonId)));
  const hasData = tasks.length + records.length + attempts.length + lessonProgress.length > 0;

  return {
    range, from, to, hasData, points,
    tasks: {
      assigned: windowTasks.length, approved: approved.length, submitted: countBy('submitted'), needsRevision: countBy('needs-revision'), open: countBy('assigned'),
      approvalRate: windowTasks.length ? Math.round((approved.length / windowTasks.length) * 100) : null,
    },
    byCategory,
    physical: { ...summarize(windowRecords), recordCount: windowRecords.length, weeklyGoalMinutes: child.weeklyGoalMinutes,
      note: 'Self-reported by a child or reported by a parent. Not device-measured and not a medical health measure.' },
    games: { attempts: windowAttempts.length, byGame },
    safety: { completed: lessons.filter((l) => doneLessons.has(String(l._id))).length, total: lessons.length,
      lessons: lessons.map((l) => ({ id: l._id, title: l.title, emoji: l.emoji, completed: doneLessons.has(String(l._id)) })) },
    creativeAndLifeSkills: { creativity: catMap.creativity.approved, lifeSkills: catMap['life-skills'].approved },
    streak: { activeDaysInRange: new Set(activeKeys.filter((k) => k >= dayKey(from) && k <= dayKey(to))).size, longestRunDays: longestRun(activeKeys),
      note: 'Streaks are for encouragement only. Missing a day never removes points or badges.' },
    daily, weeklyTrend, badgesEarned: badges.length,
  };
}

// Compact numbers for dashboards (parent + child)
export async function getChildSummary(child, now = new Date()) {
  const wk = rangeBounds('week', now); const day = rangeBounds('day', now);
  const [todayTasks, weekRecords, weekAttempts, weekApproved, points, badges] = await Promise.all([
    AssignedTask.find({ childId: child._id, scheduledDate: { $gte: day.from, $lte: day.to }, status: { $ne: 'cancelled' } }).lean(),
    PhysicalActivityRecord.find({ childId: child._id, activityDate: { $gte: wk.from, $lte: wk.to } }).lean(),
    GameAttempt.countDocuments({ childId: child._id, completedAt: { $gte: wk.from, $lte: wk.to } }),
    AssignedTask.countDocuments({ childId: child._id, status: 'approved', verifiedAt: { $gte: wk.from, $lte: wk.to } }),
    getPoints(child._id), listBadges(child._id),
  ]);
  const done = todayTasks.filter((t) => t.status === 'approved' || t.status === 'submitted').length;
  return {
    points,
    today: { total: todayTasks.length, done, approved: todayTasks.filter((t) => t.status === 'approved').length, percent: todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0 },
    week: {
      physicalMinutes: weekRecords.reduce((s, r) => s + r.durationMinutes, 0), goalMinutes: child.weeklyGoalMinutes,
      approvedTasks: weekApproved, goalTasks: child.weeklyGoalTasks, gameAttempts: weekAttempts,
      // screen-free = approved offline missions + logged movement sessions (definition shown in the UI)
      screenFreeActivities: weekApproved + weekRecords.length,
    },
    badges: { earned: badges.filter((b) => b.earned).length, total: badges.length },
  };
}
