/**
 * 🔄 CALLBACK MEMOIZATION UTILITY
 *
 * Utility pre efektívne memoizovanie callback funkcií
 */

import { useCallback, useRef } from 'react';

/**
 * 📝 Memoize callback s dependency tracking
 * POZNÁMKA: Táto funkcia je deprecated - použite useCallback priamo v komponente
 */
export const memoizeCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  dependencies: unknown[]
): T => {
  // Táto funkcia je len wrapper - v skutočnosti vráti originálny callback
  // useCallback sa musí volať priamo v React komponente
  // dependencies parameter je zachovaný pre kompatibilitu
  console.debug(
    'memoizeCallback called with dependencies:',
    dependencies.length
  );
  return callback;
};

/**
 * 🏎️ Stable callback hook - callback sa zmení len keď sa zmení referencia funkcie
 */
export const useStableCallback = <T extends (...args: unknown[]) => unknown>(
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
  dependencies: unknown[] = []
) => {
  // POZNÁMKA: Táto funkcia je deprecated - useCallback sa musí volať priamo v React komponente
  // dependencies parameter je zachovaný pre kompatibilitu
  console.debug(
    'createMemoizedHandlers called with dependencies:',
    dependencies.length
  );
  return Object.keys(handlers).reduce(
    (memo, key) => {
      memo[key] = handlers[key]!; // Vráti originálne handlery bez memoization
      return memo;
    },
    {} as Record<string, (item: T) => void>
  );
};

/**
 * 📊 Performance measurement decorator pre callbacks
 */
export const withPerformanceTracking = <
  T extends (...args: unknown[]) => unknown,
>(
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
