import { Child } from './child.model.js';
import { AssignedTask } from '../tasks/task.model.js';
import { PhysicalActivityRecord } from '../physicalActivity/physicalActivity.model.js';
import { GameAttempt } from '../games/gameAttempt.model.js';
import { LessonProgress } from '../safetyAcademy/lessonProgress.model.js';
import { Reward } from '../rewards/reward.model.js';
import { badRequest } from '../../utils/AppError.js';

const MAX_CHILDREN = 8;

export async function createChild(parentId, data) {
  if ((await Child.countDocuments({ parentId })) >= MAX_CHILDREN) throw badRequest(`You can add up to ${MAX_CHILDREN} child profiles`);
  return Child.create({ ...data, parentId });
}

export async function updateChild(child, data) {
  const { preferences, accessibilityPreferences, ...rest } = data;
  Object.assign(child, rest);
  if (preferences) Object.assign(child.preferences, preferences);
  if (accessibilityPreferences) Object.assign(child.accessibilityPreferences, accessibilityPreferences);
  child.markModified('preferences');
  await child.save();
  return child;
}

// Full data deletion for a child (parent's right to delete).
export async function deleteChildCascade(childId) {
  const filter = { childId };
  await Promise.all([
    AssignedTask.deleteMany(filter), PhysicalActivityRecord.deleteMany(filter), GameAttempt.deleteMany(filter),
    LessonProgress.deleteMany(filter), Reward.deleteMany(filter),
  ]);
  await Child.deleteOne({ _id: childId });
}
