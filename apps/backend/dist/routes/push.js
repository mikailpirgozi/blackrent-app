"use strict";
// 🔔 Push Notifications API Routes
// Backend implementation for push notification management
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const web_push_1 = __importDefault(require("web-push"));
const auth_1 = require("../middleware/auth");
const postgres_database_1 = require("../models/postgres-database");
const router = express_1.default.Router();
// VAPID keys configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@blackrent.sk';
// Initialize web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY !== 'your-vapid-public-key' && VAPID_PRIVATE_KEY !== 'your-vapid-private-key') {
    try {
        web_push_1.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        console.log('✅ Web Push VAPID keys configured');
    }
    catch (error) {
        console.warn('⚠️ VAPID keys configuration failed:', error);
    }
}
else {
    console.warn('⚠️ VAPID keys not configured - push notifications will not work');
}
// Get VAPID public key
router.get('/vapid-key', (req, res) => {
    res.json({
        publicKey: VAPID_PUBLIC_KEY
    });
});
// Subscribe to push notifications
router.post('/subscription', auth_1.authenticateToken, async (req, res) => {
    try {
        const { subscription, timestamp, userAgent } = req.body;
        const userId = req.user?.id;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({
                error: 'Invalid subscription data'
            });
        }
        // Store subscription in database
        const result = await postgres_database_1.postgresDatabase.query(`INSERT INTO push_subscriptions (
        user_id, endpoint, p256dh_key, auth_key, user_agent, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (user_id, endpoint) 
      DO UPDATE SET 
        p256dh_key = $3,
        auth_key = $4,
        user_agent = $5,
        updated_at = NOW()
      RETURNING id`, [
            userId,
            subscription.endpoint,
            subscription.keys?.p256dh || '',
            subscription.keys?.auth || '',
            userAgent || ''
        ]);
        console.log(`✅ Push subscription saved for user ${userId}`);
        res.json({
            success: true,
            subscriptionId: result.rows[0]?.id
        });
    }
    catch (error) {
        console.error('❌ Error saving push subscription:', error);
        res.status(500).json({
            error: 'Failed to save subscription'
        });
    }
});
// Unsubscribe from push notifications
router.delete('/subscription', auth_1.authenticateToken, async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user?.id;
        await postgres_database_1.postgresDatabase.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
        console.log(`✅ Push subscription removed for user ${userId}`);
        res.json({
            success: true
        });
    }
    catch (error) {
        console.error('❌ Error removing push subscription:', error);
        res.status(500).json({
            error: 'Failed to remove subscription'
        });
    }
});
// Send push notification (admin only)
router.post('/send', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { title, body, icon, badge, image, tag, data = {}, actions = [], targetUsers = [], // Empty array means send to all
        requireInteraction = false, silent = false, vibrate, ttl = 86400 // 24 hours
         } = req.body;
        if (!title || !body) {
            return res.status(400).json({
                error: 'Title and body are required'
            });
        }
        // Get target subscriptions
        let query = 'SELECT * FROM push_subscriptions WHERE active = true';
        const params = [];
        if (targetUsers.length > 0) {
            query += ` AND user_id = ANY($1)`;
            params.push(targetUsers);
        }
        const subscriptions = await postgres_database_1.postgresDatabase.query(query, params);
        if (subscriptions.rows.length === 0) {
            return res.status(404).json({
                error: 'No active subscriptions found'
            });
        }
        // Prepare notification payload
        const notificationPayload = {
            title,
            body,
            icon: icon || '/logo192.png',
            badge: badge || '/favicon.ico',
            image,
            tag: tag || `notification-${Date.now()}`,
            data: {
                ...data,
                timestamp: Date.now(),
                url: data.url || '/',
                clickAction: data.clickAction || 'open_app'
            },
            actions: actions.map((action) => ({
                action: action.action,
                title: action.title,
                icon: action.icon
            })),
            requireInteraction,
            silent,
            vibrate: vibrate || [200, 100, 200],
            timestamp: Date.now()
        };
        // Send notifications to all subscriptions
        const sendPromises = subscriptions.rows.map(async (sub) => {
            try {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh_key,
                        auth: sub.auth_key
                    }
                };
                await web_push_1.default.sendNotification(pushSubscription, JSON.stringify(notificationPayload), {
                    TTL: ttl,
                    urgency: requireInteraction ? 'high' : 'normal'
                });
                // Log successful delivery
                await logNotificationDelivery(sub.id, 'sent', notificationPayload);
                return { subscriptionId: sub.id, status: 'sent' };
            }
            catch (error) {
                console.error(`❌ Failed to send to subscription ${sub.id}:`, error);
                // Handle expired subscriptions
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await postgres_database_1.postgresDatabase.query('UPDATE push_subscriptions SET active = false WHERE id = $1', [sub.id]);
                    console.log(`🗑️ Deactivated expired subscription ${sub.id}`);
                }
                await logNotificationDelivery(sub.id, 'failed', notificationPayload, error.message);
                return { subscriptionId: sub.id, status: 'failed', error: error.message };
            }
        });
        const results = await Promise.all(sendPromises);
        const summary = {
            total: results.length,
            sent: results.filter((r) => r.status === 'sent').length,
            failed: results.filter((r) => r.status === 'failed').length
        };
        console.log(`📊 Push notification summary:`, summary);
        res.json({
            success: true,
            summary,
            results: results
        });
    }
    catch (error) {
        console.error('❌ Error sending push notifications:', error);
        res.status(500).json({
            error: 'Failed to send notifications'
        });
    }
});
// Send targeted notification to specific user
router.post('/send-to-user/:userId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'manager']), async (req, res) => {
    try {
        const { userId } = req.params;
        const notificationData = req.body;
        // Get user subscriptions
        const subscriptions = await postgres_database_1.postgresDatabase.query('SELECT * FROM push_subscriptions WHERE user_id = $1 AND active = true', [userId]);
        if (subscriptions.rows.length === 0) {
            return res.status(404).json({
                error: 'No active subscriptions found for user'
            });
        }
        // Send notification using the main send logic
        const sendResult = await sendPushNotificationToSubscriptions(subscriptions.rows, notificationData);
        res.json(sendResult);
    }
    catch (error) {
        console.error('❌ Error sending targeted notification:', error);
        res.status(500).json({
            error: 'Failed to send notification'
        });
    }
});
// Get notification analytics
router.get('/analytics', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        let query = `
      SELECT 
        DATE(created_at) as date,
        status,
        COUNT(*) as count
      FROM notification_logs 
      WHERE created_at >= $1 AND created_at <= $2
    `;
        const params = [
            startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            endDate || new Date()
        ];
        if (userId) {
            query += ' AND user_id = $3';
            params.push(userId);
        }
        query += ' GROUP BY DATE(created_at), status ORDER BY date DESC';
        const analytics = await postgres_database_1.postgresDatabase.query(query, params);
        // Get subscription stats
        const subscriptionStats = await postgres_database_1.postgresDatabase.query(`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(*) FILTER (WHERE active = true) as active_subscriptions,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
      FROM push_subscriptions
    `);
        res.json({
            analytics: analytics.rows,
            subscriptionStats: subscriptionStats.rows[0]
        });
    }
    catch (error) {
        console.error('❌ Error getting notification analytics:', error);
        res.status(500).json({
            error: 'Failed to get analytics'
        });
    }
});
// Get user's subscription status
router.get('/subscription/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const subscriptions = await postgres_database_1.postgresDatabase.query('SELECT id, endpoint, active, created_at FROM push_subscriptions WHERE user_id = $1', [userId]);
        res.json({
            subscriptions: subscriptions.rows,
            hasActiveSubscription: subscriptions.rows.some((sub) => sub.active)
        });
    }
    catch (error) {
        console.error('❌ Error getting subscription status:', error);
        res.status(500).json({
            error: 'Failed to get subscription status'
        });
    }
});
// Business logic notification triggers
router.post('/trigger/rental-request', auth_1.authenticateToken, async (req, res) => {
    try {
        const { rentalId, customerId, vehicleId } = req.body;
        // Get rental details
        const rental = await postgres_database_1.postgresDatabase.query(`SELECT r.*, c.name as customer_name, v.brand, v.model 
       FROM rentals r 
       JOIN customers c ON r.customer_id = c.id 
       JOIN vehicles v ON r.vehicle_id = v.id 
       WHERE r.id = $1`, [rentalId]);
        if (rental.rows.length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }
        const rentalData = rental.rows[0];
        // Send notification to admins
        const adminUsers = await postgres_database_1.postgresDatabase.query("SELECT id FROM users WHERE role IN ('admin', 'manager')");
        const notificationData = {
            title: '🚗 Nová žiadosť o prenájom',
            body: `${rentalData.customer_name} žiada prenájom ${rentalData.brand} ${rentalData.model}`,
            icon: '/logo192.png',
            tag: `rental-request-${rentalId}`,
            data: {
                rentalId,
                customerId,
                vehicleId,
                url: `/rentals/${rentalId}`,
                clickAction: 'view_rental'
            },
            actions: [
                {
                    action: 'approve_rental',
                    title: '✅ Schváliť',
                    icon: '/icons/approve.png'
                },
                {
                    action: 'reject_rental',
                    title: '❌ Zamietnuť',
                    icon: '/icons/reject.png'
                },
                {
                    action: 'view_rental',
                    title: '👁️ Zobraziť',
                    icon: '/icons/view.png'
                }
            ],
            requireInteraction: true
        };
        // Send to admin subscriptions
        const adminSubscriptions = await postgres_database_1.postgresDatabase.query(`SELECT ps.* FROM push_subscriptions ps 
       JOIN users u ON ps.user_id = u.id 
       WHERE u.role IN ('admin', 'manager') AND ps.active = true`);
        const result = await sendPushNotificationToSubscriptions(adminSubscriptions.rows, notificationData);
        res.json(result);
    }
    catch (error) {
        console.error('❌ Error triggering rental request notification:', error);
        res.status(500).json({
            error: 'Failed to trigger notification'
        });
    }
});
// Helper function to send notifications to multiple subscriptions
async function sendPushNotificationToSubscriptions(subscriptions, notificationData) {
    const notificationPayload = {
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon || '/logo192.png',
        badge: notificationData.badge || '/favicon.ico',
        image: notificationData.image,
        tag: notificationData.tag || `notification-${Date.now()}`,
        data: {
            ...notificationData.data,
            timestamp: Date.now()
        },
        actions: notificationData.actions || [],
        requireInteraction: notificationData.requireInteraction || false,
        silent: notificationData.silent || false,
        vibrate: notificationData.vibrate || [200, 100, 200],
        timestamp: Date.now()
    };
    const sendPromises = subscriptions.map(async (sub) => {
        try {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh_key,
                    auth: sub.auth_key
                }
            };
            await web_push_1.default.sendNotification(pushSubscription, JSON.stringify(notificationPayload), {
                TTL: notificationData.ttl || 86400,
                urgency: notificationData.requireInteraction ? 'high' : 'normal'
            });
            await logNotificationDelivery(sub.id, 'sent', notificationPayload);
            return { subscriptionId: sub.id, status: 'sent' };
        }
        catch (error) {
            console.error(`❌ Failed to send to subscription ${sub.id}:`, error);
            if (error.statusCode === 410 || error.statusCode === 404) {
                await postgres_database_1.postgresDatabase.query('UPDATE push_subscriptions SET active = false WHERE id = $1', [sub.id]);
            }
            await logNotificationDelivery(sub.id, 'failed', notificationPayload, error.message);
            return { subscriptionId: sub.id, status: 'failed', error: error.message };
        }
    });
    const results = await Promise.all(sendPromises);
    return {
        success: true,
        summary: {
            total: results.length,
            sent: results.filter((r) => r.status === 'sent').length,
            failed: results.filter((r) => r.status === 'failed').length
        },
        results
    };
}
// Log notification delivery for analytics
async function logNotificationDelivery(subscriptionId, status, payload, errorMessage) {
    try {
        await postgres_database_1.postgresDatabase.query(`INSERT INTO notification_logs (
        subscription_id, status, payload, error_message, created_at
      ) VALUES ($1, $2, $3, $4, NOW())`, [subscriptionId, status, JSON.stringify(payload), errorMessage || null]);
    }
    catch (error) {
        console.error('❌ Error logging notification delivery:', error);
    }
}
exports.default = router;
//# sourceMappingURL=push.js.map