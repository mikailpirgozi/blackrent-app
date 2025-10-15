/**
 * Stripe Payment Service
 * Handles all Stripe-related payment operations
 */

import { initStripe, useStripe, confirmPayment, confirmPlatformPayPayment } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG, type PaymentIntentResponse, type PaymentResult } from '../../config/stripe';
import api from '../../config/api';

/**
 * Initialize Stripe SDK
 * Call this on app startup
 */
export const initializeStripe = async (): Promise<void> => {
  try {
    await initStripe({
      publishableKey: STRIPE_CONFIG.publishableKey,
      merchantIdentifier: STRIPE_CONFIG.merchantIdentifier,
      merchantDisplayName: STRIPE_CONFIG.merchantDisplayName,
      urlScheme: 'blackrent', // For redirects
    });
    console.log('Stripe initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }
};

/**
 * Create Payment Intent on backend
 */
export const createPaymentIntent = async (data: {
  amount: number;
  currency?: string;
  rentalId?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}): Promise<PaymentIntentResponse> => {
  try {
    const response = await api.post<{ data: PaymentIntentResponse }>('/payments/create-intent', {
      amount: data.amount,
      currency: data.currency || 'eur',
      rentalId: data.rentalId,
      customerId: data.customerId,
      metadata: data.metadata,
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

/**
 * Confirm Payment with Card
 */
export const confirmCardPayment = async (
  clientSecret: string,
  billingDetails?: {
    email?: string;
    name?: string;
    phone?: string;
  }
): Promise<PaymentResult> => {
  try {
    const { error, paymentIntent } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',
      paymentMethodData: {
        billingDetails,
      },
    });

    if (error) {
      console.error('Payment confirmation error:', error);
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }

    if (paymentIntent) {
      return {
        success: paymentIntent.status === 'Succeeded',
        paymentIntentId: paymentIntent.id,
        requiresAction: paymentIntent.status === 'RequiresAction',
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    };
  } catch (error) {
    console.error('Payment confirmation exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
};

/**
 * Process Apple Pay Payment
 */
export const processApplePayPayment = async (
  clientSecret: string,
  merchantIdentifier: string,
  cartItems: Array<{
    label: string;
    amount: string;
  }>,
  country: string = 'SK',
  currency: string = 'EUR'
): Promise<PaymentResult> => {
  try {
    const { error, paymentIntent } = await confirmPlatformPayPayment(clientSecret, {
      applePay: {
        cartItems,
        merchantCountryCode: country,
        currencyCode: currency,
      },
    });

    if (error) {
      console.error('Apple Pay error:', error);
      return {
        success: false,
        error: error.message || 'Apple Pay failed',
      };
    }

    if (paymentIntent) {
      return {
        success: paymentIntent.status === 'Succeeded',
        paymentIntentId: paymentIntent.id,
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    };
  } catch (error) {
    console.error('Apple Pay exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Apple Pay failed',
    };
  }
};

/**
 * Process Google Pay Payment
 */
export const processGooglePayPayment = async (
  clientSecret: string,
  amount: number,
  currencyCode: string = 'EUR',
  countryCode: string = 'SK'
): Promise<PaymentResult> => {
  try {
    const { error, paymentIntent } = await confirmPlatformPayPayment(clientSecret, {
      googlePay: {
        testEnv: __DEV__,
        merchantName: STRIPE_CONFIG.merchantDisplayName,
        merchantCountryCode: countryCode,
        currencyCode,
        billingAddressConfig: {
          isRequired: false,
        },
      },
    });

    if (error) {
      console.error('Google Pay error:', error);
      return {
        success: false,
        error: error.message || 'Google Pay failed',
      };
    }

    if (paymentIntent) {
      return {
        success: paymentIntent.status === 'Succeeded',
        paymentIntentId: paymentIntent.id,
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    };
  } catch (error) {
    console.error('Google Pay exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google Pay failed',
    };
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (paymentIntentId: string): Promise<{
  status: string;
  amount: number;
  currency: string;
}> => {
  try {
    const response = await api.get(`/payments/${paymentIntentId}/status`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to check payment status:', error);
    throw new Error('Failed to check payment status');
  }
};

/**
 * Save payment method for future use
 */
export const savePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  try {
    await api.post('/payments/save-method', {
      paymentMethodId,
    });
  } catch (error) {
    console.error('Failed to save payment method:', error);
    throw new Error('Failed to save payment method');
  }
};

/**
 * Get saved payment methods
 */
export const getSavedPaymentMethods = async (): Promise<Array<{
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}>> => {
  try {
    const response = await api.get('/payments/methods');
    return response.data.data;
  } catch (error) {
    console.error('Failed to get saved payment methods:', error);
    return [];
  }
};

/**
 * Delete saved payment method
 */
export const deletePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  try {
    await api.delete(`/payments/methods/${paymentMethodId}`);
  } catch (error) {
    console.error('Failed to delete payment method:', error);
    throw new Error('Failed to delete payment method');
  }
};

// Export Stripe hook for components
export { useStripe };

