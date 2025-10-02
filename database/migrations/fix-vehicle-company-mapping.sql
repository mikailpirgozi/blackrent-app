-- 🔧 Fix Vehicle-Company Mapping Script
-- Map all vehicles to proper companies via owner_company_id

-- EXACT MATCHES (názov sa zhoduje presne)
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = '3ple digit') WHERE company = '3ple digit' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'ABC Rent') WHERE company = 'ABC Rent' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Ado Miro') WHERE company = 'Ado Miro' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Andrej') WHERE company = 'Andrej' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Andrej a miki') WHERE company = 'Andrej a miki' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Andrej, Miki, Marko') WHERE company = 'Andrej, Miki, Marko' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Blaško') WHERE company = 'Blaško' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Bozik') WHERE company = 'Bozik' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'City Rent') WHERE company = 'City Rent' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Čupka') WHERE company = 'Čupka' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Damox') WHERE company = 'Damox' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Hasak') WHERE company = 'Hasak' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Hrbas') WHERE company = 'Hrbas' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Impresario') WHERE company = 'Impresario' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Jakubac') WHERE company = 'Jakubac' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Karaba') WHERE company = 'Karaba' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Kralik') WHERE company = 'Kralik' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Kruzic') WHERE company = 'Kruzic' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Marko') WHERE company = 'Marko' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Marko, Andrej, Niko') WHERE company = 'Marko, Andrej, Niko' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Marko, Božík') WHERE company = 'Marko, Božík' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Marko Miki Niko') WHERE company = 'Marko Miki Niko' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Marko, Niko') WHERE company = 'Marko, Niko' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Miki') WHERE company = 'Miki' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Miki a jozik') WHERE company = 'Miki a jozik' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Mikolas') WHERE company = 'Mikolas' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Nikolaj') WHERE company = 'Nikolaj' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Oskar') WHERE company = 'Oskar' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Pegasus ZA dph') WHERE company = 'Pegasus ZA dph' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Picino') WHERE company = 'Picino' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Premium Cars') WHERE company = 'Premium Cars' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Test Company') WHERE company = 'Test Company' AND owner_company_id IS NULL;
UPDATE vehicles SET owner_company_id = (SELECT id FROM companies WHERE name = 'Valastin') WHERE company = 'Valastin' AND owner_company_id IS NULL;

-- VERIFICATION QUERY - Check results
SELECT 
    'BEFORE MAPPING' as status,
    COUNT(*) as total_vehicles, 
    COUNT(owner_company_id) as with_owner_company_id,
    COUNT(*) - COUNT(owner_company_id) as missing_owner_company_id 
FROM vehicles

UNION ALL

SELECT 
    'MISSING MAPPINGS' as status,
    COUNT(*) as total_unmapped,
    0 as with_owner_company_id,
    COUNT(DISTINCT company) as unique_companies
FROM vehicles 
WHERE owner_company_id IS NULL;

-- List any remaining unmapped vehicles
SELECT 
    company,
    COUNT(*) as vehicle_count
FROM vehicles 
WHERE owner_company_id IS NULL 
GROUP BY company
ORDER BY vehicle_count DESC; 