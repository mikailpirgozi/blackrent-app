-- Oprava typov v recurring_expense_generations tabuľke
-- expenses.id je integer, nie UUID

-- 1. Zmaž existujúcu tabuľku (ak je prázdna)
DROP TABLE IF EXISTS recurring_expense_generations CASCADE;

-- 2. Vytvor novú tabuľku s správnymi typmi
CREATE TABLE IF NOT EXISTS recurring_expense_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_expense_id UUID NOT NULL REFERENCES recurring_expenses(id) ON DELETE CASCADE,
    generated_expense_id INTEGER NOT NULL, -- INTEGER pre expenses.id
    generation_date DATE NOT NULL, -- pre ktorý mesiac sa vygeneroval
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(50) DEFAULT 'system', -- system alebo user ID
    
    -- Zabránenie duplikátom
    UNIQUE(recurring_expense_id, generation_date)
);

-- 3. Indexy
CREATE INDEX IF NOT EXISTS idx_recurring_generations_recurring_id ON recurring_expense_generations(recurring_expense_id);
CREATE INDEX IF NOT EXISTS idx_recurring_generations_date ON recurring_expense_generations(generation_date);
CREATE INDEX IF NOT EXISTS idx_recurring_generations_expense_id ON recurring_expense_generations(generated_expense_id);

-- 4. Komentár
COMMENT ON TABLE recurring_expense_generations IS 'Log všetkých vygenerovaných nákladov z pravidelných šablón - opravené typy';
COMMENT ON COLUMN recurring_expense_generations.generated_expense_id IS 'INTEGER ID z expenses tabuľky';
