/**
 * In-memory rate limiter per user.
 * Allows 10 requests per minute per user to prevent abuse.
 * This is separate from AI provider quotas or rate limits.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

// Track user ID -> { count, windowStart }
const userLimitCache = new Map();

function userRateLimiter(req, res, next) {
  if (!req.user || !req.user._id) return next();
  
  const userId = req.user._id.toString();
  const now = Date.now();
  
  let record = userLimitCache.get(userId);

  // If no record or window expired, reset
  if (!record || now - record.windowStart >= WINDOW_MS) {
    record = { count: 0, windowStart: now };
    userLimitCache.set(userId, record);
  }

  // Increment count
  record.count += 1;

  if (record.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - record.windowStart)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: `You are sending messages too quickly. Please wait ${retryAfter} seconds.`,
      retryAfter
    });
  }

  next();
}

// Optional cleanup interval to avoid memory leaks for long-running servers
setInterval(() => {
  const now = Date.now();
  for (const [userId, record] of userLimitCache.entries()) {
    if (now - record.windowStart >= WINDOW_MS) {
      userLimitCache.delete(userId);
    }
  }
}, WINDOW_MS * 5); // Clean up every 5 mins

module.exports = { userRateLimiter };
