"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/settlements - Získanie všetkých vyúčtovaní
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const settlements = await postgres_database_1.postgresDatabase.getSettlements();
        res.json({
            success: true,
            data: settlements
        });
    }
    catch (error) {
        console.error('Get settlements error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vyúčtovaní'
        });
    }
});
// GET /api/settlements/:id - Získanie konkrétneho vyúčtovania
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const settlement = await postgres_database_1.postgresDatabase.getSettlement(id);
        if (!settlement) {
            return res.status(404).json({
                success: false,
                error: 'Vyúčtovanie nenájdené'
            });
        }
        res.json({
            success: true,
            data: settlement
        });
    }
    catch (error) {
        console.error('Get settlement error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vyúčtovania'
        });
    }
});
// POST /api/settlements - Vytvorenie nového vyúčtovania
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { company, period, totalIncome, totalExpenses, totalCommission, profit } = req.body;
        // Frontend posiela period: { from, to }, takže musíme to správne extrahovať
        const fromDate = period?.from ? new Date(period.from) : null;
        const toDate = period?.to ? new Date(period.to) : null;
        const periodString = fromDate && toDate ?
            `${fromDate.toLocaleDateString('sk-SK')} - ${toDate.toLocaleDateString('sk-SK')}` :
            'Neurčené obdobie';
        if (!company || !fromDate || !toDate) {
            console.error('Settlement validation failed:', { company, fromDate, toDate, period });
            return res.status(400).json({
                success: false,
                error: 'Všetky povinné polia musia byť vyplnené (firma, obdobie od, obdobie do)'
            });
        }
        const createdSettlement = await postgres_database_1.postgresDatabase.createSettlement({
            company,
            period: periodString,
            fromDate,
            toDate,
            totalIncome: totalIncome || 0,
            totalExpenses: totalExpenses || 0,
            commission: totalCommission || 0,
            profit: profit || 0,
            summary: `Vyúčtovanie pre ${company} za obdobie ${periodString}`
        });
        res.status(201).json({
            success: true,
            message: 'Vyúčtovanie úspešne vytvorené',
            data: createdSettlement
        });
    }
    catch (error) {
        console.error('Create settlement error:', error);
        res.status(500).json({
            success: false,
            error: `Chyba pri vytváraní vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
        });
    }
});
// PUT /api/settlements/:id - Aktualizácia vyúčtovania
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Skontroluj, či vyúčtovanie existuje
        const existingSettlement = await postgres_database_1.postgresDatabase.getSettlement(id);
        if (!existingSettlement) {
            return res.status(404).json({
                success: false,
                error: 'Vyúčtovanie nenájdené'
            });
        }
        const updatedSettlement = await postgres_database_1.postgresDatabase.updateSettlement(id, updateData);
        res.json({
            success: true,
            message: 'Vyúčtovanie úspešne aktualizované',
            data: updatedSettlement
        });
    }
    catch (error) {
        console.error('Update settlement error:', error);
        res.status(500).json({
            success: false,
            error: `Chyba pri aktualizácii vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
        });
    }
});
// DELETE /api/settlements/:id - Vymazanie vyúčtovania
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Skontroluj, či vyúčtovanie existuje
        const existingSettlement = await postgres_database_1.postgresDatabase.getSettlement(id);
        if (!existingSettlement) {
            return res.status(404).json({
                success: false,
                error: 'Vyúčtovanie nenájdené'
            });
        }
        await postgres_database_1.postgresDatabase.deleteSettlement(id);
        res.json({
            success: true,
            message: 'Vyúčtovanie úspešne vymazané'
        });
    }
    catch (error) {
        console.error('Delete settlement error:', error);
        res.status(500).json({
            success: false,
            error: `Chyba pri vymazávaní vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
        });
    }
});
exports.default = router;
//# sourceMappingURL=settlements.js.map