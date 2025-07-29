import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  IconButton,
  Button,
  Collapse,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Chip,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  Clear as ClearIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { VehicleCategory } from '../types';
import AvailabilityCalendar from '../components/availability/AvailabilityCalendar';

const AvailabilityPageNew: React.FC = () => {
  const { state, getFilteredVehicles } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [availableFromDate, setAvailableFromDate] = useState('');
  const [availableToDate, setAvailableToDate] = useState('');
  // 🚗 MULTI-SELECT CATEGORY FILTER: Array of selected categories
  const [selectedCategories, setSelectedCategories] = useState<VehicleCategory[]>([]);

  // Get filtered vehicles based on user permissions
  const filteredVehicles = getFilteredVehicles();
  
  // Get unique companies for filter
  const uniqueCompanies = [...new Set(filteredVehicles.map(v => v.company))].sort();

  // 🚗 VEHICLE CATEGORIES with emoji icons
  const vehicleCategories: { value: VehicleCategory; label: string; emoji: string }[] = [
    { value: 'nizka-trieda', label: 'Nízka trieda', emoji: '🚗' },
    { value: 'stredna-trieda', label: 'Stredná trieda', emoji: '🚙' },
    { value: 'vyssia-stredna', label: 'Vyššia stredná trieda', emoji: '🚘' },
    { value: 'luxusne', label: 'Luxusné vozidlá', emoji: '💎' },
    { value: 'sportove', label: 'Športové vozidlá', emoji: '🏎️' },
    { value: 'suv', label: 'SUV', emoji: '🚜' },
    { value: 'viacmiestne', label: 'Viacmiestne vozidlá', emoji: '👨‍👩‍👧‍👦' },
    { value: 'dodavky', label: 'Dodávky', emoji: '📦' }
  ];

  // Handle category selection
  const handleCategoryChange = (event: any) => {
    const value = event.target.value as VehicleCategory[];
    setSelectedCategories(value);
  };

  // Clear all category filters
  const clearCategoryFilters = () => {
    setSelectedCategories([]);
  };

  const handleRefresh = () => {
    // Trigger calendar refresh
    window.location.reload();
  };

  const handleTodayClick = () => {
    // Scroll to today in calendar
    const todayElement = document.querySelector('[data-today="true"]');
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: '#1976d2',
            fontSize: { xs: '1.5rem', sm: '2rem' },
            mb: 0.5
          }}>
            📅 Dostupnosť vozidiel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kalendárny prehľad dostupnosti všetkých vozidiel v systéme
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={handleTodayClick}
            size="small"
          >
            Dnes
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size="small"
          >
            Obnoviť
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Hľadať vozidlá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            <IconButton
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{ 
                bgcolor: filtersOpen ? '#1976d2' : '#f5f5f5',
                color: filtersOpen ? 'white' : '#666',
                '&:hover': { 
                  bgcolor: filtersOpen ? '#1565c0' : '#e0e0e0' 
                }
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Box>

          {/* Filters */}
          <Collapse in={filtersOpen}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Firma</InputLabel>
                  <Select
                    value={selectedCompany}
                    label="Firma"
                    onChange={(e) => setSelectedCompany(e.target.value)}
                  >
                    <MenuItem value="">Všetky firmy</MenuItem>
                    {uniqueCompanies.map(company => (
                      <MenuItem key={company} value={company}>{company}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Kategória vozidla</InputLabel>
                  <Select
                    value={selectedCategories}
                    label="Kategória vozidla"
                    onChange={handleCategoryChange}
                    multiple
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const category = vehicleCategories.find(cat => cat.value === value);
                          return (
                            <Chip
                              key={value}
                              label={`${category?.emoji} ${category?.label}`}
                              size="small"
                              sx={{ bgcolor: '#e0e0e0', color: '#333' }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {vehicleCategories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        <Checkbox checked={selectedCategories.indexOf(category.value) > -1} />
                        <ListItemText primary={category.label} />
                      </MenuItem>
                    ))}
                  </Select>
                  {selectedCategories.length > 0 && (
                    <Button
                      size="small"
                      onClick={clearCategoryFilters}
                      startIcon={<ClearIcon />}
                      sx={{ mt: 1 }}
                    >
                      Vymazať všetky
                    </Button>
                  )}
                </FormControl>
              </Grid>
              
              {/* Date Range Filtre */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
                  📅 Filtrovanie podľa dátumu dostupnosti
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dostupné od dátumu"
                  type="date"
                  size="small"
                  value={availableFromDate}
                  onChange={(e) => setAvailableFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dostupné do dátumu"
                  type="date"
                  size="small"
                  value={availableToDate}
                  onChange={(e) => setAvailableToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {availableFromDate && availableToDate && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 1.5, 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: 1, 
                    border: '1px solid #2196f3',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                        ℹ️ Zobrazujú sa len vozidlá dostupné v období {availableFromDate} - {availableToDate}
                        <br />
                        <span style={{ fontSize: '0.85em' }}>
                          Zahŕňa: dostupné vozidlá + flexibilné prenájmy (ktoré možno prepísať)
                        </span>
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setAvailableFromDate('');
                        setAvailableToDate('');
                      }}
                      sx={{ ml: 2, minWidth: 'auto' }}
                    >
                      ✕ Zrušiť
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {filteredVehicles.filter(v => v.status === 'available').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Dostupné vozidlá
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(255,152,0,0.3)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {filteredVehicles.filter(v => v.status === 'rented').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Klasicky prenajaté
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(244,67,54,0.3)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {filteredVehicles.filter(v => v.status === 'maintenance').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Údržba
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(33,150,243,0.3)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {filteredVehicles.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Celkom
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calendar */}
      <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <AvailabilityCalendar
            searchQuery={searchQuery}
            isMobile={isMobile}
            selectedCompany={selectedCompany}
            categoryFilter={selectedCategories}
            availableFromDate={availableFromDate}
            availableToDate={availableToDate}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AvailabilityPageNew; 