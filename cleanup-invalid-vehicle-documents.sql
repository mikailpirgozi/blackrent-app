-- =====================================================
-- CLEANUP INVALID VEHICLE_DOCUMENTS FROM PRODUCTION
-- =====================================================
-- Odstráni všetky vehicle_documents ktoré majú neplatný document_type
-- (insurance typy ktoré by mali byť v insurances tabuľke)

-- 1. SHOW INVALID RECORDS FIRST
SELECT 
  id, 
  vehicle_id, 
  document_type, 
  valid_from, 
  valid_to,
  'WILL BE DELETED' as action
FROM vehicle_documents 
WHERE document_type NOT IN ('stk', 'ek', 'vignette', 'technical_certificate')
  OR document_type LIKE '%insurance%'
  OR document_type LIKE '%pzp%'
  OR document_type LIKE '%kasko%'
  OR document_type LIKE '%poistenie%';

-- 2. DELETE INVALID RECORDS
DELETE FROM vehicle_documents 
WHERE document_type NOT IN ('stk', 'ek', 'vignette', 'technical_certificate')
  OR document_type LIKE '%insurance%'
  OR document_type LIKE '%pzp%'
  OR document_type LIKE '%kasko%'
  OR document_type LIKE '%poistenie%';

-- 3. VERIFICATION
SELECT 
  COUNT(*) as total_vehicle_documents,
  COUNT(DISTINCT document_type) as unique_types
FROM vehicle_documents;

SELECT 
  document_type,
  COUNT(*) as count
FROM vehicle_documents
GROUP BY document_type
ORDER BY count DESC;

-- Expected result: Only stk, ek, vignette, technical_certificate

