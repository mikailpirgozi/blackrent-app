/**
 * 🔍 UNIFIED SEARCH FIELD COMPONENT
 *
 * Konzistentný search komponent pre celú BlackRent aplikáciu
 * Nahradí všetky rôzne search implementácie jednotným dizajnom
 * 
 * Features:
 * - Debounced search
 * - Search suggestions 
 * - Search history
 * - Loading states
 * - Clear functionality
 * - MUI kompatibilita
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import { Search, X, History, Clock, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './command';

// 🎨 Search suggestion interface
export interface SearchSuggestion {
  id: string;
  label: string;
  value: string;
  category?: string;
  icon?: React.ReactNode;
  metadata?: Record<string, unknown>;
}

// 🎨 Search history item interface
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
}

// 🎨 Props interface s MUI kompatibilitou
export interface UnifiedSearchFieldProps {
  // Basic props
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  
  // Search functionality
  debounceDelay?: number;
  minQueryLength?: number;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  maxHistoryItems?: number;
  maxSuggestions?: number;
  
  // Suggestions
  suggestions?: SearchSuggestion[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestionFunction?: (query: string) => Promise<SearchSuggestion[]> | SearchSuggestion[];
  
  // History
  historyStorageKey?: string;
  onHistorySelect?: (historyItem: SearchHistoryItem) => void;
  
  // UI customization
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  showClearButton?: boolean;
  showSearchIcon?: boolean;
  
  // MUI compatibility props
  InputProps?: {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
  };
  
  // Event handlers
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  
  // Styling
  className?: string;
  inputClassName?: string;
}

// 🎨 Custom hook pre search funkcionalitu
const useSearchField = ({
  value = '',
  onChange,
  onSearch,
  debounceDelay = 300,
  minQueryLength = 1,
  enableHistory = true,
  enableSuggestions = true,
  maxHistoryItems = 10,
  maxSuggestions = 8,
  historyStorageKey = 'search_history',
  suggestionFunction,
  onSuggestionSelect,
  onHistorySelect,
}: Pick<UnifiedSearchFieldProps, 
  'value' | 'onChange' | 'onSearch' | 'debounceDelay' | 'minQueryLength' | 
  'enableHistory' | 'enableSuggestions' | 'maxHistoryItems' | 'maxSuggestions' |
  'historyStorageKey' | 'suggestionFunction' | 'onSuggestionSelect' | 'onHistorySelect'
>) => {
  const [internalValue, setInternalValue] = useState(value);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const searchRef = useRef<NodeJS.Timeout>();

  // Load history from localStorage
  useEffect(() => {
    if (enableHistory && historyStorageKey) {
      try {
        const stored = localStorage.getItem(historyStorageKey);
        if (stored) {
          const parsedHistory = JSON.parse(stored);
          setHistory(parsedHistory.slice(0, maxHistoryItems));
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, [enableHistory, historyStorageKey, maxHistoryItems]);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: SearchHistoryItem[]) => {
    if (enableHistory && historyStorageKey) {
      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
    }
  }, [enableHistory, historyStorageKey]);

  // Add to history
  const addToHistory = useCallback((query: string, resultCount?: number) => {
    if (!enableHistory || !query.trim()) return;
    
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now(),
      resultCount,
    };
    
    setHistory(prev => {
      // Remove duplicates and add new item at the beginning
      const filtered = prev.filter(item => item.query !== query.trim());
      const newHistory = [newItem, ...filtered].slice(0, maxHistoryItems);
      saveHistory(newHistory);
      return newHistory;
    });
  }, [enableHistory, maxHistoryItems, saveHistory]);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (query.length >= minQueryLength) {
        onSearch?.(query);
        addToHistory(query);
      }
    }, debounceDelay);
  }, [debounceDelay, minQueryLength, onSearch, addToHistory]);

  // Load suggestions
  const loadSuggestions = useCallback(async (query: string) => {
    if (!enableSuggestions || !suggestionFunction || query.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await suggestionFunction(query);
      setSuggestions(Array.isArray(result) ? result.slice(0, maxSuggestions) : []);
    } catch (error) {
      console.warn('Failed to load suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [enableSuggestions, suggestionFunction, minQueryLength, maxSuggestions]);

  // Handle value change
  const handleValueChange = useCallback((newValue: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
    
    // Clear existing timeouts
    if (searchRef.current) {
      clearTimeout(searchRef.current);
    }
    
    // Debounce search and suggestions
    debouncedSearch(newValue);
    
    // Load suggestions with shorter delay
    searchRef.current = setTimeout(() => {
      loadSuggestions(newValue);
    }, 150);
    
    // Show dropdown if there's content
    if (newValue.length > 0 || history.length > 0) {
      setShowDropdown(true);
    }
  }, [onChange, debouncedSearch, loadSuggestions, history.length]);

  // Handle suggestion select
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setInternalValue(suggestion.value);
    onChange?.(suggestion.value);
    onSuggestionSelect?.(suggestion);
    setShowDropdown(false);
    
    // Trigger immediate search
    onSearch?.(suggestion.value);
    addToHistory(suggestion.value);
  }, [onChange, onSuggestionSelect, onSearch, addToHistory]);

  // Handle history select
  const handleHistorySelect = useCallback((historyItem: SearchHistoryItem) => {
    setInternalValue(historyItem.query);
    onChange?.(historyItem.query);
    onHistorySelect?.(historyItem);
    setShowDropdown(false);
    
    // Trigger immediate search
    onSearch?.(historyItem.query);
  }, [onChange, onHistorySelect, onSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setInternalValue('');
    onChange?.('');
    setSuggestions([]);
    setShowDropdown(false);
  }, [onChange]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, []);

  return {
    value: internalValue,
    suggestions,
    history,
    isLoading,
    showDropdown,
    setShowDropdown,
    handleValueChange,
    handleSuggestionSelect,
    handleHistorySelect,
    clearSearch,
  };
};

// 🎨 Main UnifiedSearchField component
export const UnifiedSearchField = React.forwardRef<
  HTMLInputElement,
  UnifiedSearchFieldProps
>(({
  value,
  onChange,
  onSearch,
  placeholder = 'Hľadať...',
  disabled = false,
  loading = false,
  debounceDelay = 300,
  minQueryLength = 1,
  enableHistory = true,
  enableSuggestions = true,
  maxHistoryItems = 10,
  maxSuggestions = 8,
  suggestions: externalSuggestions,
  onSuggestionSelect,
  suggestionFunction,
  historyStorageKey = 'search_history',
  onHistorySelect,
  label,
  size = 'default',
  fullWidth = true,
  showClearButton = true,
  showSearchIcon = true,
  InputProps,
  onFocus,
  onBlur,
  onKeyDown,
  className,
  inputClassName,
  ...props
}, ref) => {
  const {
    value: searchValue,
    suggestions: internalSuggestions,
    history,
    isLoading: suggestionsLoading,
    showDropdown,
    setShowDropdown,
    handleValueChange,
    handleSuggestionSelect,
    handleHistorySelect,
    clearSearch,
  } = useSearchField({
    value,
    onChange,
    onSearch,
    debounceDelay,
    minQueryLength,
    enableHistory,
    enableSuggestions,
    maxHistoryItems,
    maxSuggestions,
    historyStorageKey,
    suggestionFunction,
    onSuggestionSelect,
    onHistorySelect,
  });

  const finalSuggestions = externalSuggestions || internalSuggestions;
  const isLoadingState = loading || suggestionsLoading;
  const hasContent = searchValue.length > 0;
  const hasDropdownContent = finalSuggestions.length > 0 || history.length > 0;

  // Size variants
  const sizeClasses = {
    sm: 'h-8 text-xs',
    default: 'h-9 text-sm', 
    lg: 'h-11 text-base',
  };

  return (
    <div className={cn('relative', fullWidth && 'w-full', className)}>
      {label && (
        <Label className="mb-2 block text-sm font-medium">
          {label}
        </Label>
      )}
      
      <Popover open={showDropdown && hasDropdownContent} onOpenChange={setShowDropdown}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={ref}
              value={searchValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              onFocus={() => {
                onFocus?.();
                if (hasContent || history.length > 0) {
                  setShowDropdown(true);
                }
              }}
              onBlur={() => {
                onBlur?.();
                // Delay hiding to allow clicks on dropdown items
                setTimeout(() => setShowDropdown(false), 150);
              }}
              onKeyDown={(e) => {
                onKeyDown?.(e);
                if (e.key === 'Escape') {
                  setShowDropdown(false);
                }
              }}
              className={cn(
                sizeClasses[size],
                showSearchIcon && 'pl-9',
                (showClearButton && hasContent) && 'pr-9',
                inputClassName
              )}
              {...props}
            />
            
            {/* Search icon */}
            {showSearchIcon && (
              <UnifiedIcon name="search" className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            
            {/* Loading spinner */}
            {isLoadingState && (
              <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            
            {/* Clear button */}
            {showClearButton && hasContent && !isLoadingState && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {/* MUI compatibility - start/end adornments */}
            {InputProps?.startAdornment && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2">
                {InputProps.startAdornment}
              </div>
            )}
            {InputProps?.endAdornment && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {InputProps.endAdornment}
              </div>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-full p-0" 
          align="start"
          style={{ width: 'var(--radix-popover-trigger-width)' }}
        >
          <Command>
            <CommandList>
              {/* Search suggestions */}
              {finalSuggestions.length > 0 && (
                <CommandGroup heading="Návrhy">
                  {finalSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      value={suggestion.value}
                      onSelect={() => handleSuggestionSelect(suggestion)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {suggestion.icon || <UnifiedIcon name="search" className="h-4 w-4" />}
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.label}</div>
                          {suggestion.category && (
                            <div className="text-xs text-muted-foreground">
                              {suggestion.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Search history */}
              {history.length > 0 && (
                <CommandGroup heading="História vyhľadávania">
                  {history.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.query}
                      onSelect={() => handleHistorySelect(item)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{item.query}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(item.timestamp).toLocaleDateString('sk')}
                            {item.resultCount !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                {item.resultCount} výsledkov
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Empty state */}
              {finalSuggestions.length === 0 && history.length === 0 && (
                <CommandEmpty>Žiadne návrhy nenájdené</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});

UnifiedSearchField.displayName = 'UnifiedSearchField';

// 🎨 Export convenience components
export const SearchField = UnifiedSearchField;
export const UnifiedSearch = UnifiedSearchField;

// 🎨 Export types are already exported above with interface declarations
