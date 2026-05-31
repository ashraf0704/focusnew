import rateLimit from 'express-rate-limit';

const keyGenerator = (req: any) => req.user?.id || req.ip;

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});
