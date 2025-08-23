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
        console.log('💰 EXPENSE CREATE START:', { body: req.body, user: req.user?.username });
        const { description, amount, date, vehicleId, company, category, note } = req.body;
        // Povinné je len description
        if (!description || description.toString().trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Popis nákladu je povinný'
            });
        }
        console.log('💰 EXPENSE CREATE DATA:', {
            description: description.toString().trim(),
            amount: amount && !isNaN(Number(amount)) ? Number(amount) : 0,
            date: date ? new Date(date) : new Date(),
            vehicleId: vehicleId || undefined,
            company: company && company.toString().trim() !== '' ? company.toString().trim() : 'Neznáma firma',
            category: category && ['service', 'insurance', 'fuel', 'other'].includes(category) ? category : 'other',
            note: note && note.toString().trim() !== '' ? note.toString().trim() : undefined
        });
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
        console.error('❌ EXPENSE CREATE ERROR:', error);
        console.error('❌ EXPENSE ERROR STACK:', error.stack);
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
        console.log(`📥 CSV Import: Spracovávam ${dataLines.length} riadkov`);
        for (let i = 0; i < dataLines.length; i++) {
            try {
                const line = dataLines[i].trim();
                if (!line)
                    continue;
                // Parsuj CSV riadok - flexibilne spracovanie
                const fields = [];
                let current = '';
                let inQuotes = false;
                for (let j = 0; j < line.length; j++) {
                    const char = line[j];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    }
                    else if (char === ',' && !inQuotes) {
                        fields.push(current.trim());
                        current = '';
                    }
                    else {
                        current += char;
                    }
                }
                fields.push(current.trim()); // Posledné pole
                console.log(`Riadok ${i + 2}: ${fields.length} polí:`, fields);
                // Mapovanie polí podľa vášho formátu: id, description, amount, date, category, company, vehicleId, vehicleLicensePlate, note
                const [id, description, amount, date, category, company, vehicleId, vehicleLicensePlate, note] = fields;
                // Kontrola povinných polí - len description je povinný
                if (!description || description.trim() === '') {
                    console.warn(`Riadok ${i + 2}: Preskakujem - chýba popis`);
                    continue;
                }
                // Parsuj sumu - ak nie je zadaná, nastav na 0
                let parsedAmount = 0;
                if (amount && amount.trim() !== '') {
                    parsedAmount = parseFloat(amount.replace(',', '.'));
                    if (isNaN(parsedAmount)) {
                        console.warn(`Riadok ${i + 2}: Neplatná suma "${amount}", nastavujem na 0`);
                        parsedAmount = 0;
                    }
                }
                // Parsuj dátum - formát MM/YYYY sa zmení na 01.MM.YYYY
                let parsedDate = new Date();
                if (date && date.trim()) {
                    const dateStr = date.trim();
                    // Formát MM/YYYY (napr. 01/2025) -> 01.01.2025
                    if (/^\d{1,2}\/\d{4}$/.test(dateStr)) {
                        const [month, year] = dateStr.split('/');
                        parsedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                        console.log(`Dátum ${dateStr} parsovaný ako ${parsedDate.toISOString().split('T')[0]}`);
                    }
                    // Formát DD.MM.YYYY (napr. 15.01.2025)
                    else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
                        const [day, month, year] = dateStr.split('.');
                        parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    }
                    // Štandardný ISO formát YYYY-MM-DD
                    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                        parsedDate = new Date(dateStr);
                    }
                    // Ak sa nepodarí parsovať, použij aktuálny dátum
                    else {
                        console.warn(`Nepodarilo sa parsovať dátum: ${dateStr}, používam aktuálny dátum`);
                        parsedDate = new Date();
                    }
                }
                // Mapuj kategóriu na správne hodnoty - flexibilne
                let mappedCategory = 'other';
                if (category && category.trim()) {
                    const cat = category.trim().toLowerCase();
                    if (cat.includes('palivo') || cat.includes('fuel') || cat === 'fuel') {
                        mappedCategory = 'fuel';
                    }
                    else if (cat.includes('servis') || cat.includes('service') || cat.includes('oprava') || cat === 'service') {
                        mappedCategory = 'service';
                    }
                    else if (cat.includes('poistenie') || cat.includes('insurance') || cat.includes('kasko') || cat.includes('pzp') || cat === 'insurance') {
                        mappedCategory = 'insurance';
                    }
                    else {
                        mappedCategory = 'other';
                    }
                }
                // Vytvor náklad - všetky polia sú voliteľné okrem description
                const expenseData = {
                    description: description.trim(),
                    amount: parsedAmount,
                    date: parsedDate,
                    category: mappedCategory,
                    vehicleId: (vehicleId && vehicleId.trim() !== '') ? vehicleId.trim() : undefined,
                    company: (company && company.trim() !== '') ? company.trim() : 'Neznáma firma',
                    note: (note && note.trim() !== '') ? note.trim() : undefined
                };
                console.log(`Vytváram náklad:`, expenseData);
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
// 🚀 BATCH IMPORT - Rýchly import nákladov (bulk operácia)
router.post('/batch-import', auth_1.authenticateToken, (0, permissions_1.checkPermission)('expenses', 'create'), async (req, res) => {
    try {
        console.log('📥 Starting batch expense import...');
        const { expenses } = req.body;
        if (!Array.isArray(expenses) || expenses.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Náklady sú povinné a musia byť v poli',
                message: 'Poskytnuté dáta nie sú validné'
            });
        }
        console.log(`📦 Processing ${expenses.length} expenses for batch import`);
        const results = [];
        const errors = [];
        let created = 0;
        let updated = 0;
        // Spracuj náklady v dávkach po 50
        const batchSize = 50;
        for (let i = 0; i < expenses.length; i += batchSize) {
            const batch = expenses.slice(i, i + batchSize);
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(expenses.length / batchSize)} (${batch.length} expenses)`);
            for (const expenseData of batch) {
                try {
                    // Validácia povinných polí
                    if (!expenseData.description || expenseData.description.trim() === '') {
                        errors.push({
                            expense: expenseData,
                            error: 'Popis nákladu je povinný'
                        });
                        continue;
                    }
                    // Príprava dát pre vytvorenie - hľadanie vozidla podľa názvu firmy
                    let processedVehicleId = undefined;
                    if (expenseData.vehicleId && expenseData.vehicleId.toString().trim() !== '') {
                        const vehicleIdStr = expenseData.vehicleId.toString().trim();
                        // Špeciálne firmy ktoré nemajú vozidlá (hlavné firmy, štatistiky, provízie)
                        const specialCompanies = ['Black Holding', 'BlackRent', 'Blackrent'];
                        const isSpecialCompany = specialCompanies.some(company => vehicleIdStr.toLowerCase().includes(company.toLowerCase()));
                        if (isSpecialCompany) {
                            console.log(`🏢 ŠPECIÁLNA FIRMA: "${vehicleIdStr}" - náklad bez vozidla (provízie/štatistiky)`);
                            processedVehicleId = undefined;
                        }
                        else if (!isNaN(parseInt(vehicleIdStr)) && isFinite(parseInt(vehicleIdStr))) {
                            // Ak je to číslo, použij priamo
                            processedVehicleId = parseInt(vehicleIdStr);
                        }
                        else {
                            // Ak nie je číslo, skús nájsť vozidlo podľa PRESNÉHO názvu firmy
                            try {
                                const vehicleQuery = `
                    SELECT id, company FROM vehicles 
                    WHERE company = $1
                    LIMIT 1
                  `;
                                const vehicleResult = await postgres_database_1.postgresDatabase.query(vehicleQuery, [vehicleIdStr]);
                                if (vehicleResult.rows.length > 0) {
                                    processedVehicleId = vehicleResult.rows[0].id;
                                    console.log(`✅ PRESNÁ ZHODA firmy "${vehicleIdStr}": ID ${processedVehicleId}`);
                                }
                                else {
                                    console.warn(`⚠️ ŽIADNA PRESNÁ ZHODA pre firmu "${vehicleIdStr}", náklad bude bez vozidla`);
                                    console.warn(`   (Musí sa zhodovať PRESNE - veľkosť písmen, čiarky, medzery, všetko!)`);
                                }
                            }
                            catch (error) {
                                console.warn(`⚠️ Chyba pri hľadaní vozidla pre firmu "${vehicleIdStr}":`, error instanceof Error ? error.message : String(error));
                            }
                        }
                    }
                    const processedExpense = {
                        description: expenseData.description.trim(),
                        amount: parseFloat(expenseData.amount) || 0,
                        date: expenseData.date ? new Date(expenseData.date) : new Date(),
                        category: expenseData.category || 'other',
                        vehicleId: processedVehicleId,
                        company: expenseData.company?.trim() || 'Neznáma firma',
                        note: expenseData.note?.trim() || undefined
                    };
                    console.log(`💰 Creating expense: ${processedExpense.description} - ${processedExpense.amount}€`);
                    const createdExpense = await postgres_database_1.postgresDatabase.createExpense(processedExpense);
                    results.push(createdExpense);
                    created++;
                }
                catch (error) {
                    console.error(`❌ Error creating expense:`, error.message);
                    errors.push({
                        expense: expenseData,
                        error: error.message || 'Chyba pri vytváraní nákladu'
                    });
                }
            }
            // Krátka pauza medzi dávkami
            if (i + batchSize < expenses.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        const processed = created + updated;
        const total = expenses.length;
        const errorsCount = errors.length;
        const successRate = total > 0 ? `${Math.round((processed / total) * 100)}%` : '0%';
        console.log(`🎉 Batch import completed: ${created} created, ${updated} updated, ${errorsCount} errors`);
        res.json({
            success: true,
            message: `Batch import dokončený: ${created} vytvorených, ${errorsCount} chýb`,
            data: {
                processed,
                total,
                created,
                updated,
                errorsCount,
                successRate,
                results: results.slice(0, 10), // Limit na prvých 10 výsledkov
                errors: errors.slice(0, 10) // Limit na prvých 10 chýb
            }
        });
    }
    catch (error) {
        console.error('❌ Batch expense import failed:', error);
        res.status(500).json({
            success: false,
            error: 'Batch import nákladov zlyhal',
            message: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.default = router;
//# sourceMappingURL=expenses.js.map