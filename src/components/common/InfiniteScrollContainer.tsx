/**
 * 🔄 INFINITE SCROLL CONTAINER
 * 
 * Booking.com štýl infinite scrolling wrapper:
 * - Smooth loading animations
 * - Progress indicator
 * - Error handling
 * - Mobile optimized
 */

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Box, LinearProgress, Typography, Skeleton, CircularProgress } from '@mui/material';

interface InfiniteScrollContainerProps {
  // Data
  items: any[];
  hasMore: boolean;
  isLoading: boolean;
  
  // Actions
  loadMore: () => void;
  
  // Render
  renderItem: (item: any, index: number) => React.ReactNode;
  
  // Config
  height?: number | string;
  itemHeight?: number;
  showProgress?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  endMessage?: string;
  
  // Stats
  totalItems?: number;
  progress?: number;
}

export const InfiniteScrollContainer: React.FC<InfiniteScrollContainerProps> = ({
  items,
  hasMore,
  isLoading,
  loadMore,
  renderItem,
  height = 600,
  itemHeight = 120,
  showProgress = true,
  emptyMessage = "Žiadne položky",
  loadingMessage = "Načítavam...",
  endMessage = "✅ Všetko načítané",
  totalItems,
  progress = 0
}) => {

  // 🔄 Loading component
  const LoadingComponent = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <CircularProgress size={24} />
      <Typography variant="body2" color="text.secondary">
        {loadingMessage}
      </Typography>
    </Box>
  );

  // ✅ End message component
  const EndComponent = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {endMessage}
      </Typography>
      {totalItems && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Zobrazených {items.length} z {totalItems} položiek
        </Typography>
      )}
    </Box>
  );

  // 📊 Progress bar
  const ProgressBar = () => {
    if (!showProgress || !totalItems) return null;
    
    return (
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Načítané: {items.length} / {totalItems}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {progress}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 4, 
            borderRadius: 2,
            backgroundColor: '#f0f0f0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#1976d2'
            }
          }} 
        />
      </Box>
    );
  };

  // 📱 Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          color: 'text.secondary'
        }}
      >
        <Typography variant="h6">
          📋 {emptyMessage}
        </Typography>
        <Typography variant="body2">
          Skúste zmeniť filter alebo vyhľadávanie
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
      {/* Progress bar */}
      <ProgressBar />
      
      {/* Infinite scroll content */}
      <InfiniteScroll
        dataLength={items.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<LoadingComponent />}
        endMessage={<EndComponent />}
        height={typeof height === 'number' ? height - (showProgress && totalItems ? 60 : 0) : height}
        style={{
          padding: '8px',
          overflowX: 'hidden' // Prevent horizontal scroll
        }}
        // 🚀 Performance optimizations
        scrollThreshold={0.8} // Load more at 80% scroll
        pullDownToRefreshThreshold={50}
      >
        {items.map((item, index) => (
          <Box
            key={item.id || index}
            sx={{
              minHeight: itemHeight,
              marginBottom: 1,
              '&:last-child': {
                marginBottom: 0
              }
            }}
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </InfiniteScroll>
    </Box>
  );
};

// 🎯 Specialized containers for different data types
interface RentalScrollContainerProps extends Omit<InfiniteScrollContainerProps, 'emptyMessage' | 'loadingMessage'> {}

export const RentalScrollContainer: React.FC<RentalScrollContainerProps> = (props) => (
  <InfiniteScrollContainer
    {...props}
    emptyMessage="Žiadne prenájmy"
    loadingMessage="Načítavam prenájmy..."
    endMessage="✅ Všetky prenájmy načítané"
    itemHeight={140}
  />
);

export const VehicleScrollContainer: React.FC<RentalScrollContainerProps> = (props) => (
  <InfiniteScrollContainer
    {...props}
    emptyMessage="Žiadne vozidlá"
    loadingMessage="Načítavam vozidlá..."
    endMessage="✅ Všetky vozidlá načítané"
    itemHeight={120}
  />
);

export const CustomerScrollContainer: React.FC<RentalScrollContainerProps> = (props) => (
  <InfiniteScrollContainer
    {...props}
    emptyMessage="Žiadni zákazníci"
    loadingMessage="Načítavam zákazníkov..."
    endMessage="✅ Všetci zákazníci načítaní"
    itemHeight={100}
  />
);

export default InfiniteScrollContainer;
