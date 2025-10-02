-- Migrácia: Vytvorenie tabuľky pre pravidelné mesačné náklady
-- Autor: AI Assistant
-- Dátum: 2025-01-27
-- Popis: Umožňuje definovať pravidelné náklady ktoré sa automaticky vytvoria každý mesiac

-- 1. Vytvorenie tabuľky recurring_expenses
CREATE TABLE IF NOT EXISTS recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- názov pravidelného nákladu
    description TEXT NOT NULL, -- popis ktorý sa použije pre generované náklady
    amount DECIMAL(10,2) NOT NULL, -- mesačná suma
    category VARCHAR(100) NOT NULL, -- kategória (FK na expense_categories.name)
    company VARCHAR(100) NOT NULL, -- firma
    vehicle_id UUID, -- voliteľné priradenie k vozidlu
    note TEXT, -- voliteľná poznámka
    
    -- Nastavenia pravidelnosi
    frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly
    start_date DATE NOT NULL, -- od kedy začať generovanie
    end_date DATE, -- voliteľný koniec (NULL = nekonečne)
    day_of_month INTEGER DEFAULT 1, -- ktorý deň v mesiaci (1-28)
    
    -- Status a kontrola
    is_active BOOLEAN DEFAULT TRUE,
    last_generated_date DATE, -- kedy sa naposledy vygeneroval náklad
    next_generation_date DATE, -- kedy sa má vygenerovať ďalší
    total_generated INTEGER DEFAULT 0, -- počet vygenerovaných nákladov
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID, -- referencia na users.id
    
    -- Constraints
    CONSTRAINT recurring_expenses_day_check CHECK (day_of_month >= 1 AND day_of_month <= 28),
    CONSTRAINT recurring_expenses_amount_check CHECK (amount > 0),
    CONSTRAINT recurring_expenses_dates_check CHECK (end_date IS NULL OR end_date > start_date)
);

-- 2. Vytvorenie indexov pre performance
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active ON recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_generation ON recurring_expenses(next_generation_date) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_category ON recurring_expenses(category);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_company ON recurring_expenses(company);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_vehicle ON recurring_expenses(vehicle_id);

-- 3. Vytvorenie tabuľky pre log generovaných nákladov
CREATE TABLE IF NOT EXISTS recurring_expense_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_expense_id UUID NOT NULL REFERENCES recurring_expenses(id) ON DELETE CASCADE,
    generated_expense_id UUID NOT NULL, -- referencia na expenses.id
    generation_date DATE NOT NULL, -- pre ktorý mesiac sa vygeneroval
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(50) DEFAULT 'system', -- system alebo user ID
    
    -- Zabránenie duplikátom
    UNIQUE(recurring_expense_id, generation_date)
);

-- 4. Index pre generation log
CREATE INDEX IF NOT EXISTS idx_recurring_generations_recurring_id ON recurring_expense_generations(recurring_expense_id);
CREATE INDEX IF NOT EXISTS idx_recurring_generations_date ON recurring_expense_generations(generation_date);

-- 5. Trigger pre automatické updated_at
CREATE OR REPLACE FUNCTION update_recurring_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Automaticky prepočítaj next_generation_date pri zmene
    IF NEW.frequency = 'monthly' THEN
        NEW.next_generation_date = NEW.start_date + INTERVAL '1 month' * NEW.total_generated;
    ELSIF NEW.frequency = 'quarterly' THEN
        NEW.next_generation_date = NEW.start_date + INTERVAL '3 months' * NEW.total_generated;
    ELSIF NEW.frequency = 'yearly' THEN
        NEW.next_generation_date = NEW.start_date + INTERVAL '1 year' * NEW.total_generated;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recurring_expenses_updated_at ON recurring_expenses;
CREATE TRIGGER trigger_recurring_expenses_updated_at
    BEFORE UPDATE ON recurring_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_expenses_updated_at();

-- 6. Trigger pre nastavenie next_generation_date pri vytvorení
CREATE OR REPLACE FUNCTION set_initial_next_generation_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Nastav prvý generation date
    IF NEW.next_generation_date IS NULL THEN
        NEW.next_generation_date = NEW.start_date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_initial_next_generation ON recurring_expenses;
CREATE TRIGGER trigger_set_initial_next_generation
    BEFORE INSERT ON recurring_expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_initial_next_generation_date();

-- 7. Komentáre pre dokumentáciu
COMMENT ON TABLE recurring_expenses IS 'Pravidelné náklady ktoré sa automaticky generujú každý mesiac/štvrťrok/rok';
COMMENT ON COLUMN recurring_expenses.frequency IS 'Frekvencia generovania: monthly, quarterly, yearly';
COMMENT ON COLUMN recurring_expenses.day_of_month IS 'Deň v mesiaci kedy sa má vygenerovať (1-28)';
COMMENT ON COLUMN recurring_expenses.next_generation_date IS 'Dátum kedy sa má vygenerovať ďalší náklad';
COMMENT ON COLUMN recurring_expenses.last_generated_date IS 'Dátum kedy sa naposledy vygeneroval náklad';
COMMENT ON TABLE recurring_expense_generations IS 'Log všetkých vygenerovaných nákladov z pravidelných šablón';
