"use strict";
/**
 * Queue Setup pre Protocol V2 System
 * Používa BullMQ pre reliable background processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfQueue = exports.photoQueue = void 0;
exports.checkQueues = checkQueues;
exports.closeQueues = closeQueues;
exports.getQueueStats = getQueueStats;
const bull_1 = __importDefault(require("bull"));
const ioredis_1 = __importDefault(require("ioredis"));
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
const redis = new ioredis_1.default(redisConfig);
// Queue definitions
exports.photoQueue = new bull_1.default('photo-processing', {
    redis: redisConfig,
    defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 successful jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
});
exports.pdfQueue = new bull_1.default('pdf-generation', {
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
async function checkQueues() {
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
        await exports.photoQueue.isReady();
        status.photoQueue = true;
        // Test PDF queue
        await exports.pdfQueue.isReady();
        status.pdfQueue = true;
        status.overall = status.redis && status.photoQueue && status.pdfQueue;
    }
    catch (error) {
        console.error('Queue health check failed:', error);
    }
    return status;
}
/**
 * Graceful shutdown
 */
async function closeQueues() {
    try {
        await Promise.all([
            exports.photoQueue.close(),
            exports.pdfQueue.close(),
            redis.disconnect()
        ]);
    }
    catch (error) {
        console.error('Error closing queues:', error);
    }
}
/**
 * Queue monitoring stats
 */
async function getQueueStats() {
    try {
        const [photoStats, pdfStats] = await Promise.all([
            {
                waiting: await exports.photoQueue.getWaiting(),
                active: await exports.photoQueue.getActive(),
                completed: await exports.photoQueue.getCompleted(),
                failed: await exports.photoQueue.getFailed()
            },
            {
                waiting: await exports.pdfQueue.getWaiting(),
                active: await exports.pdfQueue.getActive(),
                completed: await exports.pdfQueue.getCompleted(),
                failed: await exports.pdfQueue.getFailed()
            }
        ]);
        return {
            photo: photoStats,
            pdf: pdfStats,
            timestamp: new Date()
        };
    }
    catch (error) {
        console.error('Failed to get queue stats:', error);
        return null;
    }
}
//# sourceMappingURL=setup.js.map