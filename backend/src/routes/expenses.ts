import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Expense, ApiResponse, ExpenseCategory } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/expenses/paginated - Paginated expenses with filters
router.get('/paginated', 
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        search = '',
        category = '',
        dateFrom = '',
        dateTo = '',
        minAmount = '',
        maxAmount = '',
        vehicleId = '',
        rentalId = ''
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      let expenses = await postgresDatabase.getExpenses();
      
      console.log('💰 Expenses PAGINATED GET - user:', { 
        role: req.user?.role, 
        userId: req.user?.id, 
        totalExpenses: expenses.length,
        page: pageNum,
        limit: limitNum
      });
      
      // 🔐 NON-ADMIN USERS - filter podľa company permissions
      if (req.user?.role !== 'admin' && req.user) {
        const user = req.user;
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user!.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        const companies = await postgresDatabase.getCompanies();
        const allowedCompanyNames = companies
          .filter(c => allowedCompanyIds.includes(c.id))
          .map(c => c.name);
        
        expenses = expenses.filter(e => 
          e.company && allowedCompanyNames.includes(e.company)
        );
      }

      // 🔍 Apply filters
      let filteredExpenses = [...expenses];

      // Search filter
      if (search) {
        const searchLower = search.toString().toLowerCase();
        filteredExpenses = filteredExpenses.filter(e => 
          e.description?.toLowerCase().includes(searchLower) ||
          e.company?.toLowerCase().includes(searchLower) ||
          e.note?.toLowerCase().includes(searchLower) ||
          e.category?.toLowerCase().includes(searchLower)
        );
      }

      // Category filter
      if (category) {
        filteredExpenses = filteredExpenses.filter(e => 
          e.category === category.toString()
        );
      }

      // Date filters
      if (dateFrom) {
        const fromDate = new Date(dateFrom.toString());
        filteredExpenses = filteredExpenses.filter(e => {
          if (!e.date) return false;
          const expenseDate = new Date(e.date);
          return expenseDate >= fromDate;
        });
      }

      if (dateTo) {
        const toDate = new Date(dateTo.toString());
        filteredExpenses = filteredExpenses.filter(e => {
          if (!e.date) return false;
          const expenseDate = new Date(e.date);
          return expenseDate <= toDate;
        });
      }

      // Amount filters
      if (minAmount) {
        const min = parseFloat(minAmount.toString());
        filteredExpenses = filteredExpenses.filter(e => 
          (e.amount || 0) >= min
        );
      }

      if (maxAmount) {
        const max = parseFloat(maxAmount.toString());
        filteredExpenses = filteredExpenses.filter(e => 
          (e.amount || 0) <= max
        );
      }

      // Vehicle filter
      if (vehicleId) {
        filteredExpenses = filteredExpenses.filter(e => 
          e.vehicleId === vehicleId.toString()
        );
      }

      // Rental filter
      if (rentalId) {
        filteredExpenses = filteredExpenses.filter(e => 
          e.rentalId === rentalId.toString()
        );
      }

      // Sort by date (newest first)
      filteredExpenses.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      // Calculate pagination
      const totalItems = filteredExpenses.length;
      const totalPages = Math.ceil(totalItems / limitNum);
      const hasMore = pageNum < totalPages;

      // Get paginated results
      const paginatedExpenses = filteredExpenses.slice(offset, offset + limitNum);

      console.log('📄 Paginated expenses:', {
        totalItems,
        currentPage: pageNum,
        totalPages,
        hasMore,
        resultsCount: paginatedExpenses.length
      });

      res.json({
        success: true,
        expenses: paginatedExpenses,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasMore,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      console.error('Get paginated expenses error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní výdavkov'
      });
    }
  });

// 🔍 CONTEXT FUNCTIONS
const getExpenseContext = async (req: Request) => {
  const expenseId = req.params.id;
  if (!expenseId) return {};
  
  const expenses = await postgresDatabase.getExpenses();
  const expense = expenses.find(e => e.id === expenseId);
  if (!expense || !expense.vehicleId) return {};
  
  // Získaj vehicle pre company context
  const vehicle = await postgresDatabase.getVehicle(expense.vehicleId);
  return {
    resourceCompanyId: vehicle?.ownerCompanyId,
    amount: expense.amount
  };
};

