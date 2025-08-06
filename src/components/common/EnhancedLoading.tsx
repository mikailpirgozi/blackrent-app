import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';

interface EnhancedLoadingProps {
  variant?: 'card' | 'list' | 'table' | 'button' | 'inline' | 'page';
  count?: number;
  height?: number | string;
  width?: number | string;
  message?: string;
  showMessage?: boolean;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  variant = 'card',
  count = 1,
  height = 'auto',
  width = '100%',
  message = 'Načítavam...',
  showMessage = true,
}) => {
  const theme = useTheme();

  // Card skeleton - pre všetky entity (rentals, vehicles, customers)
  const CardSkeleton = () => (
    <Card sx={{ mb: 2, opacity: 0.7 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1, mb: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );

  // List skeleton - pre jednoduché zoznamy
  const ListSkeleton = () => (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mr: 2 }} />
        <Skeleton variant="text" width="30%" height={20} />
      </Box>
    </Box>
  );

  // Table skeleton - pre tabuľky  
  const TableSkeleton = () => (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Skeleton variant="text" width="20%" height={20} sx={{ mr: 2 }} />
        <Skeleton variant="text" width="25%" height={20} sx={{ mr: 2 }} />
        <Skeleton variant="text" width="15%" height={20} sx={{ mr: 2 }} />
        <Skeleton variant="text" width="20%" height={20} sx={{ mr: 2 }} />
        <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </Box>
  );

  // Button loading - pre buttons
  const ButtonLoading = () => (
    <CircularProgress 
      size={20} 
      sx={{ 
        color: 'inherit',
        mr: showMessage ? 1 : 0
      }} 
    />
  );

  // Inline loading - pre menšie komponenty
  const InlineLoading = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <CircularProgress 
        size={24} 
        sx={{ 
          mr: showMessage ? 2 : 0,
          color: 'primary.main'
        }} 
      />
      {showMessage && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  // Page loading - pre celé stránky
  const PageLoading = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '300px',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderRadius: 2,
        p: 4
      }}
    >
      <CircularProgress 
        size={50} 
        thickness={4}
        sx={{ 
          color: 'primary.main',
          mb: 2,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      {showMessage && (
        <>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Optimalizované načítavanie
          </Typography>
        </>
      )}
    </Box>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }, (_, index) => (
          <CardSkeleton key={index} />
        ));
      case 'list':
        return Array.from({ length: count }, (_, index) => (
          <ListSkeleton key={index} />
        ));
      case 'table':
        return Array.from({ length: count }, (_, index) => (
          <TableSkeleton key={index} />
        ));
      case 'button':
        return <ButtonLoading />;
      case 'inline':
        return <InlineLoading />;
      case 'page':
        return <PageLoading />;
      default:
        return <InlineLoading />;
    }
  };

  return (
    <Box sx={{ width, height }}>
      {renderSkeleton()}
    </Box>
  );
};

// Convenience hooks pre rôzne use cases
export const useLoadingState = () => {
  const [loading, setLoading] = React.useState(false);
  
  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);
  
  return { loading, startLoading, stopLoading };
};

// HOC pre automatic loading wrapping
export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingVariant: EnhancedLoadingProps['variant'] = 'card'
) => {
  const WithLoadingComponent = (props: P & { loading?: boolean }) => {
    const { loading, ...otherProps } = props;
    
    if (loading) {
      return <EnhancedLoading variant={loadingVariant} />;
    }
    
    return <WrappedComponent {...(otherProps as P)} />;
  };
  
  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithLoadingComponent;
};

export default EnhancedLoading;