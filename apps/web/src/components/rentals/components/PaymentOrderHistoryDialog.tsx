import { Download, Eye, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePaymentOrdersByRental } from '@/lib/react-query/hooks/usePaymentOrders';
import type { Rental } from '@/types';
import type { PaymentOrder } from '@/types/payment-order.types';

interface PaymentOrderHistoryDialogProps {
  rental: Rental | null;
  open: boolean;
  onClose: () => void;
  onViewPaymentOrder: (paymentOrder: PaymentOrder) => void;
}

export function PaymentOrderHistoryDialog({
  rental,
  open,
  onClose,
  onViewPaymentOrder,
}: PaymentOrderHistoryDialogProps) {
  const { data: paymentOrders = [], isLoading } = usePaymentOrdersByRental(
    rental?.id ? String(rental.id) : ''
  );

  if (!rental) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Uhradené';
      case 'pending':
        return 'Čaká na úhradu';
      case 'cancelled':
        return 'Zrušené';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'rental' ? 'Prenájom' : 'Depozit';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            História platobných príkazov
          </DialogTitle>
          <DialogDescription>
            Objednávka: {rental.orderNumber} - {rental.customerName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : paymentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Zatiaľ neboli vytvorené žiadne platobné príkazy</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentOrders.map(order => (
              <div
                key={order.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg">
                        {getTypeLabel(order.type)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {getStatusLabel(order.paymentStatus)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Suma:
                        </span>
                        <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                          {order.amount.toFixed(2)} {order.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Variabilný symbol:
                        </span>
                        <span className="ml-2 font-mono">
                          {order.variableSymbol}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Vytvorené:
                        </span>
                        <span className="ml-2">
                          {new Date(order.createdAt).toLocaleString('sk-SK')}
                        </span>
                      </div>
                      {order.emailSent && (
                        <div className="col-span-2 text-green-600 dark:text-green-400 text-xs">
                          ✓ Odoslané emailom
                          {order.emailRecipient &&
                            ` na ${order.emailRecipient}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPaymentOrder(order)}
                      title="Zobraziť detail"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const apiUrl =
                          import.meta.env.VITE_API_URL ||
                          'http://localhost:3001/api';
                        window.open(
                          `${apiUrl}/payment-orders/${order.id}/pdf`,
                          '_blank'
                        );
                      }}
                      title="Stiahnuť PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {order.message && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                    "{order.message}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose}>Zavrieť</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
