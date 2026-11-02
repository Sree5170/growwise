import mongoose from 'mongoose';
import { GAME_TYPES } from '../../utils/constants.js';

const schema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
  gameType: { type: String, enum: GAME_TYPES, required: true },
  score: { type: Number, required: true, min: 0 },
  totalQuestions: { type: Number, required: true, min: 1 },
  durationSeconds: { type: Number, default: 0, min: 0, max: 7200 },
  hintsUsed: { type: Number, default: 0, min: 0 },
  moves: { type: Number, min: 0 }, // memory match only
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
schema.index({ childId: 1, gameType: 1, completedAt: -1 });
schema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });
export const GameAttempt = mongoose.model('GameAttempt', schema);
