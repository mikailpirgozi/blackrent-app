import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import AvailabilityCalendar from '../components/availability/AvailabilityCalendar';
import { useApp } from '../context/AppContext';

const AvailabilityPageNew: React.FC = () => {
  const { state } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAvailable, setShowAvailable] = useState(true);
  const [showRented, setShowRented] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);

  // Get unique companies for filter
  const uniqueCompanies = [...new Set(state.vehicles.map(v => v.company))].sort();

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
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="">Všetky statusy</MenuItem>
                    <MenuItem value="available">Dostupné</MenuItem>
                    <MenuItem value="rented">Prenajaté</MenuItem>
                    <MenuItem value="maintenance">Údržba</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ color: '#666', minWidth: 'fit-content' }}>
                    Zobraziť:
                  </Typography>
                  <Chip
                    label="Dostupné"
                    variant={showAvailable ? 'filled' : 'outlined'}
                    color={showAvailable ? 'success' : 'default'}
                    size="small"
                    onClick={() => setShowAvailable(!showAvailable)}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Prenajaté"
                    variant={showRented ? 'filled' : 'outlined'}
                    color={showRented ? 'warning' : 'default'}
                    size="small"
                    onClick={() => setShowRented(!showRented)}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Údržba"
                    variant={showMaintenance ? 'filled' : 'outlined'}
                    color={showMaintenance ? 'error' : 'default'}
                    size="small"
                    onClick={() => setShowMaintenance(!showMaintenance)}
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>
              </Grid>
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
                {state.vehicles.filter(v => v.status === 'available').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Dostupné
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
                {state.vehicles.filter(v => v.status === 'rented').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Prenajaté
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
                {state.vehicles.filter(v => v.status === 'maintenance').length}
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
                {state.vehicles.length}
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
          <AvailabilityCalendar searchQuery={searchQuery} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AvailabilityPageNew; 