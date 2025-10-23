# 💳 Platobné príkazy s QR kódom - Implementačný plán

## 📊 Prehľad projektu

**Cieľ:** Pridať funkcionalitu generovania platobných príkazov s QR kódom pre prenájmy a depozity.

**Technológia:** Pay by square (slovenský/český štandard)

**Umiestnenie:** Detail prenájmu - medzi údajmi o prenájme a tlačítkami Odovzdať/Prevziať

---

## 🎯 Požiadavky

### Funkcionálne požiadavky:
1. ✅ 2 tlačítka v detaile prenájmu:
   - "Vytvoriť platobný príkaz na úhradu prenájmu"
   - "Vytvoriť platobný príkaz na úhradu depozitu"

2. ✅ Výber bankového účtu (IBAN) pri generovaní
3. ✅ Variabilný symbol = číslo objednávky (bez "OBJ" prefixu)
4. ✅ Ukladanie do databázy (audit trail)
5. ✅ Email notifikácie s platobným príkazom
6. ✅ PDF s QR kódom na stiahnutie/tlač
7. ⏳ Sledovanie úhrad (neskôr)

### Technické požiadavky:
- Zero errors, zero warnings
- TypeScript strict mode
- Zod validácia
- Responsive design
- Accessibility (WCAG 2.1)

---

## 📦 FÁZA 1: Databázová schéma (30 min)

### 1.1 Tabuľka `bank_accounts`
```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,              -- napr. "Hlavný účet BlackRent"
  iban VARCHAR(34) NOT NULL,               -- SK1234567890123456789012
  swift_bic VARCHAR(11),                   -- TATRSKBX
  bank_name VARCHAR(255),                  -- Tatra banka
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_iban UNIQUE(iban),
  CONSTRAINT valid_iban CHECK(iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]+$')
);

-- Index pre rýchle vyhľadávanie aktívnych účtov
CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active) WHERE is_active = true;
```

### 1.2 Tabuľka `payment_orders`
```sql
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  
  -- Typ platby
  type VARCHAR(20) NOT NULL CHECK(type IN ('rental', 'deposit')),
  
  -- Platobné údaje
  amount DECIMAL(10,2) NOT NULL CHECK(amount > 0),
  currency VARCHAR(3) DEFAULT 'EUR',
  variable_symbol VARCHAR(20) NOT NULL,     -- číslo objednávky bez OBJ
  specific_symbol VARCHAR(20),
  constant_symbol VARCHAR(4),
  
  -- QR kód dáta
  qr_code_data TEXT NOT NULL,               -- Pay by square string
  qr_code_image TEXT,                       -- Base64 encoded PNG
  
  -- Správa pre príjemcu
  message VARCHAR(140),                     -- napr. "Prenájom Mercedes CLA 45 AMG"
  
  -- PDF
  pdf_url TEXT,                             -- URL na R2 storage
  pdf_generated_at TIMESTAMPTZ,
  
  -- Email
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_recipient VARCHAR(255),
  
  -- Status (pre budúce sledovanie úhrad)
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_rental_type UNIQUE(rental_id, type)  -- Jeden príkaz na typ
);

-- Indexy
CREATE INDEX idx_payment_orders_rental ON payment_orders(rental_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(payment_status);
CREATE INDEX idx_payment_orders_created ON payment_orders(created_at DESC);
```

### 1.3 Migračný script
**Súbor:** `backend/migrations/YYYYMMDDHHMMSS-create-payment-orders.ts`

---

## 📦 FÁZA 2: Backend API (2 hodiny)

### 2.1 Inštalácia balíčkov
```bash
cd backend
pnpm add bysquare qrcode
pnpm add -D @types/qrcode
```

### 2.2 Typy a validácie

