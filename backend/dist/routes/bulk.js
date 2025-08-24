"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ⚡ BULK DATA ENDPOINT - Načíta všetky dáta jedným requestom
router.get('/data', auth_1.authenticateToken, async (req, res) => {
    try {
        console.log('🚀 BULK: Loading all data in single request...');
        const startTime = Date.now();
        const user = req.user;
        console.log('👤 BULK: User info:', {
            id: user.id,
            role: user.role,
            companyId: user.companyId
        });
        // ⚡ PHASE 1: Load all data in parallel (no filtering yet)
        console.log('📦 BULK: Phase 1 - Loading raw data...');
        const rawDataStart = Date.now();
        try {
            const [vehicles, rentals, customers, companies, insurers, expenses, insurances, settlements, vehicleDocuments, insuranceClaims] = await Promise.all([
                postgres_database_1.postgresDatabase.getVehicles(true, true), // Zahrnúť všetky vozidlá vrátane vyradených a súkromných
                postgres_database_1.postgresDatabase.getRentals(),
                postgres_database_1.postgresDatabase.getCustomers(),
                postgres_database_1.postgresDatabase.getCompanies(),
                postgres_database_1.postgresDatabase.getInsurers(),
                postgres_database_1.postgresDatabase.getExpenses(),
                postgres_database_1.postgresDatabase.getInsurances(),
                postgres_database_1.postgresDatabase.getSettlements(),
                postgres_database_1.postgresDatabase.getVehicleDocuments(),
                postgres_database_1.postgresDatabase.getInsuranceClaims()
            ]);
            const rawDataTime = Date.now() - rawDataStart;
            console.log(`✅ BULK: Raw data loaded in ${rawDataTime}ms`);
            // ⚡ PHASE 2: Apply permission filtering (only if not admin)
            let filteredData = {
                vehicles,
                rentals,
                customers,
                companies,
                insurers,
                expenses,
                insurances,
                settlements,
                vehicleDocuments,
                insuranceClaims
            };
            if (user.role !== 'admin') {
                console.log('🔐 BULK: Applying permission filtering...');
                const filterStart = Date.now();
                // Get user permissions once (should be cached from Phase 2 optimization)
                const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(user.id);
                const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
                const allowedCompanyNames = userCompanyAccess.map(access => access.companyName);
                console.log('🔐 BULK: User access:', {
                    allowedCompanyIds: allowedCompanyIds.length,
                    allowedCompanyNames: allowedCompanyNames.length
                });
                // Filter data based on permissions
                filteredData = {
                    // Vehicles: filter by owner_company_id
                    vehicles: vehicles.filter(v => v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId)),
                    // Rentals: filter by vehicle ownership (historical)
                    rentals: rentals.filter(rental => {
                        if (rental.vehicle && rental.vehicle.ownerCompanyId) {
                            return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
                        }
                        else if (rental.vehicle && rental.vehicle.company) {
                            return allowedCompanyNames.includes(rental.vehicle.company);
                        }
                        return false;
                    }),
                    // Customers: no filtering (all users can see all customers)
                    customers,
                    // Companies: filter to only accessible companies
                    companies: companies.filter(c => allowedCompanyIds.includes(c.id) || allowedCompanyNames.includes(c.name)),
                    // Insurers: no filtering
                    insurers,
                    // Expenses: filter by company
                    expenses: expenses.filter(e => allowedCompanyNames.includes(e.company)),
                    // Insurances: filter by company  
                    insurances: insurances.filter(i => i.company && allowedCompanyNames.includes(i.company)),
                    // Settlements: filter by company
                    settlements: settlements.filter(s => s.company && allowedCompanyNames.includes(s.company)),
                    // Vehicle Documents: filter by vehicle access
                    vehicleDocuments: vehicleDocuments.filter(doc => {
                        const allowedVehicleIds = filteredData.vehicles.map(v => v.id);
                        return allowedVehicleIds.includes(doc.vehicleId);
                    }),
                    // Insurance Claims: filter by vehicle access
                    insuranceClaims: insuranceClaims.filter(claim => {
                        const allowedVehicleIds = filteredData.vehicles.map(v => v.id);
                        return claim.vehicleId && allowedVehicleIds.includes(claim.vehicleId);
                    })
                };
                const filterTime = Date.now() - filterStart;
                console.log(`🔐 BULK: Permission filtering applied in ${filterTime}ms`);
            }
            const totalTime = Date.now() - startTime;
            console.log('✅ BULK: All data loaded successfully:', {
                totalTime: `${totalTime}ms`,
                vehicles: filteredData.vehicles.length,
                rentals: filteredData.rentals.length,
                customers: filteredData.customers.length,
                companies: filteredData.companies.length,
                insurers: filteredData.insurers.length,
                expenses: filteredData.expenses.length,
                insurances: filteredData.insurances.length,
                settlements: filteredData.settlements.length,
                vehicleDocuments: filteredData.vehicleDocuments.length,
                insuranceClaims: filteredData.insuranceClaims.length
            });
            res.json({
                success: true,
                data: {
                    ...filteredData,
                    metadata: {
                        loadTimeMs: totalTime,
                        userRole: user.role,
                        isFiltered: user.role !== 'admin',
                        timestamp: new Date().toISOString()
                    }
                }
            });
        }
        catch (dataError) {
            console.error('❌ BULK: Data loading error:', dataError);
            throw dataError;
        }
    }
    catch (error) {
        console.error('❌ BULK: Error loading bulk data:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri načítaní dát',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=bulk.js.map