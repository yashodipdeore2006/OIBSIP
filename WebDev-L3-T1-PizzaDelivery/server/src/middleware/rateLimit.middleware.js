const createRateLimiter = ({ windowMs, limit, message }) => {
  const clients = new Map();

  const cleanup = () => {
    const now = Date.now();

    for (const [key, value] of clients.entries()) {
      if (value.resetAt <= now) {
        clients.delete(key);
      }
    }
  };

  setInterval(cleanup, 60_000).unref?.();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const current = clients.get(key);

    if (!current || current.resetAt <= now) {
      clients.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    current.count += 1;

    if (current.count > limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000)
      );

      res.setHeader("Retry-After", retryAfter);

      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many requests. Please try again later.",
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many authentication attempts. Please try again later.",
});
