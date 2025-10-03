-- ===================================================================
-- LEASING MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ===================================================================
-- Created: 2025-10-02
-- Description: Tabuľky pre evidenciu leasingov vozidiel s podporou
--              anuity, lineárneho splácania a len úrokového splácania
-- ===================================================================

-- ===================================================================
-- TABLE: leasings
-- Description: Hlavná tabuľka s leasingovými zmluvami
-- ===================================================================
CREATE TABLE IF NOT EXISTS leasings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Základné informácie
  leasing_company VARCHAR(255) NOT NULL,
  loan_category VARCHAR(50) NOT NULL CHECK (loan_category IN ('autoúver', 'operatívny_leasing', 'pôžička')),
  payment_type VARCHAR(20) NOT NULL DEFAULT 'anuita' CHECK (payment_type IN ('anuita', 'lineárne', 'len_úrok')),
  
  -- Finančné údaje (DECIMAL pre presné výpočty peňazí)
  initial_loan_amount DECIMAL(10, 2) NOT NULL,
  current_balance DECIMAL(10, 2) NOT NULL,
  interest_rate DECIMAL(5, 3), -- Úroková sadzba % p.a. (voliteľné)
  rpmn DECIMAL(5, 3), -- RPMN % (voliteľné)
  monthly_payment DECIMAL(10, 2), -- Mesačná splátka (voliteľné, môže byť vypočítané)
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Mesačný poplatok
  total_monthly_payment DECIMAL(10, 2), -- Celková mesačná splátka (vypočítané)
  
  -- Splátky
  total_installments INTEGER NOT NULL CHECK (total_installments > 0),
  remaining_installments INTEGER NOT NULL CHECK (remaining_installments >= 0),
  paid_installments INTEGER NOT NULL DEFAULT 0 CHECK (paid_installments >= 0),
  first_payment_date DATE NOT NULL,
  last_paid_date DATE,
  
  -- Predčasné splatenie
  early_repayment_penalty DECIMAL(5, 2) NOT NULL DEFAULT 0, -- % z istiny
  early_repayment_penalty_type VARCHAR(20) NOT NULL DEFAULT 'percent_principal' 
    CHECK (early_repayment_penalty_type IN ('percent_principal', 'fixed_amount')),
  
  -- Nadobúdacia cena vozidla (voliteľné)
  acquisition_price_without_vat DECIMAL(10, 2),
  acquisition_price_with_vat DECIMAL(10, 2),
  is_non_deductible BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Dokumenty (R2 storage URLs)
  contract_document_url TEXT,
  payment_schedule_url TEXT,
  photos_zip_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexy pre performance
  CONSTRAINT check_remaining_installments 
    CHECK (remaining_installments <= total_installments),
  CONSTRAINT check_paid_installments 
    CHECK (paid_installments <= total_installments),
  CONSTRAINT check_balance_positive 
    CHECK (current_balance >= 0)
);

-- Indexy pre rýchle vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_leasings_vehicle_id ON leasings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_leasings_company ON leasings(leasing_company);
CREATE INDEX IF NOT EXISTS idx_leasings_first_payment_date ON leasings(first_payment_date);
CREATE INDEX IF NOT EXISTS idx_leasings_created_at ON leasings(created_at);

-- ===================================================================
-- TABLE: payment_schedule
-- Description: Splátkový kalendár - každá splátka ako samostatný záznam
-- ===================================================================
CREATE TABLE IF NOT EXISTS payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leasing_id UUID NOT NULL REFERENCES leasings(id) ON DELETE CASCADE,
  
  -- Identifikácia splátky
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  due_date DATE NOT NULL,
  
  -- Finančné údaje splátky
  principal DECIMAL(10, 2) NOT NULL CHECK (principal >= 0), -- Istina
  interest DECIMAL(10, 2) NOT NULL CHECK (interest >= 0), -- Úrok
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (monthly_fee >= 0), -- Mesačný poplatok
  total_payment DECIMAL(10, 2) NOT NULL CHECK (total_payment >= 0), -- Celková splátka
  remaining_balance DECIMAL(10, 2) NOT NULL CHECK (remaining_balance >= 0), -- Zostatok po tejto splátke
  
  -- Tracking úhrad
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date DATE,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Unique constraint - jedna splátka na leasing
  CONSTRAINT unique_leasing_installment UNIQUE (leasing_id, installment_number),
  
  -- Check constraints
  CONSTRAINT check_paid_date CHECK (
    (is_paid = TRUE AND paid_date IS NOT NULL) OR 
    (is_paid = FALSE AND paid_date IS NULL)
  )
);

