"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postgres_database_1 = require("../models/postgres-database");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../middleware/permissions");
const router = (0, express_1.Router)();
// 🔍 CONTEXT FUNCTIONS
const getExpenseContext = async (req) => {
    const expenseId = req.params.id;
    if (!expenseId)
        return {};
    const expenses = await postgres_database_1.postgresDatabase.getExpenses();
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || !expense.vehicleId)
        return {};
    // Získaj vehicle pre company context
    const vehicle = await postgres_database_1.postgresDatabase.getVehicle(expense.vehicleId);
    return {
        resourceCompanyId: vehicle?.ownerCompanyId,
        amount: expense.amount
    };
};
// GET /api/expenses - Získanie všetkých nákladov
router.get('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'read'), async (req, res) => {
    try {
        let expenses = await postgres_database_1.postgresDatabase.getExpenses();
        console.log('💰 Expenses GET - user:', {
            role: req.user?.role,
            companyId: req.user?.companyId,
            totalExpenses: expenses.length
        });
        // 🏢 COMPANY OWNER - filter len náklady vlastných vozidiel
        if (req.user?.role === 'company_owner' && req.user.companyId) {
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            const companyVehicleIds = vehicles
                .filter(v => v.ownerCompanyId === req.user?.companyId)
                .map(v => v.id);
            const originalCount = expenses.length;
            expenses = expenses.filter(e => e.vehicleId && companyVehicleIds.includes(e.vehicleId));
            console.log('🏢 Company Owner Expenses Filter:', {
                userCompanyId: req.user.companyId,
                companyVehicleIds,
                originalCount,
                filteredCount: expenses.length
            });
        }
        res.json({
            success: true,
            data: expenses
        });
    }
    catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní nákladov'
        });
    }
});
// POST /api/expenses - Vytvorenie nového nákladu
router.post('/', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'create'), async (req, res) => {
    try {
        const { description, amount, date, vehicleId, company, category, note } = req.body;
        // Povinné je len description
        if (!description || description.toString().trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Popis nákladu je povinný'
            });
        }
        const createdExpense = await postgres_database_1.postgresDatabase.createExpense({
            description: description.toString().trim(),
            amount: amount && !isNaN(Number(amount)) ? Number(amount) : 0,
            date: date ? new Date(date) : new Date(),
            vehicleId: vehicleId || undefined,
            company: company && company.toString().trim() !== '' ? company.toString().trim() : 'Neznáma firma',
            category: category && ['service', 'insurance', 'fuel', 'other'].includes(category) ? category : 'other',
            note: note && note.toString().trim() !== '' ? note.toString().trim() : undefined
        });
        res.status(201).json({
            success: true,
            message: 'Náklad úspešne vytvorený',
            data: createdExpense
        });
    }
    catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri vytváraní nákladu'
        });
    }
});
// PUT /api/expenses/:id - Aktualizácia nákladu
router.put('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'update', { getContext: getExpenseContext }), async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, date, vehicleId, company, category, note } = req.body;
        // Povinné je len description
        if (!description || description.toString().trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Popis nákladu je povinný'
            });
        }
        const updatedExpense = {
            id,
            description: description.toString().trim(),
            amount: amount && !isNaN(Number(amount)) ? Number(amount) : 0,
            date: date ? new Date(date) : new Date(),
            vehicleId: vehicleId || undefined,
            company: company && company.toString().trim() !== '' ? company.toString().trim() : 'Neznáma firma',
            category: category && ['service', 'insurance', 'fuel', 'other'].includes(category) ? category : 'other',
            note: note && note.toString().trim() !== '' ? note.toString().trim() : undefined
        };
        await postgres_database_1.postgresDatabase.updateExpense(updatedExpense);
        res.json({
            success: true,
            message: 'Náklad úspešne aktualizovaný',
            data: updatedExpense
        });
    }
    catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri aktualizácii nákladu'
        });
    }
});
// DELETE /api/expenses/:id - Zmazanie nákladu
router.delete('/:id', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'delete', { getContext: getExpenseContext }), async (req, res) => {
    try {
        const { id } = req.params;
        await postgres_database_1.postgresDatabase.deleteExpense(id);
        res.json({
            success: true,
            message: 'Náklad úspešne zmazaný'
        });
    }
    catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri mazaní nákladu'
        });
    }
});
exports.default = router;
//# sourceMappingURL=expenses.js.map