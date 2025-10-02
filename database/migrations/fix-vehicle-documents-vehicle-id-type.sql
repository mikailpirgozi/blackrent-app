-- 🔧 FIX VEHICLE DOCUMENTS - vehicle_id type mismatch
-- vehicles.id je INTEGER ale vehicle_documents.vehicle_id je UUID

-- Najprv zálohuj existujúce dáta
CREATE TABLE IF NOT EXISTS vehicle_documents_backup AS 
SELECT * FROM vehicle_documents;

-- Zmaž existujúce foreign key constraint
ALTER TABLE vehicle_documents DROP CONSTRAINT IF EXISTS vehicle_documents_vehicle_id_fkey;

-- Zmeň vehicle_id typ z UUID na INTEGER
ALTER TABLE vehicle_documents ALTER COLUMN vehicle_id TYPE INTEGER USING vehicle_id::text::integer;

-- Pridaj správny foreign key constraint
ALTER TABLE vehicle_documents ADD CONSTRAINT vehicle_documents_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

-- Informačný output
SELECT 'Vehicle documents vehicle_id type fixed to INTEGER' as status;
