// ============================================================================
// PAYMENT ORDER TYPES
// ============================================================================

export type PaymentOrderType = 'rental' | 'deposit';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

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
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountRequest {
  name: string;
  iban: string;
  swiftBic?: string;
  bankName?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateBankAccountRequest {
  name?: string;
  iban?: string;
  swiftBic?: string;
  bankName?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

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
  pdfGeneratedAt?: string;
  emailSent: boolean;
  emailSentAt?: string;
  emailRecipient?: string;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentOrderRequest {
  rentalId: string;
  bankAccountId: string;
  type: PaymentOrderType;
  amount: number;
  variableSymbol: string;
  specificSymbol?: string;
  constantSymbol?: string;
  message?: string;
  sendEmail: boolean;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: PaymentStatus;
  paidAt?: string;
}
