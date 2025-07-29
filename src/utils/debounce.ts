/**
 * ⚡ DEBOUNCE UTILITIES
 * 
 * Performance optimalizácie pre API calls:
 * - Request debouncing
 * - Throttling
 * - Request deduplication
 * - Memory-efficient callbacks
 */

export interface DebounceOptions {
  delay: number;
  immediate?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  interval: number;
  trailing?: boolean;
  leading?: boolean;
}

/**
 * 🕐 Debounce funkcia - zrušuje predchádzajúce volania
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions | number
): ((...args: Parameters<T>) => void) => {
  const config = typeof options === 'number' 
    ? { delay: options } 
    : options;
  
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;

  const debouncedFn = (...args: Parameters<T>) => {
    const now = Date.now();
    
    // Clear existing timers
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Immediate execution on first call
    if (config.immediate && !lastCallTime) {
      func(...args);
      lastCallTime = now;
      return;
    }

    // Set max wait timer if specified
    if (config.maxWait && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        func(...args);
        lastCallTime = now;
        maxTimeoutId = null;
      }, config.maxWait);
    }

    // Set debounce timer
    timeoutId = setTimeout(() => {
      func(...args);
      lastCallTime = now;
      
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
        maxTimeoutId = null;
      }
    }, config.delay);
  };

  // Cleanup function
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
  };

  return debouncedFn;
};

/**
 * 🏎️ Throttle funkcia - limituje frekvenciu volání
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  options: ThrottleOptions | number
): ((...args: Parameters<T>) => void) => {
  const config = typeof options === 'number' 
    ? { interval: options, trailing: true, leading: true } 
    : { trailing: true, leading: true, ...options };

  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttledFn = (...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    // Leading edge
    if (config.leading && now - lastCallTime >= config.interval) {
      func(...args);
      lastCallTime = now;
      return;
    }

    // Trailing edge
    if (config.trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
          lastCallTime = Date.now();
        }
        timeoutId = null;
        lastArgs = null;
      }, config.interval - (now - lastCallTime));
    }
  };

  throttledFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return throttledFn;
};

/**
 * 🎯 Request deduplication - predchádza duplicitným requestom
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestCounts = new Map<string, number>();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { 
      ttl?: number; 
      maxConcurrent?: number;
      onDuplicate?: () => void;
    } = {}
  ): Promise<T> {
    const { ttl = 5000, maxConcurrent = 10, onDuplicate } = options;

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Deduplicating request: ${key}`);
      onDuplicate?.();
      return this.pendingRequests.get(key)!;
    }

    // Check concurrent request limit
    if (this.pendingRequests.size >= maxConcurrent) {
      console.warn(`⚠️ Too many concurrent requests (${this.pendingRequests.size}), queuing...`);
      await this.waitForSlot();
    }

    // Track request count
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);

    // Create and store request promise
    const requestPromise = requestFn()
      .finally(() => {
        this.pendingRequests.delete(key);
        
        // Auto-cleanup after TTL
        setTimeout(() => {
          this.requestCounts.delete(key);
        }, ttl);
      });

    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }

  private async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.pendingRequests.size < 10) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      requestCounts: Object.fromEntries(this.requestCounts.entries())
    };
  }

  clear() {
    this.pendingRequests.clear();
    this.requestCounts.clear();
  }
}

/**
 * 🧠 Memory-efficient callback memoization
 */
export const memoizeCallback = <T extends (...args: any[]) => any>(
  fn: T,
  dependencies: any[] = []
): T => {
  let memoizedFn: T;
  let lastDeps: any[] = [];

  return ((...args: Parameters<T>) => {
    // Check if dependencies changed
    const depsChanged = dependencies.length !== lastDeps.length ||
      dependencies.some((dep, i) => dep !== lastDeps[i]);

    if (!memoizedFn || depsChanged) {
      memoizedFn = fn;
      lastDeps = [...dependencies];
    }

    return memoizedFn(...args);
  }) as T;
};

/**
 * 📊 Performance monitoring
 */
export const measurePerformance = <T>(
  operation: () => T,
  label: string
): T => {
  const start = performance.now();
  const result = operation();
  const duration = performance.now() - start;
  
  console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
  
  return result;
};

/**
 * 🚀 Batch operations utility
 */
export const batchOperations = <T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 5,
  delayBetweenBatches: number = 100
): Promise<T[]> => {
  return new Promise(async (resolve, reject) => {
    const results: T[] = [];
    
    try {
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(op => op()));
        results.push(...batchResults);
        
        // Delay between batches to prevent overwhelming
        if (i + batchSize < operations.length && delayBetweenBatches > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
};