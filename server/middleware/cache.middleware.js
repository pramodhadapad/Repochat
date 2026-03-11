const { getRedisClient, checkRedisConnection } = require('../config/redis');

/**
 * Middleware to intercept requests and return cached responses if available.
 * Creates a composite key based on req.user._id, req.originalUrl, and an optional custom suffix.
 * @param {number} expiration - Time in seconds to cache the response.
 */
const cacheResponse = (expiration = 300) => {
  return async (req, res, next) => {
    // If Redis is not connected, bypass caching entirely
    if (!checkRedisConnection()) {
      return next();
    }

    const redis = getRedisClient();
    const userId = req.user ? req.user._id.toString() : 'public';
    // Create unique cache key for this user and route
    const cacheKey = `cache:${userId}:${req.originalUrl}`;

    try {
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Intercept the res.json method to capture the response body
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful requests
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            redis.setEx(cacheKey, expiration, JSON.stringify(body));
          } catch (redisErr) {
            console.error('Redis Set Error:', redisErr);
          }
        }
        // Call the original res.json
        originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.error('Redis Get Error:', err);
      // On error, just bypass cache
      next();
    }
  };
};

/**
 * Utility to manually clear cache keys matching a pattern.
 * Useful when mutations occur (e.g., deleting a repo).
 */
const clearCachePattern = async (pattern) => {
  if (!checkRedisConnection()) return;
  
  const redis = getRedisClient();
  try {
    const keys = await redis.keys(`cache:*${pattern}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    console.error('Redis Clear Cache Error:', err);
  }
};

module.exports = { cacheResponse, clearCachePattern };
