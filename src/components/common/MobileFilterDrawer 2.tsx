/**
 * 📱 MOBILE FILTER DRAWER
 * 
 * Mobile-optimized filter drawer s touch-friendly UX
 */

import React, { useState, memo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandIcon,
  Search as SearchIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import type { QuickFilter } from '../../hooks/useEnhancedSearch';

interface FilterSection {
  id: string;
  title: string;
  type: 'select' | 'multiselect' | 'range' | 'text' | 'boolean' | 'date';
  options?: { label: string; value: string }[];
  value?: any;
  placeholder?: string;
  icon?: React.ReactNode;
}

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  
  // Quick filters
  quickFilters?: QuickFilter[];
  activeQuickFilter?: string | null;
  onQuickFilterChange?: (filterId: string | null) => void;
  
  // Advanced filters
  filterSections?: FilterSection[];
  filters?: Record<string, any>;
  onFiltersChange?: (filters: Record<string, any>) => void;
  
  // Actions
  onApply?: (filters: Record<string, any>) => void;
  onReset?: () => void;
  onSearch?: (query: string) => void;
  
  // Stats
  resultCount?: number;
  hasActiveFilters?: boolean;
}

const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  open,
  onClose,
  title = 'Filtre',
  quickFilters = [],
  activeQuickFilter,
  onQuickFilterChange,
  filterSections = [],
  filters = {},
  onFiltersChange,
  onApply,
  onReset,
  onSearch,
  resultCount,
  hasActiveFilters = false
}) => {
  const theme = useTheme();
  
  // Local state pre accordion sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['quick']) // Quick filters default expanded
  );
  
  // Local search state
  const [searchQuery, setSearchQuery] = useState('');
  
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };
  
  const handleQuickFilterSelect = (filterId: string) => {
    const newFilter = activeQuickFilter === filterId ? null : filterId;
    onQuickFilterChange?.(newFilter);
  };
  
  const handleFilterChange = (sectionId: string, value: any) => {
    const newFilters = { ...filters, [sectionId]: value };
    onFiltersChange?.(newFilters);
  };
  
  const handleApply = () => {
    onApply?.(filters);
    onClose();
  };
  
  const handleReset = () => {
    onReset?.();
    setSearchQuery('');
  };
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };
  
  const getActiveFilterCount = () => {
    let count = activeQuickFilter ? 1 : 0;
    count += Object.values(filters).filter(value => 
      value !== null && value !== '' && value !== 'all'
    ).length;
    return count;
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxHeight: '85vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: theme.palette.background.default
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {getActiveFilterCount() > 0 && (
              <Badge 
                badgeContent={getActiveFilterCount()} 
                color="primary"
                sx={{ '& .MuiBadge-badge': { position: 'relative', transform: 'none' } }}
              />
            )}
          </Stack>
          
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Search */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Vyhľadať..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SearchIcon />
          </Button>
        </Stack>

        {/* Results info */}
        {resultCount !== undefined && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              mb: 2,
              color: 'text.secondary',
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            {resultCount} výsledkov
          </Typography>
        )}

        <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          {/* Quick Filters */}
          {quickFilters.length > 0 && (
            <Accordion 
              expanded={expandedSections.has('quick')}
              onChange={() => toggleSection('quick')}
              sx={{ mb: 1, boxShadow: 'none', '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ⚡ Rýchle filtre
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {quickFilters.map((filter) => (
                    <Chip
                      key={filter.id}
                      label={filter.label}
                      size="medium"
                      color={activeQuickFilter === filter.id ? filter.color : 'default'}
                      variant={activeQuickFilter === filter.id ? 'filled' : 'outlined'}
                      onClick={() => handleQuickFilterSelect(filter.id)}
                      sx={{
                        minHeight: 44, // Touch-friendly
                        fontSize: '0.9rem',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Advanced Filters */}
          {filterSections.map((section) => (
            <Accordion
              key={section.id}
              expanded={expandedSections.has(section.id)}
              onChange={() => toggleSection(section.id)}
              sx={{ mb: 1, boxShadow: 'none', '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {section.icon}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                  {filters[section.id] && filters[section.id] !== 'all' && (
                    <Chip size="small" label="✓" color="primary" />
                  )}
                </Stack>
              </AccordionSummary>
              
              <AccordionDetails>
                {section.type === 'select' && (
                  <FormControl fullWidth size="medium">
                    <InputLabel>{section.title}</InputLabel>
                    <Select
                      value={filters[section.id] || 'all'}
                      label={section.title}
                      onChange={(e) => handleFilterChange(section.id, e.target.value)}
                      MenuProps={{
                        PaperProps: {
                          style: { maxHeight: 200 }
                        }
                      }}
                    >
                      <MenuItem value="all">Všetky</MenuItem>
                      {section.options?.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {section.type === 'text' && (
                  <TextField
                    fullWidth
                    size="medium"
                    placeholder={section.placeholder || section.title}
                    value={filters[section.id] || ''}
                    onChange={(e) => handleFilterChange(section.id, e.target.value)}
                  />
                )}
                
                {section.type === 'boolean' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(filters[section.id])}
                        onChange={(e) => handleFilterChange(section.id, e.target.checked)}
                      />
                    }
                    label={section.title}
                  />
                )}
                
                {section.type === 'date' && (
                  <TextField
                    fullWidth
                    type="date"
                    size="medium"
                    value={filters[section.id] || ''}
                    onChange={(e) => handleFilterChange(section.id, e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />
        
        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ClearIcon />}
            onClick={handleReset}
            disabled={!hasActiveFilters && !searchQuery}
            sx={{ minHeight: 48 }}
          >
            Vymazať
          </Button>
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleApply}
            sx={{ 
              minHeight: 48,
              fontWeight: 600
            }}
          >
            Použiť filtre
            {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default memo(MobileFilterDrawer);