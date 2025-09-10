import express from 'express';
import mongoose from 'mongoose';
import * as redisService from '../config/redis.js';

// Import routes
import authRoutes from './auth.js';
import userRoutes from './users.js';
import restaurantRoutes from './restaurants.js';
import dishRoutes from './dishes.js';
import placesRoutes from './places.js';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      health.services.database = 'connected';
    } else {
      health.services.database = 'disconnected';
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Redis connection
    const client = await redisService.getRedisClient();
    if (client && client.isOpen) {
      health.services.redis = 'connected';
    } else {
      health.services.redis = 'disconnected';
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Use routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/dishes', dishRoutes);
router.use('/places', placesRoutes);

export default router; 