import { useCallback, useRef, useState } from 'react';

import { useDeleteRental } from '@/lib/react-query/hooks/useRentals';
// import { useApp } from '../context/AppContext'; // Removed unused import
import type { Rental } from '../types';
import { logger } from '../utils/logger';

interface UseRentalActionsProps {
  onEdit?: (rental: Rental) => void;
  onDelete?: (id: string) => void;
  onScrollRestore?: () => void;
}

interface UseRentalActionsReturn {
  // Dialog state
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  editingRental: Rental | null;
  setEditingRental: (rental: Rental | null) => void;

  // Import state
  importError: string;
  setImportError: (error: string) => void;

  // Action handlers
  handleAdd: () => void;
  handleEdit: (rental: Rental) => void;
  handleDelete: (id: string) => Promise<void>;
  handleCancel: () => void;
  handleViewRental: (rental: Rental) => void;

  // Scroll preservation
  savedScrollPosition: React.MutableRefObject<number>;
  restoreScrollPosition: () => void;
}

export const useRentalActions = ({
  onEdit,
  onDelete,
  onScrollRestore,
}: UseRentalActionsProps = {}): UseRentalActionsReturn => {
  // const { deleteRental: legacyDeleteRental } = useApp(); // Removed unused variable
  const deleteRentalMutation = useDeleteRental();

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  // Import state
  const [importError, setImportError] = useState<string>('');

  // 🎯 SCROLL PRESERVATION: Uloženie pozície pred editáciou
  const savedScrollPosition = useRef<number>(0);

  // Add handler
  const handleAdd = useCallback(() => {
    setEditingRental(null);
    setOpenDialog(true);
  }, []);

  // Edit handler with scroll preservation
  const handleEdit = useCallback(
    (rental: Rental) => {
      logger.debug('🔍 HANDLE EDIT DEBUG:', {
        rentalId: rental.id,
        totalPrice: rental.totalPrice,
        extraKmCharge: rental.extraKmCharge,
        commission: rental.commission,
        customerName: rental.customerName,
        screenWidth:
          typeof window !== 'undefined' ? window.innerWidth : 'unknown',
      });

      // 🎯 SCROLL PRESERVATION: Uložiť aktuálnu pozíciu pred editáciou
      if (typeof window !== 'undefined') {
        savedScrollPosition.current =
          window.pageYOffset || document.documentElement.scrollTop;
        logger.debug(
          '💾 SCROLL: Saved position before edit:',
          savedScrollPosition.current
        );
      }

      setEditingRental(rental);
      setOpenDialog(true);

      // Call external edit handler if provided
      if (onEdit) {
        onEdit(rental);
      }
    },
    [onEdit]
  );

  // Delete handler - now using React Query with optimistic updates
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('Naozaj chcete vymazať tento prenájom?')) {
        try {
          // 🚀 REACT QUERY: Use mutation with optimistic updates
          await deleteRentalMutation.mutateAsync(id);
          logger.info('Rental deleted successfully with React Query', {
            rentalId: id,
          });

          // Call external delete handler if provided
          if (onDelete) {
            onDelete(id);
          }
        } catch (error) {
          logger.error('Failed to delete rental', { rentalId: id, error });
          // Show error to user
          alert('Chyba pri mazaní prenájmu. Skúste to znovu.');
        }
      }
    },
    [deleteRentalMutation, onDelete]
  );

  // View rental handler (alias for edit)
  const handleViewRental = useCallback(
    (rental: Rental) => {
      logger.debug('👁️ Viewing rental:', rental.id);
      handleEdit(rental);
    },
    [handleEdit]
  );

  // 🎯 SCROLL PRESERVATION: Funkcia na obnovenie scroll pozície
  const restoreScrollPosition = useCallback(() => {
    // Malé oneskorenie aby sa DOM stihol aktualizovať
    setTimeout(() => {
      if (typeof window !== 'undefined' && savedScrollPosition.current > 0) {
        logger.debug(
          '🔄 SCROLL: Restoring position:',
          savedScrollPosition.current
        );

        // Skús obnoviť pozíciu niekoľkokrát ak sa nepodarí
        let attempts = 0;
        const maxAttempts = 5;
        const attemptRestore = () => {
          attempts++;

          // Skús window.scrollTo
          window.scrollTo({
            top: savedScrollPosition.current,
            behavior: 'auto', // Okamžité, nie smooth
          });

          // Overiť či sa pozícia obnovila
          const currentPosition =
            window.pageYOffset || document.documentElement.scrollTop;
          const tolerance = 50; // 50px tolerancia

          if (
            Math.abs(currentPosition - savedScrollPosition.current) >
              tolerance &&
            attempts < maxAttempts
          ) {
            // Ak sa nepodarilo, skús znovu o chvíľu
            setTimeout(attemptRestore, 100);
          } else {
            logger.debug('✅ SCROLL: Position restored successfully', {
              saved: savedScrollPosition.current,
              current: currentPosition,
              attempts,
            });

            // Reset saved position
            savedScrollPosition.current = 0;

            // Call external scroll restore handler if provided
            if (onScrollRestore) {
              onScrollRestore();
            }
          }
        };

        attemptRestore();
      }
    }, 100);
  }, [onScrollRestore]);

  // 🎯 SCROLL PRESERVATION: Funkcia pre zrušenie s obnovením pozície
  const handleCancel = useCallback(() => {
    setOpenDialog(false);
    setEditingRental(null);

    // Obnoviť scroll pozíciu po zatvorení dialógu
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  return {
    // Dialog state
    openDialog,
    setOpenDialog,
    editingRental,
    setEditingRental,

    // Import state
    importError,
    setImportError,

    // Action handlers
    handleAdd,
    handleEdit,
    handleDelete,
    handleCancel,
    handleViewRental,

    // Scroll preservation
    savedScrollPosition,
    restoreScrollPosition,
  };
};
