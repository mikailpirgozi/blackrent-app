-- ========================================
-- 🔄 MIGRÁCIA: company_investors na novú štruktúru
-- ========================================
-- ÚČEL: Migrovať existujúcu tabuľku company_investors
--        na novú flexibilnú štruktúru kde investor môže mať
--        podiely vo viacerých firmách
-- 
-- BEZPEČNOSŤ: Pôvodná tabuľka sa premenuje na _old
--             a zostane zachovaná ako backup
-- ========================================

BEGIN;

-- ========================================
-- KROK 1: BACKUP existujúcej tabuľky
-- ========================================

-- Ak už existuje backup, zahoď ho (len ak migrácia beží opakovane)
DROP TABLE IF EXISTS company_investors_old CASCADE;

-- Premenuj existujúcu tabuľku na _old (BACKUP)
ALTER TABLE IF EXISTS company_investors RENAME TO company_investors_old;

-- Premenuj aj indexy
ALTER INDEX IF EXISTS company_investors_pkey RENAME TO company_investors_old_pkey;
ALTER INDEX IF EXISTS idx_company_investors_company RENAME TO idx_company_investors_old_company;
ALTER INDEX IF EXISTS idx_company_investors_date RENAME TO idx_company_investors_old_date;
ALTER INDEX IF EXISTS idx_company_investors_status RENAME TO idx_company_investors_old_status;

-- ========================================
-- KROK 2: VYTVORENIE NOVEJ ŠTRUKTÚRY
-- ========================================

-- Ak existuje stará shares tabuľka, zálohuj ju
DROP TABLE IF EXISTS company_investor_shares_old CASCADE;
ALTER TABLE IF EXISTS company_investor_shares RENAME TO company_investor_shares_old;

-- Drop existujúce indexy ak existujú
DROP INDEX IF EXISTS idx_investor_shares_company;
DROP INDEX IF EXISTS idx_investor_shares_investor;
DROP INDEX IF EXISTS idx_investor_shares_primary;

-- 🤝 NOVÁ TABUĽKA SPOLUINVESTOROV (Company Investors)
-- Investori sú teraz NEZÁVISLÍ od firiem
CREATE TABLE company_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(50),
  personal_id VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexy pre novú tabuľku
CREATE INDEX idx_company_investors_name ON company_investors(last_name, first_name);
CREATE INDEX idx_company_investors_email ON company_investors(email);
CREATE INDEX idx_company_investors_active ON company_investors(is_active);

-- 💼 NOVÁ TABUĽKA PODIELOV (Company Investor Shares)
-- Vzťah many-to-many medzi investormi a firmami
CREATE TABLE company_investor_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id INTEGER NOT NULL,
  investor_id UUID NOT NULL REFERENCES company_investors(id) ON DELETE CASCADE,
  ownership_percentage DECIMAL(5,2) NOT NULL CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
  investment_amount DECIMAL(12,2),
  investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_primary_contact BOOLEAN DEFAULT false,
  profit_share_percentage DECIMAL(5,2) CHECK (profit_share_percentage >= 0 AND profit_share_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, investor_id)
);

-- Indexy pre shares
CREATE INDEX idx_investor_shares_company ON company_investor_shares(company_id);
CREATE INDEX idx_investor_shares_investor ON company_investor_shares(investor_id);
CREATE INDEX idx_investor_shares_primary ON company_investor_shares(is_primary_contact);

-- ========================================
-- KROK 3: MIGRÁCIA DÁT
-- ========================================

-- Migruj investorov zo starej tabuľky do novej
-- Rozdelíme investor_name na first_name a last_name
INSERT INTO company_investors (
  id,
  first_name,
  last_name,
  email,
  phone,
  personal_id,
  address,
  is_active,
  notes,
  created_at,
  updated_at
)
SELECT 
  id,
  -- Rozdelenie mena: prvá časť = first_name, zvyšok = last_name
  COALESCE(SPLIT_PART(investor_name, ' ', 1), 'Unknown'),
  COALESCE(
    CASE 
      WHEN ARRAY_LENGTH(STRING_TO_ARRAY(investor_name, ' '), 1) > 1 
      THEN SUBSTRING(investor_name FROM POSITION(' ' IN investor_name) + 1)
      ELSE investor_name
    END,
    'Unknown'
  ),
  investor_email,
  investor_phone,
  legal_entity_id, -- personal_id
  notes, -- address je prázdny, poznámky idú do notes
  (status = 'active'), -- is_active
  CONCAT(
    'Pôvodný typ: ', COALESCE(investor_type, 'individual'), 
    ' | Číslo zmluvy: ', COALESCE(contract_number, 'N/A'),
    ' | ', COALESCE(notes, '')
  ),
  created_at,
  updated_at
FROM company_investors_old
WHERE investor_name IS NOT NULL AND investor_name != '';

-- ========================================
-- KROK 4: VYTVORENIE SHARES (podielov)
-- ========================================

-- Vytvor shares pre každého investora
-- Predpokladáme 100% podiel ak nie je inak špecifikované
INSERT INTO company_investor_shares (
  company_id,
  investor_id,
  ownership_percentage,
  investment_amount,
  investment_date,
  is_primary_contact,
  notes,
  created_at
)
SELECT 
  company_id, -- INTEGER (nie je potrebná konverzia)
  id, -- investor_id
  100.0, -- Default 100% ownership (môžeš upraviť podľa potreby)
  investment_amount,
  investment_date,
  true, -- Default primary contact
  CONCAT(
    'Migrované z pôvodnej štruktúry | ',
    'Mena: ', investment_currency,
    ' | Status: ', COALESCE(status, 'active')
  ),
  created_at
FROM company_investors_old
WHERE company_id IS NOT NULL;

-- ========================================
-- KROK 5: OVERENIE MIGRÁCIE
-- ========================================

-- Počet záznamov v starej tabuľke
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
  shares_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM company_investors_old;
  SELECT COUNT(*) INTO new_count FROM company_investors;
  SELECT COUNT(*) INTO shares_count FROM company_investor_shares;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 MIGRÁCIA VÝSLEDOK:';
  RAISE NOTICE '   Pôvodná tabuľka: % záznamov', old_count;
  RAISE NOTICE '   Nová tabuľka investorov: % záznamov', new_count;
  RAISE NOTICE '   Vytvorené shares: % záznamov', shares_count;
  RAISE NOTICE '============================================';
  
  IF new_count < old_count THEN
    RAISE WARNING '⚠️  POZOR: Niektoré záznamy neboli migrované!';
  ELSE
    RAISE NOTICE '✅ Všetky záznamy boli úspešne migrované';
  END IF;
END $$;

COMMIT;

-- ========================================
-- 📝 PO MIGRÁCII:
-- ========================================
-- 1. Otestuj funkčnosť v aplikácii
-- 2. Keď je všetko OK, môžeš dropnúť starú tabuľku:
--    DROP TABLE company_investors_old CASCADE;
-- 3. Ale odporúčam ju nechať aspoň týždeň ako backup!
-- ========================================

