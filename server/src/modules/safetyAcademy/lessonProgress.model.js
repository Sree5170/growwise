import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;
const schema = new mongoose.Schema({
  childId: { type: ObjectId, ref: 'Child', required: true },
  lessonId: { type: ObjectId, ref: 'SafetyLesson', required: true },
  quizScore: { type: Number, required: true, min: 0 },
  totalQuestions: { type: Number, required: true, min: 0 },
  pointsAwarded: { type: Number, default: 0, min: 0 },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ childId: 1, lessonId: 1 }, { unique: true }); // one row per lesson => points awarded once
schema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const LessonProgress = mongoose.model('LessonProgress', schema);
