// 📋 Mobile Optimized List Component
// High-performance list with virtual scrolling, pull-to-refresh, and mobile gestures

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  CircularProgress,
  IconButton,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  KeyboardArrowUp as ScrollTopIcon,
} from '@mui/icons-material';
import { FixedSizeList as VirtualList } from 'react-window';
import { touchManager, isMobile } from '../../utils/mobileOptimization';
import MobileGestureHandler from './MobileGestureHandler';

interface ListItemData {
  id: string | number;
  [key: string]: any;
}

interface MobileOptimizedListProps<T extends ListItemData> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onLoadMore?: () => Promise<void> | void;
  hasMore?: boolean;
  itemHeight?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  pullToRefreshThreshold?: number;
  loadMoreThreshold?: number;
  className?: string;
  enableVirtualization?: boolean;
  maxHeight?: number | string;
  onItemClick?: (item: T, index: number) => void;
  onItemLongPress?: (item: T, index: number) => void;
  onItemSwipeLeft?: (item: T, index: number) => void;
  onItemSwipeRight?: (item: T, index: number) => void;
}

const MobileOptimizedList = <T extends ListItemData>({
  items,
  renderItem,
  loading = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  itemHeight = 80,
  emptyMessage = 'Žiadne položky',
  emptyIcon,
  pullToRefreshThreshold = 80,
  loadMoreThreshold = 200,
  className,
  enableVirtualization = true,
  maxHeight = '100%',
  onItemClick,
  onItemLongPress,
  onItemSwipeLeft,
  onItemSwipeRight,
}: MobileOptimizedListProps<T>) => {
  const theme = useTheme();
  const listRef = useRef<HTMLDivElement>(null);
  const virtualListRef = useRef<VirtualList>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  // Handle pull-to-refresh
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (listRef.current && listRef.current.scrollTop === 0) {
      setStartY(event.touches[0].clientY);
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isPulling || !onRefresh) return;

    const currentY = event.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0 && listRef.current && listRef.current.scrollTop === 0) {
      setPullDistance(Math.min(distance, pullToRefreshThreshold * 1.5));
      
      // Prevent default scrolling when pulling
      if (distance > 10) {
        event.preventDefault();
      }
    }
  }, [isPulling, startY, onRefresh, pullToRefreshThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= pullToRefreshThreshold && onRefresh && !refreshing) {
      setRefreshing(true);
      touchManager.triggerHapticFeedback('medium');
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, pullToRefreshThreshold, onRefresh, refreshing]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Show/hide scroll to top button
    setShowScrollTop(scrollTop > 300);

    // Load more when near bottom
    if (
      hasMore &&
      !loadingMore &&
      onLoadMore &&
      scrollHeight - scrollTop - clientHeight < loadMoreThreshold
    ) {
      setLoadingMore(true);
              Promise.resolve(onLoadMore()).finally(() => setLoadingMore(false));
    }
  }, [hasMore, loadingMore, onLoadMore, loadMoreThreshold]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (virtualListRef.current) {
      virtualListRef.current.scrollToItem(0, 'start');
    } else if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    touchManager.triggerHapticFeedback('light');
  }, []);

  // Virtual list item renderer
  const VirtualListItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style}>
        <MobileGestureHandler
          callbacks={{
            onTap: () => onItemClick?.(item, index),
            onLongPress: () => onItemLongPress?.(item, index),
            onSwipeLeft: () => onItemSwipeLeft?.(item, index),
            onSwipeRight: () => onItemSwipeRight?.(item, index),
          }}
        >
          <ListItem
            sx={{
              height: itemHeight,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
              '&:active': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                transform: 'scale(0.98)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {renderItem(item, index)}
          </ListItem>
        </MobileGestureHandler>
      </div>
    );
  }, [items, itemHeight, theme, renderItem, onItemClick, onItemLongPress, onItemSwipeLeft, onItemSwipeRight]);

  // Regular list item renderer
  const RegularListItem = useCallback(({ item, index }: { item: T; index: number }) => (
    <MobileGestureHandler
      key={item.id}
      callbacks={{
        onTap: () => onItemClick?.(item, index),
        onLongPress: () => onItemLongPress?.(item, index),
        onSwipeLeft: () => onItemSwipeLeft?.(item, index),
        onSwipeRight: () => onItemSwipeRight?.(item, index),
      }}
    >
      <ListItem
        sx={{
          minHeight: itemHeight,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
          '&:active': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: 'scale(0.98)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        {renderItem(item, index)}
      </ListItem>
    </MobileGestureHandler>
  ), [itemHeight, theme, renderItem, onItemClick, onItemLongPress, onItemSwipeLeft, onItemSwipeRight]);

  // Memoized empty state
  const EmptyState = useMemo(() => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center',
      }}
    >
      {emptyIcon && (
        <Box sx={{ mb: 2, opacity: 0.6 }}>
          {emptyIcon}
        </Box>
      )}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {emptyMessage}
      </Typography>
    </Box>
  ), [emptyIcon, emptyMessage]);

  // Pull to refresh indicator
  const PullToRefreshIndicator = useMemo(() => {
    if (!onRefresh) return null;

    const progress = Math.min(pullDistance / pullToRefreshThreshold, 1);
    const shouldRefresh = pullDistance >= pullToRefreshThreshold;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          left: 0,
          right: 0,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0)}, ${alpha(theme.palette.background.paper, 0.9)})`,
          transform: `translateY(${Math.min(pullDistance, pullToRefreshThreshold)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            opacity: progress,
            transform: `scale(${0.8 + progress * 0.2})`,
          }}
        >
          <CircularProgress
            size={24}
            variant={shouldRefresh ? 'indeterminate' : 'determinate'}
            value={progress * 100}
            sx={{
              color: shouldRefresh ? theme.palette.primary.main : theme.palette.text.secondary,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: shouldRefresh ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            {shouldRefresh ? 'Pustite pre obnovenie' : 'Ťahajte pre obnovenie'}
          </Typography>
        </Box>
      </Box>
    );
  }, [onRefresh, pullDistance, pullToRefreshThreshold, isPulling, theme, refreshing]);

  // Add touch event listeners
  useEffect(() => {
    const element = listRef.current;
    if (!element || !isMobile()) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Show loading state
  if (loading && items.length === 0) {
    return (
      <Box
        className={className}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Načítavam...
        </Typography>
      </Box>
    );
  }

  // Show empty state
  if (!loading && items.length === 0) {
    return (
      <Box className={className}>
        {EmptyState}
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        height: maxHeight,
        overflow: 'hidden',
      }}
    >
      {PullToRefreshIndicator}

      <Box
        ref={listRef}
        onScroll={handleScroll}
        sx={{
          height: '100%',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {enableVirtualization && items.length > 50 ? (
          <VirtualList
            ref={virtualListRef}
            height={typeof maxHeight === 'number' ? maxHeight : 600}
            width="100%"
            itemCount={items.length}
            itemSize={itemHeight}
            overscanCount={5}
          >
            {VirtualListItem}
          </VirtualList>
        ) : (
          <List sx={{ py: 0 }}>
            {items.map((item, index) => (
              <RegularListItem key={item.id} item={item} index={index} />
            ))}
          </List>
        )}

        {/* Load more indicator */}
        {loadingMore && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Načítavam ďalšie...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Scroll to top button */}
      <Fade in={showScrollTop}>
        <IconButton
          onClick={scrollToTop}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            boxShadow: theme.shadows[4],
            '&:hover': {
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              transform: 'scale(1.1)',
            },
            zIndex: 2,
          }}
        >
          <ScrollTopIcon />
        </IconButton>
      </Fade>

      {/* Refreshing overlay */}
      {refreshing && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            animation: 'shimmer 1.5s infinite',
            zIndex: 3,
          }}
        />
      )}
    </Box>
  );
};

export default MobileOptimizedList;
