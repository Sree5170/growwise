import mongoose from 'mongoose';
import { AGE_GROUPS, CATEGORIES, GOALS, INTERESTS } from '../../utils/constants.js';

const childSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  displayName: { type: String, required: true, trim: true, minlength: 1, maxlength: 30 }, // nickname only
  ageGroup: { type: String, enum: AGE_GROUPS, required: true },
  interests: { type: [{ type: String, enum: INTERESTS }], default: [] },
  goals: { type: [{ type: String, enum: GOALS }], default: [] },
  avatar: { type: String, default: 'sprout', maxlength: 20 }, // preset icon key, never a photo
  preferences: {
    availableMinutes: { type: Number, default: 30, min: 5, max: 240 },
    preferredCategories: { type: [{ type: String, enum: CATEGORIES }], default: [] },
    materialsAvailable: { type: [{ type: String, maxlength: 40 }], default: [] },
    hasOutdoorSpace: { type: Boolean, default: true },
    adultAvailable: { type: Boolean, default: true },
  },
  weeklyGoalMinutes: { type: Number, default: 150, min: 0, max: 2000 },
  weeklyGoalTasks: { type: Number, default: 5, min: 0, max: 50 },
  accessibilityPreferences: {
    largeText: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false },
  },
}, { timestamps: true });

childSchema.index({ parentId: 1, displayName: 1 });
childSchema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const Child = mongoose.model('Child', childSchema);
