-- ============================================================================
-- ADD linked_investor_id TO USERS TABLE
-- ============================================================================
-- This migration adds support for linking investor users to CompanyInvestor entities
-- ============================================================================

-- Add linked_investor_id to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS linked_investor_id UUID REFERENCES company_investors(id) ON DELETE SET NULL;

-- Create index for efficient investor lookups
CREATE INDEX IF NOT EXISTS idx_users_linked_investor ON users(linked_investor_id);

-- Create index for investor role queries
CREATE INDEX IF NOT EXISTS idx_users_investor_role ON users(role) WHERE role = 'investor';

-- ============================================================================
-- ✅ VERIFICATION QUERIES (run these after migration)
-- ============================================================================

-- Check users with linked_investor_id
-- SELECT id, username, email, role, platform_id, linked_investor_id 
-- FROM users 
-- WHERE role = 'investor';

-- Check company investors
-- SELECT ci.id, ci.first_name, ci.last_name, COUNT(cis.id) as company_count
-- FROM company_investors ci
-- LEFT JOIN company_investor_shares cis ON ci.id = cis.investor_id
-- GROUP BY ci.id, ci.first_name, ci.last_name;

-- ============================================================================
-- 📝 NOTES
-- ============================================================================
-- 1. linked_investor_id links a user account to a CompanyInvestor entity
-- 2. This allows investors to log in and see only companies where they have shares
-- 3. The relationship is nullable - not all users are investors
-- 4. ON DELETE SET NULL ensures user account remains if investor is deleted
-- ============================================================================

