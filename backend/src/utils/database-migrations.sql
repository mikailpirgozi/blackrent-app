-- Push Notifications Database Schema
-- Migration for push notification functionality

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique subscription per user and endpoint
    UNIQUE(user_id, endpoint)
);

-- Create notification_logs table for analytics
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'clicked', 'closed', 'displayed')),
    payload JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_notification_logs_subscription_id ON notification_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- Create notification_templates table for reusable templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    icon TEXT,
    badge TEXT,
    image TEXT,
    actions JSONB DEFAULT '[]',
    data JSONB DEFAULT '{}',
    require_interaction BOOLEAN DEFAULT false,
    silent BOOLEAN DEFAULT false,
    vibrate INTEGER[] DEFAULT ARRAY[200, 100, 200],
    ttl INTEGER DEFAULT 86400,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (name, title, body, icon, actions, require_interaction) VALUES
('rental_request', 
 '🚗 Nová žiadosť o prenájom', 
 'Zákazník {customer_name} žiada prenájom vozidla {vehicle_name}',
 '/logo192.png',
 '[
   {"action": "approve_rental", "title": "✅ Schváliť", "icon": "/icons/approve.png"},
   {"action": "reject_rental", "title": "❌ Zamietnuť", "icon": "/icons/reject.png"},
   {"action": "view_rental", "title": "👁️ Zobraziť", "icon": "/icons/view.png"}
 ]',
 true),

('rental_approved', 
 '✅ Prenájom schválený', 
 'Váš prenájom vozidla {vehicle_name} bol schválený',
 '/logo192.png',
 '[
   {"action": "view_rental", "title": "👁️ Zobraziť prenájom", "icon": "/icons/view.png"}
 ]',
 false),

('rental_rejected', 
 '❌ Prenájom zamietnutý', 
 'Váš prenájom vozidla {vehicle_name} bol zamietnutý. Dôvod: {reason}',
 '/logo192.png',
 '[
   {"action": "view_rental", "title": "👁️ Zobraziť detaily", "icon": "/icons/view.png"}
 ]',
 true),

('rental_reminder', 
 '⏰ Pripomienka prenájmu', 
 'Nezabudnite na prenájom vozidla {vehicle_name} dnes o {time}',
 '/logo192.png',
 '[
   {"action": "view_rental", "title": "👁️ Zobraziť prenájom", "icon": "/icons/view.png"}
 ]',
 false),

('vehicle_maintenance', 
 '🔧 Servis vozidla', 
 'Vozidlo {vehicle_name} potrebuje servis. Termín: {date}',
 '/logo192.png',
 '[
   {"action": "view_vehicle", "title": "👁️ Zobraziť vozidlo", "icon": "/icons/view.png"},
   {"action": "schedule_maintenance", "title": "📅 Naplánovať servis", "icon": "/icons/calendar.png"}
 ]',
 true),

('payment_reminder', 
 '💰 Pripomienka platby', 
 'Máte neuhradenú faktúru vo výške {amount}€. Splatnosť: {due_date}',
 '/logo192.png',
 '[
   {"action": "view_invoice", "title": "👁️ Zobraziť faktúru", "icon": "/icons/invoice.png"},
   {"action": "pay_now", "title": "💳 Zaplatiť teraz", "icon": "/icons/payment.png"}
 ]',
 true)

ON CONFLICT (name) DO NOTHING;

-- Create notification_preferences table for user preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    rental_requests BOOLEAN DEFAULT true,
    rental_approvals BOOLEAN DEFAULT true,
    rental_reminders BOOLEAN DEFAULT true,
    maintenance_alerts BOOLEAN DEFAULT true,
    payment_reminders BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at 
    BEFORE UPDATE ON push_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for notification analytics
CREATE OR REPLACE VIEW notification_analytics AS
SELECT 
    DATE(nl.created_at) as date,
    nl.status,
    COUNT(*) as count,
    COUNT(DISTINCT ps.user_id) as unique_users,
    AVG(CASE WHEN nl.status = 'sent' THEN 1 ELSE 0 END) as delivery_rate
FROM notification_logs nl
JOIN push_subscriptions ps ON nl.subscription_id = ps.id
WHERE nl.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(nl.created_at), nl.status
ORDER BY date DESC, status;

-- Create view for subscription statistics
CREATE OR REPLACE VIEW subscription_stats AS
SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(*) FILTER (WHERE active = true) as active_subscriptions,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT user_id) FILTER (WHERE active = true) as active_users
FROM push_subscriptions;

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
