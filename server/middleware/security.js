const requestCounts = new Map();
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (value.resetAt <= now) requestCounts.delete(key);
  }
}, 15 * 60 * 1000);
cleanupTimer.unref();

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
}

export function createRateLimiter({ windowMs, limit }) {
  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = req.ip;
    const current = requestCounts.get(key);

    if (!current || current.resetAt <= now) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > limit) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    return next();
  };
}

export const authenticationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
});
