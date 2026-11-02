import mongoose from 'mongoose';
import { TASK_STATUSES } from '../../utils/constants.js';

const { ObjectId } = mongoose.Schema.Types;
const taskSchema = new mongoose.Schema({
  childId: { type: ObjectId, ref: 'Child', required: true, index: true },
  parentId: { type: ObjectId, ref: 'User', required: true, index: true },
  activityId: { type: ObjectId, ref: 'Activity', required: true },
  scheduledDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: TASK_STATUSES, default: 'assigned', index: true },
  childNote: { type: String, maxlength: 300, default: '' },
  parentNote: { type: String, maxlength: 300, default: '' },
  submittedAt: Date,
  verifiedAt: Date,
  verifiedBy: { type: ObjectId, ref: 'User' },
  pointsAwarded: { type: Number, default: 0, min: 0 },
  minutesSpent: { type: Number, min: 0, max: 480 }, // optional self-report on submit
}, { timestamps: true });

taskSchema.index({ childId: 1, scheduledDate: 1 });
taskSchema.index({ parentId: 1, status: 1 });
taskSchema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const AssignedTask = mongoose.model('AssignedTask', taskSchema);
