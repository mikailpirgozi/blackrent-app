import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import { getWebSocketService } from '../services/websocket-service';
import type { ApiResponse, Rental } from '../types';

const router: Router = Router();

// 🔍 CONTEXT FUNCTIONS
const getRentalContext = async (req: Request) => {
  const rentalId = req.params.id;
  if (!rentalId) return {};
  
  const rental = await postgresDatabase.getRental(rentalId);
  if (!rental || !rental.vehicleId) return {};
  
  // Získaj vehicle pre company context
  const vehicle = await postgresDatabase.getVehicle(rental.vehicleId);
  return {
    resourceCompanyId: vehicle?.ownerCompanyId,
    amount: rental.totalPrice
  };
};

// GET /api/rentals/paginated - Získanie prenájmov s pagination a filtrami
router.get('/paginated', 
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        search = '',
        dateFilter = 'all',
        dateFrom = '',
        dateTo = '',
        company = 'all',
        status = 'all',
        protocolStatus = 'all',
        paymentMethod = 'all',
        paymentStatus = 'all',
        vehicleBrand = 'all',
        priceMin = '',
        priceMax = '',
        sortBy = 'smart_priority',
        sortOrder = 'asc'
      } = req.query;

      // Debug: Rentals PAGINATED GET - params logged

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Získaj paginated rentals s filtrami
      const result = await postgresDatabase.getRentalsPaginated({
        limit: limitNum,
        offset,
        search: search as string,
        dateFilter: dateFilter as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        company: company as string,
        status: status as string,
        protocolStatus: protocolStatus as string,
        paymentMethod: paymentMethod as string,
        paymentStatus: paymentStatus as string,
        vehicleBrand: vehicleBrand as string,
        priceMin: priceMin as string,
        priceMax: priceMax as string,
        userId: req.user?.id,
        userRole: req.user?.role,
        sortBy: sortBy as 'created_at' | 'start_date' | 'end_date' | 'smart_priority',
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      // Debug: Found rentals count logged

      res.json({
        success: true,
        data: {
          rentals: result.rentals,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(result.total / limitNum),
            totalItems: result.total,
            hasMore: (pageNum * limitNum) < result.total,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get paginated rentals error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní prenájmov'
      });
    }
  }
);

// GET /api/rentals - Získanie všetkých prenájmov
router.get('/', 
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse<Rental[]>>) => {
    try {
      let rentals = await postgresDatabase.getRentals();
      
      // console.log('🚗 Rentals GET - user:', { role: req.user?.role, userId: req.user?.id, totalRentals: rentals.length });
      
      // 🎯 CLEAN SOLUTION: Rental má svoj company field - žiadny enrichment potrebný! ✅
      // console.log('🚀 CLEAN: Rentals already have company field from database');
      
      // 🔐 PERMISSION FILTERING - Apply company-based filtering for non-admin users
      if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user) {
        const user = req.user; // TypeScript safe assignment
        
        let allowedCompanyIds: string[] = [];
        let validCompanyNames: (string | null)[] = [];
        
        // ✅ PLATFORM FILTERING: Company admin with platformId sees all platform companies
        if (user.role === 'company_admin' && user.platformId) {
          console.log('🌐 RENTALS: Company admin - filtering by platform:', user.platformId);
          const companies = await postgresDatabase.getCompanies();
          const platformCompanies = companies.filter(c => c.platformId === user.platformId);
          allowedCompanyIds = platformCompanies.map(c => c.id);
          validCompanyNames = platformCompanies.map(c => c.name);
        } else {
          // Získaj company access pre používateľa
          const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user!.id);
          allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
          
          // Get allowed company names once
          const allowedCompanyNames = await Promise.all(
            allowedCompanyIds.map(async (companyId) => {
              try {
                return await postgresDatabase.getCompanyNameById(companyId);
              } catch (error) {
                return null;
              }
            })
          );
          validCompanyNames = allowedCompanyNames.filter(name => name !== null);
        }
        
        // Filter rentals based on (now corrected) historical ownership
        rentals = rentals.filter(rental => {
          if (rental.vehicle && rental.vehicle.ownerCompanyId) {
            return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
          } else if (rental.vehicle && rental.vehicle.company) {
            return validCompanyNames.includes(rental.vehicle.company);
          }
          return false; // If no vehicle or company info, don't show
        });
        
        // console.log('🔐 Rentals Permission Filter:', { userId: user!.id, allowedCompanyIds, filteredCount: rentals.length, filterType: 'historical_ownership_based' });
      }
      
      // 🔧 DEBUG: Log final response data (first rental)
      // console.log('🔍 FINAL RESPONSE DATA (first rental):');
      if (rentals.length > 0) {
        // console.log('  Response:', { customer: rentals[0].customerName, company: rentals[0].company, vehicleId: rentals[0].vehicleId, vehicle_exists: !!rentals[0].vehicle, vehicle_brand: rentals[0].vehicle?.brand || 'NULL', vehicle_json: JSON.stringify(rentals[0].vehicle, null, 2) });
      }

      res.json({
        success: true,
        data: rentals
      });
    } catch (error) {
      console.error('Get rentals error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní prenájmov'
      });
    }
  }
);

