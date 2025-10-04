-- ========================================
-- FÁZA 4: DATABÁZOVÉ VYLEPŠENIA
-- ========================================
-- Datum: 2025-01-04
-- Popis: Foreign keys, Soft deletes, Audit trail
-- ========================================

-- ========================================
-- 4.1 FOREIGN KEYS
-- ========================================

-- Vehicle FK (SET NULL ak sa vehicle zmaže)
ALTER TABLE expenses 
  DROP CONSTRAINT IF EXISTS fk_expenses_vehicle;

ALTER TABLE expenses 
  ADD CONSTRAINT fk_expenses_vehicle 
  FOREIGN KEY (vehicle_id) 
  REFERENCES vehicles(id) 
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Category FK (RESTRICT - nemožno zmazať použitú kategóriu)
ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS fk_expenses_category;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expenses_category
  FOREIGN KEY (category) 
  REFERENCES expense_categories(name) 
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_expenses_vehicle ON expenses IS 
  'Soft reference - expense zostáva pri delete vehicle';
COMMENT ON CONSTRAINT fk_expenses_category ON expenses IS 
  'Hard reference - kategóriu nemožno zmazať ak sa používa';

-- ========================================
-- 4.2 SOFT DELETES
-- ========================================

-- Add deleted_at column to expenses
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add deleted_by column (kto zmazal)
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

-- Index pre soft deletes queries
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at 
  ON expenses(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Add deleted_at to recurring_expenses
ALTER TABLE recurring_expenses 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

ALTER TABLE recurring_expenses 
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_deleted_at 
  ON recurring_expenses(deleted_at) 
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN expenses.deleted_at IS 
  'Soft delete timestamp - NULL = active, NOT NULL = deleted';
COMMENT ON COLUMN expenses.deleted_by IS 
  'Username who deleted the expense';

-- ========================================
-- 4.3 AUDIT TRAIL
-- ========================================

-- Create expense_audit table
CREATE TABLE IF NOT EXISTS expense_audit (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE, RESTORE
  user_id INTEGER,
  username VARCHAR(255),
  changes JSONB, -- Zmeny v JSON formáte {old: {...}, new: {...}}
  ip_address VARCHAR(45), -- IPv4/IPv6
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_audit_expense 
    FOREIGN KEY (expense_id) 
    REFERENCES expenses(id) 
    ON DELETE CASCADE
);

-- Indexes pre audit queries
CREATE INDEX IF NOT EXISTS idx_expense_audit_expense_id 
  ON expense_audit(expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_audit_created_at 
  ON expense_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expense_audit_user_id 
  ON expense_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_expense_audit_action 
  ON expense_audit(action);

-- GIN index pre JSON queries
CREATE INDEX IF NOT EXISTS idx_expense_audit_changes 
  ON expense_audit USING GIN (changes);

COMMENT ON TABLE expense_audit IS 
  'Audit log pre všetky expense operácie - immutable';
COMMENT ON COLUMN expense_audit.changes IS 
  'JSON s old/new hodnotami: {"old": {...}, "new": {...}}';

-- ========================================
-- FUNCTION: Log Expense Changes
-- ========================================

CREATE OR REPLACE FUNCTION log_expense_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log only if not a soft delete (soft deletes log separately)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO expense_audit (
      expense_id, 
      action, 
      username,
      changes
    ) VALUES (
      NEW.id,
      'CREATE',
      current_user,
      jsonb_build_object('new', row_to_json(NEW))
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN
    -- Regular update (not soft delete)
    INSERT INTO expense_audit (
      expense_id,
      action,
      username,
      changes
    ) VALUES (
      NEW.id,
      'UPDATE',
      current_user,
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      )
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Soft delete
    INSERT INTO expense_audit (
      expense_id,
      action,
      username,
      changes
    ) VALUES (
      NEW.id,
      'DELETE',
      NEW.deleted_by,
      jsonb_build_object('deleted_at', NEW.deleted_at)
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    -- Restore
    INSERT INTO expense_audit (
      expense_id,
      action,
      username,
      changes
    ) VALUES (
      NEW.id,
      'RESTORE',
      current_user,
      jsonb_build_object('restored_at', NOW())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_expense_audit ON expenses;

CREATE TRIGGER trg_expense_audit
  AFTER INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION log_expense_change();

COMMENT ON FUNCTION log_expense_change() IS 
  'Automaticky loguje všetky zmeny v expenses do expense_audit';

-- ========================================
-- VERIFY INSTALLATION
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Foreign keys created';
  RAISE NOTICE '✅ Soft deletes columns added';
  RAISE NOTICE '✅ Audit trail table created';
  RAISE NOTICE '✅ Audit trigger installed';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current state:';
  RAISE NOTICE '   - expenses table: % rows', (SELECT COUNT(*) FROM expenses WHERE deleted_at IS NULL);
  RAISE NOTICE '   - expense_audit table: % rows', (SELECT COUNT(*) FROM expense_audit);
END $$;

-- Analyze tables
ANALYZE expenses;
ANALYZE expense_audit;
ANALYZE recurring_expenses;

