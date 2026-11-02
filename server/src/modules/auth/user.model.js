import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['parent', 'admin'], default: 'parent', required: true },
  notificationPreferences: {
    dailyReminder: { type: Boolean, default: true },
    reminderTime: { type: String, default: '17:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    weeklyReport: { type: Boolean, default: true },
    verificationAlerts: { type: Boolean, default: true },
  },
  privacySettings: {
    hideChildNotesInReports: { type: Boolean, default: false },
  },
}, { timestamps: true });

userSchema.set('toJSON', { transform: (_d, ret) => { delete ret.passwordHash; delete ret.__v; return ret; } });
export const User = mongoose.model('User', userSchema);
