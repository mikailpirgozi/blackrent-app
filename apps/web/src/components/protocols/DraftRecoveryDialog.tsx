/**
 * Draft Recovery Dialog
 *
 * Shows when user returns to an unfinished protocol
 * Allows recovery of partially uploaded photos
 */

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  indexedDBManager,
  type ProtocolDraft,
} from '@/utils/storage/IndexedDBManager';
import { logger } from '@/utils/logger';

interface DraftRecoveryDialogProps {
  draft: ProtocolDraft | null;
  onRecover: (draft: ProtocolDraft) => void;
  onDiscard: () => void;
  onClose: () => void;
}

export const DraftRecoveryDialog: React.FC<DraftRecoveryDialogProps> = ({
  draft,
  onRecover,
  onDiscard,
  onClose,
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  if (!draft) return null;

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      logger.info('Recovering draft', { protocolId: draft.protocolId });
      onRecover(draft);
    } catch (error) {
      logger.error('Draft recovery failed', { error });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDiscard = async () => {
    setIsDiscarding(true);
    try {
      logger.info('Discarding draft', { protocolId: draft.protocolId });

      // Clear from IndexedDB
      await indexedDBManager.clearProtocolData(draft.protocolId);

      onDiscard();
    } catch (error) {
      logger.error('Draft discard failed', { error });
    } finally {
      setIsDiscarding(false);
    }
  };

  const timeSinceLastModified = Date.now() - draft.lastModified;
  const minutesAgo = Math.floor(timeSinceLastModified / 60000);
  const hoursAgo = Math.floor(minutesAgo / 60);

  const timeString =
    hoursAgo > 0
      ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
      : `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;

  return (
    <Dialog open={!!draft} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Unfinished Protocol Found
          </DialogTitle>
          <DialogDescription>
            You have an incomplete protocol from {timeString}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Photos uploaded:</span>
                  <span>
                    {draft.uploadedCount} / {draft.totalCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Progress:</span>
                  <span>
                    {Math.round((draft.uploadedCount / draft.totalCount) * 100)}
                    %
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Would you like to continue where you left off, or start fresh?
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={isRecovering || isDiscarding}
            className="gap-2"
          >
            {isDiscarding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Discarding...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Start Fresh
              </>
            )}
          </Button>

          <Button
            onClick={handleRecover}
            disabled={isRecovering || isDiscarding}
            className="gap-2"
          >
            {isRecovering ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Recovering...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Continue Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
