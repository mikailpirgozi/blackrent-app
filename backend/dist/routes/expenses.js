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
            userId: req.user?.id,
            totalExpenses: expenses.length
        });
        // 🔐 NON-ADMIN USERS - filter podľa company permissions
        if (req.user?.role !== 'admin' && req.user) {
            const user = req.user; // TypeScript safe assignment
            const originalCount = expenses.length;
            // Získaj company access pre používateľa
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            // Získaj názvy firiem pre mapping
            const companies = await postgres_database_1.postgresDatabase.getCompanies();
            const allowedCompanyNames = companies
                .filter(c => allowedCompanyIds.includes(c.id))
                .map(c => c.name);
            // Filter expenses len pre povolené firmy
            expenses = expenses.filter(e => e.company && allowedCompanyNames.includes(e.company));
            console.log('🔐 Expenses Company Permission Filter:', {
                userId: user.id,
                allowedCompanyIds,
                allowedCompanyNames,
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
// 📊 CSV EXPORT - Export nákladov do CSV
router.get('/export/csv', auth_1.authenticateToken, async (req, res) => {
    try {
        let expenses = await postgres_database_1.postgresDatabase.getExpenses();
        // 🔐 NON-ADMIN USERS - filter podľa company permissions
        if (req.user?.role !== 'admin' && req.user) {
            const userCompanyAccess = await postgres_database_1.postgresDatabase.getUserCompanyAccess(req.user.id);
            const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            const vehicles = await postgres_database_1.postgresDatabase.getVehicles();
            expenses = expenses.filter(expense => {
                if (!expense.vehicleId)
                    return false;
                const vehicle = vehicles.find(v => v.id === expense.vehicleId);
                return vehicle && vehicle.ownerCompanyId && allowedCompanyIds.includes(vehicle.ownerCompanyId);
            });
        }
        // Vytvor CSV hlavičky
        const csvHeaders = [
            'ID',
            'Popis',
            'Suma',
            'Dátum',
            'Kategória',
            'Vozidlo ID',
            'Firma',
            'Poznámka',
            'Vytvorené'
        ];
        // Konvertuj náklady na CSV riadky
        const csvRows = expenses.map(expense => [
            expense.id,
            expense.description,
            expense.amount.toString(),
            expense.date ? expense.date.toISOString().split('T')[0] : '',
            expense.category || '',
            expense.vehicleId || '',
            expense.company || '',
            expense.note || '',
            '' // createdAt - nemáme v type
        ]);
        // Vytvor CSV obsah
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        // Nastav response headers pre CSV download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="naklady-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Cache-Control', 'no-cache');
        // Pridaj BOM pre správne zobrazenie diakritiky v Exceli
        res.send('\ufeff' + csvContent);
        console.log(`📊 CSV Export: ${expenses.length} nákladov exportovaných pre používateľa ${req.user?.username}`);
    }
    catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri exporte CSV'
        });
    }
});
// 📥 CSV IMPORT - Import nákladov z CSV
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
                if (fields.length < 4) {
                    errors.push({ row: i + 2, error: 'Nedostatok stĺpcov' });
                    continue;
                }
                const [, description, amount, date, category, vehicleId, company, note] = fields;
                if (!description || !amount) {
                    errors.push({ row: i + 2, error: 'Popis a suma sú povinné' });
                    continue;
                }
                const parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount)) {
                    errors.push({ row: i + 2, error: 'Neplatná suma' });
                    continue;
                }
                // Vytvor náklad
                const expenseData = {
                    description: description.trim(),
                    amount: parsedAmount,
                    date: date ? new Date(date) : new Date(),
                    category: (category?.trim() || 'general'),
                    vehicleId: vehicleId?.trim() || undefined,
                    company: company?.trim() || 'Neznáma firma',
                    note: note?.trim() || undefined
                };
                const createdExpense = await postgres_database_1.postgresDatabase.createExpense(expenseData);
                results.push({ row: i + 2, expense: createdExpense });
            }
            catch (error) {
                errors.push({
                    row: i + 2,
                    error: error.message || 'Chyba pri vytváraní nákladu'
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
        console.log(`📥 CSV Import: ${results.length} nákladov importovaných, ${errors.length} chýb`);
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
//# sourceMappingURL=expenses.js.map