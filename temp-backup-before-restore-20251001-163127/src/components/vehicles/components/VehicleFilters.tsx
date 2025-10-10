import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  Box,
  TextField,
  IconButton,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Divider,
  FormGroup,
  Typography,
} from '@mui/material';
import React from 'react';

import type { VehicleCategory } from '../../../types';

interface VehicleFiltersProps {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filter toggle
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;

  // Filter states
  filterBrand: string;
  setFilterBrand: (brand: string) => void;
  filterModel: string;
  setFilterModel: (model: string) => void;
  filterCompany: string;
  setFilterCompany: (company: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterCategory: VehicleCategory | 'all';
  setFilterCategory: (category: VehicleCategory | 'all') => void;

  // Status checkboxes
  showAvailable: boolean;
  setShowAvailable: (show: boolean) => void;
  showRented: boolean;
  setShowRented: (show: boolean) => void;
  showMaintenance: boolean;
  setShowMaintenance: (show: boolean) => void;
  showOther: boolean;
  setShowOther: (show: boolean) => void;
  showPrivate: boolean;
  setShowPrivate: (show: boolean) => void;
  showRemoved: boolean;
  setShowRemoved: (show: boolean) => void;
  showTempRemoved: boolean;
  setShowTempRemoved: (show: boolean) => void;

  // Data for dropdowns
  uniqueBrands: string[];
  uniqueModels: string[];
  uniqueCompanies: string[];
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filtersOpen,
  setFiltersOpen,
  filterBrand,
  setFilterBrand,
  filterModel,
  setFilterModel,
  filterCompany,
  setFilterCompany,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  showAvailable,
  setShowAvailable,
  showRented,
  setShowRented,
  showMaintenance,
  setShowMaintenance,
  showOther,
  setShowOther,
  showPrivate,
  setShowPrivate,
  showRemoved,
  setShowRemoved,
  showTempRemoved,
  setShowTempRemoved,
  uniqueBrands,
  uniqueModels,
  uniqueCompanies,
}) => {
  return (
    <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <CardContent>
        {/* Search Bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Hľadať vozidlá..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <UnifiedIcon name="search" sx={{ color: '#666', mr: 1 }} />,
            }}
            sx={{ flex: 1 }}
          />
          <IconButton
            onClick={() => setFiltersOpen(!filtersOpen)}
            sx={{
              bgcolor: filtersOpen ? '#1976d2' : '#f5f5f5',
              color: filtersOpen ? 'white' : '#666',
              '&:hover': {
                bgcolor: filtersOpen ? '#1565c0' : '#e0e0e0',
              },
            }}
          >
            <UnifiedIcon name="filter" />
          </IconButton>
        </Box>

        {/* Filters */}
        <Collapse in={filtersOpen}>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Značka</InputLabel>
                <Select
                  value={filterBrand}
                  label="Značka"
                  onChange={e => setFilterBrand(e.target.value)}
                >
                  <MenuItem value="">Všetky značky</MenuItem>
                  {uniqueBrands.map(brand => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Model</InputLabel>
                <Select
                  value={filterModel}
                  label="Model"
                  onChange={e => setFilterModel(e.target.value)}
                >
                  <MenuItem value="">Všetky modely</MenuItem>
                  {uniqueModels.map(model => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Firma</InputLabel>
                <Select
                  value={filterCompany}
                  label="Firma"
                  onChange={e => setFilterCompany(e.target.value)}
                >
                  <MenuItem value="">Všetky firmy</MenuItem>
                  {uniqueCompanies.map(company => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">Všetky statusy</MenuItem>
                  <MenuItem value="available">Dostupné</MenuItem>
                  <MenuItem value="rented">Prenajaté</MenuItem>
                  <MenuItem value="maintenance">Údržba</MenuItem>
                  <MenuItem value="temporarily_removed">
                    Dočasne vyradené
                  </MenuItem>
                  <MenuItem value="removed">Vyradené</MenuItem>
                  <MenuItem value="transferred">Prepisané</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategória</InputLabel>
                <Select
                  value={filterCategory}
                  label="Kategória"
                  onChange={e =>
                    setFilterCategory(e.target.value as VehicleCategory | 'all')
                  }
                >
                  <MenuItem value="all">Všetky kategórie</MenuItem>
                  <MenuItem value="nizka-trieda">🚗 Nízka trieda</MenuItem>
                  <MenuItem value="stredna-trieda">🚙 Stredná trieda</MenuItem>
                  <MenuItem value="vyssia-stredna">🚘 Vyššia stredná</MenuItem>
                  <MenuItem value="luxusne">💎 Luxusné</MenuItem>
                  <MenuItem value="sportove">🏎️ Športové</MenuItem>
                  <MenuItem value="suv">🚜 SUV</MenuItem>
                  <MenuItem value="viacmiestne">👨‍👩‍👧‍👦 Viacmiestne</MenuItem>
                  <MenuItem value="dodavky">📦 Dodávky</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Status Checkboxes */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
              Zobraziť statusy:
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showAvailable}
                    onChange={e => setShowAvailable(e.target.checked)}
                  />
                }
                label="Dostupné"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showRented}
                    onChange={e => setShowRented(e.target.checked)}
                  />
                }
                label="Prenajaté"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showMaintenance}
                    onChange={e => setShowMaintenance(e.target.checked)}
                  />
                }
                label="Údržba"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOther}
                    onChange={e => setShowOther(e.target.checked)}
                  />
                }
                label="Ostatné"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showPrivate}
                    onChange={e => setShowPrivate(e.target.checked)}
                  />
                }
                label="🏠 Súkromné"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showRemoved}
                    onChange={e => setShowRemoved(e.target.checked)}
                  />
                }
                label="🗑️ Vyradené"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showTempRemoved}
                    onChange={e => setShowTempRemoved(e.target.checked)}
                  />
                }
                label="⏸️ Dočasne vyradené"
              />
            </FormGroup>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default VehicleFilters;
