import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Settlement, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/settlements - Získanie všetkých vyúčtovaní
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Settlement[]>>) => {
  try {
    const settlements = await postgresDatabase.getSettlements();
    res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní vyúčtovaní'
    });
  }
});

// GET /api/settlements/:id - Získanie konkrétneho vyúčtovania
router.get('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse<Settlement>>) => {
  try {
    const { id } = req.params;
    const settlement = await postgresDatabase.getSettlement(id);
    
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
  } catch (error) {
    console.error('Get settlement error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní vyúčtovania'
    });
  }
});

// POST /api/settlements - Vytvorenie nového vyúčtovania
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      company,
      period,
      totalIncome,
      totalExpenses,
      totalCommission,
      profit
    } = req.body;

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

    // Vypočítaj skutočné hodnoty z prenájmov a nákladov
    const rentals = await postgresDatabase.getRentals();
    const expenses = await postgresDatabase.getExpenses();
    
    console.log(`🔍 Settlement for company: ${company} from ${fromDate} to ${toDate}`);
    console.log(`📊 Total rentals in DB: ${rentals.length}`);
    console.log(`📊 Total expenses in DB: ${expenses.length}`);
    
    // Filtruj prenájmy pre dané obdobie a firmu
    const filteredRentals = rentals.filter(rental => {
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.endDate);
      const isInPeriod = (rentalStart >= fromDate && rentalStart <= toDate) || 
                        (rentalEnd >= fromDate && rentalEnd <= toDate) ||
                        (rentalStart <= fromDate && rentalEnd >= toDate);
      const hasMatchingCompany = rental.vehicle?.company === company;
      
      console.log(`🏠 Rental ${rental.id} - Vehicle company: "${rental.vehicle?.company}", Looking for: "${company}", Match: ${hasMatchingCompany}, Period: ${isInPeriod}`);
      
      return isInPeriod && hasMatchingCompany;
    });
    
    console.log(`✅ Filtered rentals: ${filteredRentals.length}`);
    
    // Filtruj náklady pre dané obdobie a firmu
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInPeriod = expenseDate >= fromDate && expenseDate <= toDate;
      const hasMatchingCompany = expense.company === company;
      
      console.log(`💰 Expense ${expense.id} - Company: "${expense.company}", Looking for: "${company}", Match: ${hasMatchingCompany}, Period: ${isInPeriod}`);
      
      return isInPeriod && hasMatchingCompany;
    });
    
    console.log(`✅ Filtered expenses: ${filteredExpenses.length}`);
    
    // Vypočítaj skutočné hodnoty
    const calculatedIncome = filteredRentals.reduce((sum, rental) => sum + rental.totalPrice, 0);
    const calculatedExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const calculatedCommission = filteredRentals.reduce((sum, rental) => {
      // Assuming commission is calculated from rental price - adjust as needed
      return sum + (rental.totalPrice * 0.1); // 10% commission example
    }, 0);
    const calculatedProfit = calculatedIncome - calculatedExpenses - calculatedCommission;

    const createdSettlement = await postgresDatabase.createSettlement({
      company,
      period: periodString,
      fromDate,
      toDate,
      totalIncome: calculatedIncome,
      totalExpenses: calculatedExpenses,
      commission: calculatedCommission,
      profit: calculatedProfit,
      summary: `Vyúčtovanie pre ${company} za obdobie ${periodString}`,
      rentals: filteredRentals,
      expenses: filteredExpenses
    });

    res.status(201).json({
      success: true,
      message: 'Vyúčtovanie úspešne vytvorené',
      data: createdSettlement
    });

  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri vytváraní vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// PUT /api/settlements/:id - Aktualizácia vyúčtovania
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Skontroluj, či vyúčtovanie existuje
    const existingSettlement = await postgresDatabase.getSettlement(id);
    if (!existingSettlement) {
      return res.status(404).json({
        success: false,
        error: 'Vyúčtovanie nenájdené'
      });
    }

    const updatedSettlement = await postgresDatabase.updateSettlement(id, updateData);

    res.json({
      success: true,
      message: 'Vyúčtovanie úspešne aktualizované',
      data: updatedSettlement
    });

  } catch (error) {
    console.error('Update settlement error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri aktualizácii vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// DELETE /api/settlements/:id - Vymazanie vyúčtovania
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    // Skontroluj, či vyúčtovanie existuje
    const existingSettlement = await postgresDatabase.getSettlement(id);
    if (!existingSettlement) {
      return res.status(404).json({
        success: false,
        error: 'Vyúčtovanie nenájdené'
      });
    }

    await postgresDatabase.deleteSettlement(id);

    res.json({
      success: true,
      message: 'Vyúčtovanie úspešne vymazané'
    });

  } catch (error) {
    console.error('Delete settlement error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri vymazávaní vyúčtovania: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// GET /api/settlements/:id/pdf - Export vyúčtovania do PDF
router.get('/:id/pdf', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🎯 PDF export request pre settlement ID: ${id}`);

    // Získaj vyúčtovanie z databázy
    const settlement = await postgresDatabase.getSettlement(id);
    if (!settlement) {
      console.error(`❌ Settlement s ID ${id} nenájdené`);
      return res.status(404).json({
        success: false,
        error: 'Vyúčtovanie nenájdené'
      });
    }

    console.log(`✅ Settlement načítané: ${settlement.company}, obdobie: ${settlement.period?.from} - ${settlement.period?.to}`);

    // Použij PDFLib generátor (rovnaký ako protokoly)
    const { PDFLibGenerator } = await import('../utils/pdf-lib-generator');
    
    // Vytvor PDF generátor a vygeneruj PDF
    const pdfGenerator = new PDFLibGenerator();
    const pdfBuffer = await pdfGenerator.generateSettlement(settlement);

    console.log(`✅ PDF vygenerované úspešne, veľkosť: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);

    // Nastav správne headers pre PDF download
    const filename = `vyuctovanie_${settlement.company?.replace(/[^a-zA-Z0-9]/g, '_')}_${settlement.id.slice(-8)}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Pošli PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Settlement PDF export error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri generovaní PDF: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

export default router; 