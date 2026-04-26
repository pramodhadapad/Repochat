const { createClient } = require('redis');
const logger = require('./logger');

let redisClient = null;
let isRedisConnected = false;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Retry a few times, then give up so app doesn't hang
          if (retries > 5) {
            logger.warn('Redis reconnection failed after 5 attempts. Operating without cache.');
            return new Error('Redis max retries reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Client Error: ${err.message}`);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
      isRedisConnected = true;
    });

    await redisClient.connect();
  } catch (err) {
    logger.warn(`Could not connect to Redis (${redisUrl}). Caching will be disabled. Error: ${err.message}`);
    isRedisConnected = false;
  }
};

const getRedisClient = () => redisClient;
const checkRedisConnection = () => isRedisConnected;

module.exports = { connectRedis, getRedisClient, checkRedisConnection };
