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
export declare class MockQueue {
    private jobs;
    private name;
    constructor(name: string, _options?: unknown);
    add(jobName: string, data: Record<string, unknown>): Promise<{
        id: string;
        name: string;
        data: Record<string, unknown>;
        timestamp: Date;
    }>;
    process(_handler: unknown): Promise<boolean>;
    isReady(): Promise<boolean>;
    close(): Promise<boolean>;
    getJobCounts(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }>;
    getWaiting(): Promise<never[]>;
    getActive(): Promise<never[]>;
    getCompleted(): Promise<MockJob[]>;
    getFailed(): Promise<never[]>;
    on(_event: string, _handler: unknown): this;
}
export declare const photoQueue: MockQueue;
export declare const pdfQueue: MockQueue;
export declare function checkQueues(): Promise<{
    redis: boolean;
    photoQueue: boolean;
    pdfQueue: boolean;
    overall: boolean;
}>;
export declare function closeQueues(): Promise<void>;
export declare function getQueueStats(): Promise<{
    photo: {
        waiting: never[];
        active: never[];
        completed: never[];
        failed: never[];
    };
    pdf: {
        waiting: never[];
        active: never[];
        completed: never[];
        failed: never[];
    };
    timestamp: Date;
}>;
export {};
//# sourceMappingURL=setup.test.d.ts.map