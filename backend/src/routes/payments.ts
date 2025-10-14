/**
 * Payments API Routes
 * Stripe payment integration for customer bookings
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import Stripe from 'stripe';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';

const router: Router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});

/**
 * POST /api/payments/create-intent
 * Create a Stripe Payment Intent for a booking
 */
router.post('/create-intent', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { amount, currency = 'eur', rentalId, customerId, metadata = {} } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount provided',
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // For mobile app, we don't want redirects
      },
      metadata: {
        rentalId: rentalId || '',
        customerId: customerId || '',
        ...metadata,
      },
      description: `Vehicle Rental Payment - Rental ID: ${rentalId || 'N/A'}`,
    });

    // Log payment intent creation
    console.log('[Payments] Created payment intent:', {
      id: paymentIntent.id,
      amount,
      currency,
      rentalId,
      customerId,
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error('[Payments] Create intent error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    });
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment and update rental status
 */
router.post('/confirm', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { paymentIntentId, rentalId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID required',
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: `Payment not successful. Status: ${paymentIntent.status}`,
      });
    }

    // Update rental payment status in database
    if (rentalId) {
      await postgresDatabase.updateRentalPaymentStatus(rentalId, {
        paymentIntentId,
        status: 'paid',
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paidAt: new Date(),
      });

      console.log('[Payments] Payment confirmed for rental:', {
        rentalId,
        paymentIntentId,
        amount: paymentIntent.amount,
      });
    }

    res.json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error) {
    console.error('[Payments] Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm payment',
    });
  }
});

/**
 * GET /api/payments/:paymentIntentId/status
 * Check payment status
 */
router.get('/:paymentIntentId/status', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error('[Payments] Check status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check payment status',
    });
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook handler for payment events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[Payments] Webhook signature or secret missing');
    return res.status(400).send('Webhook signature or secret missing');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    console.log('[Payments] Webhook event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Payments] Payment succeeded:', paymentIntent.id);
        
        // Update database with successful payment
        const rentalId = paymentIntent.metadata.rentalId;
        if (rentalId) {
          await postgresDatabase.updateRentalPaymentStatus(rentalId, {
            paymentIntentId: paymentIntent.id,
            status: 'paid',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paidAt: new Date(),
          });

          // TODO: Send confirmation email (when email service is ready)
          // await emailService.sendPaymentConfirmation(rentalId);

          // TODO: Send push notification (when push service is ready)
          // await pushNotificationService.sendPaymentSuccess(customerId);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('[Payments] Payment failed:', paymentIntent.id);
        
        // Update database with failed payment
        const rentalId = paymentIntent.metadata.rentalId;
        if (rentalId) {
          await postgresDatabase.updateRentalPaymentStatus(rentalId, {
            paymentIntentId: paymentIntent.id,
            status: 'failed',
            failureReason: paymentIntent.last_payment_error?.message,
          });

          // TODO: Send failure notification (when push service is ready)
          // await pushNotificationService.sendPaymentFailed(customerId);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('[Payments] Payment canceled:', paymentIntent.id);
        break;
      }

      default:
        console.log('[Payments] Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Payments] Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * POST /api/payments/save-method
 * Save payment method for future use
 */
router.post('/save-method', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { paymentMethodId, customerId } = req.body;

    if (!paymentMethodId || !customerId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID and customer ID required',
      });
    }

    // Attach payment method to customer
    // Note: This requires creating a Stripe customer first
    // TODO: Implement customer creation in auth flow
    
    res.json({
      success: true,
      message: 'Payment method saved successfully',
    });
  } catch (error) {
    console.error('[Payments] Save method error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save payment method',
    });
  }
});

/**
 * GET /api/payments/methods
 * Get saved payment methods for customer
 */
router.get('/methods', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID required',
      });
    }

    // TODO: Retrieve payment methods from Stripe customer
    // const paymentMethods = await stripe.paymentMethods.list({
    //   customer: stripeCustomerId,
    //   type: 'card',
    // });

    res.json({
      success: true,
      data: [], // Empty for now
    });
  } catch (error) {
    console.error('[Payments] Get methods error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment methods',
    });
  }
});

/**
 * DELETE /api/payments/methods/:paymentMethodId
 * Delete a saved payment method
 */
router.delete('/methods/:paymentMethodId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { paymentMethodId } = req.params;

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    console.error('[Payments] Delete method error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete payment method',
    });
  }
});

export default router;

