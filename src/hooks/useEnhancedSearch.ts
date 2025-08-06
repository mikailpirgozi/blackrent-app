/**
 * 🔍 ENHANCED SEARCH HOOK
 * 
 * Unified search system pre celú aplikáciu:
 * - Debounced search s performance optimalizáciou
 * - Search suggestions s autocomplete
 * - Search history tracking
 * - Quick filters
 * - Mobile-optimized UX
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { debounce } from '../utils/debounce';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'quick_filter';
  category?: string;
  count?: number;
}

export interface QuickFilter {
  id: string;
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  icon?: string;
  count?: number;
}

export interface SearchOptions {
  debounceDelay?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  maxHistory?: number;
  storageKey?: string;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  placeholder?: string;
  quickFilters?: QuickFilter[];
}

export interface UseEnhancedSearchOptions extends SearchOptions {
  searchFunction: (query: string, quickFilter?: string) => Promise<any[]> | any[];
  suggestionFunction?: (query: string) => Promise<SearchSuggestion[]> | SearchSuggestion[];
  onSearch?: (query: string, results: any[]) => void;
  onClear?: () => void;
}

export interface UseEnhancedSearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  activeQuickFilter: string | null;
  
  // Results
  results: any[];
  suggestions: SearchSuggestion[];
  
  // History
  searchHistory: string[];
  clearHistory: () => void;
  
  // Actions
  search: (query: string) => void;
  clearSearch: () => void;
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  setQuickFilter: (filterId: string | null) => void;
  
  // UI state
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  
  // Performance
  searchStats: {
    duration: number;
    resultCount: number;
    lastSearchTime: number;
  };
}

export const useEnhancedSearch = ({
  searchFunction,
  suggestionFunction,
  onSearch,
  onClear,
  debounceDelay = 300,
  minQueryLength = 2,
  maxSuggestions = 8,
  maxHistory = 10,
  storageKey = 'search_history',
  enableHistory = true,
  enableSuggestions = true,
  placeholder = 'Hľadať...',
  quickFilters = []
}: UseEnhancedSearchOptions): UseEnhancedSearchReturn => {
  
  // Search state
  const [query, setQueryState] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  
  // Performance tracking
  const [searchStats, setSearchStats] = useState({
    duration: 0,
    resultCount: 0,
    lastSearchTime: 0
  });
  
  // Refs pre cleanup
  const searchAbortController = useRef<AbortController | null>(null);
  const suggestionAbortController = useRef<AbortController | null>(null);

  // Load search history from localStorage
  useEffect(() => {
    if (enableHistory && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const history = JSON.parse(stored);
          setSearchHistory(Array.isArray(history) ? history.slice(0, maxHistory) : []);
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, [enableHistory, storageKey, maxHistory]);

  // Save search history to localStorage
  const saveToHistory = useCallback((searchQuery: string) => {
    if (!enableHistory || !storageKey || !searchQuery.trim()) return;
    
    try {
      const newHistory = [
        searchQuery,
        ...searchHistory.filter(h => h !== searchQuery)
      ].slice(0, maxHistory);
      
      setSearchHistory(newHistory);
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, [enableHistory, storageKey, searchHistory, maxHistory]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string, quickFilter?: string) => {
      if (searchQuery.length < minQueryLength && !quickFilter) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      // Cancel previous search
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
      
      searchAbortController.current = new AbortController();
      setIsSearching(true);
      
      try {
        const startTime = performance.now();
        const searchResults = await searchFunction(searchQuery, quickFilter);
        const duration = performance.now() - startTime;
        
        setResults(searchResults);
        setSearchStats({
          duration,
          resultCount: searchResults.length,
          lastSearchTime: Date.now()
        });
        
        // Save to history
        if (searchQuery.trim()) {
          saveToHistory(searchQuery);
        }
        
        onSearch?.(searchQuery, searchResults);
        
        console.log(`🔍 Search completed: "${searchQuery}" → ${searchResults.length} results (${duration.toFixed(2)}ms)`);
        
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, debounceDelay),
    [searchFunction, debounceDelay, minQueryLength, saveToHistory, onSearch]
  );

  // Debounced suggestions
  const debouncedSuggestions = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (!enableSuggestions || !suggestionFunction || searchQuery.length < 1) {
        setSuggestions([]);
        return;
      }

      // Cancel previous suggestions request
      if (suggestionAbortController.current) {
        suggestionAbortController.current.abort();
      }
      
      suggestionAbortController.current = new AbortController();
      
      try {
        const suggestionResults = await suggestionFunction(searchQuery);
        
        // Combine with search history
        const historySuggestions: SearchSuggestion[] = enableHistory
          ? searchHistory
              .filter(h => h.toLowerCase().includes(searchQuery.toLowerCase()) && h !== searchQuery)
              .slice(0, 3)
              .map(h => ({
                id: `history_${h}`,
                text: h,
                type: 'recent' as const,
                category: 'História'
              }))
          : [];
        
        const allSuggestions = [
          ...historySuggestions,
          ...suggestionResults
        ].slice(0, maxSuggestions);
        
        setSuggestions(allSuggestions);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Suggestions error:', error);
          setSuggestions([]);
        }
      }
    }, 150),
    [suggestionFunction, enableSuggestions, enableHistory, searchHistory, maxSuggestions]
  );

  // Search function
  const search = useCallback((searchQuery: string) => {
    setQueryState(searchQuery);
    debouncedSearch(searchQuery, activeQuickFilter || undefined);
    
    if (enableSuggestions && searchQuery.length > 0) {
      debouncedSuggestions(searchQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch, debouncedSuggestions, activeQuickFilter, enableSuggestions]);

  // Set query wrapper
  const setQuery = useCallback((newQuery: string) => {
    search(newQuery);
  }, [search]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveQuickFilter(null);
    
    // Cancel ongoing requests
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    if (suggestionAbortController.current) {
      suggestionAbortController.current.abort();
    }
    
    onClear?.();
  }, [onClear]);

  // Clear history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    if (enableHistory && storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear search history:', error);
      }
    }
  }, [enableHistory, storageKey]);

  // Select suggestion
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
  }, [setQuery]);

  // Set quick filter
  const setQuickFilter = useCallback((filterId: string | null) => {
    setActiveQuickFilter(filterId);
    // Re-search with current query and new filter
    if (query || filterId) {
      debouncedSearch(query, filterId || undefined);
    }
  }, [query, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel ongoing requests
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
      if (suggestionAbortController.current) {
        suggestionAbortController.current.abort();
      }
    };
  }, []);

  return {
    // Search state
    query,
    setQuery,
    isSearching,
    activeQuickFilter,
    
    // Results
    results,
    suggestions,
    
    // History
    searchHistory,
    clearHistory,
    
    // Actions
    search,
    clearSearch,
    selectSuggestion,
    setQuickFilter,
    
    // UI state
    showSuggestions,
    setShowSuggestions,
    
    // Performance
    searchStats
  };
};