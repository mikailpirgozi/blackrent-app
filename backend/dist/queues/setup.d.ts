/**
 * Queue Setup pre Protocol V2 System
 * Používa BullMQ pre reliable background processing
 */
import Queue from 'bull';
export declare const photoQueue: Queue.Queue<any>;
export declare const pdfQueue: Queue.Queue<any>;
export declare function checkQueues(): Promise<{
    redis: boolean;
    photoQueue: boolean;
    pdfQueue: boolean;
    overall: boolean;
}>;
/**
 * Graceful shutdown
 */
export declare function closeQueues(): Promise<void>;
/**
 * Queue monitoring stats
 */
export declare function getQueueStats(): Promise<{
    photo: {
        waiting: Queue.Job<any>[];
        active: Queue.Job<any>[];
        completed: Queue.Job<any>[];
        failed: Queue.Job<any>[];
    };
    pdf: {
        waiting: Queue.Job<any>[];
        active: Queue.Job<any>[];
        completed: Queue.Job<any>[];
        failed: Queue.Job<any>[];
    };
    timestamp: Date;
} | null>;
//# sourceMappingURL=setup.d.ts.map