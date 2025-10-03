/**
 * 🔍 ENHANCED SEARCH BAR
 *
 * Unified search komponent s pokročilými features:
 * - Debounced search
 * - Autocomplete suggestions
 * - Search history
 * - Quick filters
 * - Mobile-optimized UX
 */

import { X, Filter, History, Search, TrendingUp, Loader2 } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui';
import React, { memo, useEffect, useRef } from 'react';

import type {
  QuickFilter,
  SearchSuggestion,
} from '../../hooks/useEnhancedSearch';

import { useEnhancedSearch } from '../../hooks/useEnhancedSearch';

interface EnhancedSearchBarProps {
  // Search function
  onSearch: (
    _query: string,
    _quickFilter?: string
  ) => Promise<Record<string, unknown>[]> | Record<string, unknown>[];
  suggestionFunction?: (
    _query: string
  ) => Promise<SearchSuggestion[]> | SearchSuggestion[];

  // Search options
  debounceDelay?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  maxHistory?: number;
  storageKey?: string;
  enableHistory?: boolean;
  enableSuggestions?: boolean;

  // UI customization
  placeholder?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';

  // Quick filters
  quickFilters?: QuickFilter[];

  // Mobile optimization
  autoFocus?: boolean;
  showResultCount?: boolean;
  showPerformanceStats?: boolean;

  // Event handlers
  onQueryChange?: (_query: string) => void;
  onResultsChange?: (_results: Record<string, unknown>[]) => void;
  onQuickFilterChange?: (_filterId: string | null) => void;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  onSearch,
  suggestionFunction,
  debounceDelay,
  minQueryLength,
  maxSuggestions,
  maxHistory,
  storageKey,
  enableHistory,
  enableSuggestions,
  placeholder = 'Hľadať...',
  size = 'medium',
  fullWidth = true,
  // variant = 'outlined',
  quickFilters = [],
  autoFocus = false,
  showResultCount = true,
  showPerformanceStats = false,
  onQueryChange,
  onResultsChange,
  onQuickFilterChange,
}) => {
  // Mobile detection using window width
  // const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Search hook
  const {
    query,
    setQuery,
    isSearching,
    activeQuickFilter,
    results,
    suggestions,
    searchHistory,
    showSuggestions,
    setShowSuggestions,
    clearSearch,
    selectSuggestion,
    setQuickFilter,
    searchStats,
  } = useEnhancedSearch({
    searchFunction: onSearch,
    ...(suggestionFunction && { suggestionFunction }),
    debounceDelay: debounceDelay ?? 300,
    minQueryLength: minQueryLength ?? 2,
    maxSuggestions: maxSuggestions ?? 10,
    maxHistory: maxHistory ?? 20,
    storageKey: storageKey ?? 'search-history',
    enableHistory: enableHistory ?? true,
    enableSuggestions: enableSuggestions ?? true,
    placeholder,
    quickFilters,
  });

  // Local state
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Notify parent of changes
  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  useEffect(() => {
    onQuickFilterChange?.(activeQuickFilter);
  }, [activeQuickFilter, onQuickFilterChange]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (newQuery.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (query.length > 0 || searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay for suggestion clicks)
  const handleInputBlur = () => {
    window.setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    selectSuggestion(suggestion);
    inputRef.current?.focus();
  };

  // Handle quick filter selection
  const handleQuickFilterSelect = (filterId: string) => {
    if (activeQuickFilter === filterId) {
      setQuickFilter(null);
    } else {
      setQuickFilter(filterId);
    }
  };

  // Handle clear
  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Calculate search info text
  const getSearchInfo = () => {
    if (isSearching) return 'Vyhľadávam...';

    if (showResultCount && results.length > 0) {
      const count = results.length;
      const duration = searchStats.duration;

      if (showPerformanceStats && duration > 0) {
        return `${count} ${count === 1 ? 'výsledok' : count < 5 ? 'výsledky' : 'výsledkov'} (${duration.toFixed(0)}ms)`;
      }

      return `${count} ${count === 1 ? 'výsledok' : count < 5 ? 'výsledky' : 'výsledkov'}`;
    }

    return '';
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-auto'}`}>
      {/* Quick Filters */}
      {quickFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
            <Filter className="h-3.5 w-3.5 mr-1" />
            Rýchle filtre:
          </div>

          {quickFilters.map(filter => (
            <Badge
              key={filter.id}
              variant={activeQuickFilter === filter.id ? 'default' : 'outline'}
              className={`cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                activeQuickFilter === filter.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border-border'
              }`}
              onClick={() => handleQuickFilterSelect(filter.id)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            className={`pl-10 ${query ? 'pr-10' : ''} ${size === 'small' ? 'h-8' : 'h-10'}`}
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
          />
          {isSearching && (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          {query && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-destructive/10"
                    onClick={handleClear}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vymazať</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Search Info */}
      {getSearchInfo() && (
        <p className="text-xs text-muted-foreground text-right mt-1">
          {getSearchInfo()}
        </p>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions &&
        (suggestions.length > 0 || searchHistory.length > 0) && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 max-h-96 overflow-auto mt-1 bg-background border border-border rounded-lg shadow-lg"
          >
            <div className="py-1">
              {/* Search History */}
              {searchHistory.length > 0 && !query && (
                <>
                  <div className="px-3 py-2 bg-muted/50">
                    <div className="flex items-center text-xs font-semibold text-muted-foreground">
                      <History className="h-3 w-3 mr-2" />
                      Posledné vyhľadávania
                    </div>
                  </div>
                  {searchHistory.slice(0, 5).map((historyItem, index) => (
                    <div
                      key={`history-${index}`}
                      className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer"
                      onClick={() =>
                        handleSuggestionSelect({
                          id: `history-${index}`,
                          text: historyItem,
                          type: 'recent',
                        })
                      }
                    >
                      <History className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="text-sm">{historyItem}</span>
                    </div>
                  ))}
                  <Separator />
                </>
              )}

              {/* Suggestions */}
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion.type === 'recent' ? (
                    <History className="h-4 w-4 mr-3 text-muted-foreground" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-3 text-primary" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{suggestion.text}</div>
                    {suggestion.category && (
                      <div className="text-xs text-muted-foreground">
                        {suggestion.category}
                      </div>
                    )}
                  </div>

                  {suggestion.count && (
                    <Badge variant="secondary" className="ml-2">
                      {suggestion.count}
                    </Badge>
                  )}
                </div>
              ))}

              {/* No suggestions */}
              {query && suggestions.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Žiadne návrhy pre "{query}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default memo(EnhancedSearchBar);
