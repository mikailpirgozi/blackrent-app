-- Fix pre chýbajúcu email_processing_history tabuľku
CREATE TABLE IF NOT EXISTS email_processing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id TEXT UNIQUE NOT NULL,
    message_id TEXT,
    subject TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT DEFAULT 'info@blackrent.sk',
    email_content TEXT,
    email_html TEXT,
    received_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'processed', 'rejected', 'archived', 'duplicate')),
    action_taken TEXT CHECK (action_taken IN ('approved', 'rejected', 'edited', 'deleted', 'archived', 'duplicate')),
    processed_by UUID,
    parsed_data JSONB,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    error_message TEXT,
    notes TEXT,
    tags TEXT[],
    rental_id UUID,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vytvorenie indexov
CREATE INDEX IF NOT EXISTS idx_email_history_email_id ON email_processing_history(email_id);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_processing_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_sender ON email_processing_history(sender);
CREATE INDEX IF NOT EXISTS idx_email_history_received_at ON email_processing_history(received_at DESC);

-- Vytvorenie email_action_logs tabuľky
CREATE TABLE IF NOT EXISTS email_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES email_processing_history(id),
    user_id UUID,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT 'Email tabuľky úspešne vytvorené!' as result;