**Súbor:** `backend/src/types/payment-order.types.ts`
```typescript
import { z } from 'zod';

export const PaymentOrderTypeSchema = z.enum(['rental', 'deposit']);
export type PaymentOrderType = z.infer<typeof PaymentOrderTypeSchema>;

export const CreatePaymentOrderSchema = z.object({
  rentalId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  type: PaymentOrderTypeSchema,
  amount: z.number().positive(),
  variableSymbol: z.string().min(1).max(20),
  specificSymbol: z.string().max(20).optional(),
  constantSymbol: z.string().max(4).optional(),
  message: z.string().max(140).optional(),
  sendEmail: z.boolean().default(true),
});

export type CreatePaymentOrderDto = z.infer<typeof CreatePaymentOrderSchema>;

export interface PaymentOrder {
  id: string;
  rentalId: string;
  bankAccountId: string;
  type: PaymentOrderType;
  amount: number;
  currency: string;
  variableSymbol: string;
  specificSymbol?: string;
  constantSymbol?: string;
  qrCodeData: string;
  qrCodeImage?: string;
  message?: string;
  pdfUrl?: string;
  pdfGeneratedAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  emailRecipient?: string;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paidAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.3 Service pre generovanie QR kódov

**Súbor:** `backend/src/services/payment-qr.service.ts`
```typescript
import { BySquare } from 'bysquare';
import QRCode from 'qrcode';

export class PaymentQRService {
  /**
   * Generuje Pay by square string
   */
  async generateBySquareData(params: {
    iban: string;
    amount: number;
    currency: string;
    variableSymbol: string;
    specificSymbol?: string;
    constantSymbol?: string;
    message?: string;
    dueDate?: Date;
  }): Promise<string> {
    const bySquare = new BySquare({
      invoiceId: params.variableSymbol,
      payments: [{
        type: 'payment',
        amount: params.amount,
        currency: params.currency,
        variableSymbol: params.variableSymbol,
        specificSymbol: params.specificSymbol,
        constantSymbol: params.constantSymbol,
        iban: params.iban,
        swift: '', // Voliteľné
        date: params.dueDate,
        note: params.message,
      }],
    });

    return bySquare.generate();
  }

  /**
   * Generuje QR kód ako PNG base64
   */
  async generateQRCodeImage(data: string): Promise<string> {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 512,
      margin: 2,
    });

    return qrCodeDataUrl; // data:image/png;base64,...
  }
}
```

### 2.4 Service pre PDF generovanie

**Súbor:** `backend/src/services/payment-pdf.service.ts`
```typescript
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export class PaymentPDFService {
  async generatePaymentOrderPDF(params: {
    orderNumber: string;
    customerName: string;
    vehicleName: string;
    amount: number;
    type: 'rental' | 'deposit';
    iban: string;
    variableSymbol: string;
    qrCodeImage: string; // base64
    bankName: string;
    message?: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Platobný príkaz', { align: 'center' });
      doc.moveDown();

      // Typ platby
      const typeLabel = params.type === 'rental' ? 'Úhrada prenájmu' : 'Úhrada depozitu';
      doc.fontSize(16).text(typeLabel, { align: 'center' });
      doc.moveDown(2);

      // Údaje o prenájme
      doc.fontSize(12);
      doc.text(`Objednávka: ${params.orderNumber}`);
      doc.text(`Zákazník: ${params.customerName}`);
      doc.text(`Vozidlo: ${params.vehicleName}`);
      doc.moveDown();

      // Platobné údaje
      doc.fontSize(14).text('Platobné údaje:', { underline: true });
      doc.fontSize(12);
      doc.text(`Suma: ${params.amount.toFixed(2)} EUR`);
      doc.text(`IBAN: ${params.iban}`);
      doc.text(`Banka: ${params.bankName}`);
      doc.text(`Variabilný symbol: ${params.variableSymbol}`);
      if (params.message) {
        doc.text(`Správa: ${params.message}`);
      }
      doc.moveDown(2);

      // QR kód
      doc.fontSize(14).text('QR kód pre platbu:', { underline: true });
      doc.moveDown();

      // Pridaj QR kód obrázok (odstráň data:image/png;base64, prefix)
      const base64Data = params.qrCodeImage.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      doc.image(qrBuffer, {
        fit: [200, 200],
        align: 'center',
      });

      doc.moveDown(2);
      doc.fontSize(10).text('Naskenujte QR kód v mobilnej bankovej aplikácii', { align: 'center' });

      // Footer
      doc.moveDown(3);
      doc.fontSize(8).text('BlackRent s.r.o. | www.blackrent.sk', { align: 'center' });

      doc.end();
    });
  }
}
```

### 2.5 Controller a Routes

**Súbor:** `backend/src/controllers/payment-orders.controller.ts`
```typescript
import { Request, Response } from 'express';
import { CreatePaymentOrderSchema } from '../types/payment-order.types';
import { PaymentOrdersService } from '../services/payment-orders.service';

