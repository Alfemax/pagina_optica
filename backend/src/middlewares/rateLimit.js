import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 20,                   // 20 intentos por IP/ventana
  standardHeaders: true,
  legacyHeaders: false,
});
