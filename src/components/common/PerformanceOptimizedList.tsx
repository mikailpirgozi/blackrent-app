// ⚡ Performance Optimized List Component
// Demonstrates all performance optimization techniques

import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

// Import our performance optimization tools
import {
  useImagePreloader,
  usePerformanceMonitor,
  useShallowMemo,
  useThrottledCallback,
  useVirtualScrolling,
} from '../../hooks/usePerformanceOptimization';
import { createLazyComponentWithLoader } from '../../utils/lazyComponents';

import { OptimizedImage } from './OptimizedImage';
import { SkeletonLoader } from './SkeletonLoader';

// Lazy load heavy components
const EditDialog = createLazyComponentWithLoader(
  () => import('./LazyEditDialog'), // This would be a heavy edit dialog
  <SkeletonLoader variant="form" />
);

const DetailView = createLazyComponentWithLoader(
  () => import('./LazyDetailView'), // This would be a detailed view
  <SkeletonLoader variant="card" count={1} />
);

// Memoized item component with shallow comparison
interface ListItemProps {
  item: {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    status: 'active' | 'inactive' | 'pending';
    category: string;
    metadata?: Record<string, unknown>;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  index: number;
}

const OptimizedListItem = memo<ListItemProps>(
  ({ item, onEdit, onDelete, onView, index }) => {
    const theme = useTheme();
    // const _isMobile = useMediaQuery(theme.breakpoints.down('md')); // TODO: Implement mobile-specific optimizations
    const { getStats } = usePerformanceMonitor(`ListItem-${item.id}`);

    // Memoize style calculations
    const itemStyles = useShallowMemo(
      () => ({
        card: {
          height: '100%',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.customShadows?.lg || theme.shadows[6],
          },
        },
        statusChip: {
          backgroundColor:
            item.status === 'active'
              ? theme.palette.success.light
              : item.status === 'pending'
                ? theme.palette.warning.light
                : theme.palette.error.light,
        },
      }),
      [item.status, theme]
    );

    // Throttled event handlers
    const handleEdit = useThrottledCallback(() => {
      onEdit(item.id);
    }, 300);

    const handleDelete = useThrottledCallback(() => {
      onDelete(item.id);
    }, 300);

    const handleView = useThrottledCallback(() => {
      onView(item.id);
    }, 300);

    // Performance logging in development
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        const stats = getStats();
        if (stats.maxRenderTime > 16) {
          console.warn(`Slow list item render: ${item.id}`, stats);
        }
      }
    }, [item.id, getStats]);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Card sx={itemStyles.card}>
          <CardContent>
            {/* Optimized image with lazy loading */}
            {item.image && (
              <OptimizedImage
                src={item.image}
                alt={item.title}
                width="100%"
                height={200}
                aspectRatio={16 / 9}
                placeholder="skeleton"
                lazy={index > 6} // First 6 images load immediately
                priority={index < 3} // First 3 are high priority
              />
            )}

            {/* Content */}
            <Box sx={{ mt: item.image ? 2 : 0 }}>
              <Typography variant="h6" noWrap>
                {item.title}
              </Typography>

              {item.subtitle && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {item.subtitle}
                </Typography>
              )}

              {/* Status and category */}
              <Box
                sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}
              >
                <Chip
                  label={item.status}
                  size="small"
                  sx={itemStyles.statusChip}
                />
                <Typography variant="caption" color="text.secondary">
                  {item.category}
                </Typography>
              </Box>

              {/* Action buttons */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Tooltip title="Zobraziť">
                  <IconButton size="small" onClick={handleView}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Upraviť">
                  <IconButton size="small" onClick={handleEdit}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Odstrániť">
                  <IconButton size="small" onClick={handleDelete}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for better memoization
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.item.status === nextProps.item.status &&
      prevProps.item.category === nextProps.item.category &&
      prevProps.index === nextProps.index
    );
  }
);

OptimizedListItem.displayName = 'OptimizedListItem';

