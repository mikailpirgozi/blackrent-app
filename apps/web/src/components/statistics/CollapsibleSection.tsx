/**
 * 📂 COLLAPSIBLE SECTION
 *
 * Expandable section pre mobile statistics s smooth animations
 */

import { ChevronDown as ExpandMoreIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import React, { memo, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: number | string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  color?:
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'secondary'
    | string;
  compact?: boolean;
  disabled?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  icon,
  badge,
  defaultExpanded = false,
  children,
  color = 'primary',
  compact = false,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Get color classes based on color prop
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, { border: string; bg: string; text: string; hover: string }> = {
      primary: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        hover: 'hover:bg-blue-100'
      },
      success: {
        border: 'border-green-200',
        bg: 'bg-green-50',
        text: 'text-green-600',
        hover: 'hover:bg-green-100'
      },
      warning: {
        border: 'border-orange-200',
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        hover: 'hover:bg-orange-100'
      },
      error: {
        border: 'border-red-200',
        bg: 'bg-red-50',
        text: 'text-red-600',
        hover: 'hover:bg-red-100'
      },
      info: {
        border: 'border-cyan-200',
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        hover: 'hover:bg-cyan-100'
      },
    };
    return colorMap[colorName] || colorMap.primary;
  };

  const colorClasses = getColorClasses(color);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card
        className={`
          ${compact ? 'rounded-lg' : 'rounded-xl'} 
          overflow-hidden 
          ${colorClasses?.border || ''} 
          ${expanded ? (colorClasses?.bg || 'bg-white') : 'bg-white'} 
          transition-all duration-300 ease-in-out 
          ${!disabled ? `${colorClasses?.hover || ''} hover:border-opacity-60` : ''} 
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          shadow-md
        `}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div
            className={`
              flex items-center 
              ${compact ? 'p-4' : 'p-5'} 
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} 
              transition-colors duration-200 
              ${!disabled ? (colorClasses?.hover || '') : ''} 
              ${expanded ? `border-b ${colorClasses?.border || ''}` : ''}
            `}
          >
            {/* Icon */}
            {icon && (
              <div
                className={`
                  flex items-center mr-3 
                  ${colorClasses?.text || ''} 
                  ${disabled ? 'opacity-50' : 'opacity-100'}
                `}
              >
                {icon}
              </div>
            )}

            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={`
                    ${compact ? 'text-sm' : 'text-lg'} 
                    font-semibold 
                    ${expanded ? (colorClasses?.text || 'text-gray-900') : 'text-gray-900'} 
                    transition-colors duration-200
                  `}
                >
                  {title}
                </h3>

                {/* Badge */}
                {badge !== undefined && (
                  <Badge
                    variant="secondary"
                    className={`
                      ${colorClasses?.bg || ''} ${colorClasses?.text || ''} 
                      text-xs h-5 min-w-5 px-1.5
                    `}
                  >
                    {badge}
                  </Badge>
                )}
              </div>

              {subtitle && (
                <p className="text-xs text-gray-500 mt-1 block">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Expand Icon */}
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={`
                ${expanded ? (colorClasses?.text || 'text-gray-500') : 'text-gray-500'} 
                transition-all duration-300 ease-in-out 
                ${expanded ? 'rotate-180' : 'rotate-0'} 
                ${!disabled ? `hover:${colorClasses?.bg || ''}` : ''} 
                p-1 h-8 w-8
              `}
            >
              <ExpandMoreIcon className="h-4 w-4" />
            </Button>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent className="transition-all duration-300 ease-in-out">
          <div
            className={`
              ${compact ? 'p-4 pt-3' : 'p-5 pt-4'} 
              ${expanded ? (colorClasses?.bg || 'bg-transparent') : 'bg-transparent'} 
              transition-colors duration-200
            `}
          >
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default memo(CollapsibleSection);
