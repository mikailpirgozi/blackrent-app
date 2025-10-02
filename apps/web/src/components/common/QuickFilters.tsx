/**
 * ⚡ QUICK FILTERS
 *
 * Reusable quick filter chips pre časté vyhľadávania
 */

import {
  X as ClearIcon,
  Filter as FilterIcon,
} from 'lucide-react';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Typography,
} from '@/components/ui/typography';
import { useMobile } from '@/hooks/use-mobile';
import React, { memo } from 'react';

import type { QuickFilter } from '../../hooks/useEnhancedSearch';

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: string | null;
  onFilterSelect: (filterId: string | null) => void;
  showTitle?: boolean;
  compact?: boolean;
  maxVisible?: number;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  activeFilter,
  onFilterSelect,
  showTitle = true,
  compact = false,
  maxVisible,
}) => {
  const isMobile = useMobile();

  if (!filters || filters.length === 0) {
    return null;
  }

  // Limit visible filters on mobile
  const visibleFilters =
    maxVisible && isMobile ? filters.slice(0, maxVisible) : filters;

  const handleFilterClick = (filterId: string) => {
    if (activeFilter === filterId) {
      onFilterSelect(null); // Deselect if already active
    } else {
      onFilterSelect(filterId);
    }
  };

  const getFilterColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) return '';
    
    switch (color) {
      case 'success':
        return 'bg-green-600 text-white border-green-600 hover:bg-green-700';
      case 'warning':
        return 'bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700';
      case 'error':
        return 'bg-red-600 text-white border-red-600 hover:bg-red-700';
      case 'info':
        return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
      case 'primary':
        return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
      case 'secondary':
        return 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700';
      default:
        return 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700';
    }
  };

  return (
    <div className={compact ? 'mb-1' : 'mb-2'}>
      {showTitle && (
        <Typography
          variant={compact ? 'caption' : 'body2'}
          className="flex items-center mb-1 text-gray-600 font-semibold"
        >
          <FilterIcon size={16} className="mr-1" />
          Rýchle filtre:
        </Typography>
      )}

      <div className="flex flex-wrap gap-2">
        {visibleFilters.map(filter => (
          <TooltipProvider key={filter.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={activeFilter === filter.id ? 'default' : 'outline'}
                  className={`
                    cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md
                    ${activeFilter === filter.id 
                      ? getFilterColorClasses(filter.color, true)
                      : getFilterColorClasses(filter.color, false)
                    }
                    ${filter.count && filter.count > 10 ? 'relative' : ''}
                  `}
                  onClick={() => handleFilterClick(filter.id)}
                >
                  <div className="flex items-center gap-1">
                    {filter.label}
                    {filter.count && (
                      <span className="text-xs opacity-80 font-semibold">
                        ({filter.count})
                      </span>
                    )}
                    {activeFilter === filter.id && (
                      <ClearIcon 
                        size={12} 
                        className="ml-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterSelect(null);
                        }}
                      />
                    )}
                  </div>
                  {filter.count && filter.count > 10 && activeFilter !== filter.id && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {filter.count ? `${filter.count} výsledkov` : filter.label}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Show more indicator */}
        {maxVisible && isMobile && filters.length > maxVisible && (
          <Badge
            variant="outline"
            className="opacity-60 cursor-default text-xs"
          >
            +{filters.length - maxVisible}
          </Badge>
        )}
      </div>
    </div>
  );
};

// Pre-defined quick filters pre rôzne entity
export const RENTAL_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'active',
    label: 'Aktívne',
    value: 'active',
    color: 'success',
    icon: '🟢',
  },
  {
    id: 'pending',
    label: 'Čakajúce',
    value: 'pending',
    color: 'warning',
    icon: '⏳',
  },
  {
    id: 'overdue',
    label: 'Preterminované',
    value: 'overdue',
    color: 'error',
    icon: '⚠️',
  },
  {
    id: 'this_month',
    label: 'Tento mesiac',
    value: 'this_month',
    color: 'primary',
    icon: '📅',
  },
  {
    id: 'high_value',
    label: 'Vysoká suma',
    value: 'high_value',
    color: 'secondary',
    icon: '💰',
  },
];

export const VEHICLE_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'available',
    label: 'Dostupné',
    value: 'available',
    color: 'success',
    icon: '✅',
  },
  {
    id: 'rented',
    label: 'Prenajaté',
    value: 'rented',
    color: 'warning',
    icon: '🚗',
  },
  {
    id: 'maintenance',
    label: 'Servis',
    value: 'maintenance',
    color: 'error',
    icon: '🔧',
  },
  {
    id: 'premium',
    label: 'Premium',
    value: 'premium',
    color: 'secondary',
    icon: '⭐',
  },
];

export const CUSTOMER_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'vip',
    label: 'VIP',
    value: 'vip',
    color: 'secondary',
    icon: '👑',
  },
  {
    id: 'active_rentals',
    label: 'Aktívni',
    value: 'active_rentals',
    color: 'success',
    icon: '🎯',
  },
  {
    id: 'new',
    label: 'Noví',
    value: 'new',
    color: 'info',
    icon: '🆕',
  },
  {
    id: 'corporate',
    label: 'Firemní',
    value: 'corporate',
    color: 'primary',
    icon: '🏢',
  },
];

export default memo(QuickFilters);
