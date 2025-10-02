/**
 * Email Filters Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { UnifiedCard } from '../../ui/UnifiedCard';
import { UnifiedTypography } from '../../ui/UnifiedTypography';
import { UnifiedTextField } from '../../ui/UnifiedTextField';
import { UnifiedSelect } from '../../ui/UnifiedSelect';
import { UnifiedButton } from '../../ui/UnifiedButton';
import { cn } from '../../../lib/utils';
import { useState, useEffect } from 'react';

import { STATUS_OPTIONS } from '../utils/email-constants';

// interface EmailFiltersProps {
//   statusFilter: string;
//   senderFilter: string;
//   onStatusFilterChange: (value: string) => void;
//   onSenderFilterChange: (value: string) => void;
//   onClearFilters: () => void;
// }

interface EmailFiltersProps {
  statusFilter: string;
  senderFilter: string;
  onStatusFilterChange: (value: string) => void;
  onSenderFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const EmailFilters = ({
  statusFilter,
  senderFilter,
  onStatusFilterChange,
  onSenderFilterChange,
  onClearFilters,
}: EmailFiltersProps) => {
  // Media queries using window.innerWidth
  const [isExtraSmall, setIsExtraSmall] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsExtraSmall(window.innerWidth < 400);
      setIsMobile(window.innerWidth < 768); // md breakpoint
      setIsSmallMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <UnifiedCard variant="default" className="mb-6">
      <div className={cn(
        "p-4",
        isExtraSmall ? "p-3" : isMobile ? "p-4" : "p-6"
      )}>
        <UnifiedTypography
          variant={isExtraSmall ? 'body1' : isMobile ? 'subtitle1' : 'h6'}
          className={cn(
            "font-semibold mb-4",
            isExtraSmall ? "text-base" : undefined,
            isSmallMobile ? "text-center" : "text-left"
          )}
        >
          🔍 Filtre
        </UnifiedTypography>
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4",
          isExtraSmall ? "gap-3" : isMobile ? "gap-4" : "gap-4"
        )}>
          <UnifiedSelect
            label="Status"
            value={statusFilter}
            onChange={value => onStatusFilterChange(Array.isArray(value) ? value[0] ?? '' : value ?? '')}
            options={STATUS_OPTIONS.map(option => ({
              value: option.value,
              label: option.label
            }))}
            placeholder="Vybrať status"
            fullWidth
            size={isExtraSmall ? 'sm' : isMobile ? 'default' : 'sm'}
            className={cn(
              isExtraSmall ? "text-sm" : undefined
            )}
          />
          <UnifiedTextField
            label="Odosielateľ"
            value={senderFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onSenderFilterChange(e.target.value)}
            fullWidth
            size={isExtraSmall ? 'small' : isMobile ? 'medium' : 'small'}
            placeholder={
              isExtraSmall ? 'Hľadať...' : 'Hľadať podľa odosielateľa...'
            }
            className={cn(
              isExtraSmall ? "text-sm" : undefined
            )}
          />
          <UnifiedButton
            variant="outline"
            onClick={onClearFilters}
            fullWidth
            size={isExtraSmall ? 'small' : 'medium'}
            className={cn(
              isExtraSmall ? "text-sm py-2" : undefined
            )}
          >
            {isExtraSmall ? 'Vyčistiť' : 'Vyčistiť filtre'}
          </UnifiedButton>
        </div>
      </div>
    </UnifiedCard>
  );
};
