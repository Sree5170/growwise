import { forbidden } from '../utils/AppError.js';

// Roles: 'parent', 'admin' (account roles) and 'child' (child-mode session locked to one child)
export const authorizeRole = (...roles) => (req, _res, next) =>
  roles.includes(req.auth?.role) ? next() : next(forbidden('Your account type cannot perform this action'));
