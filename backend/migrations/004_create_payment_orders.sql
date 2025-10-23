-- ============================================================================
-- PAYMENT ORDERS & BANK ACCOUNTS MIGRATION
-- ============================================================================
-- Created: 2025-10-22
-- Description: Pridáva tabuľky pre platobné príkazy s QR kódmi
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. BANK ACCOUNTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  iban VARCHAR(34) NOT NULL UNIQUE,
  swift_bic VARCHAR(11),
  bank_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_iban CHECK (iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]+$')
);

-- Index pre rýchle vyhľadávanie aktívnych účtov
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. PAYMENT ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id INTEGER NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  
  -- Typ platby
  type VARCHAR(20) NOT NULL,
  
  -- Platobné údaje
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  variable_symbol VARCHAR(20) NOT NULL,
  specific_symbol VARCHAR(20),
  constant_symbol VARCHAR(4),
  
  -- QR kód dáta
  qr_code_data TEXT NOT NULL,
  qr_code_image TEXT,
  
  -- Správa pre príjemcu
  message VARCHAR(140),
  
  -- PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMPTZ,
  
  -- Email
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_recipient VARCHAR(255),
  
  -- Status
  payment_status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_type CHECK (type IN ('rental', 'deposit')),
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  CONSTRAINT unique_rental_type UNIQUE(rental_id, type)
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_payment_orders_rental ON payment_orders(rental_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created ON payment_orders(created_at DESC);

-- ============================================================================
-- 3. INSERT DEFAULT BANK ACCOUNT (PLACEHOLDER)
-- ============================================================================

INSERT INTO bank_accounts (name, iban, bank_name, is_active, is_default)
VALUES (
  'Hlavný účet BlackRent',
  'SK0000000000000000000000',
  'Banka (upraviť)',
  true,
  true
)
ON CONFLICT (iban) DO NOTHING;

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions na nové tabuľky pre všetkých používateľov
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_accounts TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_orders TO PUBLIC;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Payment orders tables created successfully';
  RAISE NOTICE '📋 Tables: bank_accounts, payment_orders';
  RAISE NOTICE '🔑 Default bank account created (please update IBAN)';
END $$;

