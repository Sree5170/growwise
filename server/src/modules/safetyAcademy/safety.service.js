import { SafetyLesson } from './safetyLesson.model.js';
import { LessonProgress } from './lessonProgress.model.js';
import { badRequest, notFound } from '../../utils/AppError.js';
import { evaluateBadges, getPoints } from '../rewards/rewards.service.js';

export const PASS_RATIO = 0.6;

export async function listLessons(child) {
  const lessons = await SafetyLesson.find({ isPublished: true, ...(child ? { ageGroups: child.ageGroup } : {}) }).select('-quizQuestions -lessonContent').sort({ createdAt: 1 }).lean();
  const progress = child ? await LessonProgress.find({ childId: child._id }).lean() : [];
  const by = Object.fromEntries(progress.map((p) => [String(p.lessonId), p]));
  return lessons.map((l) => ({ ...l, completed: !!by[String(l._id)], quizScore: by[String(l._id)]?.quizScore ?? null, totalQuestions: by[String(l._id)]?.totalQuestions ?? null }));
}

export async function getLesson(id, child) {
  const lesson = await SafetyLesson.findOne({ _id: id, isPublished: true }).lean();
  if (!lesson) throw notFound('Lesson not found');
  const progress = child ? await LessonProgress.findOne({ childId: child._id, lessonId: id }).lean() : null;
  return { ...lesson, completed: !!progress, quizScore: progress?.quizScore ?? null };
}

// Score is computed on the server from the lesson's own quiz. Points are awarded once per child per lesson.
export async function completeLesson(child, lessonId, answers) {
  const lesson = await SafetyLesson.findOne({ _id: lessonId, isPublished: true });
  if (!lesson) throw notFound('Lesson not found');
  const total = lesson.quizQuestions.length;
  const seen = new Set(); let score = 0;
  for (const a of answers) {
    if (a.questionIndex >= total || seen.has(a.questionIndex)) throw badRequest('Invalid quiz answers');
    seen.add(a.questionIndex);
    if (lesson.quizQuestions[a.questionIndex].correctIndex === a.selectedIndex) score++;
  }
  if (seen.size !== total) throw badRequest('Please answer every question');
  const passed = total === 0 || score / total >= PASS_RATIO;
  let firstCompletion = false;
  if (passed) {
    const existing = await LessonProgress.findOne({ childId: child._id, lessonId });
    if (existing) {
      if (score > existing.quizScore) { existing.quizScore = score; await existing.save(); }
    } else {
      try { await LessonProgress.create({ childId: child._id, lessonId, quizScore: score, totalQuestions: total, pointsAwarded: lesson.points }); firstCompletion = true; }
      catch (e) { if (e.code !== 11000) throw e; } // lost a race with a duplicate request: no second award
    }
  }
  const newBadges = passed ? await evaluateBadges(child._id) : [];
  return { passed, score, totalQuestions: total, passMark: PASS_RATIO, pointsAwarded: firstCompletion ? lesson.points : 0, firstCompletion, newBadges, points: await getPoints(child._id) };
}
