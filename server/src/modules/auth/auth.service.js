import bcrypt from 'bcryptjs';
import { User } from './user.model.js';
import { conflict, unauthorized } from '../../utils/AppError.js';

const ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 11;
export const hashPassword = (p) => bcrypt.hash(p, ROUNDS);

// Role is NEVER taken from the request: public registration always creates a parent.
export async function registerParent({ name, email, password }) {
  if (await User.exists({ email })) throw conflict('An account with this email already exists');
  return User.create({ name, email, passwordHash: await hashPassword(password), role: 'parent' });
}

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 4);
export async function verifyCredentials(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH); // constant-ish time
  if (!user || !valid) throw unauthorized('Incorrect email or password');
  return user;
}

export async function checkPassword(userId, password) {
  const user = await User.findById(userId).select('+passwordHash');
  return !!user && bcrypt.compare(password, user.passwordHash);
}
