import { buildProgress } from '../progress/progress.service.js';
import { AssignedTask } from '../tasks/task.model.js';
import { addDays } from '../../utils/dates.js';

const diff = (now, prev) => ({ now, previous: prev, change: now - prev });

// Narrative lines are generated ONLY from stored numbers. Nothing is invented when there is no data.
export async function buildWeeklyReport(child, parent, now = new Date()) {
  const cur = await buildProgress(child, 'week', now);
  const prev = await buildProgress(child, 'week', addDays(now, -7));
  const highlights = [];
  if (cur.tasks.approved > 0) highlights.push(`${cur.tasks.approved} of ${cur.tasks.assigned} assigned missions were approved.`);
  if (cur.physical.totalMinutes > 0) highlights.push(`${cur.physical.totalMinutes} minutes of movement were logged (${cur.physical.parentVerifiedMinutes} parent-reported, ${cur.physical.selfReportedMinutes} child-reported).`);
  if (cur.games.attempts > 0) highlights.push(`${cur.games.attempts} brain game ${cur.games.attempts === 1 ? 'round was' : 'rounds were'} played.`);
  const newLessons = cur.safety.completed;
  if (cur.safety.total) highlights.push(`${newLessons} of ${cur.safety.total} safety lessons completed so far.`);
  // Child-written notes are included only if the parent has not chosen to hide them.
  let childNotes = [];
  if (!parent?.privacySettings?.hideChildNotesInReports) {
    const noted = await AssignedTask.find({ childId: child._id, scheduledDate: { $gte: cur.from, $lte: cur.to }, childNote: { $ne: '' } }).sort({ submittedAt: -1 }).limit(5).select('childNote');
    childNotes = noted.map((t) => t.childNote);
  }
  const goalMet = child.weeklyGoalMinutes > 0 && cur.physical.totalMinutes >= child.weeklyGoalMinutes;
  if (goalMet) highlights.push('The weekly movement goal was reached.');
  return {
    child: { id: child._id, displayName: child.displayName, ageGroup: child.ageGroup },
    from: cur.from, to: cur.to, hasData: cur.hasData, highlights, childNotes,
    comparison: {
      approvedTasks: diff(cur.tasks.approved, prev.tasks.approved),
      physicalMinutes: diff(cur.physical.totalMinutes, prev.physical.totalMinutes),
      gameAttempts: diff(cur.games.attempts, prev.games.attempts),
    },
    progress: cur,
    disclaimer: 'Physical activity time is reported manually and is not a medical measurement. Game scores show practice, not intelligence.',
  };
}