// Main list component
interface PerformanceOptimizedListProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    status: 'active' | 'inactive' | 'pending';
    category: string;
    metadata?: Record<string, unknown>;
  }>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  enableVirtualScrolling?: boolean;
  containerHeight?: number;
  itemHeight?: number;
}

export const PerformanceOptimizedList: React.FC<
  PerformanceOptimizedListProps
> = ({
  items,
  onEdit = () => {},
  onDelete = () => {},
  onView = () => {},
  enableVirtualScrolling = false,
  containerHeight = 800,
  itemHeight = 300,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getStats } = usePerformanceMonitor('PerformanceOptimizedList');

  // State for lazy components
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // Preload images for visible items
  const { preloadImages, isLoading: imagesLoading } = useImagePreloader();

  // Virtual scrolling for large lists
  const { visibleItems, totalHeight, offsetY, handleScroll, visibleRange } =
    useVirtualScrolling(items, itemHeight, containerHeight);

  // Memoize filtered and sorted items
  const processedItems = useMemo(() => {
    if (enableVirtualScrolling) {
      return visibleItems.map((item, index) => ({
        ...item,
        originalIndex: visibleRange.startIndex + index,
      }));
    }
    return items.map((item, index) => ({ ...item, originalIndex: index }));
  }, [items, visibleItems, visibleRange, enableVirtualScrolling]);

  // Preload images when component mounts
  useEffect(() => {
    const imageSources = items
      .filter(item => item.image)
      .map(item => item.image!)
      .slice(0, 10); // Preload first 10 images

    if (imageSources.length > 0) {
      preloadImages(imageSources);
    }
  }, [items, preloadImages]);

  // Optimized event handlers
  const handleEditItem = useCallback(
    (id: string) => {
      setSelectedItemId(id);
      setEditDialogOpen(true);
      onEdit(id);
    },
    [onEdit]
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      onDelete(id);
    },
    [onDelete]
  );

  const handleViewItem = useCallback(
    (id: string) => {
      setSelectedItemId(id);
      setDetailViewOpen(true);
      onView(id);
    },
    [onView]
  );

  // Performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const stats = getStats();
      console.log('List performance stats:', {
        ...stats,
        itemCount: items.length,
        virtualScrolling: enableVirtualScrolling,
        imagesLoading: imagesLoading,
      });
    }
  }, [getStats, items.length, enableVirtualScrolling, imagesLoading]);

  // Render loading state
  if (items.length === 0) {
    return (
      <SkeletonLoader
        variant="card"
        count={isMobile ? 2 : 4}
        showText={true}
        showButtons={true}
      />
    );
  }

  const content = (
    <Grid container spacing={3}>
      {processedItems.map(item => (
        <OptimizedListItem
          key={item.id}
          item={item}
          index={item.originalIndex}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onView={handleViewItem}
        />
      ))}
    </Grid>
  );

  return (
    <Box>
      {/* Virtual scrolling container */}
      {enableVirtualScrolling ? (
        <Box
          sx={{
            height: containerHeight,
            overflow: 'auto',
            position: 'relative',
          }}
          onScroll={handleScroll}
        >
          <Box sx={{ height: totalHeight, position: 'relative' }}>
            <Box
              sx={{
                transform: `translateY(${offsetY}px)`,
                position: 'relative',
              }}
            >
              {content}
            </Box>
          </Box>
        </Box>
      ) : (
        content
      )}

      {/* Lazy loaded dialogs */}
      {editDialogOpen && (
        <EditDialog
          itemId={selectedItemId}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
        />
      )}

      {detailViewOpen && (
        <DetailView
          itemId={selectedItemId}
          open={detailViewOpen}
          onClose={() => setDetailViewOpen(false)}
        />
      )}

      {/* Performance info in development */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption">
            🔧 Performance: {items.length} items, Virtual:{' '}
            {enableVirtualScrolling ? 'ON' : 'OFF'}
            {enableVirtualScrolling &&
              ` (${visibleRange.startIndex}-${visibleRange.endIndex} visible)`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PerformanceOptimizedList;