-- Indexy pre rýchle vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_payment_schedule_leasing_id ON payment_schedule(leasing_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_due_date ON payment_schedule(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_is_paid ON payment_schedule(is_paid);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_is_paid_due_date ON payment_schedule(is_paid, due_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_leasing_installment ON payment_schedule(leasing_id, installment_number);

-- ===================================================================
-- TABLE: leasing_documents
-- Description: Dokumenty spojené s leasingom (zmluvy, fotky, atď.)
-- ===================================================================
CREATE TABLE IF NOT EXISTS leasing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leasing_id UUID NOT NULL REFERENCES leasings(id) ON DELETE CASCADE,
  
  -- Document metadata
  type VARCHAR(50) NOT NULL CHECK (type IN ('contract', 'payment_schedule', 'photo', 'other')),
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0), -- bytes
  mime_type VARCHAR(100) NOT NULL,
  
  -- Metadata
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexy pre rýchle vyhľadávanie
  CONSTRAINT valid_file_name CHECK (LENGTH(file_name) > 0),
  CONSTRAINT valid_file_url CHECK (LENGTH(file_url) > 0)
);

-- Indexy pre rýchle vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_leasing_documents_leasing_id ON leasing_documents(leasing_id);
CREATE INDEX IF NOT EXISTS idx_leasing_documents_type ON leasing_documents(type);
CREATE INDEX IF NOT EXISTS idx_leasing_documents_leasing_type ON leasing_documents(leasing_id, type);
CREATE INDEX IF NOT EXISTS idx_leasing_documents_uploaded_at ON leasing_documents(uploaded_at);

-- ===================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ===================================================================
CREATE OR REPLACE FUNCTION update_leasings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leasings_updated_at
  BEFORE UPDATE ON leasings
  FOR EACH ROW
  EXECUTE FUNCTION update_leasings_updated_at();

-- ===================================================================
-- COMMENTS FOR DOCUMENTATION
-- ===================================================================
COMMENT ON TABLE leasings IS 'Hlavná tabuľka s leasingovými zmluvami vozidiel';
COMMENT ON TABLE payment_schedule IS 'Splátkový kalendár - každá splátka ako samostatný záznam pre tracking';
COMMENT ON TABLE leasing_documents IS 'Dokumenty spojené s leasingom (zmluvy, fotky, splátkové kalendáre)';

COMMENT ON COLUMN leasings.payment_type IS 'Typ splácania: anuita (rovnaká splátka), lineárne (klesajúca splátka), len_úrok (len úrok)';
COMMENT ON COLUMN leasings.rpmn IS 'Ročná percentuálna miera nákladov (zahŕňa úrok + poplatky)';
COMMENT ON COLUMN leasings.early_repayment_penalty IS 'Pokuta za predčasné splatenie (% z istiny alebo fixná suma)';
COMMENT ON COLUMN payment_schedule.principal IS 'Istina (časť mesačnej splátky ktorá ide na splatenie úveru)';
COMMENT ON COLUMN payment_schedule.interest IS 'Úrok (časť mesačnej splátky ktorá ide na úrok)';
COMMENT ON COLUMN payment_schedule.remaining_balance IS 'Zostatok úveru po tejto splátke';

-- ===================================================================
-- SEED DATA (optional - pre testovanie)
-- ===================================================================
-- Toto je pre testovanie - neskôr bude seed script osobne
-- INSERT INTO leasings (vehicle_id, leasing_company, loan_category, payment_type, ...) VALUES (...);

