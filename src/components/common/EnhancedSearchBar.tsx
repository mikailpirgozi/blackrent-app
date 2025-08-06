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

import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Typography,
  Divider,
  Fade,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  TrendingUp as SuggestionIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useEnhancedSearch, UseEnhancedSearchOptions, SearchSuggestion, QuickFilter } from '../../hooks/useEnhancedSearch';

interface EnhancedSearchBarProps {
  // Search function
  onSearch: (query: string, quickFilter?: string) => Promise<any[]> | any[];
  suggestionFunction?: (query: string) => Promise<SearchSuggestion[]> | SearchSuggestion[];
  
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
  onQueryChange?: (query: string) => void;
  onResultsChange?: (results: any[]) => void;
  onQuickFilterChange?: (filterId: string | null) => void;
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
  variant = 'outlined',
  quickFilters = [],
  autoFocus = false,
  showResultCount = true,
  showPerformanceStats = false,
  onQueryChange,
  onResultsChange,
  onQuickFilterChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
    searchStats
  } = useEnhancedSearch({
    searchFunction: onSearch,
    suggestionFunction,
    debounceDelay,
    minQueryLength,
    maxSuggestions,
    maxHistory,
    storageKey,
    enableHistory,
    enableSuggestions,
    placeholder,
    quickFilters
  });
  
  // Local state
  const [inputFocused, setInputFocused] = useState(false);
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
    setInputFocused(true);
    if (query.length > 0 || searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay for suggestion clicks)
  const handleInputBlur = () => {
    setTimeout(() => {
      setInputFocused(false);
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
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      {/* Quick Filters */}
      {quickFilters.length > 0 && (
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            mb: 2,
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              alignSelf: 'center', 
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            <FilterIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
            Rýchle filtre:
          </Typography>
          
          {quickFilters.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              size={isMobile ? 'small' : 'medium'}
              color={activeQuickFilter === filter.id ? filter.color : 'default'}
              variant={activeQuickFilter === filter.id ? 'filled' : 'outlined'}
              onClick={() => handleQuickFilterSelect(filter.id)}
              sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[2]
                }
              }}
            />
          ))}
        </Stack>
      )}

      {/* Search Input */}
      <TextField
        ref={inputRef}
        fullWidth={fullWidth}
        size={size}
        variant={variant}
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {isSearching ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon sx={{ color: 'text.secondary' }} />
              )}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <Tooltip title="Vymazať">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{ 
                    '&:hover': {
                      backgroundColor: `${theme.palette.error.main}15`
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        }}
      />

      {/* Search Info */}
      {getSearchInfo() && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            mt: 0.5,
            color: 'text.secondary',
            textAlign: 'right'
          }}
        >
          {getSearchInfo()}
        </Typography>
      )}

      {/* Suggestions Dropdown */}
      <Fade in={showSuggestions && (suggestions.length > 0 || searchHistory.length > 0)} timeout={200}>
        <Paper
          ref={suggestionsRef}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: theme.zIndex.modal,
            maxHeight: isMobile ? '60vh' : '400px',
            overflow: 'auto',
            mt: 0.5,
            boxShadow: theme.shadows[8],
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <List dense disablePadding>
            {/* Search History */}
            {searchHistory.length > 0 && !query && (
              <>
                <ListItem sx={{ py: 1, backgroundColor: theme.palette.background.default }}>
                  <ListItemIcon>
                    <HistoryIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Posledné vyhľadávania
                      </Typography>
                    }
                  />
                </ListItem>
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <ListItem
                    key={`history-${index}`}
                    button
                    onClick={() => handleSuggestionSelect({
                      id: `history-${index}`,
                      text: historyItem,
                      type: 'recent'
                    })}
                    sx={{
                      py: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <ListItemIcon>
                      <HistoryIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </ListItemIcon>
                    <ListItemText primary={historyItem} />
                  </ListItem>
                ))}
                <Divider />
              </>
            )}

            {/* Suggestions */}
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={suggestion.id}
                button
                onClick={() => handleSuggestionSelect(suggestion)}
                sx={{
                  py: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  }
                }}
              >
                <ListItemIcon>
                  {suggestion.type === 'recent' ? (
                    <HistoryIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  ) : (
                    <SuggestionIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                  )}
                </ListItemIcon>
                
                <ListItemText 
                  primary={suggestion.text}
                  secondary={suggestion.category}
                />
                
                {suggestion.count && (
                  <Badge 
                    badgeContent={suggestion.count} 
                    color="primary"
                    sx={{ mr: 1 }}
                  />
                )}
              </ListItem>
            ))}

            {/* No suggestions */}
            {query && suggestions.length === 0 && (
              <ListItem sx={{ py: 2 }}>
                <ListItemText 
                  primary={
                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      Žiadne návrhy pre "{query}"
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Fade>
    </Box>
  );
};

export default memo(EnhancedSearchBar);