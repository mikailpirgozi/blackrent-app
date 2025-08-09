/**
 * 🚀 OPTIMIZED RENTAL LIST - Booking.com Performance Level
 * 
 * Features:
 * - Infinite scrolling (no limits!)
 * - Image lazy loading with thumbnails
 * - React.memo optimizations
 * - Smart caching
 * - Mobile-first design
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as ProtocolIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

import { useApp } from '../../context/AppContext';
import { Rental } from '../../types';
import { useInfiniteRentals } from '../../hooks/useInfiniteData';
import { RentalScrollContainer } from '../common/InfiniteScrollContainer';
import { OptimizedImage, ThumbnailImage } from '../common/OptimizedImage';
import RentalAdvancedFilters, { FilterState } from './RentalAdvancedFilters';

// 🎯 MEMOIZED RENTAL CARD - prevents unnecessary re-renders
const RentalCard = memo<{
  rental: Rental;
  index: number;
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
  onCreateProtocol: (rental: Rental, type: 'handover' | 'return') => void;
}>(({ rental, index, onEdit, onDelete, onCreateProtocol }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🚗 Vehicle info
  const vehicle = rental.vehicle || {};
  const vehicleDisplay = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Neznáme vozidlo';
  
  // 📅 Date formatting
  const startDate = format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk });
  const endDate = format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk });
  
  // 💰 Price formatting
  const totalPrice = rental.totalPrice ? `€${rental.totalPrice}` : 'Nezadané';
  
  // 🎯 Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'active': return 'info';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 1,
        '&:hover': { 
          boxShadow: theme.shadows[4],
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease'
        },
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          
          {/* 🖼️ VEHICLE IMAGE - Optimized with lazy loading */}
          <Box sx={{ flexShrink: 0 }}>
            <ThumbnailImage
              src={vehicle.imageUrl || '/api/placeholder/150/100'}
              alt={vehicleDisplay}
              width={isMobile ? 80 : 120}
              height={isMobile ? 60 : 80}
              style={{ borderRadius: 8 }}
            />
          </Box>

          {/* 📋 RENTAL INFO */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            
            {/* Header row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: theme.palette.primary.main,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                lineHeight: 1.2
              }}>
                {vehicleDisplay}
              </Typography>
              
              <Chip
                label={rental.status || 'Neznámy'}
                color={getStatusColor(rental.status) as any}
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>

            {/* Customer & License plate */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              👤 {rental.customerName || 'Neznámy zákazník'}
              {vehicle.licensePlate && ` • 🚗 ${vehicle.licensePlate}`}
            </Typography>

            {/* Dates */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              📅 {startDate} - {endDate}
            </Typography>

            {/* Price */}
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              color: theme.palette.success.main,
              mb: 2
            }}>
              💰 {totalPrice}
            </Typography>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Tooltip title="Upraviť prenájom">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => onEdit(rental)}
                  sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Odovzdávací protokol">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => onCreateProtocol(rental, 'handover')}
                  sx={{ bgcolor: 'rgba(46, 125, 50, 0.08)' }}
                >
                  <ProtocolIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Zmazať prenájom">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(rental.id)}
                  sx={{ bgcolor: 'rgba(211, 47, 47, 0.08)' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

RentalCard.displayName = 'RentalCard';

// 🚀 MAIN COMPONENT
export default function RentalListOptimizedNew() {
  const { state } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🔍 Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    status: 'all',
    paymentMethod: 'all',
    company: 'all',
    dateFrom: '',
    dateTo: '',
    priceMin: '',
    priceMax: '',
    protocolStatus: 'all',
    customerName: '',
    vehicleBrand: 'all',
    vehicleModel: '',
    licensePlate: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    insuranceCompany: 'all',
    insuranceType: 'all',
    timeFilter: 'all',
    priceRange: 'all',
    paymentStatus: 'all',
    showOnlyActive: false,
    showOnlyOverdue: false,
    showOnlyCompleted: false,
  });

  // 🚀 INFINITE SCROLL DATA
  const infiniteRentals = useInfiniteRentals({
    data: state.rentals || [],
    pageSize: 15, // Load 15 at a time - Booking.com style
    searchQuery,
    filters: advancedFilters,
    sortFn: (a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
  });

  // 🎯 MEMOIZED HANDLERS
  const handleEdit = useCallback((rental: Rental) => {
    console.log('Edit rental:', rental.id);
    // TODO: Open edit dialog
  }, []);

  const handleDelete = useCallback((rentalId: string) => {
    if (window.confirm('Naozaj chcete zmazať tento prenájom?')) {
      console.log('Delete rental:', rentalId);
      // TODO: Delete rental
    }
  }, []);

  const handleCreateProtocol = useCallback((rental: Rental, type: 'handover' | 'return') => {
    console.log('Create protocol:', type, rental.id);
    // TODO: Open protocol dialog
  }, []);

  // 🎨 RENDER RENTAL ITEM
  const renderRentalItem = useCallback((rental: Rental, index: number) => (
    <RentalCard
      key={rental.id}
      rental={rental}
      index={index}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreateProtocol={handleCreateProtocol}
    />
  ), [handleEdit, handleDelete, handleCreateProtocol]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      
      {/* 📊 HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: theme.palette.primary.main,
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          🚗 Prenájmy vozidiel
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          📊 Zobrazené: {infiniteRentals.displayedCount} z {infiniteRentals.totalItems} prenájmov
          {infiniteRentals.progress < 100 && ` (${infiniteRentals.progress}% načítaných)`}
        </Typography>
      </Box>

      {/* 🔍 FILTERS */}
      <RentalAdvancedFilters
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onReset={() => setAdvancedFilters({
          status: 'all',
          paymentMethod: 'all',
          company: 'all',
          dateFrom: '',
          dateTo: '',
          priceMin: '',
          priceMax: '',
          protocolStatus: 'all',
          customerName: '',
          vehicleBrand: 'all',
          vehicleModel: '',
          licensePlate: '',
          customerEmail: '',
          customerPhone: '',
          customerCompany: '',
          insuranceCompany: 'all',
          insuranceType: 'all',
          timeFilter: 'all',
          priceRange: 'all',
          paymentStatus: 'all',
          showOnlyActive: false,
          showOnlyOverdue: false,
          showOnlyCompleted: false,
        })}
        onSavePreset={() => console.log('Save preset')}
        availableStatuses={['confirmed', 'active', 'completed', 'cancelled']}
        availableCompanies={[...new Set((state.rentals || []).map(r => r.company).filter(Boolean))]}
        availablePaymentMethods={['hotovosť', 'karta', 'prevod']}
        availableVehicleBrands={[...new Set((state.vehicles || []).map(v => v.brand).filter(Boolean))]}
        availableInsuranceCompanies={['Allianz', 'Generali', 'UNIQA']}
        availableInsuranceTypes={['povinné', 'kasko', 'úrazové']}
      />

      {/* 🚀 INFINITE SCROLL LIST */}
      <RentalScrollContainer
        items={infiniteRentals.displayedItems}
        hasMore={infiniteRentals.hasMore}
        isLoading={infiniteRentals.isLoading}
        loadMore={infiniteRentals.loadMore}
        renderItem={renderRentalItem}
        height={isMobile ? 500 : 600}
        showProgress={true}
        totalItems={infiniteRentals.totalItems}
        progress={infiniteRentals.progress}
      />
    </Box>
  );
}
