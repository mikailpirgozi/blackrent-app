/**
 * Queue Setup pre Protocol V2 System
 * Používa BullMQ pre reliable background processing
 */

import Queue from 'bull';
import Redis from 'ioredis';

// Redis konfigurácia
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true
};

// Vytvorenie Redis instance
const redis = new Redis(redisConfig);

// Queue definitions
export const photoQueue = new Queue('photo-processing', { 
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 successful jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const pdfQueue = new Queue('pdf-generation', { 
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000
    }
  }
});

// Health check function
export async function checkQueues(): Promise<{
  redis: boolean;
  photoQueue: boolean;
  pdfQueue: boolean;
  overall: boolean;
}> {
  const status = {
    redis: false,
    photoQueue: false,
    pdfQueue: false,
    overall: false
  };
  
  try {
    // Test Redis connection
    await redis.ping();
    status.redis = true;
    
    // Test photo queue
    await photoQueue.isReady();
    status.photoQueue = true;
    
    // Test PDF queue
    await pdfQueue.isReady();
    status.pdfQueue = true;
    
    status.overall = status.redis && status.photoQueue && status.pdfQueue;
  } catch (error) {
    console.error('Queue health check failed:', error);
  }
  
  return status;
}

/**
 * Graceful shutdown
 */
export async function closeQueues(): Promise<void> {
  try {
    await Promise.all([
      photoQueue.close(),
      pdfQueue.close(),
      redis.disconnect()
    ]);
  } catch (error) {
    console.error('Error closing queues:', error);
  }
}

/**
 * Queue monitoring stats
 */
export async function getQueueStats() {
  try {
    const [photoStats, pdfStats] = await Promise.all([
      {
        waiting: await photoQueue.waiting(),
        active: await photoQueue.active(),
        completed: await photoQueue.completed(),
        failed: await photoQueue.failed()
      },
      {
        waiting: await pdfQueue.waiting(),
        active: await pdfQueue.active(),
        completed: await pdfQueue.completed(),
        failed: await pdfQueue.failed()
      }
    ]);
    
    return {
      photo: photoStats,
      pdf: pdfStats,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return null;
  }
}
