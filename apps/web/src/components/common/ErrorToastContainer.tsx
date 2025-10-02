// 🍞 Error Toast Container
// Displays error messages as elegant toast notifications

import { UnifiedIcon } from '../ui/UnifiedIcon';
import { UnifiedButton } from '../ui/UnifiedButton';
import { UnifiedTypography } from '../ui/UnifiedTypography';
import { Alert, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';
import { cn } from '../../lib/utils';
import React, { useMemo } from 'react';

import { useError } from '../../context/ErrorContext';
import type { AppError } from '../../types/errors';

// Toast severity mapping - currently not used
// const getSeverityColor = (severity: ErrorSeverity) => {
//   switch (severity) {
//     case 'info':
//       return 'info';
//     case 'warning':
//       return 'warning';
//     case 'error':
//       return 'error';
//     case 'critical':
//       return 'error';
//     default:
//       return 'info';
//   }
// };

// Error icon mapping
const getErrorIcon = (error: AppError) => {
  switch (error.category) {
    case 'network':
      return <UnifiedIcon name="wifi_off" size={16} />;
    default:
      return undefined;
  }
};

// Individual Error Toast Component
interface ErrorToastProps {
  error: AppError;
  onDismiss: (id: string) => void;
  isOnline: boolean;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  isOnline,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // const severity = getSeverityColor(error.severity);
  const icon = getErrorIcon(error);

  const handleRetry = async () => {
    // TODO: Implement retry logic based on error context
    console.log('Retrying action for error:', error.id);
    onDismiss(error.id);
  };

  const handleDismiss = () => {
    onDismiss(error.id);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="mb-2 min-w-[300px] max-w-[500px]">
      <Alert>
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-2">
            {icon}
            <AlertTitle className="mb-0">
              <div className="flex items-center gap-2">
                <UnifiedTypography variant="subtitle2" className="flex-grow">
                  {error.message}
                </UnifiedTypography>
                <Badge
                  variant="outline"
                  className="text-xs h-5"
                >
                  {error.category}
                </Badge>
              </div>
            </AlertTitle>
          </div>
          <div className="flex items-center gap-1">
            {error.details && (
              <UnifiedButton
                variant="ghost"
                className="h-8 px-3 text-sm"
                onClick={toggleExpanded}
                className="p-1"
              >
                {expanded ? (
                  <UnifiedIcon name="expand_less" size={16} />
                ) : (
                  <UnifiedIcon name="expand_more" size={16} />
                )}
              </UnifiedButton>
            )}
            {error.retry && !isOnline && (
              <UnifiedButton
                variant="ghost"
                className="p-1"
                onClick={handleRetry}
                disabled={!isOnline}
              >
                <UnifiedIcon name="refresh" size={16} />
              </UnifiedButton>
            )}
            <UnifiedButton
              variant="ghost"
              className="p-1"
              onClick={handleDismiss}
            >
              <UnifiedIcon name="close" size={16} />
            </UnifiedButton>
          </div>
        </div>
      </Alert>

      <Collapsible open={expanded}>
        <CollapsibleContent>
          {error.details && (
            <UnifiedTypography variant="body2" className="mt-2 opacity-80">
              {error.details}
            </UnifiedTypography>
          )}

          {error.context && Object.keys(error.context).length > 0 && (
            <div className="mt-2">
              <UnifiedTypography variant="caption" className="font-bold">
                Technické detaily:
              </UnifiedTypography>
              <pre className="text-xs mt-1 p-2 bg-black/10 rounded overflow-auto max-h-[100px]">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </div>
          )}

          {error.retry && (
            <UnifiedButton
              className="h-8 px-3 text-sm"
              startIcon={<UnifiedIcon name="refresh" size={16} />}
              onClick={handleRetry}
              disabled={!isOnline}
              className="mt-2"
            >
              Skúsiť znovu
            </UnifiedButton>
          )}
        </CollapsibleContent>
      </Collapsible>

      <UnifiedTypography
        variant="caption"
        className="block mt-2 opacity-60 text-xs"
      >
        {error.timestamp.toLocaleTimeString()}
      </UnifiedTypography>
    </div>
  );
};

// Network Status Indicator
const NetworkStatusIndicator: React.FC<{ isOnline: boolean }> = ({
  isOnline,
}) => (
  <div className={cn(
    "fixed top-4 right-4 z-[2000] flex items-center gap-2 p-2 bg-orange-500 text-white rounded shadow-lg",
    isOnline ? "hidden" : "flex"
  )}>
    <UnifiedIcon name="wifi_off" size={16} />
    <UnifiedTypography variant="body2">Offline</UnifiedTypography>
  </div>
);

// Main Error Toast Container
export const ErrorToastContainer: React.FC = () => {
  const { errors, dismissError, isOnline } = useError();

  // Sort errors by severity and timestamp
  const sortedErrors = useMemo(() => {
    const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
    return [...errors].sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [errors]);

  // Get the most recent error for Snackbar positioning
  // const latestError = sortedErrors[0]; // Currently not used

  return (
    <>
      <NetworkStatusIndicator isOnline={isOnline} />

      {sortedErrors.length > 0 && (
        <div className="fixed top-6 right-6 z-[1500] min-w-[300px] space-y-2">
          {sortedErrors.map(error => (
            <ErrorToast
              key={error.id}
              error={error}
              onDismiss={dismissError}
              isOnline={isOnline}
            />
          ))}

          {sortedErrors.length > 3 && (
            <Alert className="opacity-80">
              <AlertTitle>
                <UnifiedTypography variant="body2">
                  + {sortedErrors.length - 3} ďalších chýb
                </UnifiedTypography>
                <UnifiedButton
                  className="h-8 px-3 text-sm"
                  onClick={() => {
                    // Dismiss older errors
                    sortedErrors.slice(3).forEach(error => {
                      dismissError(error.id);
                    });
                  }}
                  className="mt-2"
                >
                  Skryť staršie
                </UnifiedButton>
              </AlertTitle>
            </Alert>
          )}
        </div>
      )}
    </>
  );
};

export default ErrorToastContainer;
