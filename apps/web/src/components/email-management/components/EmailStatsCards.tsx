/**
 * Email Statistics Cards Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { StatisticsCard } from '../../ui/UnifiedCard';
import { UnifiedTypography } from '../../ui/UnifiedTypography';
import { cn } from '../../../lib/utils';
import { useState, useEffect } from 'react';

import type { EmailStats } from '../types/email-types';

interface EmailStatsCardsProps {
  stats: EmailStats | null;
}

export const EmailStatsCards = ({ stats }: EmailStatsCardsProps) => {
  // Media queries using window.innerWidth
  const [isExtraSmall, setIsExtraSmall] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsExtraSmall(window.innerWidth < 400);
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!stats) return null;

  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6",
      isExtraSmall ? "gap-2" : isMobile ? "gap-4" : "gap-6"
    )}>
      <StatisticsCard
        className={cn(
          "h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          isExtraSmall ? "min-h-[80px]" : "min-h-[100px]"
        )}
      >
        <div className={cn(
          "flex flex-col justify-center items-center text-center",
          isExtraSmall ? "p-2" : isMobile ? "p-3" : "p-4"
        )}>
          <UnifiedTypography
            variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
            color="primary"
            className={cn(
              "font-medium mb-2",
              isExtraSmall ? "text-xs" : isMobile ? "text-sm" : undefined
            )}
          >
            {isExtraSmall ? '📬' : '📬 Celkom'}
          </UnifiedTypography>
          <UnifiedTypography
            variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
            className={cn(
              "font-bold leading-none",
              isExtraSmall ? "text-xl" : undefined
            )}
          >
            {stats.today.total}
          </UnifiedTypography>
        </div>
      </StatisticsCard>
      <StatisticsCard
        className={cn(
          "h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          isExtraSmall ? "min-h-[80px]" : "min-h-[100px]"
        )}
      >
        <div className={cn(
          "flex flex-col justify-center items-center text-center",
          isExtraSmall ? "p-2" : isMobile ? "p-3" : "p-4"
        )}>
          <UnifiedTypography
            variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
            className={cn(
              "font-medium mb-2 text-green-600",
              isExtraSmall ? "text-xs" : isMobile ? "text-sm" : undefined
            )}
          >
            {isExtraSmall ? '✅' : '✅ Schválené'}
          </UnifiedTypography>
          <UnifiedTypography
            variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
            className={cn(
              "font-bold leading-none",
              isExtraSmall ? "text-xl" : undefined
            )}
          >
            {stats.today.processed}
          </UnifiedTypography>
        </div>
      </StatisticsCard>
      <StatisticsCard
        className={cn(
          "h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          isExtraSmall ? "min-h-[80px]" : "min-h-[100px]"
        )}
      >
        <div className={cn(
          "flex flex-col justify-center items-center text-center",
          isExtraSmall ? "p-2" : isMobile ? "p-3" : "p-4"
        )}>
          <UnifiedTypography
            variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
            className={cn(
              "font-medium mb-2 text-red-600",
              isExtraSmall ? "text-xs" : isMobile ? "text-sm" : undefined
            )}
          >
            {isExtraSmall ? '❌' : '❌ Zamietnuté'}
          </UnifiedTypography>
          <UnifiedTypography
            variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
            className={cn(
              "font-bold leading-none",
              isExtraSmall ? "text-xl" : undefined
            )}
          >
            {stats.today.rejected}
          </UnifiedTypography>
        </div>
      </StatisticsCard>
      <StatisticsCard
        className={cn(
          "h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          isExtraSmall ? "min-h-[80px]" : "min-h-[100px]"
        )}
      >
        <div className={cn(
          "flex flex-col justify-center items-center text-center",
          isExtraSmall ? "p-2" : isMobile ? "p-3" : "p-4"
        )}>
          <UnifiedTypography
            variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
            className={cn(
              "font-medium mb-2 text-orange-600",
              isExtraSmall ? "text-xs" : isMobile ? "text-sm" : undefined
            )}
          >
            {isExtraSmall ? '⏳' : '⏳ Čakajúce'}
          </UnifiedTypography>
          <UnifiedTypography
            variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
            className={cn(
              "font-bold leading-none",
              isExtraSmall ? "text-xl" : undefined
            )}
          >
            {stats.today.pending}
          </UnifiedTypography>
        </div>
      </StatisticsCard>
    </div>
  );
};
