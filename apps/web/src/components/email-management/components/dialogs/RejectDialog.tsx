/**
 * Reject Dialog Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { useState, useEffect } from 'react';

// Custom useMediaQuery hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

interface RejectDialogProps {
  open: boolean;
  isRental?: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  isRental = false,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isExtraSmall = useMediaQuery('(max-width: 400px)');

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={`sm:max-w-md ${
        isExtraSmall 
          ? 'h-full w-full max-w-none rounded-none' 
          : isMobile 
            ? 'm-2' 
            : 'm-4'
      }`}>
        <DialogHeader>
          <DialogTitle className={isExtraSmall ? 'text-lg' : 'text-xl'}>
            {isRental
              ? isExtraSmall
                ? 'Zamietnuť'
                : 'Zamietnuť prenájom'
              : isExtraSmall
                ? 'Zamietnuť'
                : 'Zamietnuť email'}
          </DialogTitle>
          <DialogDescription>
            {isRental
              ? 'Zadajte dôvod zamietnutia prenájmu'
              : 'Zadajte dôvod zamietnutia emailu'}
          </DialogDescription>
        </DialogHeader>
        
        <div className={`space-y-4 ${isExtraSmall ? 'p-4' : 'py-4'}`}>
          <div className="space-y-2">
            <Label htmlFor="reason" className={isExtraSmall ? 'text-sm' : ''}>
              {isExtraSmall ? 'Dôvod' : 'Dôvod zamietnutia'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onReasonChange(e.target.value)}
              rows={isExtraSmall ? 2 : 3}
              className={isExtraSmall ? 'text-sm' : ''}
              placeholder="Zadajte dôvod zamietnutia..."
            />
          </div>
        </div>
        
        <DialogFooter className={`gap-2 ${isExtraSmall ? 'p-4' : ''}`}>
          <Button
            variant="outline"
            onClick={onCancel}
            size={isExtraSmall ? 'sm' : 'default'}
            className={isExtraSmall ? 'text-sm' : ''}
          >
            Zrušiť
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            size={isExtraSmall ? 'sm' : 'default'}
            className={isExtraSmall ? 'text-sm' : ''}
          >
            Zamietnuť
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
