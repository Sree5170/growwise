import mongoose from 'mongoose';
import { CATEGORIES, DIFFICULTIES, COMPLETION_METHODS } from '../../utils/constants.js';

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 600 },
  category: { type: String, enum: CATEGORIES, required: true, index: true },
  minimumAge: { type: Number, required: true, min: 3, max: 17 },
  maximumAge: { type: Number, required: true, min: 3, max: 17 },
  durationMinutes: { type: Number, required: true, min: 1, max: 480 },
  difficulty: { type: String, enum: DIFFICULTIES, default: 'easy' },
  materials: { type: [String], default: [] },
  instructions: { type: [String], validate: [(v) => v.length > 0, 'At least one instruction step is required'] },
  safetyNotes: { type: [String], default: [] },
  requiresAdultSupervision: { type: Boolean, default: false },
  completionMethod: { type: String, enum: COMPLETION_METHODS, default: 'parent-verified' },
  points: { type: Number, required: true, min: 1, max: 100 },
  tags: { type: [String], default: [] }, // match child interests
  isIndoor: { type: Boolean, default: true },
  needsOutdoorSpace: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true, index: true },
}, { timestamps: true });

activitySchema.pre('validate', function (next) {
  if (this.minimumAge > this.maximumAge) return next(new Error('minimumAge cannot be greater than maximumAge'));
  next();
});
activitySchema.index({ category: 1, minimumAge: 1, maximumAge: 1 });
activitySchema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const Activity = mongoose.model('Activity', activitySchema);
