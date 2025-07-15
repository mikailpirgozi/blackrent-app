"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
// GET /api/rentals - Získanie všetkých prenájmov
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const rentals = await postgres_database_1.postgresDatabase.getRentals();
        res.json({
            success: true,
            data: rentals
        });
    }
    catch (error) {
        console.error('Get rentals error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní prenájmov'
        });
    }
});
// GET /api/rentals/:id - Získanie konkrétneho prenájmu
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const rental = await postgres_database_1.postgresDatabase.getRental(id);
        if (!rental) {
            return res.status(404).json({
                success: false,
                error: 'Prenájom nenájdený'
            });
        }
        res.json({
            success: true,
            data: rental
        });
    }
    catch (error) {
        console.error('Get rental error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní prenájmu'
        });
    }
});
// POST /api/rentals - Vytvorenie nového prenájmu
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { vehicleId, customerId, customerName, startDate, endDate, totalPrice, commission, paymentMethod, discount, customCommission, extraKmCharge, paid, status, handoverPlace, confirmed, payments, history, orderNumber } = req.body;
        if (!customerName || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené'
            });
        }
        const newRental = {
            id: (0, uuid_1.v4)(),
            vehicleId,
            customerId,
            customerName,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            totalPrice: totalPrice || 0,
            commission: commission || 0,
            paymentMethod: paymentMethod || 'cash',
            discount,
            customCommission,
            extraKmCharge,
            paid: paid || false,
            status: status || 'pending',
            handoverPlace,
            confirmed: confirmed || false,
            payments,
            history,
            orderNumber,
            createdAt: new Date(),
            vehicle: {
                id: vehicleId,
                brand: '',
                model: '',
                licensePlate: '',
                company: '',
                pricing: [],
                commission: { type: 'percentage', value: 0 },
                status: 'available'
            }
        };
        await postgres_database_1.postgresDatabase.createRental(newRental);
        res.status(201).json({
            success: true,
            message: 'Prenájom úspešne vytvorený',
            data: newRental
        });
    }
    catch (error) {
        console.error('Create rental error:', error);
        res.status(500).json({
            success: false,
            error: `Chyba pri vytváraní prenájmu: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
        });
    }
});
// PUT /api/rentals/:id - Aktualizácia prenájmu
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Skontroluj, či prenájom existuje
        const existingRental = await postgres_database_1.postgresDatabase.getRental(id);
        if (!existingRental) {
            return res.status(404).json({
                success: false,
                error: 'Prenájom nenájdený'
            });
        }
        const updatedRental = {
            ...existingRental,
            ...updateData,
            id,
            startDate: updateData.startDate ? new Date(updateData.startDate) : existingRental.startDate,
            endDate: updateData.endDate ? new Date(updateData.endDate) : existingRental.endDate
        };
        await postgres_database_1.postgresDatabase.updateRental(updatedRental);
        res.json({
            success: true,
            message: 'Prenájom úspešne aktualizovaný',
            data: updatedRental
        });
    }
    catch (error) {
        console.error('Update rental error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii prenájmu'
        });
    }
});
// DELETE /api/rentals/:id - Vymazanie prenájmu
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        console.log(`🗑️ Pokus o vymazanie prenájmu ID: ${id}, používateľ: ${userId}, rola: ${userRole}`);
        // Skontroluj, či prenájom existuje
        const existingRental = await postgres_database_1.postgresDatabase.getRental(id);
        if (!existingRental) {
            console.log(`❌ Prenájom ${id} nenájdený v databáze`);
            return res.status(404).json({
                success: false,
                error: 'Prenájom nenájdený'
            });
        }
        console.log(`✅ Prenájom ${id} nájdený, vymazávam...`);
        await postgres_database_1.postgresDatabase.deleteRental(id);
        console.log(`🎉 Prenájom ${id} úspešne vymazaný`);
        res.json({
            success: true,
            message: 'Prenájom úspešne vymazaný'
        });
    }
    catch (error) {
        console.error('Delete rental error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vymazávaní prenájmu'
        });
    }
});
exports.default = router;
//# sourceMappingURL=rentals.js.map