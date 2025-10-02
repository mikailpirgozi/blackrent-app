/**
 * 🎨 UNIFIED CHIP COMPONENT
 *
 * Konzistentný chip komponent pre celú BlackRent aplikáciu
 * Nahradí všetky rôzne chip štýly jednotným dizajnom
 */

import React from 'react';
import { cn } from '@/lib/utils';

// 🎨 Definované chip varianty pre BlackRent
export type ChipVariant =
  | 'default'
  | 'status'
  | 'priority'
  | 'trend'
  | 'role'
  | 'compact';

// 🎨 Definované farby pre BlackRent chips
type ChipColor = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

// 🎨 Props interface
export interface UnifiedChipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  variant?: ChipVariant;
  chipColor?: ChipColor;
  animated?: boolean;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onDelete?: () => void;
  size?: 'small' | 'medium' | 'default' | 'large';
}

// 🎨 Tailwind classes pre jednotlivé varianty a farby
const getChipClasses = (
  variant: ChipVariant = 'default',
  chipColor: ChipColor = 'primary',
  size: 'small' | 'medium' | 'default' | 'large' = 'default'
): string => {
  const sizeClasses = {
    small: 'text-xs h-5 px-2',
    medium: 'text-sm h-6 px-2.5',
    default: 'text-sm h-6 px-3',
    large: 'text-base h-8 px-4',
  };

  const colorClasses = {
    primary: {
      default: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      status: 'bg-blue-600 text-white hover:bg-blue-700',
      priority: 'bg-blue-600 text-white hover:bg-blue-700',
      trend: 'bg-blue-100 text-blue-700',
      role: 'bg-blue-600 text-white hover:bg-blue-700',
      compact: 'bg-blue-50 text-blue-700',
    },
    secondary: {
      default: 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200',
      status: 'bg-pink-600 text-white hover:bg-pink-700',
      priority: 'bg-pink-600 text-white hover:bg-pink-700',
      trend: 'bg-pink-100 text-pink-700',
      role: 'bg-pink-600 text-white hover:bg-pink-700',
      compact: 'bg-pink-50 text-pink-700',
    },
    success: {
      default: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
      status: 'bg-green-600 text-white hover:bg-green-700',
      priority: 'bg-green-600 text-white hover:bg-green-700',
      trend: 'bg-green-100 text-green-700',
      role: 'bg-green-600 text-white hover:bg-green-700',
      compact: 'bg-green-50 text-green-700',
    },
    warning: {
      default: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
      status: 'bg-orange-600 text-white hover:bg-orange-700',
      priority: 'bg-orange-600 text-white hover:bg-orange-700',
      trend: 'bg-orange-100 text-orange-700',
      role: 'bg-orange-600 text-white hover:bg-orange-700',
      compact: 'bg-orange-50 text-orange-700',
    },
    error: {
      default: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
      status: 'bg-red-600 text-white hover:bg-red-700',
      priority: 'bg-red-600 text-white hover:bg-red-700',
      trend: 'bg-red-100 text-red-700',
      role: 'bg-red-600 text-white hover:bg-red-700',
      compact: 'bg-red-50 text-red-700',
    },
    info: {
      default: 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200',
      status: 'bg-cyan-600 text-white hover:bg-cyan-700',
      priority: 'bg-cyan-600 text-white hover:bg-cyan-700',
      trend: 'bg-cyan-100 text-cyan-700',
      role: 'bg-cyan-600 text-white hover:bg-cyan-700',
      compact: 'bg-cyan-50 text-cyan-700',
    },
    neutral: {
      default: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
      status: 'bg-gray-600 text-white hover:bg-gray-700',
      priority: 'bg-gray-600 text-white hover:bg-gray-700',
      trend: 'bg-gray-100 text-gray-700',
      role: 'bg-gray-600 text-white hover:bg-gray-700',
      compact: 'bg-gray-50 text-gray-700',
    },
  };

  const variantSpecificClasses = {
    default: 'border font-semibold transition-all hover:-translate-y-px hover:shadow-sm',
    status: 'font-bold',
    priority: 'font-bold min-w-8 rounded-full hover:scale-105 hover:shadow-sm',
    trend: 'text-xs',
    role: 'font-semibold',
    compact: 'text-xs h-4',
  };

  const colorClass = colorClasses[chipColor][variant];
  const variantClass = variantSpecificClasses[variant];
  const sizeClass = variant === 'compact' ? 'text-xs h-4 px-2' : sizeClasses[size as keyof typeof sizeClasses];

  return cn(
    'inline-flex items-center gap-1 rounded-md transition-all',
    sizeClass,
    colorClass,
    variantClass
  );
};

// 🎨 Unified Chip Component
export const UnifiedChip: React.FC<UnifiedChipProps> = ({
  variant = 'default',
  chipColor = 'primary',
  animated = false,
  label,
  icon,
  onDelete,
  size = 'default',
  className,
  children,
  ...props
}) => {
  const animatedClass = animated ? 'hover:animate-pulse' : '';
  const chipClasses = getChipClasses(variant, chipColor, size);

  return (
    <div
      className={cn(
        chipClasses,
        animatedClass,
        'relative',
        className
      )}
      {...props}
    >
      {icon && (
        <span className="inline-flex items-center justify-center w-4 h-4">
          {icon}
        </span>
      )}
      {label || children}
      {onDelete && (
        <button
          onClick={onDelete}
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

// 🎨 Predefined chip variants pre rýchle použitie
export const StatusChip: React.FC<
  Omit<UnifiedChipProps, 'variant'>
> = props => <UnifiedChip variant="status" {...props} />;

export const PriorityChip: React.FC<
  Omit<UnifiedChipProps, 'variant'>
> = props => <UnifiedChip variant="priority" {...props} />;

export const TrendChip: React.FC<Omit<UnifiedChipProps, 'variant'>> = props => (
  <UnifiedChip variant="trend" {...props} />
);

export const RoleChip: React.FC<Omit<UnifiedChipProps, 'variant'>> = props => (
  <UnifiedChip variant="role" {...props} />
);

export const CompactChip: React.FC<
  Omit<UnifiedChipProps, 'variant'>
> = props => <UnifiedChip variant="compact" {...props} />;

// 🎨 Predefined status chips pre BlackRent stavy
export const PendingChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="warning" label="Čaká" {...props} />;

export const ActiveChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="success" label="Aktívny" {...props} />;

export const CompletedChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="info" label="Dokončený" {...props} />;

export const CancelledChip: React.FC<
  Omit<UnifiedChipProps, 'chipColor' | 'variant'>
> = props => <StatusChip chipColor="error" label="Zrušený" {...props} />;

export default UnifiedChip;
