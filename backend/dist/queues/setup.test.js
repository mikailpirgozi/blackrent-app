"use strict";
/**
 * Mock Queue Setup pre testy
 * Simuluje Queue funkcionalitu bez potreby Redis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfQueue = exports.photoQueue = exports.MockQueue = void 0;
exports.checkQueues = checkQueues;
exports.closeQueues = closeQueues;
exports.getQueueStats = getQueueStats;
class MockQueue {
    constructor(name, _options) {
        this.jobs = [];
        this.name = name;
    }
    async add(jobName, data) {
        const job = {
            id: `test-job-${Date.now()}`,
            name: jobName,
            data,
            timestamp: new Date()
        };
        this.jobs.push(job);
        return job;
    }
    async process(_handler) {
        // Mock process
        return true;
    }
    async isReady() {
        return true;
    }
    async close() {
        return true;
    }
    async getJobCounts() {
        return {
            waiting: 0,
            active: 0,
            completed: this.jobs.length,
            failed: 0
        };
    }
    async getWaiting() {
        return [];
    }
    async getActive() {
        return [];
    }
    async getCompleted() {
        return this.jobs;
    }
    async getFailed() {
        return [];
    }
    on(_event, _handler) {
        // Mock event handler
        return this;
    }
}
exports.MockQueue = MockQueue;
// Export mock queues for tests
exports.photoQueue = new MockQueue('photo-processing');
exports.pdfQueue = new MockQueue('pdf-generation');
async function checkQueues() {
    return {
        redis: true,
        photoQueue: true,
        pdfQueue: true,
        overall: true
    };
}
async function closeQueues() {
    return Promise.resolve();
}
async function getQueueStats() {
    return {
        photo: {
            waiting: [],
            active: [],
            completed: [],
            failed: []
        },
        pdf: {
            waiting: [],
            active: [],
            completed: [],
            failed: []
        },
        timestamp: new Date()
    };
}
//# sourceMappingURL=setup.test.js.map