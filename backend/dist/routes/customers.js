"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const cache_middleware_1 = require("../middleware/cache-middleware");
const router = (0, express_1.Router)();
// GET /api/customers - Získanie všetkých zákazníkov s cache
router.get('/', auth_1.authenticateToken, (0, cache_middleware_1.cacheResponse)('customers', {
    cacheKey: cache_middleware_1.userSpecificCache,
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['customers']
}), async (req, res) => {
    try {
        let customers = await postgres_database_1.postgresDatabase.getCustomers();
        console.log('👥 Customers GET - user:', {
            role: req.user?.role,
            userId: req.user?.id,
            totalCustomers: customers.length
        });
        // 🔐 NON-ADMIN USERS - filter podľa company permissions
        if (req.user?.role !== 'admin' && req.user) {
            const user = req.user; // TypeScript safe assignment
            const originalCount = customers.length;
            // Získaj company access pre používateľa
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            // Získaj všetky rentals a vehicles pre mapping
            const rentals = await postgres_database_1.postgresDatabase.getRentals();
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            // Filter zákazníkov len tých, ktorí mali prenajaté vozidlá z povolených firiem
            const allowedCustomerIds = new Set();
            rentals.forEach(rental => {
                if (!rental.customerId || !rental.vehicleId)
                    return;
                const vehicle = vehicles.find(v => v.id === rental.vehicleId);
                if (!vehicle || !vehicle.ownerCompanyId)
                    return;
                if (allowedCompanyIds.includes(vehicle.ownerCompanyId)) {
                    allowedCustomerIds.add(rental.customerId);
                }
            });
            customers = customers.filter(c => allowedCustomerIds.has(c.id));
            console.log('🔐 Customers Company Permission Filter:', {
                userId: user.id,
                allowedCompanyIds,
                originalCount,
                filteredCount: customers.length,
                allowedCustomerIds: Array.from(allowedCustomerIds)
            });
        }
        res.json({
            success: true,
            data: customers
        });
    }
    catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní zákazníkov'
        });
    }
});
// POST /api/customers - Vytvorenie nového zákazníka
router.post('/', auth_1.authenticateToken, (0, cache_middleware_1.invalidateCache)('customer'), async (req, res) => {
    try {
        console.log('🎯 Customer creation started with data:', req.body);
        const { name, email, phone } = req.body;
        if (!name || typeof name !== 'string' || name.trim() === '') {
            console.log('❌ Customer validation failed - missing or invalid name:', name);
            return res.status(400).json({
                success: false,
                error: 'Meno zákazníka je povinné a musí byť vyplnené'
            });
        }
        console.log('✅ Customer validation passed, creating customer...');
        console.log('📝 Customer data:', {
            name: name.trim(),
            email: email || null,
            phone: phone || null
        });
        const createdCustomer = await postgres_database_1.postgresDatabase.createCustomer({
            name: name.trim(),
            email: email || null,
            phone: phone || null
        });
        console.log('🎉 Customer created successfully:', createdCustomer.id);
        res.status(201).json({
            success: true,
            message: 'Zákazník úspešne vytvorený',
            data: createdCustomer
        });
    }
    catch (error) {
        console.error('❌ DETAILED Create customer error:');
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        console.error('   Error detail:', error.detail);
        console.error('   Error stack:', error.stack);
        console.error('   Full error object:', error);
        res.status(500).json({
            success: false,
            error: `Chyba pri vytváraní zákazníka: ${error.message || 'Neznáma chyba'}`
        });
    }
});
// PUT /api/customers/:id - Aktualizácia zákazníka
router.put('/:id', auth_1.authenticateToken, (0, cache_middleware_1.invalidateCache)('customer'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Meno zákazníka je povinné'
            });
        }
        const updatedCustomer = {
            id,
            name,
            email: email || '',
            phone: phone || '',
            createdAt: new Date()
        };
        await postgres_database_1.postgresDatabase.updateCustomer(updatedCustomer);
        res.json({
            success: true,
            message: 'Zákazník úspešne aktualizovaný',
            data: updatedCustomer
        });
    }
    catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii zákazníka'
        });
    }
});
// DELETE /api/customers/:id - Vymazanie zákazníka
router.delete('/:id', auth_1.authenticateToken, (0, cache_middleware_1.invalidateCache)('customer'), async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteCustomer(id);
        res.json({
            success: true,
            message: 'Zákazník úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní zákazníka'
        });
    }
});
// 📊 CSV EXPORT - Export zákazníkov do CSV
router.get('/export/csv', auth_1.authenticateToken, async (req, res) => {
    try {
        let customers = await postgres_database_1.postgresDatabase.getCustomers();
        // 🔐 NON-ADMIN USERS - filter podľa company permissions
        if (req.user?.role !== 'admin' && req.user) {
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(req.user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            const rentals = await postgres_database_1.postgresDatabase.getRentals();
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            const allowedCustomerIds = new Set();
            rentals.forEach(rental => {
                if (!rental.customerId || !rental.vehicleId)
                    return;
                const vehicle = vehicles.find(v => v.id === rental.vehicleId);
                if (!vehicle || !vehicle.ownerCompanyId)
                    return;
                if (allowedCompanyIds.includes(vehicle.ownerCompanyId)) {
                    allowedCustomerIds.add(rental.customerId);
                }
            });
            customers = customers.filter(c => allowedCustomerIds.has(c.id));
        }
        // Vytvor CSV hlavičky
        const csvHeaders = [
            'ID',
            'Meno',
            'Email',
            'Telefón',
            'Vytvorené'
        ];
        // Konvertuj zákazníkov na CSV riadky
        const csvRows = customers.map(customer => [
            customer.id,
            customer.name,
            customer.email || '',
            customer.phone || '',
            customer.createdAt ? customer.createdAt.toISOString().split('T')[0] : ''
        ]);
        // Vytvor CSV obsah
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        // Nastav response headers pre CSV download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="zakaznici-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Cache-Control', 'no-cache');
        // Pridaj BOM pre správne zobrazenie diakritiky v Exceli
        res.send('\ufeff' + csvContent);
        console.log(`📊 CSV Export: ${customers.length} zákazníkov exportovaných pre používateľa ${req.user?.username}`);
    }
    catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri exporte CSV'
        });
    }
});
// 📥 CSV IMPORT - Import zákazníkov z CSV
router.post('/import/csv', auth_1.authenticateToken, async (req, res) => {
    try {
        const { csvData } = req.body;
        if (!csvData || typeof csvData !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'CSV dáta sú povinné'
            });
        }
        // Parsuj CSV
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'CSV musí obsahovať aspoň hlavičku a jeden riadok dát'
            });
        }
        // Preskočíme hlavičku
        const dataLines = lines.slice(1);
        const results = [];
        const errors = [];
        for (let i = 0; i < dataLines.length; i++) {
            try {
                const line = dataLines[i].trim();
                if (!line)
                    continue;
                // Parsuj CSV riadok
                const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
                if (fields.length < 2) {
                    errors.push({ row: i + 2, error: 'Nedostatok stĺpcov' });
                    continue;
                }
                const [, name, email, phone] = fields;
                if (!name) {
                    errors.push({ row: i + 2, error: 'Meno zákazníka je povinné' });
                    continue;
                }
                // Vytvor zákazníka
                const customerData = {
                    name: name.trim(),
                    email: email?.trim() || '',
                    phone: phone?.trim() || ''
                };
                const createdCustomer = await postgres_database_1.postgresDatabase.createCustomer(customerData);
                results.push({ row: i + 2, customer: createdCustomer });
            }
            catch (error) {
                errors.push({
                    row: i + 2,
                    error: error.message || 'Chyba pri vytváraní zákazníka'
                });
            }
        }
        res.json({
            success: true,
            message: `CSV import dokončený: ${results.length} úspešných, ${errors.length} chýb`,
            data: {
                imported: results.length,
                errorsCount: errors.length,
                results,
                errors: errors.slice(0, 10) // Limit na prvých 10 chýb
            }
        });
        console.log(`📥 CSV Import: ${results.length} zákazníkov importovaných, ${errors.length} chýb`);
    }
    catch (error) {
        console.error('CSV import error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri importe CSV'
        });
    }
});
exports.default = router;
//# sourceMappingURL=customers.js.map