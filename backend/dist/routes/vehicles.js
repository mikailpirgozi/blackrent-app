"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const cache_middleware_1 = require("../middleware/cache-middleware");
const router = (0, express_1.Router)();
// 🔍 CONTEXT FUNCTIONS
const getVehicleContext = async (req) => {
    const vehicleId = req.params.id;
    if (!vehicleId)
        return {};
    const vehicle = await postgres_database_1.postgresDatabase.getVehicle(vehicleId);
    return {
        resourceOwnerId: vehicle?.assignedMechanicId,
        resourceCompanyId: vehicle?.ownerCompanyId
    };
};
// GET /api/vehicles - Získanie všetkých vozidiel s cache
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'read'), (0, cache_middleware_1.cacheResponse)('vehicles', {
    cacheKey: cache_middleware_1.userSpecificCache,
    ttl: 10 * 60 * 1000, // 10 minutes
    tags: ['vehicles']
}), async (req, res) => {
    try {
        let vehicles = await postgres_database_1.postgresDatabase.getVehicles();
        console.log('🚗 Vehicles GET - user:', {
            role: req.user?.role,
            userId: req.user?.id,
            totalVehicles: vehicles.length
        });
        // 🔐 NON-ADMIN USERS - filter podľa company permissions
        if (req.user?.role !== 'admin' && req.user) {
            const user = req.user; // TypeScript safe assignment
            const originalCount = vehicles.length;
            // Získaj company access pre používateľa
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            // Filter vozidlá len pre firmy, ku ktorým má používateľ prístup
            // ✅ Všetky vozidlá majú teraz owner_company_id - používame len to
            vehicles = vehicles.filter(v => {
                return v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId);
            });
            console.log('🔐 Company Permission Filter:', {
                userId: user.id,
                allowedCompanyIds,
                userCompanyAccess: userCompanyAccess.map(a => ({ id: a.companyId, name: a.companyName })),
                originalCount,
                filteredCount: vehicles.length,
                sampleResults: vehicles.slice(0, 3).map(v => ({
                    licensePlate: v.licensePlate,
                    company: v.company,
                    ownerCompanyId: v.ownerCompanyId
                }))
            });
        }
        res.json({
            success: true,
            data: vehicles
        });
    }
    catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vozidiel'
        });
    }
});
// 🧪 TEST endpoint pre CSV funkcionalitu
router.get('/test-csv', auth_1.authenticateToken, async (req, res) => {
    res.json({
        success: true,
        message: 'CSV endpointy sú dostupné',
        timestamp: new Date().toISOString()
    });
});
// ⚡ GET /api/vehicles/bulk-ownership-history - História vlastníctva všetkých vozidiel NARAZ
router.get('/bulk-ownership-history', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        console.log('🚀 BULK: Loading ownership history for all vehicles...');
        const startTime = Date.now();
        // ⚡⚡ SKUTOČNÝ BULK: Jeden SQL query pre všetky vehicle histories naraz
        const client = await postgres_database_1.postgresDatabase.pool.connect();
        try {
            // 1. Získaj všetky vozidlá
            const vehiclesResult = await client.query(`
          SELECT id, brand, model, license_plate, owner_company_id 
          FROM vehicles 
          ORDER BY brand, model
        `);
            const vehicles = vehiclesResult.rows;
            console.log(`📊 Loading history for ${vehicles.length} vehicles...`);
            // 2. Získaj všetky ownership histories jedným query
            const historiesResult = await client.query(`
          SELECT 
            vehicle_id,
            id,
            owner_company_id,
            owner_company_name,
            valid_from,
            valid_to,
            transfer_reason,
            transfer_notes
          FROM vehicle_ownership_history
          ORDER BY vehicle_id, valid_from DESC
        `);
            // 3. Group histories by vehicle_id
            const historiesByVehicle = new Map();
            historiesResult.rows.forEach((row) => {
                if (!historiesByVehicle.has(row.vehicle_id)) {
                    historiesByVehicle.set(row.vehicle_id, []);
                }
                historiesByVehicle.get(row.vehicle_id).push({
                    id: row.id,
                    ownerCompanyId: row.owner_company_id,
                    ownerCompanyName: row.owner_company_name,
                    validFrom: row.valid_from,
                    validTo: row.valid_to,
                    transferReason: row.transfer_reason,
                    transferNotes: row.transfer_notes
                });
            });
            // 4. Combine vehicle data with histories
            const allHistories = vehicles.map((vehicle) => ({
                vehicleId: vehicle.id,
                vehicle: {
                    id: vehicle.id,
                    brand: vehicle.brand,
                    model: vehicle.model,
                    licensePlate: vehicle.license_plate,
                    ownerCompanyId: vehicle.owner_company_id
                },
                history: historiesByVehicle.get(vehicle.id) || []
            }));
            const loadTime = Date.now() - startTime;
            console.log(`✅ BULK: Loaded ownership history for ${vehicles.length} vehicles in ${loadTime}ms using 2 SQL queries instead of ${vehicles.length + 1}`);
            res.json({
                success: true,
                data: {
                    vehicleHistories: allHistories,
                    totalVehicles: vehicles.length,
                    loadTimeMs: loadTime
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Bulk ownership history error:', error);
        res.status(500).json({
            success: false,
            error: `Failed to load bulk ownership history: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }
});
// GET /api/vehicles/:id - Získanie konkrétneho vozidla
router.get('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'read', { getContext: getVehicleContext }), async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await postgres_database_1.postgresDatabase.getVehicle(id);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nenájdené'
            });
        }
        res.json({
            success: true,
            data: vehicle
        });
    }
    catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vozidla'
        });
    }
});
// POST /api/vehicles - Vytvorenie nového vozidla s cache invalidation
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'create'), (0, cache_middleware_1.invalidateCache)('vehicle'), async (req, res) => {
    try {
        const { brand, model, licensePlate, vin, company, pricing, commission, status, year } = req.body;
        if (!brand || !model || !company) {
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené'
            });
        }
        const createdVehicle = await postgres_database_1.postgresDatabase.createVehicle({
            brand,
            model,
            year: year || 2024,
            licensePlate: licensePlate || '',
            vin: vin || null,
            company,
            pricing: pricing || [],
            commission: commission || { type: 'percentage', value: 0 },
            status: status || 'available'
        });
        res.status(201).json({
            success: true,
            message: 'Vozidlo úspešne vytvorené',
            data: createdVehicle
        });
    }
    catch (error) {
        console.error('Create vehicle error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba pri vytváraní vozidla';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});
// PUT /api/vehicles/:id - Aktualizácia vozidla s cache invalidation
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'update', { getContext: getVehicleContext }), (0, cache_middleware_1.invalidateCache)('vehicle'), async (req, res) => {
    try {
        const { id } = req.params;
        const { brand, model, licensePlate, vin, company, category, pricing, commission, status, year, stk } = req.body;
        // Skontroluj, či vozidlo existuje
        const existingVehicle = await postgres_database_1.postgresDatabase.getVehicle(id);
        if (!existingVehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nenájdené'
            });
        }
        const updatedVehicle = {
            id,
            brand: brand || existingVehicle.brand,
            model: model || existingVehicle.model,
            licensePlate: licensePlate || existingVehicle.licensePlate,
            vin: vin !== undefined ? vin : existingVehicle.vin,
            company: company || existingVehicle.company,
            category: category || existingVehicle.category,
            pricing: pricing || existingVehicle.pricing,
            commission: commission || existingVehicle.commission,
            status: status || existingVehicle.status,
            year: year !== undefined ? year : existingVehicle.year,
            stk: stk !== undefined ? (stk ? new Date(stk) : undefined) : existingVehicle.stk,
            ownerCompanyId: existingVehicle.ownerCompanyId,
            assignedMechanicId: existingVehicle.assignedMechanicId,
            createdAt: existingVehicle.createdAt
        };
        await postgres_database_1.postgresDatabase.updateVehicle(updatedVehicle);
        res.json({
            success: true,
            message: 'Vozidlo úspešne aktualizované',
            data: updatedVehicle
        });
    }
    catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii vozidla'
        });
    }
});
// DELETE /api/vehicles/:id - Vymazanie vozidla s cache invalidation
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'delete', { getContext: getVehicleContext }), (0, cache_middleware_1.invalidateCache)('vehicle'), async (req, res) => {
    try {
        const { id } = req.params;
        // Skontroluj, či vozidlo existuje
        const existingVehicle = await postgres_database_1.postgresDatabase.getVehicle(id);
        if (!existingVehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nenájdené'
            });
        }
        await postgres_database_1.postgresDatabase.deleteVehicle(id);
        res.json({
            success: true,
            message: 'Vozidlo úspešne vymazané'
        });
    }
    catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní vozidla'
        });
    }
});
// 🔧 ADMIN TOOL - Priradenie vozidiel k firme
router.post('/assign-to-company', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { vehicleIds, companyId } = req.body;
        if (!vehicleIds || !Array.isArray(vehicleIds) || !companyId) {
            return res.status(400).json({
                success: false,
                error: 'vehicleIds (array) a companyId sú povinné'
            });
        }
        // Verify company exists
        const companies = await postgres_database_1.postgresDatabase.getCompanies();
        const company = companies.find(c => c.id === companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Firma nenájdená'
            });
        }
        // Update vehicles using database method
        await postgres_database_1.postgresDatabase.assignVehiclesToCompany(vehicleIds, companyId);
        console.log(`🏢 Assigned ${vehicleIds.length} vehicles to company ${company.name}`);
        res.json({
            success: true,
            message: `${vehicleIds.length} vozidiel úspešne priradených k firme ${company.name}`,
            data: {
                companyId,
                companyName: company.name,
                assignedVehicleIds: vehicleIds
            }
        });
    }
    catch (error) {
        console.error('Assign vehicles to company error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri priradzovaní vozidiel'
        });
    }
});
// 📊 CSV EXPORT - Export vozidiel do CSV
router.get('/export/csv', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'read'), async (req, res) => {
    try {
        let vehicles = await postgres_database_1.postgresDatabase.getVehicles();
        // 🔐 NON-ADMIN USERS - filter podľa company permissions
        if (req.user?.role !== 'admin' && req.user) {
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(req.user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            vehicles = vehicles.filter(v => v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId));
        }
        // Vytvor CSV hlavičky
        const csvHeaders = [
            'ID',
            'Značka',
            'Model',
            'ŠPZ',
            'Firma',
            'Rok',
            'Status',
            'STK',
            'Vytvorené'
        ];
        // Konvertuj vozidlá na CSV riadky
        const csvRows = vehicles.map(vehicle => [
            vehicle.id,
            vehicle.brand,
            vehicle.model,
            vehicle.licensePlate,
            vehicle.company,
            vehicle.year || '',
            vehicle.status,
            vehicle.stk ? vehicle.stk.toISOString().split('T')[0] : '',
            vehicle.createdAt ? vehicle.createdAt.toISOString().split('T')[0] : ''
        ]);
        // Vytvor CSV obsah
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        // Nastav response headers pre CSV download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="vozidla-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Cache-Control', 'no-cache');
        // Pridaj BOM pre správne zobrazenie diakritiky v Exceli
        res.send('\ufeff' + csvContent);
        console.log(`📊 CSV Export: ${vehicles.length} vozidiel exportovaných pre používateľa ${req.user?.username}`);
    }
    catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri exporte CSV'
        });
    }
});
// 📥 CSV IMPORT - Import vozidiel z CSV s kontrolou duplicít a update
router.post('/import/csv', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('📥 Starting CSV import for vehicles...');
        const { csvData } = req.body;
        if (!csvData) {
            return res.status(400).json({
                success: false,
                error: 'CSV dáta sú povinné'
            });
        }
        // Parsuj CSV dáta
        const lines = csvData.split('\n').filter((line) => line.trim());
        const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
        const dataLines = lines.slice(1); // Preskočiť header
        console.log('📊 CSV Header:', header);
        const results = [];
        const errors = [];
        const updated = [];
        const skipped = [];
        console.log(`📊 Processing ${dataLines.length} vehicles from CSV...`);
        // Získaj existujúce vozidlá pre kontrolu duplicít
        const existingVehicles = await postgres_database_1.postgresDatabase.getVehicles();
        const existingByLicensePlate = new Map(existingVehicles.map(v => [v.licensePlate?.toLowerCase(), v]));
        // Progress tracking
        const progressInterval = Math.max(1, Math.floor(dataLines.length / 10)); // Log každých 10% alebo každý záznam ak je menej ako 10
        for (let i = 0; i < dataLines.length; i++) {
            // Progress logging
            if (i % progressInterval === 0 || i === dataLines.length - 1) {
                const progress = Math.round(((i + 1) / dataLines.length) * 100);
                console.log(`📊 CSV Import Progress: ${progress}% (${i + 1}/${dataLines.length})`);
            }
            try {
                const line = dataLines[i].trim();
                if (!line)
                    continue;
                // Parsuj CSV riadok
                const fields = line.split(',').map((field) => field.replace(/^"|"$/g, '').trim());
                if (fields.length < 4) {
                    errors.push({ row: i + 2, error: 'Nedostatok stĺpcov' });
                    continue;
                }
                // Mapovanie základných stĺpcov
                const fieldMap = {};
                header.forEach((headerName, index) => {
                    fieldMap[headerName] = fields[index] || '';
                });
                const brand = fieldMap['brand'];
                const model = fieldMap['model'];
                const licensePlate = fieldMap['licensePlate'];
                const company = fieldMap['company'];
                const year = fieldMap['year'];
                const status = fieldMap['status'];
                const stk = fieldMap['stk'];
                if (!brand || !model || !company) {
                    errors.push({ row: i + 2, error: 'Značka, model a firma sú povinné' });
                    continue;
                }
                // ✅ PARSOVANIE CENOTVORBY Z CSV
                const pricing = [];
                // Mapovanie cenových stĺpcov na pricing formát
                const priceColumns = [
                    { column: 'cena_0_1', minDays: 0, maxDays: 1 },
                    { column: 'cena_2_3', minDays: 2, maxDays: 3 },
                    { column: 'cena_4_7', minDays: 4, maxDays: 7 },
                    { column: 'cena_8_14', minDays: 8, maxDays: 14 },
                    { column: 'cena_15_22', minDays: 15, maxDays: 22 },
                    { column: 'cena_23_30', minDays: 23, maxDays: 30 },
                    { column: 'cena_31_9999', minDays: 31, maxDays: 9999 }
                ];
                priceColumns.forEach((priceCol, index) => {
                    const priceValue = fieldMap[priceCol.column];
                    if (priceValue && !isNaN(parseFloat(priceValue))) {
                        pricing.push({
                            id: (index + 1).toString(),
                            minDays: priceCol.minDays,
                            maxDays: priceCol.maxDays,
                            pricePerDay: parseFloat(priceValue)
                        });
                    }
                });
                // Parsovanie commission
                const commissionType = (fieldMap['commissionType'] || 'percentage');
                const commissionValue = fieldMap['commissionValue'] ? parseFloat(fieldMap['commissionValue']) : 20;
                // Vytvor vehicle data
                const vehicleData = {
                    brand: brand.trim(),
                    model: model.trim(),
                    licensePlate: licensePlate?.trim() || '',
                    company: company.trim(),
                    year: year && year.trim() && !isNaN(parseInt(year)) ? parseInt(year) : 2024,
                    status: (status?.trim() || 'available'),
                    stk: stk && stk.trim() ? new Date(stk.trim()) : undefined,
                    pricing: pricing,
                    commission: {
                        type: commissionType,
                        value: commissionValue
                    }
                };
                // 🔍 KONTROLA DUPLICÍT - Ak existuje vozidlo s rovnakou ŠPZ
                const licensePlateLower = vehicleData.licensePlate.toLowerCase();
                const existingVehicle = existingByLicensePlate.get(licensePlateLower);
                if (existingVehicle) {
                    // ✅ UPDATE EXISTUJÚCEHO ZÁZNAMU
                    console.log(`🔄 Updating existing vehicle ${i + 1}/${dataLines.length}: ${brand} ${model} (${licensePlate})`);
                    const updatedVehicle = {
                        ...existingVehicle,
                        brand: vehicleData.brand,
                        model: vehicleData.model,
                        company: vehicleData.company,
                        year: vehicleData.year,
                        status: vehicleData.status,
                        stk: vehicleData.stk,
                        pricing: vehicleData.pricing,
                        commission: vehicleData.commission
                    };
                    await postgres_database_1.postgresDatabase.updateVehicle(updatedVehicle);
                    updated.push({
                        id: existingVehicle.id,
                        brand: vehicleData.brand,
                        model: vehicleData.model,
                        licensePlate: vehicleData.licensePlate,
                        action: 'updated'
                    });
                }
                else {
                    // ✅ VYTVOR NOVÉ VOZIDLO
                    console.log(`🚗 Creating new vehicle ${i + 1}/${dataLines.length}: ${brand} ${model} with ${pricing.length} price tiers`);
                    console.log('💰 Pricing:', pricing);
                    const createdVehicle = await postgres_database_1.postgresDatabase.createVehicle(vehicleData);
                    results.push({
                        id: createdVehicle.id,
                        brand: vehicleData.brand,
                        model: vehicleData.model,
                        licensePlate: vehicleData.licensePlate,
                        action: 'created'
                    });
                }
            }
            catch (error) {
                console.error(`❌ Error processing row ${i + 2}:`, error);
                errors.push({
                    row: i + 2,
                    error: error instanceof Error ? error.message : 'Neznáma chyba'
                });
            }
        }
        console.log(`✅ CSV import completed: ${results.length} created, ${updated.length} updated, ${errors.length} errors`);
        res.json({
            success: true,
            message: `CSV import dokončený: ${results.length} vytvorených, ${updated.length} aktualizovaných, ${errors.length} chýb`,
            data: {
                imported: results.length,
                updated: updated.length,
                errorsCount: errors.length,
                results: [...results, ...updated],
                errors: errors.slice(0, 10) // Limit na prvých 10 chýb
            }
        });
    }
    catch (error) {
        console.error('❌ CSV import error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri CSV importe',
            details: error instanceof Error ? error.message : 'Neznáma chyba'
        });
    }
});
// 🚀 GMAIL APPROACH: GET /api/vehicles/paginated - Rýchle vyhľadávanie s pagination
router.get('/paginated', auth_1.authenticateToken, (0, permissions_1.checkPermission)('vehicles', 'read'), async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', company = 'all', brand = 'all', category = 'all', status = 'all', yearMin = '', yearMax = '', priceMin = '', priceMax = '' } = req.query;
        console.log('🚗 Vehicles PAGINATED GET - params:', {
            page, limit, search, company, brand, category,
            role: req.user?.role,
            userId: req.user?.id
        });
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        // Získaj paginated vehicles s filtrami
        const result = await postgres_database_1.postgresDatabase.getVehiclesPaginated({
            limit: limitNum,
            offset,
            search: search,
            company: company,
            brand: brand,
            category: category,
            status: status,
            yearMin: yearMin,
            yearMax: yearMax,
            priceMin: priceMin,
            priceMax: priceMax,
            userId: req.user?.id,
            userRole: req.user?.role
        });
        console.log(`📊 Found ${result.vehicles.length}/${result.total} vehicles (page ${pageNum})`);
        res.json({
            success: true,
            data: {
                vehicles: result.vehicles,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(result.total / limitNum),
                    totalItems: result.total,
                    hasMore: (pageNum * limitNum) < result.total,
                    itemsPerPage: limitNum
                }
            }
        });
    }
    catch (error) {
        console.error('Get paginated vehicles error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vozidiel'
        });
    }
});
exports.default = router;
//# sourceMappingURL=vehicles.js.map