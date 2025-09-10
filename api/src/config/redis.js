import { createClient } from 'redis';

let redisClient = null;

// Create Redis client with connection management
const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = createClient({
      url,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    redisClient.on('end', () => {
      console.log('Redis client disconnected');
    });

    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error.message);
    throw new Error(`Redis connection failed: ${error.message}`);
  }
};

// Store verification code in Redis with 10-minute expiration
export const storeVerificationCode = async (email, code) => {
  try {
    const client = await getRedisClient();
    await client.set(`verification:${email}`, code, { EX: 600 }); // 10 minutes expiration
    console.log(`Verification code stored for ${email}`);
  } catch (error) {
    console.error(`Error storing verification code in Redis: ${error.message}`);
    // If Redis is not available, we could fall back to in-memory storage or database
    throw new Error(`Failed to store verification code: ${error.message}`);
  }
};

// Get verification code from Redis
export const getVerificationCode = async (email) => {
  try {
    const client = await getRedisClient();
    return await client.get(`verification:${email}`);
  } catch (error) {
    console.error(`Error getting verification code from Redis: ${error.message}`);
    throw error;
  }
};

// Delete verification code from Redis
export const deleteVerificationCode = async (email) => {
  try {
    const client = await getRedisClient();
    await client.del(`verification:${email}`);
  } catch (error) {
    console.error(`Error deleting verification code from Redis: ${error.message}`);
    throw error;
  }
};

// Generate a random 6-digit verification code
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Export default for backward compatibility
export default {
  storeVerificationCode,
  getVerificationCode,
  deleteVerificationCode,
  generateCode,
  getRedisClient
};

// Export getRedisClient for health check
export { getRedisClient }; 