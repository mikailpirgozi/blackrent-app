// ⚡ Performance Optimized List Component
// Demonstrates all performance optimization techniques

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Trash2, Edit, Eye } from 'lucide-react';

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
import { logger } from '@/utils/smartLogger';

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
    const { getStats } = usePerformanceMonitor(`ListItem-${item.id}`);

    // Memoize style calculations
    const statusColor = useShallowMemo(() => {
      switch (item.status) {
        case 'active':
          return 'bg-green-100 text-green-800 hover:bg-green-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        case 'inactive':
          return 'bg-red-100 text-red-800 hover:bg-red-200';
        default:
          return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      }
    }, [item.status]);

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
      <div className="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3">
        <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <CardContent className="p-4">
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
            <div className={item.image ? 'mt-4' : ''}>
              <h3 className="text-lg font-semibold truncate">{item.title}</h3>

              {item.subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {item.subtitle}
                </p>
              )}

              {/* Status and category */}
              <div className="mt-2 flex gap-2 items-center">
                <Badge className={statusColor}>{item.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {item.category}
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleView}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zobraziť</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upraviť</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Odstrániť</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
      logger.debug('List performance stats:', {
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
        count={4}
        showText={true}
        showButtons={true}
      />
    );
  }

  const content = (
    <div className="grid grid-cols-12 gap-6">
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
    </div>
  );

  return (
    <div>
      {/* Virtual scrolling container */}
      {enableVirtualScrolling ? (
        <div
          className="overflow-auto relative"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          <div className="relative" style={{ height: totalHeight }}>
            <div
              className="relative"
              style={{ transform: `translateY(${offsetY}px)` }}
            >
              {content}
            </div>
          </div>
        </div>
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
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            🔧 Performance: {items.length} items, Virtual:{' '}
            {enableVirtualScrolling ? 'ON' : 'OFF'}
            {enableVirtualScrolling &&
              ` (${visibleRange.startIndex}-${visibleRange.endIndex} visible)`}
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizedList;
