-- Migrácia: Vytvorenie tabuľky pre vlastné kategórie nákladov
-- Autor: AI Assistant
-- Dátum: 2025-01-27
-- Popis: Umožňuje používateľom vytvárať vlastné kategórie nákladov namiesto hardcoded hodnôt

-- 1. Vytvorenie tabuľky expense_categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'receipt', -- Material UI icon name
    color VARCHAR(20) DEFAULT 'primary', -- MUI color: primary, secondary, success, error, warning, info
    is_default BOOLEAN DEFAULT FALSE, -- označuje základné kategórie
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID -- referencia na users.id (bez FK kvôli flexibilite)
);

-- 2. Vytvorenie indexov pre performance
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_categories_sort ON expense_categories(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_expense_categories_default ON expense_categories(is_default);

-- 3. Vloženie základných kategórií (migrácia z hardcoded hodnôt)
INSERT INTO expense_categories (name, display_name, description, icon, color, is_default, sort_order) VALUES 
    ('fuel', 'Palivo', 'Náklady na palivo a pohonné hmoty', 'local_gas_station', 'warning', TRUE, 1),
    ('service', 'Servis', 'Servisné práce, opravy a údržba', 'build', 'error', TRUE, 2),
    ('insurance', 'Poistenie', 'Poistné a poistné udalosti', 'security', 'info', TRUE, 3),
    ('other', 'Ostatné', 'Ostatné náklady a výdavky', 'category', 'secondary', TRUE, 4)
ON CONFLICT (name) DO NOTHING;

-- 4. Pridanie foreign key constraint na expenses tabuľku (soft constraint)
-- Najprv skontrolujeme či už constraint neexistuje
DO $$
BEGIN
    -- Skontroluj či constraint už existuje
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_expenses_category' 
        AND table_name = 'expenses'
    ) THEN
        -- Pridaj foreign key constraint
        ALTER TABLE expenses 
        ADD CONSTRAINT fk_expenses_category 
        FOREIGN KEY (category) REFERENCES expense_categories(name) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Trigger pre automatické updated_at
CREATE OR REPLACE FUNCTION update_expense_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_expense_categories_updated_at ON expense_categories;
CREATE TRIGGER trigger_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_categories_updated_at();

-- 6. Komentáre pre dokumentáciu
COMMENT ON TABLE expense_categories IS 'Vlastné kategórie nákladov - umožňuje používateľom vytvárať a spravovať vlastné kategórie';
COMMENT ON COLUMN expense_categories.name IS 'Jedinečný identifikátor kategórie (používa sa ako FK)';
COMMENT ON COLUMN expense_categories.display_name IS 'Zobrazovaný názov kategórie v UI';
COMMENT ON COLUMN expense_categories.icon IS 'Material UI icon name pre zobrazenie';
COMMENT ON COLUMN expense_categories.color IS 'MUI farba pre štýlovanie (primary, secondary, success, error, warning, info)';
COMMENT ON COLUMN expense_categories.is_default IS 'Označuje základné kategórie ktoré nemožno zmazať';
COMMENT ON COLUMN expense_categories.sort_order IS 'Poradie zobrazovania v UI';
