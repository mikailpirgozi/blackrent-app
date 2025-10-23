import { z } from 'zod';

// ============================================================================
// ENUMS & SCHEMAS
// ============================================================================

export const PaymentOrderTypeSchema = z.enum(['rental', 'deposit']);
export type PaymentOrderType = z.infer<typeof PaymentOrderTypeSchema>;

export const PaymentStatusSchema = z.enum(['pending', 'paid', 'cancelled']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// ============================================================================
// BANK ACCOUNT
// ============================================================================

export interface BankAccount {
  id: string;
  name: string;
  iban: string;
  swiftBic?: string;
  bankName?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateBankAccountSchema = z.object({
  name: z.string().min(1, 'Názov je povinný').max(255),
  iban: z
    .string()
    .min(15, 'IBAN musí mať aspoň 15 znakov')
    .max(34, 'IBAN môže mať maximálne 34 znakov')
    .transform((val) => val.replace(/\s/g, '').toUpperCase())
    .refine(
      (val) => /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(val),
      'Neplatný formát IBAN (napr. SK0000000000000000000000)'
    ),
  swiftBic: z
    .string()
    .max(11)
    .transform((val) => (val ? val.replace(/\s/g, '').toUpperCase() : val))
    .optional()
    .or(z.literal('')),
  bankName: z.string().max(255).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export type CreateBankAccountDto = z.infer<typeof CreateBankAccountSchema>;

export const UpdateBankAccountSchema = CreateBankAccountSchema.partial();
export type UpdateBankAccountDto = z.infer<typeof UpdateBankAccountSchema>;

// ============================================================================
// PAYMENT ORDER
// ============================================================================

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
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CreatePaymentOrderSchema = z.object({
  // ✅ rentalId can be either UUID or integer (converted to string)
  rentalId: z.string().min(1, 'Rental ID is required'),
  // ✅ bankAccountId must be UUID
  bankAccountId: z.string().uuid('Invalid bank account ID'),
  type: PaymentOrderTypeSchema,
  amount: z.number().positive('Amount must be positive'),
  variableSymbol: z.string().min(1).max(20),
  specificSymbol: z.string().max(20).optional(),
  constantSymbol: z.string().max(4).optional(),
  message: z.string().max(140).optional(),
  sendEmail: z.boolean().default(true),
});

export type CreatePaymentOrderDto = z.infer<typeof CreatePaymentOrderSchema>;

export const UpdatePaymentStatusSchema = z.object({
  paymentStatus: PaymentStatusSchema,
  paidAt: z.date().optional(),
});

export type UpdatePaymentStatusDto = z.infer<typeof UpdatePaymentStatusSchema>;

// ============================================================================
// QR CODE GENERATION PARAMS
// ============================================================================

export interface GenerateQRParams {
  iban: string;
  amount: number;
  currency: string;
  variableSymbol: string;
  specificSymbol?: string;
  constantSymbol?: string;
  message?: string;
  dueDate?: Date;
}

// ============================================================================
// PDF GENERATION PARAMS
// ============================================================================

export interface GeneratePDFParams {
  orderNumber: string;
  customerName: string;
  vehicleName: string;
  amount: number;
  type: PaymentOrderType;
  iban: string;
  variableSymbol: string;
  qrCodeImage: string;
  bankName: string;
  message?: string;
}

// ============================================================================
// EMAIL PARAMS
// ============================================================================

export interface SendPaymentOrderEmailParams {
  to: string;
  customerName: string;
  orderNumber: string;
  amount: number;
  type: PaymentOrderType;
  iban: string;
  variableSymbol: string;
  message?: string;
  pdfBuffer: Buffer;
  qrImage: string;
}

