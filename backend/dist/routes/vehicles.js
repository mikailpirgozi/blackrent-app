"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/vehicles - Získanie všetkých vozidiel
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
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
// GET /api/vehicles/:id - Získanie konkrétneho vozidla
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
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
// POST /api/vehicles - Vytvorenie nového vozidla
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { brand, model, licensePlate, company, pricing, commission, status, year } = req.body;
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
// PUT /api/vehicles/:id - Aktualizácia vozidla
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { brand, model, licensePlate, company, pricing, commission, status } = req.body;
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
            company: company || existingVehicle.company,
            pricing: pricing || existingVehicle.pricing,
            commission: commission || existingVehicle.commission,
            status: status || existingVehicle.status
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
// DELETE /api/vehicles/:id - Vymazanie vozidla
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
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
exports.default = router;
//# sourceMappingURL=vehicles.js.map