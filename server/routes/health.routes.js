const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { chromaClient } = require('../config/chromadb');
const { createClient } = require('redis');

/**
 * @route GET /api/health
 * @desc Get health status of all dependent services
 * @access Public
 */
router.get('/', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      mongodb: 'unknown',
      chromadb: 'unknown',
      redis: 'unknown'
    }
  };

  // 1. Check MongoDB
  health.services.mongodb = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  // 2. Check ChromaDB
  try {
    if (chromaClient) {
      await chromaClient.version();
      health.services.chromadb = 'connected';
    } else {
      health.services.chromadb = 'not_configured';
    }
  } catch (err) {
    health.services.chromadb = 'disconnected';
  }

  // 3. Check Redis (Optional dependency)
  try {
    // In this app, redis is often not running or fails retries.
    // We check the environment variable and try a ping if possible.
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({ url: redisUrl, socket: { connectTimeout: 1000 } });
    client.on('error', () => {}); 
    await client.connect();
    await client.ping();
    health.services.redis = 'connected';
    await client.quit();
  } catch (err) {
    health.services.redis = 'disconnected';
  }

  const isHealthy = health.services.mongodb === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

module.exports = router;
