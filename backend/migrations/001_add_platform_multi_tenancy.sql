-- ============================================================================
-- BLACKRENT PLATFORM MULTI-TENANCY MIGRATION
-- ============================================================================
-- This migration adds platform-level multi-tenancy support to the database.
-- It creates platforms table and adds platform_id to all relevant tables.
-- ============================================================================

-- 1️⃣ CREATE PLATFORMS TABLE
CREATE TABLE IF NOT EXISTS platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  subdomain VARCHAR(50) UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active platforms
CREATE INDEX IF NOT EXISTS idx_platforms_active ON platforms(is_active);

-- 2️⃣ INSERT DEFAULT PLATFORMS
INSERT INTO platforms (name, display_name, subdomain, is_active) 
VALUES 
  ('Blackrent', 'Blackrent - Premium Car Rental', 'blackrent', true),
  ('Impresario', 'Impresario - Luxury Fleet Management', 'impresario', true)
ON CONFLICT (name) DO NOTHING;

-- 3️⃣ ADD platform_id TO companies
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_companies_platform ON companies(platform_id);

-- 4️⃣ ADD platform_id TO users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform_id);
CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_id, role);

-- 5️⃣ ADD platform_id TO vehicles
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vehicles_platform ON vehicles(platform_id);

-- 6️⃣ ADD platform_id TO rentals
ALTER TABLE rentals 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_rentals_platform ON rentals(platform_id);

-- 7️⃣ ADD platform_id TO expenses
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_expenses_platform ON expenses(platform_id);

-- 8️⃣ ADD platform_id TO insurances
ALTER TABLE insurances 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_insurances_platform ON insurances(platform_id);

-- 9️⃣ ADD platform_id TO customers
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_customers_platform ON customers(platform_id);

-- 🔟 ADD platform_id TO settlements
ALTER TABLE settlements 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_settlements_platform ON settlements(platform_id);

-- 1️⃣1️⃣ ADD platform_id TO vehicle_documents
ALTER TABLE vehicle_documents 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_platform ON vehicle_documents(platform_id);

-- 1️⃣2️⃣ ADD platform_id TO insurance_claims
ALTER TABLE insurance_claims 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_insurance_claims_platform ON insurance_claims(platform_id);

-- 1️⃣3️⃣ ADD platform_id TO company_documents
ALTER TABLE company_documents 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_company_documents_platform ON company_documents(platform_id);

-- 1️⃣4️⃣ ADD platform_id TO handover_protocols
ALTER TABLE handover_protocols 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_handover_protocols_platform ON handover_protocols(platform_id);

-- 1️⃣5️⃣ ADD platform_id TO return_protocols
ALTER TABLE return_protocols 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_return_protocols_platform ON return_protocols(platform_id);

-- 1️⃣6️⃣ ADD platform_id TO vehicle_unavailability
ALTER TABLE vehicle_unavailability 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vehicle_unavailability_platform ON vehicle_unavailability(platform_id);

-- 1️⃣7️⃣ ADD platform_id TO company_investor_shares
ALTER TABLE company_investor_shares 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_company_investor_shares_platform ON company_investor_shares(platform_id);

-- 1️⃣8️⃣ ADD platform_id TO recurring_expenses
ALTER TABLE recurring_expenses 
  ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_platform ON recurring_expenses(platform_id);

-- ============================================================================
-- 🚀 DATA MIGRATION: Migrate existing admin/super_admin users to Blackrent
-- ============================================================================

-- Get Blackrent platform ID
DO $$
DECLARE
  blackrent_platform_id UUID;
BEGIN
  SELECT id INTO blackrent_platform_id FROM platforms WHERE name = 'Blackrent' LIMIT 1;
  
  -- Migrate all existing admin/super_admin users to Blackrent platform
  IF blackrent_platform_id IS NOT NULL THEN
    UPDATE users 
    SET platform_id = blackrent_platform_id 
    WHERE role IN ('admin', 'super_admin') 
    AND platform_id IS NULL;
    
    RAISE NOTICE 'Migrated admin users to Blackrent platform: %', blackrent_platform_id;
  END IF;
END $$;

-- ============================================================================
-- ✅ VERIFICATION QUERIES (run these after migration)
-- ============================================================================

-- Check platforms
-- SELECT * FROM platforms;

-- Check users with platform
-- SELECT id, username, email, role, platform_id FROM users LIMIT 10;

-- Check companies with platform
-- SELECT id, name, platform_id FROM companies LIMIT 10;

-- ============================================================================
-- 📝 NOTES
-- ============================================================================
-- 1. All existing admin users are automatically assigned to Blackrent platform
-- 2. Companies, vehicles, and other data will be manually assigned to platforms via UI
-- 3. Super admins (role='super_admin') can see all platforms
-- 4. Platform admins (role='platform_admin') can only see their platform
-- 5. Investors (role='investor') can only see companies where they have shares
-- ============================================================================

