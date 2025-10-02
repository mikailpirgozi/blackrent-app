-- Protocol V2 Migration: Pridanie tabuliek pre nový systém
-- Non-breaking migration - zachováva kompatibilitu s V1

-- ===== PHOTO DERIVATIVES TABLE =====
-- Ukladá derivatívy obrázkov (thumb, gallery, pdf verzie)
CREATE TABLE IF NOT EXISTS photo_derivatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL, -- Odkaz na existujúcu photos tabuľku
  derivative_type VARCHAR(20) NOT NULL CHECK (derivative_type IN ('thumb', 'gallery', 'pdf')),
  url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  format VARCHAR(10) NOT NULL DEFAULT 'jpeg',
  quality INTEGER DEFAULT 80,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(photo_id, derivative_type),
  
  -- Indexes
  INDEX idx_photo_derivatives_photo_id (photo_id),
  INDEX idx_photo_derivatives_type (derivative_type)
);

-- ===== PROTOCOL PROCESSING JOBS TABLE =====
-- Sleduje background jobs pre protokoly
CREATE TABLE IF NOT EXISTS protocol_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('photo_processing', 'pdf_generation', 'derivative_generation')),
  job_id VARCHAR(100), -- External queue job ID
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_protocol_jobs_protocol_id (protocol_id),
  INDEX idx_protocol_jobs_status (status),
  INDEX idx_protocol_jobs_type (job_type),
  INDEX idx_protocol_jobs_created (created_at)
);

-- ===== PHOTO METADATA V2 TABLE =====
-- Rozšírené metadáta pre V2 photos
CREATE TABLE IF NOT EXISTS photo_metadata_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL UNIQUE, -- One-to-one s photos
  hash_sha256 VARCHAR(64), -- SHA-256 hash originálu
  original_size INTEGER NOT NULL DEFAULT 0,
  processing_time INTEGER, -- v milliseconds
  savings_percentage DECIMAL(5,2), -- Úspora miesta v %
  device_info JSONB DEFAULT '{}', -- Info o zariadení
  exif_data JSONB DEFAULT '{}', -- EXIF metadáta
  processing_config JSONB DEFAULT '{}', -- Config použitý pri spracovaní
  version INTEGER DEFAULT 2, -- Protocol version
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint (ak photos tabuľka existuje)
  -- FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_photo_metadata_v2_hash (hash_sha256),
  INDEX idx_photo_metadata_v2_version (version),
  INDEX idx_photo_metadata_v2_created (created_at)
);

-- ===== FEATURE FLAGS TABLE =====
-- Dynamické feature flags pre V2 rollout
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name VARCHAR(100) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  percentage INTEGER DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  allowed_users TEXT[], -- Array of user IDs
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_feature_flags_name (flag_name),
  INDEX idx_feature_flags_enabled (enabled),
  INDEX idx_feature_flags_dates (start_date, end_date)
);

-- ===== INITIAL FEATURE FLAGS DATA =====
-- Nastavenie počiatočných flags pre V2 systém
INSERT INTO feature_flags (flag_name, enabled, percentage, description) VALUES
  ('PROTOCOL_V2', false, 0, 'Hlavný V2 protokol systém'),
  ('PROTOCOL_V2_PHOTO_PROCESSING', false, 0, 'V2 photo processing s derivatívami'),
  ('PROTOCOL_V2_PDF_GENERATION', false, 0, 'V2 PDF generovanie s queue'),
  ('PROTOCOL_V2_QUEUE_SYSTEM', false, 0, 'Background queue processing')
ON CONFLICT (flag_name) DO NOTHING;

-- ===== PROTOCOL VERSIONS TABLE =====
-- Sleduje ktoré protokoly používajú ktorú verziu
CREATE TABLE IF NOT EXISTS protocol_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version IN (1, 2)),
  migrated_at TIMESTAMP,
  migration_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_protocol_versions_protocol_id (protocol_id),
  INDEX idx_protocol_versions_version (version),
  INDEX idx_protocol_versions_migrated (migrated_at)
);

-- ===== UPDATE TRIGGERS =====
-- Auto-update updated_at stĺpcov
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pre auto-update
CREATE TRIGGER update_protocol_processing_jobs_updated_at 
  BEFORE UPDATE ON protocol_processing_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_metadata_v2_updated_at 
  BEFORE UPDATE ON photo_metadata_v2 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at 
  BEFORE UPDATE ON feature_flags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== MIGRATION NOTES =====
-- Táto migrácia je non-breaking:
-- 1. Pridáva len nové tabuľky, nemení existujúce
-- 2. V1 protokoly môžu pokračovať bez zmien
-- 3. V2 protokoly budú používať nové tabuľky
-- 4. Postupný rollout cez feature flags
-- 5. Možnosť rollback bez data loss
