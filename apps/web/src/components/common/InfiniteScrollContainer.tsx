/**
 * 🔄 INFINITE SCROLL CONTAINER
 *
 * Booking.com štýl infinite scrolling wrapper:
 * - Smooth loading animations
 * - Progress indicator
 * - Error handling
 * - Mobile optimized
 */

import { UnifiedTypography } from '../ui/UnifiedTypography';
import { Spinner } from '../ui/spinner';
import { Progress } from '../ui/progress';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

interface InfiniteScrollContainerProps<T = unknown> {
  // Data
  items: T[];
  hasMore: boolean;
  isLoading: boolean;

  // Actions
  loadMore: () => void;

  // Render
  renderItem: (item: T, index: number) => React.ReactNode;

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

export const InfiniteScrollContainer = <T,>({
  items,
  hasMore,
  isLoading,
  loadMore,
  renderItem,
  height = 600,
  itemHeight = 120,
  showProgress = true,
  emptyMessage = 'Žiadne položky',
  loadingMessage = 'Načítavam...',
  endMessage = '✅ Všetko načítané',
  totalItems,
  progress = 0,
}: InfiniteScrollContainerProps<T>) => {
  // 🔄 Loading component
  const LoadingComponent = () => (
    <div className="p-4 flex flex-col items-center gap-4">
      <Spinner size={24} />
      <UnifiedTypography variant="body2" color="textSecondary">
        {loadingMessage}
      </UnifiedTypography>
    </div>
  );

  // ✅ End message component
  const EndComponent = () => (
    <div className="p-6 text-center">
      <UnifiedTypography
        variant="body2"
        color="textSecondary"
        className="font-medium"
      >
        {endMessage}
      </UnifiedTypography>
      {totalItems && (
        <UnifiedTypography
          variant="caption"
          color="textSecondary"
          className="mt-2 block"
        >
          Zobrazených {items.length} z {totalItems} položiek
        </UnifiedTypography>
      )}
    </div>
  );

  // 📊 Progress bar
  const ProgressBar = () => {
    if (!showProgress || !totalItems) return null;

    return (
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <UnifiedTypography variant="caption" color="textSecondary">
            Načítané: {items.length} / {totalItems}
          </UnifiedTypography>
          <UnifiedTypography variant="caption" color="textSecondary">
            {progress}%
          </UnifiedTypography>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
    );
  };

  // 📱 Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div 
        className="flex items-center justify-center flex-col gap-4 text-muted-foreground"
        style={{ height }}
      >
        <UnifiedTypography variant="h6">📋 {emptyMessage}</UnifiedTypography>
        <UnifiedTypography variant="body2">
          Skúste zmeniť filter alebo vyhľadávanie
        </UnifiedTypography>
      </div>
    );
  }

  return (
    <div 
      className="border border-border rounded-lg overflow-hidden"
      style={{ height }}
    >
      {/* Progress bar */}
      <ProgressBar />

      {/* Infinite scroll content */}
      <InfiniteScroll
        dataLength={items.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<LoadingComponent />}
        endMessage={<EndComponent />}
        height={
          typeof height === 'number'
            ? height - (showProgress && totalItems ? 60 : 0)
            : height
        }
        style={{
          padding: '8px',
          overflowX: 'hidden', // Prevent horizontal scroll
        }}
        // 🚀 Performance optimizations
        scrollThreshold={0.8} // Load more at 80% scroll
        pullDownToRefreshThreshold={50}
      >
        {items.map((item, index) => (
          <div
            key={(item as { id?: string | number }).id || index}
            className="mb-2 last:mb-0"
            style={{ minHeight: itemHeight }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};

// 🎯 Specialized containers for different data types
interface RentalScrollContainerProps
  extends Omit<
    InfiniteScrollContainerProps,
    'emptyMessage' | 'loadingMessage'
  > {}

export const RentalScrollContainer: React.FC<
  RentalScrollContainerProps
> = props => (
  <InfiniteScrollContainer
    {...props}
    emptyMessage="Žiadne prenájmy"
    loadingMessage="Načítavam prenájmy..."
    endMessage="✅ Všetky prenájmy načítané"
    itemHeight={140}
  />
);

export const VehicleScrollContainer: React.FC<
  RentalScrollContainerProps
> = props => (
  <InfiniteScrollContainer
    {...props}
    emptyMessage="Žiadne vozidlá"
    loadingMessage="Načítavam vozidlá..."
    endMessage="✅ Všetky vozidlá načítané"
    itemHeight={120}
  />
);

export const CustomerScrollContainer: React.FC<
  RentalScrollContainerProps
> = props => (
  <InfiniteScrollContainer
    {...props}
    emptyMessage="Žiadni zákazníci"
    loadingMessage="Načítavam zákazníkov..."
    endMessage="✅ Všetci zákazníci načítaní"
    itemHeight={100}
  />
);

export default InfiniteScrollContainer;
