/**
 * 🍞 ENHANCED ERROR TOAST COMPONENT
 *
 * Vylepšená verzia error toast s:
 * - User-friendly messages
 * - Contextual suggestions
 * - Better positioning
 * - Recovery actions
 */

import {
  Bug as BugReportIcon,
  X as CloseIcon,
  ChevronDown as ExpandLessIcon,
  ChevronUp as ExpandMoreIcon,
  RefreshCw as RefreshIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { ErrorContext } from '../../utils/enhancedErrorMessages';
import {
  getEnhancedErrorMessage,
  getRecoverySuggestions,
} from '../../utils/enhancedErrorMessages';
import type { EnhancedError } from '../../utils/errorHandling';

interface EnhancedErrorToastProps {
  error: EnhancedError | null;
  context?: ErrorContext;
  onClose: () => void;
  onRetry?: () => void;
  autoHideDuration?: number;
  position?: 'top' | 'bottom';
}

export const EnhancedErrorToast: React.FC<EnhancedErrorToastProps> = ({
  error,
  context = {},
  onClose,
  onRetry,
  // autoHideDuration = 8000, // Longer for better UX
  position = 'top',
}) => {
  const [open, setOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Show toast when error appears
  useEffect(() => {
    if (error) {
      setOpen(true);
      setShowDetails(false);
      setShowTechnicalDetails(false);
    }
  }, [error]);

  // Handle close
  const handleClose = (
    _event?: React.SyntheticEvent,
    _reason?: string
  ) => {
    if (_reason === 'clickaway') return;
    setOpen(false);
    window.setTimeout(onClose, 300); // Wait for animation
  };

  // Handle retry with enhanced feedback
  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      setOpen(false);
      window.setTimeout(onClose, 300);
    } catch (err) {
      console.error('Retry failed:', err);
      // Error handling už sa zvládne v parent komponente
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle page refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  if (!error) return null;

  const enhancedMessage = getEnhancedErrorMessage(error, context);
  const suggestions = getRecoverySuggestions(error);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed z-50 max-w-md w-full',
        position === 'top' 
          ? 'top-6 right-6 md:right-6 md:left-auto' 
          : 'bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6'
      )}
    >
      <Alert 
        variant={enhancedMessage.severity === 'error' ? 'destructive' : 'default'}
        className="w-full backdrop-blur-md bg-background/95 border shadow-lg"
      >
        <div className="flex items-start justify-between w-full">
          <div className="flex-1 pr-2">
            {/* Main error message */}
            <div className={cn("mb-2", showDetails && "mb-4")}>
              <AlertTitle className="flex items-center gap-2 text-base font-semibold mb-1">
                <span className="text-lg">{enhancedMessage.emoji}</span>
                {enhancedMessage.title}
              </AlertTitle>
              <AlertDescription className="text-sm opacity-90 leading-relaxed">
                {enhancedMessage.message}
              </AlertDescription>
            </div>

            {/* Connection status indicator */}
            {enhancedMessage.category === 'network' && (
              <Badge
                variant={isOnline ? 'default' : 'destructive'}
                className={cn(
                  "text-xs mb-2",
                  isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            )}

            {/* Expandable details */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleContent className="mt-4 space-y-3">
                {/* Suggestion */}
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-sm leading-relaxed">
                    💡 <strong>Návrh:</strong> {enhancedMessage.suggestion}
                  </p>
                </Card>

                {/* Recovery suggestions */}
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold">Možné riešenia:</p>
                    <div className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs opacity-80">
                          <div className="w-1 h-1 bg-current rounded-full flex-shrink-0" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {onRetry && enhancedMessage.actionLabel && (
                    <Button
                      size="sm"
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="flex items-center gap-1 text-xs min-w-24"
                    >
                      <RefreshIcon className={cn("h-3 w-3", isRetrying && "animate-spin")} />
                      {isRetrying ? 'Skúšam...' : enhancedMessage.actionLabel}
                    </Button>
                  )}

                  {enhancedMessage.category === 'unknown' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefresh}
                      className="flex items-center gap-1 text-xs"
                    >
                      <RefreshIcon className="h-3 w-3" />
                      Obnoviť stránku
                    </Button>
                  )}
                </div>

                {/* Technical details toggle */}
                <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs opacity-70 hover:opacity-100 p-0 h-auto"
                    >
                      <BugReportIcon className="h-3 w-3 mr-1" />
                      {showTechnicalDetails ? 'Skryť' : 'Zobraziť'} technické detaily
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-2">
                    <Card className="p-2 bg-muted/50">
                      <div className="space-y-1 text-xs font-mono">
                        <p className="font-semibold">Technické info:</p>
                        <p>Error: {error.technicalMessage}</p>
                        {error.originalError && 'status' in error.originalError && (
                          <p>Status: {(error.originalError as { status: number }).status}</p>
                        )}
                        <p>Type: {error.errorType}</p>
                        <p>Retryable: {error.isRetryable ? 'Yes' : 'No'}</p>
                      </div>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 w-6 p-0 opacity-80 hover:opacity-100"
            >
              {showDetails ? <ExpandLessIcon className="h-3 w-3" /> : <ExpandMoreIcon className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 opacity-80 hover:opacity-100"
            >
              <CloseIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default EnhancedErrorToast;
