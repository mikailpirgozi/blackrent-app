-- 🔍 Index Usage Analysis - opravená verzia
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    idx_scan, 
    idx_tup_read, 
    idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename IN ('rentals', 'vehicle_unavailability', 'vehicles')
ORDER BY idx_scan DESC;

-- Aktuálne indexy na tabuľkách
\echo '--- Current indexes on tables ---'
SELECT 
    t.tablename,
    i.indexname,
    i.indexdef
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.tablename IN ('rentals', 'vehicle_unavailability', 'vehicles')
ORDER BY t.tablename, i.indexname;