"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/vehicle-unavailability - Získanie všetkých nedostupností
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, startDate, endDate } = req.query;
        // Parse query parameters
        const parsedStartDate = startDate ? new Date(startDate) : undefined;
        const parsedEndDate = endDate ? new Date(endDate) : undefined;
        const unavailabilities = await postgres_database_1.postgresDatabase.getVehicleUnavailabilities(vehicleId, parsedStartDate, parsedEndDate);
        res.json({
            success: true,
            data: unavailabilities
        });
    }
    catch (error) {
        console.error('Get vehicle unavailabilities error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní nedostupností vozidiel'
        });
    }
});
// GET /api/vehicle-unavailability/:id - Získanie konkrétnej nedostupnosti
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const unavailability = await postgres_database_1.postgresDatabase.getVehicleUnavailability(id);
        if (!unavailability) {
            return res.status(404).json({
                success: false,
                error: 'Nedostupnosť vozidla nenájdená'
            });
        }
        res.json({
            success: true,
            data: unavailability
        });
    }
    catch (error) {
        console.error('Get vehicle unavailability error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní nedostupnosti vozidla'
        });
    }
});
// POST /api/vehicle-unavailability - Vytvorenie novej nedostupnosti
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, startDate, endDate, reason, type, notes, priority, recurring, recurringConfig } = req.body;
        // Validation
        if (!vehicleId || !startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                error: 'Povinné polia: vehicleId, startDate, endDate, reason'
            });
        }
        // Get username from authenticated user for createdBy
        const createdBy = req.user?.username || 'system';
        const unavailability = await postgres_database_1.postgresDatabase.createVehicleUnavailability({
            vehicleId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            type,
            notes,
            priority,
            recurring,
            recurringConfig,
            createdBy
        });
        res.status(201).json({
            success: true,
            data: unavailability,
            message: 'Nedostupnosť vozidla úspešne vytvorená'
        });
    }
    catch (error) {
        console.error('Create vehicle unavailability error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Chyba pri vytváraní nedostupnosti vozidla'
        });
    }
});
// PUT /api/vehicle-unavailability/:id - Aktualizácia nedostupnosti
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Parse dates if provided
        if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate);
        }
        if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }
        const unavailability = await postgres_database_1.postgresDatabase.updateVehicleUnavailability(id, updateData);
        res.json({
            success: true,
            data: unavailability,
            message: 'Nedostupnosť vozidla úspešne aktualizovaná'
        });
    }
    catch (error) {
        console.error('Update vehicle unavailability error:', error);
        if (error.message === 'Nedostupnosť vozidla nenájdená') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Chyba pri aktualizácii nedostupnosti vozidla'
        });
    }
});
// DELETE /api/vehicle-unavailability/:id - Zmazanie nedostupnosti
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await postgres_database_1.postgresDatabase.deleteVehicleUnavailability(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Nedostupnosť vozidla nenájdená'
            });
        }
        res.json({
            success: true,
            message: 'Nedostupnosť vozidla úspešne zmazaná'
        });
    }
    catch (error) {
        console.error('Delete vehicle unavailability error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri mazaní nedostupnosti vozidla'
        });
    }
});
// GET /api/vehicle-unavailability/date-range/:startDate/:endDate - Nedostupnosti pre kalendár
router.get('/date-range/:startDate/:endDate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const unavailabilities = await postgres_database_1.postgresDatabase.getUnavailabilitiesForDateRange(new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: unavailabilities
        });
    }
    catch (error) {
        console.error('Get unavailabilities for date range error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní nedostupností pre dátumový rozsah'
        });
    }
});
exports.default = router;
//# sourceMappingURL=vehicle-unavailability.js.map