export class PaymentOrdersController {
  constructor(private paymentOrdersService: PaymentOrdersService) {}

  async create(req: Request, res: Response) {
    try {
      const dto = CreatePaymentOrderSchema.parse(req.body);
      const userId = req.user?.id; // Z auth middleware

      const paymentOrder = await this.paymentOrdersService.create(dto, userId);

      res.status(201).json(paymentOrder);
    } catch (error) {
      // Error handling
      res.status(400).json({ error: error.message });
    }
  }

  async getByRental(req: Request, res: Response) {
    try {
      const { rentalId } = req.params;
      const paymentOrders = await this.paymentOrdersService.findByRental(rentalId);
      res.json(paymentOrders);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async downloadPDF(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pdfBuffer = await this.paymentOrdersService.getPDF(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="platobny-prikaz-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

**Súbor:** `backend/src/routes/payment-orders.routes.ts`
```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { PaymentOrdersController } from '../controllers/payment-orders.controller';

const router = Router();
const controller = new PaymentOrdersController(/* inject service */);

router.post('/', authMiddleware, controller.create.bind(controller));
router.get('/rental/:rentalId', authMiddleware, controller.getByRental.bind(controller));
router.get('/:id/pdf', authMiddleware, controller.downloadPDF.bind(controller));

export default router;
```

### 2.6 Main Service

**Súbor:** `backend/src/services/payment-orders.service.ts`
```typescript
import { Pool } from 'pg';
import { CreatePaymentOrderDto, PaymentOrder } from '../types/payment-order.types';
import { PaymentQRService } from './payment-qr.service';
import { PaymentPDFService } from './payment-pdf.service';
import { EmailService } from './email.service';

export class PaymentOrdersService {
  constructor(
    private db: Pool,
    private qrService: PaymentQRService,
    private pdfService: PaymentPDFService,
    private emailService: EmailService
  ) {}

  async create(dto: CreatePaymentOrderDto, userId?: string): Promise<PaymentOrder> {
    // 1. Načítaj rental a bank account
    const rental = await this.getRental(dto.rentalId);
    const bankAccount = await this.getBankAccount(dto.bankAccountId);

    // 2. Validuj amount podľa typu
    const expectedAmount = dto.type === 'rental' ? rental.totalPrice : rental.deposit;
    if (dto.amount !== expectedAmount) {
      throw new Error(`Amount mismatch: expected ${expectedAmount}, got ${dto.amount}`);
    }

    // 3. Generuj QR kód
    const qrData = await this.qrService.generateBySquareData({
      iban: bankAccount.iban,
      amount: dto.amount,
      currency: 'EUR',
      variableSymbol: dto.variableSymbol,
      specificSymbol: dto.specificSymbol,
      constantSymbol: dto.constantSymbol,
      message: dto.message,
    });

    const qrImage = await this.qrService.generateQRCodeImage(qrData);

    // 4. Generuj PDF
    const pdfBuffer = await this.pdfService.generatePaymentOrderPDF({
      orderNumber: rental.orderNumber,
      customerName: rental.customerName,
      vehicleName: `${rental.vehicle.brand} ${rental.vehicle.model}`,
      amount: dto.amount,
      type: dto.type,
      iban: bankAccount.iban,
      variableSymbol: dto.variableSymbol,
      qrCodeImage: qrImage,
      bankName: bankAccount.bankName,
      message: dto.message,
    });

    // 5. Upload PDF na R2 (TODO: implementovať)
    const pdfUrl = await this.uploadPDF(pdfBuffer, dto.rentalId, dto.type);

    // 6. Ulož do DB
    const paymentOrder = await this.saveToDatabase({
      ...dto,
      qrCodeData: qrData,
      qrCodeImage: qrImage,
      pdfUrl,
      createdBy: userId,
    });

    // 7. Pošli email (ak je požadované)
    if (dto.sendEmail && rental.customerEmail) {
      await this.emailService.sendPaymentOrder({
        to: rental.customerEmail,
        customerName: rental.customerName,
        orderNumber: rental.orderNumber,
        amount: dto.amount,
        type: dto.type,
        pdfBuffer,
        qrImage,
      });

      await this.markEmailSent(paymentOrder.id, rental.customerEmail);
    }

    return paymentOrder;
  }

  private async getRental(rentalId: string) {
    // Implementácia
  }

  private async getBankAccount(bankAccountId: string) {
    // Implementácia
  }

  private async saveToDatabase(data: any): Promise<PaymentOrder> {
    // Implementácia
  }

  private async uploadPDF(buffer: Buffer, rentalId: string, type: string): Promise<string> {
    // TODO: Upload na R2
    return '';
  }

  private async markEmailSent(paymentOrderId: string, recipient: string) {
    // Implementácia
  }

  async findByRental(rentalId: string): Promise<PaymentOrder[]> {
    // Implementácia
  }

  async getPDF(id: string): Promise<Buffer> {
    // Implementácia
  }
}
```

---

## 📦 FÁZA 3: Frontend - Komponenty (2 hodiny)

### 3.1 Inštalácia balíčkov
```bash
cd apps/web
pnpm add react-qr-code
```

### 3.2 Typy

**Súbor:** `apps/web/src/types/payment-order.types.ts`
```typescript
export type PaymentOrderType = 'rental' | 'deposit';

export interface BankAccount {
  id: string;
  name: string;
  iban: string;
  swiftBic?: string;
  bankName?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface PaymentOrder {
  id: string;
  rentalId: string;
  bankAccountId: string;
  type: PaymentOrderType;
  amount: number;
  currency: string;
  variableSymbol: string;
  qrCodeData: string;
  qrCodeImage?: string;
  message?: string;
  pdfUrl?: string;
  emailSent: boolean;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
}

export interface CreatePaymentOrderRequest {
  rentalId: string;
  bankAccountId: string;
  type: PaymentOrderType;
  amount: number;
  variableSymbol: string;
  message?: string;
  sendEmail: boolean;
}
```

### 3.3 API hooks

**Súbor:** `apps/web/src/lib/react-query/hooks/usePaymentOrders.ts`
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreatePaymentOrderRequest, PaymentOrder } from '@/types/payment-order.types';

export const useCreatePaymentOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentOrderRequest) => {
      const response = await api.post<PaymentOrder>('/payment-orders', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-orders', data.rentalId] });
    },
  });
};

export const usePaymentOrdersByRental = (rentalId: string) => {
  return useQuery({
    queryKey: ['payment-orders', rentalId],
    queryFn: async () => {
      const response = await api.get<PaymentOrder[]>(`/payment-orders/rental/${rentalId}`);
      return response.data;
    },
    enabled: !!rentalId,
  });
};

export const useBankAccounts = () => {
  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const response = await api.get<BankAccount[]>('/bank-accounts');
      return response.data;
    },
  });
};
```

### 3.4 Tlačítka v MobileRentalRow

**Súbor:** `apps/web/src/components/rentals/MobileRentalRow.tsx`

Pridať medzi PriceDisplay a tlačítka Odovzdať/Prevziať (riadok ~246):

```typescript
{/* 💳 PLATOBNÉ PRÍKAZY - NOVÁ SEKCIA */}
<div className="flex gap-2 mb-3">
  <Button
    variant="outline"
    size="sm"
    className="flex-1 h-10 text-xs font-semibold border-blue-500 text-blue-600 hover:bg-blue-50"
    onClick={(e) => {
      e.stopPropagation();
      onCreatePaymentOrder(rental, 'rental');
    }}
  >
    <EuroIcon className="w-4 h-4 mr-1" />
    Platba prenájmu
  </Button>

  {rental.deposit && rental.deposit > 0 && (
    <Button
      variant="outline"
      size="sm"
      className="flex-1 h-10 text-xs font-semibold border-purple-500 text-purple-600 hover:bg-purple-50"
      onClick={(e) => {
        e.stopPropagation();
        onCreatePaymentOrder(rental, 'deposit');
      }}
    >
      <ShieldIcon className="w-4 h-4 mr-1" />
      Platba depozitu
    </Button>
  )}
