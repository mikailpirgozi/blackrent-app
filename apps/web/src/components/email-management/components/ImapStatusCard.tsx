/**
 * IMAP Status Card Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { UnifiedCard } from '../../ui/UnifiedCard';
import { UnifiedTypography } from '../../ui/UnifiedTypography';
import { UnifiedChip } from '../../ui/UnifiedChip';
import { Alert, AlertTitle } from '../../ui/alert';
import { cn } from '../../../lib/utils';
import React, { useState, useEffect } from 'react';

import type { ImapStatus } from '../types/email-types';

interface ImapStatusCardProps {
  imapStatus: ImapStatus | null;
}

export const ImapStatusCard: React.FC<ImapStatusCardProps> = ({
  imapStatus,
}) => {
  // Media queries using window.innerWidth
  const [isExtraSmall, setIsExtraSmall] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsExtraSmall(window.innerWidth < 400);
      setIsSmallMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!imapStatus) return null;

  return (
    <UnifiedCard variant="default" className="mb-6">
      <div className={cn(
        "p-4",
        isExtraSmall ? "p-3" : "p-6"
      )}>
        <UnifiedTypography
          variant={isSmallMobile ? 'subtitle1' : 'h6'}
          className={cn(
            "mb-4",
            isExtraSmall ? "text-base" : undefined,
            isSmallMobile ? "text-center" : "text-left"
          )}
        >
          📧 IMAP Konfigurácia
        </UnifiedTypography>
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4",
          isSmallMobile ? "gap-4" : "gap-4"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            isSmallMobile ? "justify-center" : "justify-start",
            isExtraSmall ? "flex-col" : "flex-row"
          )}>
            <UnifiedTypography
              variant="body2"
              color="textSecondary"
              className={cn(
                isExtraSmall ? "text-sm" : undefined
              )}
            >
              Status:
            </UnifiedTypography>
            <UnifiedChip
              label={
                imapStatus.enabled
                  ? imapStatus.running
                    ? 'Beží'
                    : 'Zastavený'
                  : 'Vypnutý'
              }
              variant={
                imapStatus.enabled
                  ? imapStatus.running
                    ? 'default'
                    : 'status'
                  : 'compact'
              }
              size={isExtraSmall ? 'small' : 'small'}
              className={cn(
                isExtraSmall ? "text-xs" : undefined
              )}
            />
          </div>
          <div className={cn(
            isSmallMobile ? "text-center" : "text-left"
          )}>
            <UnifiedTypography
              variant="body2"
              color="textSecondary"
              className={cn(
                "break-words",
                isExtraSmall ? "text-sm" : undefined
              )}
            >
              Server:{' '}
              <strong>{imapStatus.config?.host || 'Nekonfigurovaný'}</strong>
            </UnifiedTypography>
          </div>
          <div className={cn(
            isSmallMobile ? "text-center" : "text-left"
          )}>
            <UnifiedTypography
              variant="body2"
              color="textSecondary"
              className={cn(
                "break-words",
                isExtraSmall ? "text-sm" : undefined
              )}
            >
              Používateľ:{' '}
              <strong>{imapStatus.config?.user || 'Nekonfigurovaný'}</strong>
            </UnifiedTypography>
          </div>
        </div>
        {!imapStatus.enabled && (
          <Alert className="mt-4">
            <AlertTitle>
              <UnifiedTypography
                variant="body2"
                className={cn(
                  isExtraSmall ? "text-sm" : undefined
                )}
              >
                IMAP monitoring je vypnutý. Skontrolujte konfiguráciu v backend/.env
                súbore.
              </UnifiedTypography>
            </AlertTitle>
          </Alert>
        )}
      </div>
    </UnifiedCard>
  );
};
