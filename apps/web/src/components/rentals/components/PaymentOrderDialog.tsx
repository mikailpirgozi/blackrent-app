import { useState } from 'react';
import { Euro as EuroIcon, Shield as ShieldIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useActiveBankAccounts,
  useCreatePaymentOrder,
} from '@/lib/react-query/hooks/usePaymentOrders';
import type { Rental } from '@/types';
import type {
  PaymentOrder,
  PaymentOrderType,
} from '@/types/payment-order.types';

interface PaymentOrderDialogProps {
  rental: Rental | null;
  type: PaymentOrderType | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentOrder: PaymentOrder) => void;
}

export function PaymentOrderDialog({
  rental,
  type,
  open,
  onClose,
  onSuccess,
}: PaymentOrderDialogProps) {
  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>('');
  const [sendEmail, setSendEmail] = useState(true);

  const { data: bankAccounts = [], isLoading: loadingAccounts } =
    useActiveBankAccounts();
  const createMutation = useCreatePaymentOrder();

  if (!rental || !type) return null;

  const amount = type === 'rental' ? rental.totalPrice : rental.deposit || 0;

  // ✅ Ensure variableSymbol is never empty - use rental ID as fallback
  const variableSymbol =
    rental.orderNumber?.replace('OBJ', '') || String(rental.id).slice(-8);

  const typeLabel = type === 'rental' ? 'prenájmu' : 'depozitu';
  const TypeIcon = type === 'rental' ? EuroIcon : ShieldIcon;

  const handleCreate = async () => {
    if (!selectedBankAccountId) {
      alert('Vyberte bankový účet');
      return;
    }

    try {
      const paymentOrder = await createMutation.mutateAsync({
        // ✅ Ensure rentalId is always a string (UUID or number converted to string)
        rentalId: String(rental.id),
        bankAccountId: selectedBankAccountId,
        type,
        amount,
        variableSymbol,
        message:
          `Úhrada ${typeLabel} - ${rental.vehicle?.brand || ''} ${rental.vehicle?.model || ''}`.trim(),
        sendEmail,
      });

      onSuccess(paymentOrder);
      onClose();
    } catch (error) {
      console.error('Failed to create payment order:', error);
      alert('Chyba pri vytváraní platobného príkazu');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5" />
            Vytvoriť platobný príkaz na úhradu {typeLabel}
          </DialogTitle>
          <DialogDescription>
            Vygeneruje sa QR kód a PDF platobného príkazu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informácie o prenájme */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Objednávka
              </p>
              <p className="font-semibold">{rental.orderNumber}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Zákazník
              </p>
              <p className="font-semibold">{rental.customerName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vozidlo
              </p>
              <p className="font-semibold">
                {rental.vehicle?.brand} {rental.vehicle?.model}
              </p>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Suma na úhradu
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {amount.toFixed(2)} EUR
              </p>
            </div>
          </div>

          {/* Výber bankového účtu */}
          <div className="space-y-2">
            <Label htmlFor="bank-account">Bankový účet *</Label>
            <Select
              value={selectedBankAccountId}
              onValueChange={setSelectedBankAccountId}
            >
              <SelectTrigger id="bank-account">
                <SelectValue placeholder="Vyberte účet" />
              </SelectTrigger>
              <SelectContent>
                {loadingAccounts ? (
                  <SelectItem value="loading" disabled>
                    Načítavam...
                  </SelectItem>
                ) : bankAccounts.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Žiadne aktívne účty
                  </SelectItem>
                ) : (
                  bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-gray-500">
                          {account.iban}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Email checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={checked => setSendEmail(checked as boolean)}
            />
            <Label htmlFor="send-email" className="text-sm cursor-pointer">
              Odoslať platobný príkaz emailom zákazníkovi
            </Label>
          </div>

          {/* Variabilný symbol info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p>
              <strong>Variabilný symbol:</strong> {variableSymbol}
            </p>
            <p className="mt-1">
              Tento symbol bude použitý na identifikáciu platby
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createMutation.isPending}
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !selectedBankAccountId ||
                createMutation.isPending ||
                bankAccounts.length === 0
              }
              className="flex-1"
            >
              {createMutation.isPending ? 'Vytváram...' : 'Vytvoriť'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
