import { Download, Printer, CheckCircle } from 'lucide-react';
import QRCodeSVG from 'react-qr-code';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PaymentOrder } from '@/types/payment-order.types';

interface PaymentOrderViewDialogProps {
  paymentOrder: PaymentOrder | null;
  open: boolean;
  onClose: () => void;
}

export function PaymentOrderViewDialog({
  paymentOrder,
  open,
  onClose,
}: PaymentOrderViewDialogProps) {
  if (!paymentOrder) return null;

  const handleDownloadPDF = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    window.open(`${apiUrl}/payment-orders/${paymentOrder.id}/pdf`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const typeLabel = paymentOrder.type === 'rental' ? 'Prenájom' : 'Depozit';
  const statusLabel = {
    pending: 'Čaká na úhradu',
    paid: 'Uhradené',
    cancelled: 'Zrušené',
  }[paymentOrder.paymentStatus];

  const statusColor = {
    pending: 'text-orange-600 bg-orange-50',
    paid: 'text-green-600 bg-green-50',
    cancelled: 'text-gray-600 bg-gray-50',
  }[paymentOrder.paymentStatus];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Platobný príkaz - {typeLabel}</span>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${statusColor}`}
            >
              {statusLabel}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platobné údaje */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suma</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {paymentOrder.amount.toFixed(2)} {paymentOrder.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Variabilný symbol
              </p>
              <p className="text-lg font-semibold">
                {paymentOrder.variableSymbol}
              </p>
            </div>
          </div>

          {/* Správa */}
          {paymentOrder.message && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Správa pre príjemcu
              </p>
              <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">
                {paymentOrder.message}
              </p>
            </div>
          )}

          {/* QR kód */}
          <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              QR kód pre platbu
            </p>
            <div className="p-4 bg-white rounded">
              <QRCodeSVG value={paymentOrder.qrCodeData} size={256} level="M" />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              Naskenujte QR kód v mobilnej bankovej aplikácii
            </p>
          </div>

          {/* Email status */}
          {paymentOrder.emailSent && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>
                Odoslané emailom
                {paymentOrder.emailRecipient &&
                  ` na ${paymentOrder.emailRecipient}`}
                {paymentOrder.emailSentAt &&
                  ` dňa ${new Date(paymentOrder.emailSentAt).toLocaleString('sk-SK')}`}
              </span>
            </div>
          )}

          {/* Dátum vytvorenia */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Vytvorené:{' '}
            {new Date(paymentOrder.createdAt).toLocaleString('sk-SK')}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Stiahnuť PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Tlačiť
            </Button>
          </div>

          {/* Close button */}
          <Button onClick={onClose} className="w-full">
            Zavrieť
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
