import React from 'react';
import { Box, Card, CardContent, Skeleton, Typography, useTheme, alpha } from '@mui/material';
import { EnhancedLoading } from './EnhancedLoading';

// Špecializované loading komponenty pre BlackRent entities

export const RentalCardLoading = () => (
  <Card sx={{ mb: 2, opacity: 0.7 }}>
    <CardContent>
      {/* Header s customer a dates */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1.5 }} />
          <Box>
            <Skeleton variant="text" width={120} height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={80} height={16} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
      </Box>
      
      {/* Vehicle info */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="rectangular" width={40} height={40} sx={{ mr: 2, borderRadius: 1 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={18} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>
      </Box>
      
      {/* Dates and price */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={60} height={14} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="100%" height={16} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={60} height={14} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="100%" height={16} />
        </Box>
        <Box>
          <Skeleton variant="text" width={40} height={14} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={60} height={18} />
        </Box>
      </Box>
      
      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

export const VehicleCardLoading = () => (
  <Card sx={{ mb: 2, opacity: 0.7 }}>
    <CardContent>
      {/* Vehicle header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Skeleton variant="text" width={140} height={22} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={100} height={16} />
        </Box>
        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
      </Box>
      
      {/* Vehicle details */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="text" width={60} height={16} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="text" width={120} height={16} />
          <Skeleton variant="text" width={80} height={16} />
        </Box>
      </Box>
      
      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

export const CustomerCardLoading = () => (
  <Card sx={{ mb: 2, opacity: 0.7 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Skeleton variant="rectangular" width={20} height={16} />
          <Skeleton variant="text" width={140} height={16} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Skeleton variant="rectangular" width={20} height={16} />
          <Skeleton variant="text" width={120} height={16} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={20} height={16} />
          <Skeleton variant="text" width={80} height={16} />
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

export const StatisticsCardLoading = () => {
  const theme = useTheme();
  
  return (
    <Card sx={{ mb: 2, opacity: 0.7 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="rectangular" width={32} height={32} sx={{ mr: 2, borderRadius: 1 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="50%" height={18} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="30%" height={14} />
          </Box>
          <Skeleton variant="text" width={60} height={24} />
        </Box>
        
        {/* Chart area */}
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1, mb: 2 }} />
        
        {/* Stats footer */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Skeleton variant="text" width="60%" height={16} sx={{ mb: 0.5, mx: 'auto' }} />
            <Skeleton variant="text" width="40%" height={12} sx={{ mx: 'auto' }} />
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Skeleton variant="text" width="60%" height={16} sx={{ mb: 0.5, mx: 'auto' }} />
            <Skeleton variant="text" width="40%" height={12} sx={{ mx: 'auto' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const TableRowLoading = ({ columns = 5 }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
    {Array.from({ length: columns }, (_, index) => (
      <Box key={index} sx={{ flex: 1, mr: index < columns - 1 ? 2 : 0 }}>
        <Skeleton variant="text" width={`${80 + Math.random() * 40}%`} height={18} />
      </Box>
    ))}
  </Box>
);

// Wrapper komponenty pre easy integration
export const LoadingWrapper: React.FC<{
  loading: boolean;
  variant?: 'rentals' | 'vehicles' | 'customers' | 'statistics' | 'table';
  count?: number;
  children: React.ReactNode;
}> = ({ loading, variant = 'rentals', count = 3, children }) => {
  if (!loading) {
    return <>{children}</>;
  }

  const renderLoadingCards = () => {
    switch (variant) {
      case 'rentals':
        return Array.from({ length: count }, (_, index) => <RentalCardLoading key={index} />);
      case 'vehicles':
        return Array.from({ length: count }, (_, index) => <VehicleCardLoading key={index} />);
      case 'customers':
        return Array.from({ length: count }, (_, index) => <CustomerCardLoading key={index} />);
      case 'statistics':
        return Array.from({ length: count }, (_, index) => <StatisticsCardLoading key={index} />);
      case 'table':
        return Array.from({ length: count }, (_, index) => <TableRowLoading key={index} />);
      default:
        return <EnhancedLoading variant="card" count={count} />;
    }
  };

  return <>{renderLoadingCards()}</>;
};

export default LoadingWrapper;