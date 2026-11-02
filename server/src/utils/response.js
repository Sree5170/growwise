export const ok = (res, data, status = 200, meta) => res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
export const parsePaging = (q, max = 50) => {
  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(q.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};