// GET /api/expenses - Získanie všetkých nákladov
router.get('/', 
  authenticateToken,
  checkPermission('expenses', 'read'),
  async (req: Request, res: Response<ApiResponse<Expense[]>>) => {
    try {
      let expenses = await postgresDatabase.getExpenses();
      
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
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user!.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        // Získaj názvy firiem pre mapping
        const companies = await postgresDatabase.getCompanies();
        const allowedCompanyNames = companies
          .filter(c => allowedCompanyIds.includes(c.id))
          .map(c => c.name);
        
        // Filter expenses len pre povolené firmy
        expenses = expenses.filter(e => 
          e.company && allowedCompanyNames.includes(e.company)
        );
        
        console.log('🔐 Expenses Company Permission Filter:', {
          userId: user!.id,
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
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní nákladov'
      });
    }
  });

// POST /api/expenses - Vytvorenie nového nákladu
router.post('/', 
  authenticateToken,
  checkPermission('expenses', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
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

    const createdExpense = await postgresDatabase.createExpense({
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

  } catch (error: any) {
    console.error('❌ EXPENSE CREATE ERROR:', error);
    console.error('❌ EXPENSE ERROR STACK:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní nákladu'
    });
  }
});

// PUT /api/expenses/:id - Aktualizácia nákladu
router.put('/:id', 
  authenticateToken,
  checkPermission('expenses', 'update', { getContext: getExpenseContext }),
  async (req: Request, res: Response<ApiResponse>) => {
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

    const updatedExpense: Expense = {
      id,
      description: description.toString().trim(),
      amount: amount && !isNaN(Number(amount)) ? Number(amount) : 0,
      date: date ? new Date(date) : new Date(),
      vehicleId: vehicleId || undefined,
      company: company && company.toString().trim() !== '' ? company.toString().trim() : 'Neznáma firma',
      category: category && ['service', 'insurance', 'fuel', 'other'].includes(category) ? category : 'other',
      note: note && note.toString().trim() !== '' ? note.toString().trim() : undefined
    };

    await postgresDatabase.updateExpense(updatedExpense);

    res.json({
      success: true,
      message: 'Náklad úspešne aktualizovaný',
      data: updatedExpense
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii nákladu'
    });
  }
});

// DELETE /api/expenses/:id - Zmazanie nákladu
router.delete('/:id', 
  authenticateToken,
  checkPermission('expenses', 'delete', { getContext: getExpenseContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteExpense(id);

    res.json({
      success: true,
      message: 'Náklad úspešne zmazaný'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri mazaní nákladu'
    });
  }
});

// 📊 CSV EXPORT - Export nákladov do CSV
router.get('/export/csv', 
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      let expenses = await postgresDatabase.getExpenses();
      
      // 🔐 NON-ADMIN USERS - filter podľa company permissions
      if (req.user?.role !== 'admin' && req.user) {
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(req.user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        const vehicles = await postgresDatabase.getVehicles();
        
        expenses = expenses.filter(expense => {
          if (!expense.vehicleId) return false;
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

    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri exporte CSV'
      });
    }
  }
);

// 📥 CSV IMPORT - Import nákladov z CSV
router.post('/import/csv',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
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
          if (!line) continue;

          // Parsuj CSV riadok - flexibilne spracovanie
          const fields = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              fields.push(current.trim());
              current = '';
            } else {
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
          let mappedCategory: ExpenseCategory = 'other';
          if (category && category.trim()) {
            const cat = category.trim().toLowerCase();
            if (cat.includes('palivo') || cat.includes('fuel') || cat === 'fuel') {
              mappedCategory = 'fuel';
            } else if (cat.includes('servis') || cat.includes('service') || cat.includes('oprava') || cat === 'service') {
              mappedCategory = 'service';
            } else if (cat.includes('poistenie') || cat.includes('insurance') || cat.includes('kasko') || cat.includes('pzp') || cat === 'insurance') {
              mappedCategory = 'insurance';
            } else {
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

          const createdExpense = await postgresDatabase.createExpense(expenseData);
          results.push({ row: i + 2, expense: createdExpense });

        } catch (error: any) {
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

    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri importe CSV'
      });
    }
  }
);

export default router; 