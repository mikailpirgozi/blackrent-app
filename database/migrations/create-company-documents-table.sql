-- 📄 COMPANY DOCUMENTS TABLE
-- Tabuľka pre ukladanie dokumentov majiteľov vozidiel (zmluvy, faktúry)

CREATE TABLE IF NOT EXISTS company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Typ dokumentu
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('contract', 'invoice')),
  
  -- Kategorizácia faktúr po mesiacoch
  document_month INTEGER CHECK (document_month >= 1 AND document_month <= 12),
  document_year INTEGER CHECK (document_year >= 2020 AND document_year <= 2099),
  
  -- Základné info
  document_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- File storage
  file_path TEXT NOT NULL, -- R2 storage path
  file_size BIGINT,
  file_type VARCHAR(100),
  original_filename VARCHAR(255),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Indexy pre výkon
CREATE INDEX IF NOT EXISTS idx_company_documents_company_id ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_documents_type ON company_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_company_documents_date ON company_documents(document_year, document_month);
CREATE INDEX IF NOT EXISTS idx_company_documents_created_at ON company_documents(created_at);

-- Trigger pre updated_at
CREATE OR REPLACE FUNCTION update_company_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_company_documents_updated_at ON company_documents;
CREATE TRIGGER trigger_company_documents_updated_at
  BEFORE UPDATE ON company_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_company_documents_updated_at();
