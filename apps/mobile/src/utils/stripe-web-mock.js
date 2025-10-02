/**
 * Stripe React Native Web Mock
 * Provides empty implementations for web platform
 */

// Mock StripeProvider component
export const StripeProvider = ({ children }) => children;

// Mock payment functions
export const PaymentSheetError = {};

export const confirmPayment = async () => ({
  error: { message: 'Payment not available on web' }
});

export const initPaymentSheet = async () => ({
  error: { message: 'Payment not available on web' }
});

export const presentPaymentSheet = async () => ({
  error: { message: 'Payment not available on web' }
});

// Mock card components
export const CardField = () => null;
export const CardForm = () => null;

// Default export
export default {
  StripeProvider,
  PaymentSheetError,
  confirmPayment,
  initPaymentSheet,
  presentPaymentSheet,
  CardField,
  CardForm,
};
