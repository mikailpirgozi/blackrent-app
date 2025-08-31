/**
 * Mock Queue Setup pre testy
 * Simuluje Queue funkcionalitu bez potreby Redis
 */

interface MockJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export class MockQueue {
  private jobs: MockJob[] = [];
  private name: string;
  
  constructor(name: string, _options?: unknown) {
    this.name = name;
  }
  
  async add(jobName: string, data: Record<string, unknown>) {
    const job = {
      id: `test-job-${Date.now()}`,
      name: jobName,
      data,
      timestamp: new Date()
    };
    this.jobs.push(job);
    return job;
  }
  
  async process(_handler: unknown) {
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
  
  on(_event: string, _handler: unknown) {
    // Mock event handler
    return this;
  }
}

// Export mock queues for tests
export const photoQueue = new MockQueue('photo-processing');
export const pdfQueue = new MockQueue('pdf-generation');

export async function checkQueues() {
  return {
    redis: true,
    photoQueue: true,
    pdfQueue: true,
    overall: true
  };
}

export async function closeQueues() {
  return Promise.resolve();
}

export async function getQueueStats() {
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
