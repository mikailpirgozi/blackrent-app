/**
 * 🎉 SUCCESS TOAST COMPONENT
 *
 * Pleasant success notifications:
 * - Protocol status loaded
 * - Data synced
 * - Actions completed
 * - Smooth animations
 */

import {
  CheckCircle as CheckCircleIcon,
  X as CloseIcon,
  CloudCheck as CloudDoneIcon,
  RefreshCw as RefreshIcon,
  Zap as SpeedIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Button,
} from '@/components/ui/button';
import React, { useEffect, useState } from 'react';

interface SuccessToastProps {
  message: string | null;
  onClose: () => void;
  icon?: 'check' | 'speed' | 'cloud' | 'refresh';
  autoHideDuration?: number;
  showStats?: {
    count?: number;
    duration?: number;
  };
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  onClose,
  icon = 'check',
  autoHideDuration = 4000,
  showStats,
}) => {
  const [open, setOpen] = useState(false);

  // Show toast when message appears
  useEffect(() => {
    if (message) {
      setOpen(true);
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setOpen(false);
        setTimeout(onClose, 300); // Wait for animation
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [message, autoHideDuration, onClose]);

  // Handle close
  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setOpen(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  // Get icon based on type
  const getIcon = () => {
    const iconProps = { size: 16 };

    switch (icon) {
      case 'speed':
        return <SpeedIcon {...iconProps} />;
      case 'cloud':
        return <CloudDoneIcon {...iconProps} />;
      case 'refresh':
        return <RefreshIcon {...iconProps} />;
      default:
        return <CheckCircleIcon {...iconProps} />;
    }
  };

  if (!message) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <Alert className="min-w-[280px] max-w-[400px] bg-green-600 text-white border-green-700">
        <div className="flex items-start gap-3">
          <div className="animate-pulse">
            {getIcon()}
          </div>
          <div className="flex-1">
            <AlertDescription className="text-white font-medium">
              {message}
            </AlertDescription>

            {/* Stats display */}
            {showStats && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {showStats.count !== undefined && (
                  <Badge
                    variant="outline"
                    className="bg-white/10 text-white border-white/30 text-xs"
                  >
                    {showStats.count} záznamov
                  </Badge>
                )}

                {showStats.duration !== undefined && (
                  <Badge
                    variant="outline"
                    className="bg-white/10 text-white border-white/30 text-xs flex items-center gap-1"
                  >
                    <SpeedIcon size={12} />
                    {showStats.duration}ms
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/10 h-6 w-6 p-0"
          >
            <CloseIcon size={14} />
          </Button>
        </div>
      </Alert>
    </div>
  );
};
