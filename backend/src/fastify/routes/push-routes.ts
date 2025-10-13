/**
 * 🔔 PUSH NOTIFICATIONS ROUTES - Fastify Migration
 * 
 * Migrated from: backend/src/routes/push.ts
 * Purpose: Push notification management (web push)
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import webpush from 'web-push';
import { z } from 'zod';
import { authenticateFastify, requireRoleFastify } from '../decorators/auth';
import { postgresDatabase } from '../../models/postgres-database';

// VAPID keys configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@blackrent.sk';

// Initialize web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && 
    VAPID_PUBLIC_KEY !== 'your-vapid-public-key' && 
    VAPID_PRIVATE_KEY !== 'your-vapid-private-key') {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (error) {
    console.warn('⚠️ VAPID keys configuration failed:', error);
  }
}

// Zod schemas
const SubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().min(1),
    keys: z.object({
      p256dh: z.string().optional(),
      auth: z.string().optional()
    }).optional()
  }),
  timestamp: z.string().optional(),
  userAgent: z.string().optional()
});

const UnsubscribeSchema = z.object({
  endpoint: z.string().min(1)
});

const SendNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  icon: z.string().optional(),
  badge: z.string().optional(),
  image: z.string().optional(),
  tag: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(z.record(z.string(), z.unknown())).optional(),
  targetUsers: z.array(z.string()).optional(),
  requireInteraction: z.boolean().optional(),
  silent: z.boolean().optional(),
  vibrate: z.array(z.number()).optional(),
  ttl: z.number().optional()
});

// Helper function
async function logNotificationDelivery(
  subscriptionId: string,
  status: string,
  payload: Record<string, unknown>,
  errorMessage?: string
): Promise<void> {
  try {
    await postgresDatabase.query(
      `INSERT INTO notification_logs (
        subscription_id, status, payload, error_message, created_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [subscriptionId, status, JSON.stringify(payload), errorMessage || null]
    );
  } catch (error) {
    // Silently fail - logging shouldn't break the app
  }
}

const pushRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/push/vapid-key - Get VAPID public key
  fastify.get('/vapid-key', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      publicKey: VAPID_PUBLIC_KEY
    });
  });

  // POST /api/push/subscription - Subscribe to push notifications
  fastify.post<{
    Body: z.infer<typeof SubscriptionSchema>;
  }>('/subscription', {
    onRequest: [authenticateFastify],
    schema: {
      body: SubscriptionSchema
    }
  }, async (request, reply) => {
    try {
      const { subscription, userAgent } = request.body;
      const userId = request.user?.id;

      const result = await postgresDatabase.query<{ id: string }>(
        `INSERT INTO push_subscriptions (
          user_id, endpoint, p256dh_key, auth_key, user_agent, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (user_id, endpoint) 
        DO UPDATE SET 
          p256dh_key = $3,
          auth_key = $4,
          user_agent = $5,
          updated_at = NOW()
        RETURNING id`,
        [
          userId,
          subscription.endpoint,
          subscription.keys?.p256dh || '',
          subscription.keys?.auth || '',
          userAgent || ''
        ]
      );

      request.log.info({ userId }, `✅ Push subscription saved`);

      return reply.send({
        success: true,
        subscriptionId: result.rows[0]?.id
      });

    } catch (error) {
      request.log.error(error, '❌ Error saving push subscription');
      return reply.status(500).send({
        error: 'Failed to save subscription'
      });
    }
  });

  // DELETE /api/push/subscription - Unsubscribe from push notifications
  fastify.delete<{
    Body: z.infer<typeof UnsubscribeSchema>;
  }>('/subscription', {
    onRequest: [authenticateFastify],
    schema: {
      body: UnsubscribeSchema
    }
  }, async (request, reply) => {
    try {
      const { endpoint } = request.body;
      const userId = request.user?.id;

      await postgresDatabase.query(
        'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
        [userId, endpoint]
      );

      request.log.info({ userId }, `✅ Push subscription removed`);

      return reply.send({
        success: true
      });

    } catch (error) {
      request.log.error(error, '❌ Error removing push subscription');
      return reply.status(500).send({
        error: 'Failed to remove subscription'
      });
    }
  });

  // POST /api/push/send - Send push notification (admin only)
  fastify.post<{
    Body: z.infer<typeof SendNotificationSchema>;
  }>('/send', {
    onRequest: [authenticateFastify, requireRoleFastify(['admin'])],
    schema: {
      body: SendNotificationSchema
    }
  }, async (request, reply) => {
    try {
      const body = request.body;

      // Get target subscriptions
      let query = 'SELECT * FROM push_subscriptions WHERE active = true';
      const params: any[] = [];

      if (body.targetUsers && body.targetUsers.length > 0) {
        query += ` AND user_id = ANY($1)`;
        params.push(body.targetUsers);
      }

      interface Subscription {
        id: string;
        endpoint: string;
        p256dh_key: string;
        auth_key: string;
        user_id: string;
        active: boolean;
      }

      const subscriptions = await postgresDatabase.query<Subscription>(query, params);

      if (subscriptions.rows.length === 0) {
        return reply.status(404).send({
          error: 'No active subscriptions found'
        });
      }

      // Prepare notification payload
      const notificationPayload = {
        title: body.title,
        body: body.body,
        icon: body.icon || '/logo192.png',
        badge: body.badge || '/favicon.ico',
        image: body.image,
        tag: body.tag || `notification-${Date.now()}`,
        data: {
          ...body.data,
          timestamp: Date.now(),
          url: body.data?.url || '/',
          clickAction: body.data?.clickAction || 'open_app'
        },
        actions: body.actions || [],
        requireInteraction: body.requireInteraction || false,
        silent: body.silent || false,
        vibrate: body.vibrate || [200, 100, 200],
        timestamp: Date.now()
      };

      // Send notifications
      const sendPromises = subscriptions.rows.map(async (sub: Subscription) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload),
            {
              TTL: body.ttl || 86400,
              urgency: body.requireInteraction ? 'high' : 'normal'
            }
          );

          await logNotificationDelivery(sub.id, 'sent', notificationPayload);
          return { subscriptionId: sub.id, status: 'sent' };

        } catch (error: unknown) {
          request.log.error({ subscriptionId: sub.id, error }, `❌ Failed to send to subscription`);

          // Deactivate expired subscriptions
          const webPushError = error as { statusCode?: number };
          if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            await postgresDatabase.query(
              'UPDATE push_subscriptions SET active = false WHERE id = $1',
              [sub.id]
            );
          }

          await logNotificationDelivery(sub.id, 'failed', notificationPayload, error instanceof Error ? error.message : String(error));
          return { subscriptionId: sub.id, status: 'failed', error: error instanceof Error ? error.message : String(error) };
        }
      });

      const results = await Promise.all(sendPromises);

      const summary = {
        total: results.length,
        sent: results.filter((r: { status: string }) => r.status === 'sent').length,
        failed: results.filter((r: { status: string }) => r.status === 'failed').length
      };

      request.log.info(summary, `📊 Push notification summary`);

      return reply.send({
        success: true,
        summary,
        results
      });

    } catch (error) {
      request.log.error(error, '❌ Error sending push notifications');
      return reply.status(500).send({
        error: 'Failed to send notifications'
      });
    }
  });

  // GET /api/push/subscription/status - Get user's subscription status
  fastify.get('/subscription/status', {
    onRequest: [authenticateFastify]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;

      interface StatusSubscription {
        id: string;
        endpoint: string;
        active: boolean;
        created_at: string;
      }

      const subscriptions = await postgresDatabase.query<StatusSubscription>(
        'SELECT id, endpoint, active, created_at FROM push_subscriptions WHERE user_id = $1',
        [userId]
      );

      return reply.send({
        subscriptions: subscriptions.rows,
        hasActiveSubscription: subscriptions.rows.some((sub: StatusSubscription) => sub.active)
      });

    } catch (error) {
      request.log.error(error, '❌ Error getting subscription status');
      return reply.status(500).send({
        error: 'Failed to get subscription status'
      });
    }
  });
};

export default pushRoutes;

