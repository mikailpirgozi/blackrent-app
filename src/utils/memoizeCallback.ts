/**
 * 🔄 CALLBACK MEMOIZATION UTILITY
 *
 * Utility pre efektívne memoizovanie callback funkcií
 */

import { useCallback, useRef } from 'react';

/**
 * 📝 Memoize callback s dependency tracking
 */
export const memoizeCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T => {
  return useCallback(callback, dependencies);
};

/**
 * 🏎️ Stable callback hook - callback sa zmení len keď sa zmení referencia funkcie
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
};

/**
 * 🔐 Memoized event handlers factory
 */
export const createMemoizedHandlers = <T>(
  handlers: Record<string, (item: T) => void>,
  dependencies: any[] = []
) => {
  return Object.keys(handlers).reduce(
    (memo, key) => {
      memo[key] = useCallback(handlers[key], dependencies);
      return memo;
    },
    {} as Record<string, (item: T) => void>
  );
};

/**
 * 📊 Performance measurement decorator pre callbacks
 */
export const withPerformanceTracking = <T extends (...args: any[]) => any>(
  callback: T,
  label: string
): T => {
  return ((...args: Parameters<T>) => {
    console.time(label);
    const result = callback(...args);
    console.timeEnd(label);
    return result;
  }) as T;
};
