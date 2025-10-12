import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse, Settlement } from '../types';

const router: Router = Router();

// GET /api/settlements - Získanie všetkých vyúčtovaní
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Settlement[]>>) => {
  try {
    let settlements = await postgresDatabase.getSettlements();
    
    console.log('💰 Settlements GET - user:', { 
      role: req.user?.role, 
      userId: req.user?.id,
      username: req.user?.username,
      platformId: req.user?.platformId,
      totalSettlements: settlements.length 
    });
    
    // 🔐 PLATFORM FILTERING - Apply to ALL users with platformId (including admin role, except super_admin)
    if (req.user && req.user.platformId && req.user.role !== 'super_admin') {
      const user = req.user;
      const originalCount = settlements.length;
      
      // ✅ PLATFORM FILTERING: Any user with platformId sees only their platform settlements
      console.log('🌐 SETTLEMENTS: Platform filtering - user:', { username: user.username, role: user.role, platformId: user.platformId });
      
      // Get all companies for this platform
      const companies = await postgresDatabase.getCompanies();
      const platformCompanies = companies.filter(c => c.platformId === user.platformId);
      const validCompanyNames = platformCompanies.map(c => c.name);
      
      console.log('🔍 SETTLEMENTS: Platform companies:', { platformId: user.platformId, companyCount: platformCompanies.length, companyNames: validCompanyNames });
      
      // 🚨 STRICT FILTERING: Only show settlements where company can be determined AND matches platform
      settlements = settlements.filter(s => {
        // ❌ REJECT: No company data
        if (!s.company) {
          console.log('🚫 SETTLEMENTS: Rejected settlement (no company):', s.id);
          return false;
        }
        
        // ✅ ACCEPT: company matches platform
        if (validCompanyNames.includes(s.company)) {
          return true;
        }
        
        // ❌ REJECT: company doesn't match platform
        console.log('🚫 SETTLEMENTS: Rejected settlement (wrong platform):', { id: s.id, company: s.company, expectedCompanies: validCompanyNames });
        return false;
      });
      
      console.log('🔐 SETTLEMENTS Platform Filter:', {
        userId: user.id,
        username: user.username,
        role: user.role,
        platformId: user.platformId,
        validCompanyNames,
        originalCount,
        filteredCount: settlements.length
      });
    } else if (req.user && req.user.role === 'super_admin') {
      console.log('🌐 SETTLEMENTS: Super Admin - showing ALL settlements (no platform filter)');
    }
    
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
router.post('/', 
  authenticateToken, 
  checkPermission('settlements', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      company,
      period
      // totalIncome, totalExpenses, commission, profit - calculated from DB data
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
    
    // 🔧 SIMPLIFIED: Direct filtering using vehicle.company from getRentals
    console.log(`🚀 SIMPLE: Filtering ${rentals.length} rentals for settlement...`);
    const filterStartTime = Date.now();
    
    // Filter by period and company
    const filteredRentals = rentals.filter(rental => {
      if (!rental.vehicleId) return false;
      
      // 1. Check if rental STARTS in period (FIXED: only include rentals that START in the period)
      const rentalStart = new Date(rental.startDate);
      const isInPeriod = rentalStart >= fromDate && rentalStart <= toDate;
      
      if (!isInPeriod) return false;
      
      // 2. Check company match using vehicle.company (from getRentals JOIN)
      const vehicleCompany = rental.vehicle?.company;
      const rentalCompany = rental.company; // Historical snapshot
      
      const companyMatch = vehicleCompany === company || rentalCompany === company;
      
      if (companyMatch) {
        console.log(`✅ Rental ${rental.id} - Company match: ${vehicleCompany || rentalCompany} (customer: ${rental.customerName})`);
      }
      
      return companyMatch;
    });
    
    const filterTime = Date.now() - filterStartTime;
    console.log(`⚡ SIMPLE: Filtered ${filteredRentals.length}/${rentals.length} rentals in ${filterTime}ms`);

    
    // Filtruj náklady pre dané obdobie a firmu
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInPeriod = expenseDate >= fromDate && expenseDate <= toDate;
      const hasMatchingCompany = expense.company === company;
      
      console.log(`💰 Expense ${expense.id} - Company: "${expense.company}", Looking for: "${company}", Match: ${hasMatchingCompany}, Period: ${isInPeriod}`);
      
      return isInPeriod && hasMatchingCompany;
    });
    
    console.log(`✅ Filtered expenses: ${filteredExpenses.length}`);
    
    // 🔥 NEW LOGIC: Calculate based on payment method
    // Income = only rentals where I received money (VRP, cash, bank_transfer)
    // For "direct_to_owner" - owner already has money, I only receive commission
    
    const rentalsIReceived = filteredRentals.filter(r => 
      r.paymentMethod === 'vrp' || 
      r.paymentMethod === 'cash' || 
      r.paymentMethod === 'bank_transfer'
    );
    
    const rentalsOwnerReceived = filteredRentals.filter(r => 
      r.paymentMethod === 'direct_to_owner'
    );
    
    // Calculate income (money I actually received)
    const calculatedIncome = rentalsIReceived.reduce((sum, rental) => sum + rental.totalPrice, 0);
    
    // Calculate expenses
    const calculatedExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate all commissions
    const calculatedCommission = filteredRentals.reduce((sum, rental) => sum + rental.commission, 0);
    
    // Calculate amount to pay/receive from owner
    // rentalsIReceived: I pay owner (income - commissions from those rentals)
    // rentalsOwnerReceived: Owner pays me (commissions from those rentals)
    const commissionsFromMyRentals = rentalsIReceived.reduce((sum, rental) => sum + rental.commission, 0);
    const commissionsFromOwnerRentals = rentalsOwnerReceived.reduce((sum, rental) => sum + rental.commission, 0);
    
    const totalToOwner = (calculatedIncome - commissionsFromMyRentals) - commissionsFromOwnerRentals;
    // Positive = I pay owner, Negative = Owner pays me
    
    // Calculate profit (always sum of all commissions)
    const calculatedProfit = calculatedCommission;
    
    console.log(`📊 Settlement calculation:
      - Rentals I received: ${rentalsIReceived.length} (${calculatedIncome}€)
      - Rentals owner received: ${rentalsOwnerReceived.length}
      - Total income: ${calculatedIncome}€
      - Total commissions: ${calculatedCommission}€
      - To/From owner: ${totalToOwner}€ (${totalToOwner >= 0 ? 'I pay owner' : 'Owner pays me'})
      - My profit: ${calculatedProfit}€
    `);

    const createdSettlement = await postgresDatabase.createSettlement({
      company,
      period: periodString,
      fromDate,
      toDate,
      totalIncome: calculatedIncome,
      totalExpenses: calculatedExpenses,
      commission: calculatedCommission,
      totalToOwner: totalToOwner,
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
router.put('/:id', 
  authenticateToken, 
  checkPermission('settlements', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
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
router.delete('/:id', 
  authenticateToken, 
  checkPermission('settlements', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
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