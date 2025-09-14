"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const postgres_database_1 = require("../models/postgres-database");
const router = (0, express_1.Router)();
// GET /api/recurring-expenses - Získanie všetkých pravidelných nákladov
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'read'), async (req, res) => {
    try {
        const recurringExpenses = await postgres_database_1.postgresDatabase.getRecurringExpenses();
        console.log('🔄 Recurring Expenses GET:', {
            user: req.user?.username,
            count: recurringExpenses.length
        });
        // Pridaj cache busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.json({
            success: true,
            data: recurringExpenses
        });
    }
    catch (error) {
        console.error('Get recurring expenses error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní pravidelných nákladov'
        });
    }
});
// POST /api/recurring-expenses - Vytvorenie nového pravidelného nákladu
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'create'), async (req, res) => {
    try {
        const { name, description, amount, category, company, vehicleId, note, frequency, startDate, endDate, dayOfMonth } = req.body;
        // Validácia povinných polí
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Názov pravidelného nákladu je povinný'
            });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Popis je povinný'
            });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Suma musí byť väčšia ako 0'
            });
        }
        if (!category || !category.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Kategória je povinná'
            });
        }
        if (!company || !company.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Firma je povinná'
            });
        }
        // Validácia frequency
        const validFrequencies = ['monthly', 'quarterly', 'yearly'];
        if (!frequency || !validFrequencies.includes(frequency)) {
            return res.status(400).json({
                success: false,
                error: 'Neplatná frekvencia (monthly, quarterly, yearly)'
            });
        }
        // Validácia dayOfMonth
        const dayNum = parseInt(dayOfMonth) || 1;
        if (dayNum < 1 || dayNum > 28) {
            return res.status(400).json({
                success: false,
                error: 'Deň v mesiaci musí byť medzi 1-28'
            });
        }
        const recurringData = {
            name: name.trim(),
            description: description.trim(),
            amount: parseFloat(amount),
            category: category.trim(),
            company: company.trim(),
            vehicleId: vehicleId?.trim() || undefined,
            note: note?.trim() || undefined,
            frequency,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : undefined,
            dayOfMonth: dayNum,
            createdBy: req.user?.id
        };
        console.log('🔄 Creating recurring expense:', recurringData);
        const createdRecurring = await postgres_database_1.postgresDatabase.createRecurringExpense(recurringData);
        res.status(201).json({
            success: true,
            message: 'Pravidelný náklad úspešne vytvorený',
            data: createdRecurring
        });
    }
    catch (error) {
        console.error('Create recurring expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní pravidelného nákladu'
        });
    }
});
// PUT /api/recurring-expenses/:id - Aktualizácia pravidelného nákladu
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'update'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, amount, category, company, vehicleId, note, frequency, startDate, endDate, dayOfMonth, isActive } = req.body;
        // Získaj existujúci recurring expense priamo z databázy
        const recurringExpense = await postgres_database_1.postgresDatabase.getRecurringExpenseById(id);
        if (!recurringExpense) {
            return res.status(404).json({
                success: false,
                error: 'Pravidelný náklad nenájdený'
            });
        }
        // Validácia
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Názov je povinný'
            });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Popis je povinný'
            });
        }
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Suma musí byť väčšia ako 0'
            });
        }
        const updatedRecurring = {
            ...recurringExpense,
            name: name.trim(),
            description: description.trim(),
            amount: parseFloat(amount),
            category: category?.trim() || recurringExpense.category,
            company: company?.trim() || recurringExpense.company,
            vehicleId: vehicleId?.trim() || recurringExpense.vehicleId,
            note: note?.trim() || recurringExpense.note,
            frequency: frequency || recurringExpense.frequency,
            startDate: startDate ? new Date(startDate) : recurringExpense.startDate,
            endDate: endDate ? new Date(endDate) : recurringExpense.endDate,
            dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : recurringExpense.dayOfMonth,
            isActive: isActive !== undefined ? isActive : recurringExpense.isActive,
            updatedAt: new Date()
        };
        await postgres_database_1.postgresDatabase.updateRecurringExpense(updatedRecurring);
        // Načítaj fresh data z databázy pre potvrdenie
        const freshData = await postgres_database_1.postgresDatabase.getRecurringExpenseById(id);
        console.log('🔄 Updated recurring expense:', { id, name, freshData: freshData?.category });
        // Pridaj cache busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.json({
            success: true,
            message: 'Pravidelný náklad úspešne aktualizovaný',
            data: freshData || updatedRecurring
        });
    }
    catch (error) {
        console.error('Update recurring expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii pravidelného nákladu'
        });
    }
});
// DELETE /api/recurring-expenses/:id - Zmazanie pravidelného nákladu
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteRecurringExpense(id);
        console.log('🔄 Deleted recurring expense:', { id, user: req.user?.username });
        res.json({
            success: true,
            message: 'Pravidelný náklad úspešne zmazaný'
        });
    }
    catch (error) {
        console.error('Delete recurring expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri mazaní pravidelného nákladu'
        });
    }
});
// POST /api/recurring-expenses/generate - Manuálne spustenie generovania
router.post('/generate', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'create'), async (req, res) => {
    try {
        const { targetDate } = req.body;
        const date = targetDate ? new Date(targetDate) : new Date();
        console.log('🔄 Manual recurring expense generation triggered for:', date.toISOString().split('T')[0]);
        const results = await postgres_database_1.postgresDatabase.generateRecurringExpenses(date);
        res.json({
            success: true,
            message: `Generovanie dokončené: ${results.generated} vytvorených, ${results.skipped} preskočených`,
            data: results
        });
    }
    catch (error) {
        console.error('Generate recurring expenses error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri generovaní pravidelných nákladov'
        });
    }
});
// POST /api/recurring-expenses/:id/generate - Manuálne vygenerovanie konkrétneho nákladu
router.post('/:id/generate', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'create'), async (req, res) => {
    try {
        const { id } = req.params;
        const { targetDate } = req.body;
        const generatedExpenseId = await postgres_database_1.postgresDatabase.triggerRecurringExpenseGeneration(id, targetDate ? new Date(targetDate) : new Date());
        res.json({
            success: true,
            message: 'Náklad úspešne vygenerovaný',
            data: { generatedExpenseId }
        });
    }
    catch (error) {
        console.error('Generate single recurring expense error:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Chyba pri generovaní nákladu'
        });
    }
});
exports.default = router;
//# sourceMappingURL=recurring-expenses.js.map