</div>
```

### 3.5 Modal pre vytvorenie platobného príkazu

**Súbor:** `apps/web/src/components/rentals/components/PaymentOrderDialog.tsx`
```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCreatePaymentOrder, useBankAccounts } from '@/lib/react-query/hooks/usePaymentOrders';
import type { Rental } from '@/types';
import type { PaymentOrderType } from '@/types/payment-order.types';

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
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [sendEmail, setSendEmail] = useState(true);

  const { data: bankAccounts = [], isLoading: loadingAccounts } = useBankAccounts();
  const createMutation = useCreatePaymentOrder();

  if (!rental || !type) return null;

  const amount = type === 'rental' ? rental.totalPrice : rental.deposit || 0;
  const variableSymbol = rental.orderNumber?.replace('OBJ', '') || '';
  const typeLabel = type === 'rental' ? 'prenájmu' : 'depozitu';

  const handleCreate = async () => {
    if (!selectedBankAccountId) {
      alert('Vyberte bankový účet');
      return;
    }

    try {
      const paymentOrder = await createMutation.mutateAsync({
        rentalId: rental.id,
        bankAccountId: selectedBankAccountId,
        type,
        amount,
        variableSymbol,
        message: `Úhrada ${typeLabel} - ${rental.vehicle?.brand} ${rental.vehicle?.model}`,
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
          <DialogTitle>Vytvoriť platobný príkaz na úhradu {typeLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informácie o prenájme */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Objednávka</p>
            <p className="font-semibold">{rental.orderNumber}</p>
            
            <p className="text-sm text-gray-600 mb-1 mt-2">Zákazník</p>
            <p className="font-semibold">{rental.customerName}</p>
            
            <p className="text-sm text-gray-600 mb-1 mt-2">Suma</p>
            <p className="text-2xl font-bold text-green-600">{amount.toFixed(2)} EUR</p>
          </div>

          {/* Výber bankového účtu */}
          <div>
            <Label>Bankový účet</Label>
            <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte účet" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts
                  .filter(acc => acc.isActive)
                  .map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.iban}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label htmlFor="send-email">
              Odoslať platobný príkaz emailom zákazníkovi
            </Label>
          </div>

          {/* Variabilný symbol info */}
          <div className="text-xs text-gray-500">
            Variabilný symbol: {variableSymbol}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Zrušiť
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedBankAccountId || createMutation.isPending}
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
```

### 3.6 Modal pre zobrazenie platobného príkazu

**Súbor:** `apps/web/src/components/rentals/components/PaymentOrderViewDialog.tsx`
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Mail, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';
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
    window.open(`/api/payment-orders/${paymentOrder.id}/pdf`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const typeLabel = paymentOrder.type === 'rental' ? 'Prenájom' : 'Depozit';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Platobný príkaz - {typeLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Platobné údaje */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Suma</p>
              <p className="text-2xl font-bold text-green-600">
                {paymentOrder.amount.toFixed(2)} {paymentOrder.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Variabilný symbol</p>
              <p className="text-lg font-semibold">{paymentOrder.variableSymbol}</p>
            </div>
          </div>

          {/* QR kód */}
          <div className="flex justify-center p-6 bg-white border rounded-lg">
            <QRCode value={paymentOrder.qrCodeData} size={256} />
          </div>

          <p className="text-center text-sm text-gray-600">
            Naskenujte QR kód v mobilnej bankovej aplikácii
          </p>

          {/* Email status */}
          {paymentOrder.emailSent && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Mail className="w-4 h-4" />
              Odoslané emailom
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Stiahnuť PDF
            </Button>
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Tlačiť
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📦 FÁZA 4: Admin rozhranie pre bankové účty (1 hodina)

### 4.1 Stránka pre správu účtov

**Súbor:** `apps/web/src/pages/BankAccountsPage.tsx`

- Zoznam bankových účtov
- Pridanie nového účtu
- Úprava existujúceho
- Aktivácia/deaktivácia
- Nastavenie default účtu

---

## 📦 FÁZA 5: Email notifikácie (1 hodina)

### 5.1 Email template

**Súbor:** `backend/src/templates/payment-order-email.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Platobný príkaz - BlackRent</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
    <h1>Platobný príkaz</h1>
  </div>
  
  <div style="padding: 20px;">
    <p>Dobrý deň {{customerName}},</p>
    
    <p>zasielame Vám platobný príkaz na úhradu {{typeLabel}} pre objednávku <strong>{{orderNumber}}</strong>.</p>
    
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Platobné údaje:</h3>
      <p><strong>Suma:</strong> {{amount}} EUR</p>
      <p><strong>IBAN:</strong> {{iban}}</p>
      <p><strong>Variabilný symbol:</strong> {{variableSymbol}}</p>
      {{#if message}}
      <p><strong>Správa:</strong> {{message}}</p>
      {{/if}}
    </div>
    
    <p>V prílohe nájdete platobný príkaz s QR kódom, ktorý môžete použiť v mobilnej bankovej aplikácii.</p>
    
    <p>S pozdravom,<br>Tím BlackRent</p>
  </div>
  
  <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>BlackRent s.r.o. | www.blackrent.sk</p>
  </div>
</body>
</html>
```

---

## 📦 FÁZA 6: Testovanie (1 hodina)

### 6.1 Unit testy
- PaymentQRService
- PaymentPDFService
- PaymentOrdersService

### 6.2 Integration testy
- API endpoints
- Email sending
- PDF generation

### 6.3 E2E testy
- Vytvorenie platobného príkazu cez UI
- Stiahnutie PDF
- Email delivery

---

## ⏱️ Časový odhad

| Fáza | Čas | Kumulatívne |
|------|-----|-------------|
| 1. Databáza | 30 min | 30 min |
| 2. Backend API | 2 hod | 2.5 hod |
| 3. Frontend | 2 hod | 4.5 hod |
| 4. Admin UI | 1 hod | 5.5 hod |
| 5. Email | 1 hod | 6.5 hod |
| 6. Testovanie | 1 hod | 7.5 hod |

**Celkom: ~7.5 hodiny**

---

## 🚀 Postup implementácie

1. ✅ Vytvor databázovú schému a migrácie
2. ✅ Implementuj backend služby (QR, PDF)
3. ✅ Vytvor API endpoints
4. ✅ Implementuj frontend komponenty
5. ✅ Pridaj tlačítka do UI
6. ✅ Vytvor admin rozhranie pre účty
7. ✅ Implementuj email notifikácie
8. ✅ Testovanie a oprava chýb
9. ✅ Dokumentácia

---

## 📝 Poznámky

- **Pay by square** je oficiálny slovenský/český štandard
- **QR kód** obsahuje všetky platobné údaje
- **PDF** je optimalizované pre tlač aj email
- **Audit trail** - všetko sa ukladá do DB
- **Email** - automatické odoslanie zákazníkovi
- **Budúcnosť** - integrácia s bankou pre sledovanie úhrad

---

## 🔒 Bezpečnosť

- ✅ Zod validácia všetkých vstupov
- ✅ Auth middleware na všetkých endpointoch
- ✅ Rate limiting
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection
- ✅ CSRF tokens

---

## 📚 Dokumentácia knižníc

- [bysquare](https://www.npmjs.com/package/bysquare) - Pay by square generátor
- [qrcode](https://www.npmjs.com/package/qrcode) - QR kód generátor
- [pdfkit](https://www.npmjs.com/package/pdfkit) - PDF generátor
- [react-qr-code](https://www.npmjs.com/package/react-qr-code) - React QR komponent

---

**Vytvorené:** {{DATE}}
**Autor:** Cursor AI
**Status:** 📋 Plán pripravený - čaká na schválenie