// GET /api/rentals/:id - Získanie konkrétneho prenájmu
router.get('/:id', 
  authenticateToken,
  checkPermission('rentals', 'read', { getContext: getRentalContext }),
  async (req: Request, res: Response<ApiResponse<Rental>>) => {
  try {
    const { id } = req.params;
    const rental = await postgresDatabase.getRental(id);
    
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
  } catch (error) {
    console.error('Get rental error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní prenájmu'
    });
  }
});

// POST /api/rentals - Vytvorenie nového prenájmu
router.post('/', 
  authenticateToken,
  checkPermission('rentals', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      vehicleId,
      customerId,
      customerName,
      startDate,
      endDate,
      totalPrice,
      commission,
      paymentMethod,
      discount,
      customCommission,
      extraKmCharge,
      paid,
      status,
      handoverPlace,
      confirmed,
      payments,
      history,
      orderNumber,
      deposit,
      allowedKilometers,
      dailyKilometers,
      extraKilometerRate,
      returnConditions,
      fuelLevel,
      odometer,
      returnFuelLevel,
      returnOdometer,
      actualKilometers,
      fuelRefillCost,
      handoverProtocolId,
      returnProtocolId,
      // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
      isFlexible,
      flexibleEndDate
    } = req.body;

    // 🔄 NOVÁ VALIDÁCIA: Pre flexibilné prenájmy endDate nie je povinné
    if (!customerName || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'Meno zákazníka a dátum začiatku sú povinné'
      });
    }

    // Pre flexibilné prenájmy nastavíme endDate automaticky ak nie je zadané
    let finalEndDate = endDate;
    if (isFlexible && !endDate) {
      // Pre flexibilné prenájmy nastavíme endDate na flexibleEndDate alebo +365 dní
      if (flexibleEndDate) {
        finalEndDate = flexibleEndDate;
      } else {
        const oneYearFromStart = new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000);
        finalEndDate = oneYearFromStart.toISOString();
      }
      // console.log('🔄 Flexibilný prenájom: Automaticky nastavený endDate na', finalEndDate);
    }

    if (!finalEndDate) {
      return res.status(400).json({
        success: false,
        error: 'Dátum ukončenia je povinný pre štandardné prenájmy'
      });
    }

    const createdRental = await postgresDatabase.createRental({
      vehicleId,
      customerId,
      customerName,
      startDate: startDate,
      endDate: finalEndDate,
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
      deposit,
      allowedKilometers,
      dailyKilometers,
      extraKilometerRate,
      returnConditions,
      fuelLevel,
      odometer,
      returnFuelLevel,
      returnOdometer,
      actualKilometers,
      fuelRefillCost,
      handoverProtocolId,
      returnProtocolId,
      // 🔄 OPTIMALIZOVANÉ: Flexibilné prenájmy (zjednodušené)
      isFlexible: isFlexible || false,
      flexibleEndDate: flexibleEndDate ? new Date(flexibleEndDate) : undefined
    });

    // 🔴 Real-time broadcast: Nový prenájom vytvorený
    const websocketService = getWebSocketService();
    if (websocketService) {
      const userName = req.user?.username || 'Neznámy užívateľ';
      websocketService.broadcastRentalCreated(createdRental, userName);
    }

    res.status(201).json({
      success: true,
      message: 'Prenájom úspešne vytvorený',
      data: createdRental
    });

  } catch (error) {
    console.error('Create rental error:', error);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      success: false,
      error: `Chyba pri vytváraní prenájmu: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// 🔄 POST /api/rentals/:id/clone - Klonovanie prenájmu na nasledujúce obdobie
router.post('/:id/clone', 
  authenticateToken,
  checkPermission('rentals', 'create'), // Potrebuje create permission pre nový prenájom
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    // console.log('🔄 RENTAL CLONE ENDPOINT HIT - ID:', req.params.id);
    const { id } = req.params;
    
    // Získaj originálny prenájom
    const originalRental = await postgresDatabase.getRental(id);
    if (!originalRental) {
      return res.status(404).json({
        success: false,
        error: 'Prenájom nebol nájdený'
      });
    }
    
    // console.log('📋 Original rental found:', { id: originalRental.id, startDate: originalRental.startDate, endDate: originalRental.endDate, customerName: originalRental.customerName });
    
    // Importuj utility funkcie (budeme ich potrebovať na backend)
    // Pre teraz použijeme jednoduchú logiku priamo tu
    const startDate = typeof originalRental.startDate === 'string' 
      ? new Date(originalRental.startDate.replace(' ', 'T'))
      : originalRental.startDate;
    const endDate = typeof originalRental.endDate === 'string'
      ? new Date(originalRental.endDate.replace(' ', 'T'))
      : originalRental.endDate;
    
    // Výpočet dĺžky prenájmu v dňoch
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    // Výpočet nového obdobia
    const newStartDate = new Date(endDate);
    
    let newEndDate: Date;
    let periodType: string;
    
    if (durationDays === 1) {
      // Denný prenájom - posun o deň
      periodType = 'daily';
      newStartDate.setDate(newStartDate.getDate() + 1);
      newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
    } else if (durationDays === 7) {
      // Týždenný prenájom - posun o týždeň
      periodType = 'weekly';
      newStartDate.setDate(newStartDate.getDate() + 1);
      newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + 7);
    } else if (durationDays >= 28 && durationDays <= 31) {
      // Mesačný prenájom - nový začiatok = pôvodný koniec, nový koniec = +1 mesiac
      periodType = 'monthly';
      // newStartDate už je nastavený na endDate (bez zmeny)
      
      const originalEndDay = endDate.getDate();
      const lastDayOfOriginalMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
      
      // Vypočítaj nový koniec - posun o mesiac od nového začiatku
      newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      
      if (originalEndDay === lastDayOfOriginalMonth) {
        // Posledný deň mesiaca - nastav na posledný deň nasledujúceho mesiaca
        const targetMonth = newStartDate.getMonth() + 1;
        const lastDayOfTargetMonth = new Date(newStartDate.getFullYear(), targetMonth + 1, 0).getDate();
        
        newEndDate = new Date(newStartDate);
        newEndDate.setDate(1); // Najprv nastav na 1. deň
        newEndDate.setMonth(targetMonth); // Potom nastav mesiac
        newEndDate.setDate(lastDayOfTargetMonth); // Nakonec nastav správny deň
      } else {
        // Zachovaj deň v mesiaci, čas zostáva rovnaký
        const maxDayInNewMonth = new Date(newEndDate.getFullYear(), newEndDate.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(originalEndDay, maxDayInNewMonth);
        newEndDate.setDate(targetDay);
      }
    } else {
      // Vlastná dĺžka - posun o deň a zachovaj dĺžku
      periodType = 'custom';
      newStartDate.setDate(newStartDate.getDate() + 1);
      newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + durationDays);
    }
    
    // console.log('📅 Calculated new period:', { periodType, originalDuration: durationDays, newStartDate: newStartDate.toISOString(), newEndDate: newEndDate.toISOString() });
    
    // console.log('🔍 Original rental data check:', { orderNumber: originalRental.orderNumber, dailyKilometers: originalRental.dailyKilometers, deposit: originalRental.deposit, paymentMethod: originalRental.paymentMethod });
    
    // Vytvor kópiu prenájmu s novými dátumami a resetovanými statusmi
    const clonedRental = {
      // Nové dátumy
      startDate: newStartDate,
      endDate: newEndDate,
      
      // Zachované údaje o zákazníkovi
      customerId: originalRental.customerId,
      customerName: originalRental.customerName,
      customerEmail: originalRental.customerEmail,
      customerPhone: originalRental.customerPhone,
      // customerAddress: originalRental.customerAddress, // Neexistuje v type
      
      // Zachované údaje o vozidle
      vehicleId: originalRental.vehicleId,
      vehicleVin: originalRental.vehicleVin,
      vehicleCode: originalRental.vehicleCode,
      vehicleName: originalRental.vehicleName,
      
      // Zachované cenové údaje
      totalPrice: originalRental.totalPrice,
      commission: originalRental.commission,
      discount: originalRental.discount,
      customCommission: originalRental.customCommission,
      extraKmCharge: originalRental.extraKmCharge,
      extraKilometerRate: originalRental.extraKilometerRate,
      
      // Zachované podmienky prenájmu
      deposit: originalRental.deposit,
      allowedKilometers: originalRental.allowedKilometers,
      dailyKilometers: originalRental.dailyKilometers,
      returnConditions: originalRental.returnConditions,
      
      // Zachované lokácie a nastavenia
      handoverPlace: originalRental.handoverPlace,
      pickupLocation: originalRental.pickupLocation,
      returnLocation: originalRental.returnLocation,
      paymentMethod: originalRental.paymentMethod,
      
      // Zachované flexibilné nastavenia
      isFlexible: originalRental.isFlexible,
      flexibleEndDate: originalRental.flexibleEndDate,
      
      // Zachované firemné údaje
      company: originalRental.company,
      
      // Zachované poznámky a dodatočné info
      // notes: originalRental.notes, // Neexistuje v type
      sourceType: originalRental.sourceType || 'manual',
      // reservationTime: originalRental.reservationTime, // Neexistuje v type
      // isPrivateRental: originalRental.isPrivateRental, // Neexistuje v type
      orderNumber: originalRental.orderNumber, // Číslo objednávky - KOPÍRUJ
      
      // RESETOVANÉ STATUSY A PROTOKOLY
      status: 'pending',
      paid: false,
      confirmed: false,
      approvalStatus: 'pending',
      
      // Resetované protokoly
      handoverProtocolId: null,
      returnProtocolId: null,
      
      // Resetované merania a náklady
      fuelLevel: null,
      odometer: null,
      returnFuelLevel: null,
      returnOdometer: null,
      actualKilometers: null,
      fuelRefillCost: null,
      damageCost: null,
      additionalCosts: null,
      finalPrice: null,
      
      // Resetované platby a história
      payments: [],
      history: []
    };
    
    // console.log('🔄 Creating cloned rental...');
    
    // console.log('🔍 Cloned rental data check:', { orderNumber: clonedRental.orderNumber, dailyKilometers: clonedRental.dailyKilometers, deposit: clonedRental.deposit, paymentMethod: clonedRental.paymentMethod });
    
    // Fix null values pre TypeScript - konvertuj null na undefined pre problematické polia
    const clonedRentalFixed = {
      ...clonedRental,
      fuelLevel: clonedRental.fuelLevel === null ? undefined : clonedRental.fuelLevel,
      odometer: clonedRental.odometer === null ? undefined : clonedRental.odometer,
      returnFuelLevel: clonedRental.returnFuelLevel === null ? undefined : clonedRental.returnFuelLevel,
      returnOdometer: clonedRental.returnOdometer === null ? undefined : clonedRental.returnOdometer,
      actualKilometers: clonedRental.actualKilometers === null ? undefined : clonedRental.actualKilometers,
      fuelRefillCost: clonedRental.fuelRefillCost === null ? undefined : clonedRental.fuelRefillCost,
      handoverProtocolId: clonedRental.handoverProtocolId === null ? undefined : clonedRental.handoverProtocolId,
      returnProtocolId: clonedRental.returnProtocolId === null ? undefined : clonedRental.returnProtocolId,
      approvalStatus: 'pending' as const // Reset approval status pre nový rental
    };
    
    // Vytvor nový prenájom v databáze
    const newRental = await postgresDatabase.createRental(clonedRentalFixed);
    
    // console.log('✅ Cloned rental created successfully:', { originalId: id, newId: newRental.id, periodType, newPeriod: `${newStartDate.toLocaleDateString('sk-SK')} - ${newEndDate.toLocaleDateString('sk-SK')}` });
    
    // Pošli WebSocket notifikáciu
    const wsService = getWebSocketService();
    if (wsService) {
      wsService.broadcastRentalUpdated(newRental, 'system', ['cloned']);
    }
    
    res.json({
      success: true,
      data: newRental,
      message: `Prenájom bol úspešne skopírovaný na obdobie ${newStartDate.toLocaleDateString('sk-SK')} - ${newEndDate.toLocaleDateString('sk-SK')} (${periodType})`
    });
    
  } catch (error) {
    console.error('❌ Clone rental error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri kopírovaní prenájmu: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// PUT /api/rentals/:id - Aktualizácia prenájmu (simplified for debugging)
router.put('/:id', 
  authenticateToken,
  checkPermission('rentals', 'update', { getContext: getRentalContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    // console.log('🚀 RENTAL UPDATE ENDPOINT HIT - ID:', req.params.id);
    const { id } = req.params;
    const updateData = req.body;

    // console.log('🔄 RENTAL UPDATE request:', { rentalId: id, userId: req.user?.id, updateFields: Object.keys(updateData), vehicleId: updateData.vehicleId, customerName: updateData.customerName, totalPrice: updateData.totalPrice, paid: updateData.paid, status: updateData.status, extraKilometerRate: updateData.extraKilometerRate, fullUpdateData: updateData });

    // Skontroluj, či prenájom existuje
    const existingRental = await postgresDatabase.getRental(id);
    if (!existingRental) {
      // console.log('❌ Rental not found:', id);
      return res.status(404).json({
        success: false,
        error: 'Prenájom nenájdený'
      });
    }

    // console.log('📋 Existing rental data:', { id: existingRental.id, vehicleId: existingRental.vehicleId, customerName: existingRental.customerName, hasVehicle: !!existingRental.vehicle });

    const updatedRental: Rental = {
      ...existingRental,
      ...updateData,
      id,
      startDate: updateData.startDate ? updateData.startDate : existingRental.startDate,
      endDate: updateData.endDate ? updateData.endDate : existingRental.endDate
    };

    // console.log('💾 Saving updated rental:', { id: updatedRental.id, vehicleId: updatedRental.vehicleId, customerName: updatedRental.customerName });

    await postgresDatabase.updateRental(updatedRental);

    // Znovu načítaj prenájom z databázy pre overenie
    const savedRental = await postgresDatabase.getRental(id);
    // console.log('✅ Rental saved successfully:', { id: savedRental?.id, vehicleId: savedRental?.vehicleId, hasVehicle: !!savedRental?.vehicle });

    // 🔴 Real-time broadcast: Prenájom aktualizovaný
    const websocketService = getWebSocketService();
    if (websocketService && savedRental) {
      const userName = req.user?.username || 'Neznámy užívateľ';
      websocketService.broadcastRentalUpdated(savedRental, userName);
    }

    res.json({
      success: true,
      message: 'Prenájom úspešne aktualizovaný',
      data: savedRental || updatedRental
    });

  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii prenájmu'
    });
  }
});

// DELETE /api/rentals/:id - Vymazanie prenájmu
router.delete('/:id', 
  authenticateToken,
  checkPermission('rentals', 'delete', { getContext: getRentalContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    // Skontroluj, či prenájom existuje
    const existingRental = await postgresDatabase.getRental(id);
    if (!existingRental) {
      return res.status(404).json({
        success: false,
        error: 'Prenájom nenájdený'
      });
    }

    await postgresDatabase.deleteRental(id);

    // 🔴 Real-time broadcast: Prenájom zmazaný
    const websocketService = getWebSocketService();
    if (websocketService) {
      const userName = req.user?.username || 'Neznámy užívateľ';
      websocketService.broadcastRentalDeleted(id, existingRental.customerName, userName);
    }

    res.json({
      success: true,
      message: 'Prenájom úspešne vymazaný'
    });

  } catch (error) {
    console.error('Delete rental error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní prenájmu'
    });
  }
});

// 📥 BATCH CSV IMPORT - Rýchly import viacerých prenájmov naraz
router.post('/batch-import', 
  authenticateToken,
  checkPermission('rentals', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      // console.log('📥 Starting batch rental import...');
      const { rentals } = req.body;

      if (!rentals || !Array.isArray(rentals)) {
        return res.status(400).json({
          success: false,
          error: 'Rentals array je povinný'
        });
      }

      // console.log(`📊 Processing ${rentals.length} rentals in batch...`);
      
      const results = [];
      const errors = [];
      let processed = 0;

      // Progress tracking
      const progressInterval = Math.max(1, Math.floor(rentals.length / 10));

      for (let i = 0; i < rentals.length; i++) {
        // Progress logging
        if (i % progressInterval === 0 || i === rentals.length - 1) {
          // console.log(`📊 Batch Import Progress: ${Math.round(((i + 1) / rentals.length) * 100)}% (${i + 1}/${rentals.length})`);
        }

        try {
          const rentalData = rentals[i];
          
          // 🔍 DEBUG: Log price data
          // console.log(`🔍 BATCH IMPORT PRICE DEBUG [${i}]:`, { customerName: rentalData.customerName, totalPrice: rentalData.totalPrice, typeOf: typeof rentalData.totalPrice });

          const createdRental = await postgresDatabase.createRental(rentalData);
          results.push({
            index: i,
            id: createdRental.id,
            customerName: rentalData.customerName,
            totalPrice: rentalData.totalPrice,
            action: 'created'
          });
          processed++;

        } catch (error) {
          console.error(`❌ Error processing rental ${i}:`, error);
          errors.push({ 
            index: i, 
            customerName: rentals[i]?.customerName || 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // console.log(`✅ Batch import completed: ${processed}/${rentals.length} successful`);

      res.json({
        success: true,
        data: {
          processed,
          total: rentals.length,
          results,
          errors,
          successRate: Math.round((processed / rentals.length) * 100)
        }
      });

    } catch (error) {
      console.error('Batch import error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri batch importe prenájmov'
      });
    }
  }
);

export default router; 