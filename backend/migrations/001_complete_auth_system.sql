-- ===================================================================
-- COMPLETE AUTH SYSTEM MIGRATION
-- ===================================================================
-- Author: AI Assistant
-- Date: 2025-01-04
-- Description: Complete refactoring of authentication and authorization system
--              - Role hierarchy (super_admin, company_admin, company_owner, employee, etc.)
--              - Company-based permissions (user_company_access table)
--              - Proper data filtering and access control
-- ===================================================================

BEGIN;

-- ===================================================================
-- STEP 1: Update users table with all required columns
-- ===================================================================

-- Add missing columns to users table (if they don't exist)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
  ADD COLUMN IF NOT EXISTS signature_template TEXT,
  ADD COLUMN IF NOT EXISTS linked_investor_id UUID;

-- Update role column to support new roles
ALTER TABLE users 
  ALTER COLUMN role TYPE VARCHAR(50);

-- Add check constraint for valid roles
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN (
    'super_admin',      -- You - sees all companies, all data
    'company_admin',    -- Admin of specific company (BlackRent, Impresario)
    'company_owner',    -- Owner of sub-company (read-only to own vehicles)
    'employee',         -- Employee with custom permissions
    'temp_worker',      -- Temporary worker with limited permissions
    'mechanic',         -- Mechanic with maintenance permissions
    'sales_rep'         -- Sales representative with sales permissions
  ));

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ===================================================================
-- STEP 2: Create user_company_access table
-- ===================================================================

CREATE TABLE IF NOT EXISTS user_company_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Granular permissions per resource
  permissions JSONB NOT NULL DEFAULT '{
    "vehicles": {"read": false, "write": false, "delete": false},
    "rentals": {"read": false, "write": false, "delete": false},
    "expenses": {"read": false, "write": false, "delete": false},
    "settlements": {"read": false, "write": false, "delete": false},
    "customers": {"read": false, "write": false, "delete": false},
    "insurances": {"read": false, "write": false, "delete": false},
    "maintenance": {"read": false, "write": false, "delete": false},
    "protocols": {"read": false, "write": false, "delete": false},
    "statistics": {"read": false, "write": false, "delete": false}
  }'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  
  -- Unique constraint: one user can have only one permission set per company
  UNIQUE(user_id, company_id)
);

-- Create indexes for fast permission lookups
CREATE INDEX IF NOT EXISTS idx_user_company_access_user_id ON user_company_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_access_company_id ON user_company_access(company_id);
CREATE INDEX IF NOT EXISTS idx_user_company_access_permissions ON user_company_access USING GIN(permissions);

-- ===================================================================
-- STEP 3: Add audit logging table for permission changes
-- ===================================================================

CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  
  action VARCHAR(20) NOT NULL CHECK (action IN ('grant', 'revoke', 'update')),
  resource VARCHAR(50) NOT NULL,
  old_permissions JSONB,
  new_permissions JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created_at ON permission_audit_log(created_at DESC);

-- ===================================================================
-- STEP 4: Add updated_at trigger for user_company_access
-- ===================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_company_access_updated_at ON user_company_access;

CREATE TRIGGER update_user_company_access_updated_at
  BEFORE UPDATE ON user_company_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- STEP 5: Migrate existing users to new role system
-- ===================================================================

-- Update existing 'admin' users to 'super_admin' (preserve current admins)
UPDATE users 
SET role = 'super_admin' 
WHERE role = 'admin' OR username = 'admin';

-- Update existing 'user' role to 'employee' (if exists)
UPDATE users 
SET role = 'employee' 
WHERE role = 'user';

-- ===================================================================
-- STEP 6: Create default permissions templates
-- ===================================================================

-- Default permissions for company_admin (all permissions in their company)
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL,
  permissions JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO permission_templates (name, role, permissions, description) VALUES
(
  'company_admin_full',
  'company_admin',
  '{
    "vehicles": {"read": true, "write": true, "delete": true},
    "rentals": {"read": true, "write": true, "delete": true},
    "expenses": {"read": true, "write": true, "delete": true},
    "settlements": {"read": true, "write": true, "delete": true},
    "customers": {"read": true, "write": true, "delete": true},
    "insurances": {"read": true, "write": true, "delete": true},
    "maintenance": {"read": true, "write": true, "delete": true},
    "protocols": {"read": true, "write": true, "delete": true},
    "statistics": {"read": true, "write": true, "delete": true}
  }'::jsonb,
  'Full permissions for company administrators'
),
(
  'company_owner_readonly',
  'company_owner',
  '{
    "vehicles": {"read": true, "write": false, "delete": false},
    "rentals": {"read": true, "write": false, "delete": false},
    "expenses": {"read": true, "write": false, "delete": false},
    "settlements": {"read": true, "write": false, "delete": false},
    "customers": {"read": true, "write": false, "delete": false},
    "insurances": {"read": true, "write": false, "delete": false},
    "maintenance": {"read": true, "write": false, "delete": false},
    "protocols": {"read": true, "write": false, "delete": false},
    "statistics": {"read": true, "write": false, "delete": false}
  }'::jsonb,
  'Read-only access for company owners to their own data'
),
(
  'employee_standard',
  'employee',
  '{
    "vehicles": {"read": true, "write": true, "delete": false},
    "rentals": {"read": true, "write": true, "delete": false},
    "expenses": {"read": true, "write": true, "delete": false},
    "settlements": {"read": true, "write": false, "delete": false},
    "customers": {"read": true, "write": true, "delete": false},
    "insurances": {"read": true, "write": false, "delete": false},
    "maintenance": {"read": true, "write": true, "delete": false},
    "protocols": {"read": true, "write": true, "delete": false},
    "statistics": {"read": true, "write": false, "delete": false}
  }'::jsonb,
  'Standard permissions for employees'
)
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- STEP 7: Add comments for documentation
-- ===================================================================

COMMENT ON TABLE user_company_access IS 'Company-based permission system - users can have different permissions in different companies';
COMMENT ON COLUMN user_company_access.permissions IS 'JSONB object with granular permissions per resource (vehicles, rentals, etc.)';
COMMENT ON TABLE permission_audit_log IS 'Audit trail for all permission changes';
COMMENT ON TABLE permission_templates IS 'Reusable permission templates for different roles';

-- ===================================================================
-- STEP 8: Create helper views for easier querying
-- ===================================================================

-- View: User with their company details
CREATE OR REPLACE VIEW v_users_with_companies AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.company_id,
  c.name as company_name,
  u.is_active,
  u.last_login,
  u.created_at
FROM users u
LEFT JOIN companies c ON u.company_id = c.id;

-- View: User company access with company names
CREATE OR REPLACE VIEW v_user_company_permissions AS
SELECT 
  uca.id,
  uca.user_id,
  u.username,
  u.email,
  u.role,
  uca.company_id,
  c.name as company_name,
  uca.permissions,
  uca.created_at,
  uca.updated_at
FROM user_company_access uca
JOIN users u ON uca.user_id = u.id
JOIN companies c ON uca.company_id = c.id;

COMMIT;

-- ===================================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ===================================================================

-- Check users table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

-- Check user_company_access table
-- SELECT * FROM information_schema.tables WHERE table_name = 'user_company_access';

-- Check all users and their roles
-- SELECT id, username, role, company_id, is_active FROM users;

-- Check permission templates
-- SELECT name, role, description FROM permission_templates;

