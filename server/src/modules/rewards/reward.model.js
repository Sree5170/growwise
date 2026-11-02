import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  badgeId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ childId: 1, badgeId: 1 }, { unique: true }); // a badge is earned once
schema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const Reward = mongoose.model('Reward', schema);
