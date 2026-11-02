import { AppError } from '../utils/AppError.js';

// validate({ body, query, params }) with zod schemas; parsed values replace originals.
export const validate = (schemas) => (req, _res, next) => {
  for (const part of ['body', 'query', 'params']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(new AppError(422, 'Please check the highlighted fields', details));
    }
    if (part === 'query') { req.validQuery = result.data; } else { req[part] = result.data; }
  }
  next();
};
