import mongoose from 'mongoose';
import { AGE_GROUPS, HAZARD_TYPES } from '../../utils/constants.js';

const quizQuestion = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], validate: [(v) => v.length >= 2 && v.length <= 5, '2-5 options'] },
  correctIndex: { type: Number, required: true, min: 0 },
  explanation: { type: String, required: true },
}, { _id: false });

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  hazardType: { type: String, enum: HAZARD_TYPES, required: true },
  ageGroups: { type: [{ type: String, enum: AGE_GROUPS }], default: AGE_GROUPS },
  emoji: { type: String, default: '🛟' },
  introduction: { type: String, required: true },
  learningObjectives: { type: [String], default: [] },
  lessonContent: { type: [{ heading: String, body: String }], default: [], _id: false },
  safetySteps: { type: [String], default: [] },
  checklist: { type: [String], default: [] }, // printable
  parentPractice: { type: [String], default: [] }, // supervised practice activities
  quizQuestions: { type: [quizQuestion], default: [] },
  sourceReferences: { type: [{ name: String, note: String }], default: [], _id: false },
  points: { type: Number, default: 15, min: 0, max: 100 },
  reviewedAt: Date,
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });
schema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const SafetyLesson = mongoose.model('SafetyLesson', schema);
