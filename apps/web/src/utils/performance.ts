import { useState, useEffect, useMemo } from 'react';
import { logger } from '@/utils/smartLogger';

/**
 * Hook pre debouncing hodnoty - optimalizuje vyhľadávanie
 * @param value - hodnota na debouncing
 * @param delay - oneskorenie v ms (default: 300ms)
 * @returns debounced hodnota
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pre pagination - optimalizuje zobrazenie veľkých tabuliek
 * @param data - pole dát
 * @param itemsPerPage - počet položiek na stránku
 * @param initialPage - počiatočná stránka
 */
export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 20,
  initialPage: number = 1
) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    currentData,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    pageInfo: {
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      showing: `${startIndex + 1}-${Math.min(endIndex, totalItems)} z ${totalItems}`,
    },
  };
}

/**
 * Hook pre memoized filtering - optimalizuje filtrovanie
 * @param data - pole dát
 * @param filterFn - filter funkcia
 * @param dependencies - závislosti pre re-run
 */
export function useMemoizedFilter<T>(
  data: T[],
  filterFn: (item: T) => boolean,
  dependencies: unknown[] = []
): T[] {
  return useMemo(() => {
    // Bezpečnostná kontrola - ak data nie je pole, vráť prázdne pole
    if (!Array.isArray(data)) {
      console.warn('useMemoizedFilter: data is not an array:', data);
      return [];
    }
    // dependencies parameter je zachovaný pre kompatibilitu
    logger.debug(
      'useMemoizedFilter called with dependencies:',
      dependencies.length
    );
    return data.filter(filterFn);
  }, [data, filterFn, dependencies]);
}

/**
 * Hook pre lazy loading - optimalizuje načítanie obrázkov
 * @param src - URL obrázka
 * @param placeholder - placeholder obrázok
 */
export function useLazyImage(src: string, placeholder: string = '') {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setImageSrc(placeholder);
      setLoading(false);
      return;
    }

    setLoading(true);
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
    };

    img.onerror = () => {
      setImageSrc(placeholder);
      setLoading(false);
    };
  }, [src, placeholder]);

  return { imageSrc, loading };
}
