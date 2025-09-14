/**
 * 🚀 DEBOUNCE UTILITY
 *
 * Performance optimization for search and API calls
 */

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function measurePerformance<T>(name: string, fn: () => T): T;
export function measurePerformance<T>(fn: () => T, name: string): T;
export function measurePerformance<T>(
  nameOrFn: string | (() => T),
  fnOrName?: (() => T) | string
): T {
  let name: string;
  let fn: () => T;

  if (typeof nameOrFn === 'string') {
    name = nameOrFn;
    fn = fnOrName as () => T;
  } else {
    fn = nameOrFn;
    name = fnOrName as string;
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();
  // eslint-disable-next-line no-console
  console.log(`⚡ ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export type DebounceOptions = {
  ttl?: number;
  maxConcurrent?: number;
  onDuplicate?: () => void;
};

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(key?: string) {
    if (key) {
      this.pendingRequests.delete(key);
    } else {
      this.pendingRequests.clear();
    }
  }
}
