import { env } from '../config/env.js';

export const notFoundHandler = (req, res) =>
  res.status(404).json({ success: false, error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });

export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.expose ? err.message : 'Something went wrong. Please try again.';
  let details = err.details;

  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  if (err.name === 'ValidationError') { status = 422; message = 'Validation failed'; details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })); }
  if (err.code === 11000) { status = 409; message = 'That record already exists'; }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON body'; }
  if (err.type === 'entity.too.large') { status = 413; message = 'Request body too large'; }

  if (status >= 500 && !env.isTest) console.error(err);
  res.status(status).json({ success: false, error: { message, ...(details ? { details } : {}) } });
}
