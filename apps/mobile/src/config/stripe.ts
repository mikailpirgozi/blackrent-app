/**
 * Stripe Configuration
 * Centralized Stripe setup for payment processing
 */

import { STRIPE_PUBLISHABLE_KEY } from './constants';

export const STRIPE_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  
  // Merchant identifiers for Apple Pay and Google Pay
  merchantIdentifier: process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || 'merchant.com.blackrent',
  merchantDisplayName: 'BlackRent',
  
  // Payment options
  allowsDelayedPaymentMethods: true,
  
  // Google Pay
  googlePay: {
    testEnv: __DEV__,
    merchantName: 'BlackRent',
    merchantCountryCode: 'SK',
    currencyCode: 'EUR',
    billingAddressRequired: false,
  },
  
  // Apple Pay
  applePay: {
    merchantCountryCode: 'SK',
    currencyCode: 'EUR',
  },
  
  // 3D Secure
  threeDSecure: {
    enabled: true,
  },
};

// Stripe colors for theming
export const STRIPE_THEME = {
  light: {
    primaryColor: '#007AFF', // iOS Blue
    backgroundColor: '#FFFFFF',
    componentBackground: '#F5F5F5',
    componentBorder: '#E5E5E5',
    componentDivider: '#E5E5E5',
    primaryText: '#000000',
    secondaryText: '#8E8E93',
    componentText: '#000000',
    placeholderText: '#C7C7CC',
  },
  dark: {
    primaryColor: '#0A84FF', // iOS Blue Dark
    backgroundColor: '#000000',
    componentBackground: '#1C1C1E',
    componentBorder: '#38383A',
    componentDivider: '#38383A',
    primaryText: '#FFFFFF',
    secondaryText: '#8E8E93',
    componentText: '#FFFFFF',
    placeholderText: '#48484A',
  },
};

// Payment method types
export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay';

// Payment intent status
export type PaymentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface PaymentIntentResponse {
  clientSecret: string;
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  requiresAction?: boolean;
}

