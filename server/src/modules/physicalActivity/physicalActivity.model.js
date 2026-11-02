import mongoose from 'mongoose';
import { PHYSICAL_TYPES } from '../../utils/constants.js';

const { ObjectId } = mongoose.Schema.Types;
const schema = new mongoose.Schema({
  childId: { type: ObjectId, ref: 'Child', required: true, index: true },
  parentId: { type: ObjectId, ref: 'User', required: true },
  activityType: { type: String, enum: PHYSICAL_TYPES, required: true },
  durationMinutes: { type: Number, required: true, min: 1, max: 600 },
  activityDate: { type: Date, required: true },
  // Always manual: 'self-reported' (child) or 'parent-verified'. Nothing is device-measured.
  verificationStatus: { type: String, enum: ['self-reported', 'parent-verified'], default: 'self-reported' },
  recordedBy: { type: String, enum: ['parent', 'child'], required: true },
  note: { type: String, maxlength: 200, default: '' },
}, { timestamps: true });
schema.index({ childId: 1, activityDate: -1 });
schema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const PhysicalActivityRecord = mongoose.model('PhysicalActivityRecord', schema);
