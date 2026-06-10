import rateLimit from 'express-rate-limit';

// Key generator based on authenticated user ID or IP address
const keyGenerator = (req: any) => req.user?.id || req.ip;

// Existing limiters
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

// New limiter for authentication routes (login/signup/guest)
// Allows up to 5 requests per 2 seconds per IP/user to keep response fast
export const authLimiter = rateLimit({
  windowMs: 2000, // 2 seconds
  max: 5,
  message: { error: 'Too many authentication attempts, please wait a moment.', code: 'AUTH_RATE_LIMIT' },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
});
