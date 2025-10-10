/**
 * 🪟 UNIFIED DIALOG COMPONENT
 * 
 * Konzistentný dialog pre celú BlackRent aplikáciu
 * Nahradí všetky MUI Dialog implementácie
 * 
 * Features:
 * - Modal a non-modal dialogs
 * - Fullscreen support
 * - Scrollable content
 * - MUI Dialog API kompatibilita
 */

import React, { forwardRef, useState, useEffect } from 'react';
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { UnifiedIcon } from './UnifiedIcon';

export interface UnifiedDialogProps {
  // Basic props
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  
  // Content
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  
  // Configuration
  fullScreen?: boolean;
  fullWidth?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  scroll?: 'body' | 'paper';
  
  // Actions
  actions?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  
  // States
  loading?: boolean;
  disabled?: boolean;
  
  // MUI compatibility
  TransitionComponent?: React.ComponentType<any>;
  TransitionProps?: any;
  BackdropComponent?: React.ComponentType<any>;
  BackdropProps?: any;
  PaperComponent?: React.ComponentType<any>;
  PaperProps?: any;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  hideBackdrop?: boolean;
  keepMounted?: boolean;
  sx?: Record<string, unknown>;
  
  // Styling
  className?: string;
  contentClassName?: string;
  paperClassName?: string;
}

export const UnifiedDialog = forwardRef<HTMLDivElement, UnifiedDialogProps>(
  ({
    open = false,
    onClose,
    onOpenChange,
    title,
    subtitle,
    children,
    fullScreen = false,
    fullWidth = false,
    maxWidth = 'sm',
    scroll = 'paper',
    actions,
    onConfirm,
    onCancel,
    confirmText = 'Potvrdiť',
    cancelText = 'Zrušiť',
    confirmDisabled = false,
    cancelDisabled = false,
    loading = false,
    disabled = false,
    TransitionComponent,
    TransitionProps,
    BackdropComponent,
    BackdropProps,
    PaperComponent,
    PaperProps,
    disableBackdropClick = false,
    disableEscapeKeyDown = false,
    hideBackdrop = false,
    keepMounted = false,
    sx,
    className,
    contentClassName,
    paperClassName,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(open);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Sync with external open state
    useEffect(() => {
      setIsOpen(open);
    }, [open]);
    
    // Handle open change
    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
      
      if (!newOpen) {
        onClose?.();
      }
    };
    
    // Handle confirm
    const handleConfirm = () => {
      onConfirm?.();
    };
    
    // Handle cancel
    const handleCancel = () => {
      onCancel?.();
      handleOpenChange(false);
    };
    
    // Handle escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen && !disableEscapeKeyDown) {
          handleOpenChange(false);
        }
      };
      
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isOpen, disableEscapeKeyDown]);
    
    // Max width classes
    const getMaxWidthClass = () => {
      if (fullWidth) return 'max-w-full';
      if (fullScreen) return 'max-w-full h-full';
      
      switch (maxWidth) {
        case 'xs': return 'max-w-xs';
        case 'sm': return 'max-w-sm';
        case 'md': return 'max-w-md';
        case 'lg': return 'max-w-lg';
        case 'xl': return 'max-w-xl';
        case false: return 'max-w-none';
        default: return 'max-w-sm';
      }
    };
    
    // Default actions if none provided
    const defaultActions = (
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={cancelDisabled || loading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={confirmDisabled || loading}
        >
          {loading ? 'Načítava...' : confirmText}
        </Button>
      </div>
    );
    
    const finalActions = actions || defaultActions;
    
    return (
      <ShadcnDialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          ref={ref}
          className={cn(
            'sm:max-w-md',
            getMaxWidthClass(),
            fullScreen && 'h-full max-h-full',
            isFullscreen && 'h-screen max-h-screen',
            contentClassName
          )}
          aria-describedby={subtitle ? undefined : "dialog-description"}
          {...props}
        >
          {/* Hidden description for accessibility when no subtitle */}
          {!subtitle && (
            <div id="dialog-description" className="sr-only">
              Dialog obsah
            </div>
          )}
          
          {/* Header */}
          {(title || subtitle) && (
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-8">
              <div className="space-y-1.5">
                {title && (
                  <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
                    {title}
                  </DialogTitle>
                )}
                {subtitle && (
                  <DialogDescription className="text-sm text-muted-foreground">
                    {subtitle}
                  </DialogDescription>
                )}
              </div>
              
              {/* Fullscreen toggle */}
              {!fullScreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="h-8 w-8 p-0"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </DialogHeader>
          )}
          
          {/* Content */}
          <div
            className={cn(
              'flex-1',
              scroll === 'body' && 'overflow-auto',
              scroll === 'paper' && 'overflow-hidden',
              fullScreen && 'flex-1',
              isFullscreen && 'flex-1'
            )}
          >
            {children}
          </div>
          
          {/* Footer */}
          {finalActions && (
            <DialogFooter className="flex-shrink-0">
              {finalActions}
            </DialogFooter>
          )}
        </DialogContent>
      </ShadcnDialog>
    );
  }
);

UnifiedDialog.displayName = 'UnifiedDialog';

// Export convenience components
export const Dialog = UnifiedDialog;

// Dialog with trigger
export interface UnifiedDialogWithTriggerProps extends UnifiedDialogProps {
  trigger?: React.ReactNode;
  triggerText?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'link';
  triggerSize?: 'sm' | 'default' | 'lg';
}

export const UnifiedDialogWithTrigger = forwardRef<HTMLDivElement, UnifiedDialogWithTriggerProps>(
  ({
    trigger,
    triggerText = 'Otvoriť dialog',
    triggerVariant = 'default',
    triggerSize = 'default',
    ...dialogProps
  }, ref) => {
    return (
      <ShadcnDialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant={triggerVariant} size={triggerSize}>
              {triggerText}
            </Button>
          )}
        </DialogTrigger>
        <UnifiedDialog ref={ref} {...dialogProps} />
      </ShadcnDialog>
    );
  }
);

UnifiedDialogWithTrigger.displayName = 'UnifiedDialogWithTrigger';

// Export aliases
export const DialogWithTrigger = UnifiedDialogWithTrigger;

export default UnifiedDialog;
