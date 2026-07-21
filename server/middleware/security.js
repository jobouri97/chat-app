const requestCounts = new Map();
// Delete expired rate-limit records so the Map does not grow forever.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (value.resetAt <= now) requestCounts.delete(key);
  }
}, 15 * 60 * 1000);
cleanupTimer.unref();

export function securityHeaders(req, res, next) {
  // These headers tell browsers to enable safer behavior. For example, DENY
  // prevents another website from placing the app inside an invisible frame.
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
    // Each IP address receives its own request counter for this time window.
    const key = req.ip;
    const current = requestCounts.get(key);

    if (!current || current.resetAt <= now) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > limit) {
      // Retry-After tells the client how many seconds remain before trying again.
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    return next();
  };
}

export const authenticationLimiter = createRateLimiter({
  // Login and registration are common brute-force targets, so limit them more
  // aggressively than ordinary authenticated requests.
  windowMs: 15 * 60 * 1000,
  limit: 20,
});
