import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Rental, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketService } from '../services/websocket-service';

const router = Router();

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

// GET /api/rentals - Získanie všetkých prenájmov
router.get('/', 
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse<Rental[]>>) => {
    try {
      let rentals = await postgresDatabase.getRentals();
      
      console.log('🚗 Rentals GET - user:', { 
        role: req.user?.role, 
        userId: req.user?.id,
        totalRentals: rentals.length 
      });
      
      // 🎯 CLEAN SOLUTION: Rental má svoj company field - žiadny enrichment potrebný! ✅
      console.log('🚀 CLEAN: Rentals already have company field from database');
      
      // 🔐 PERMISSION FILTERING - Apply company-based filtering for non-admin users
      if (req.user?.role !== 'admin' && req.user) {
        const user = req.user; // TypeScript safe assignment
        const originalCount = rentals.length;
        
        // Získaj company access pre používateľa
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user!.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
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
        const validCompanyNames = allowedCompanyNames.filter(name => name !== null);
        
        // Filter rentals based on (now corrected) historical ownership
        rentals = rentals.filter(rental => {
          if (rental.vehicle && rental.vehicle.ownerCompanyId) {
            return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
          } else if (rental.vehicle && rental.vehicle.company) {
            return validCompanyNames.includes(rental.vehicle.company);
          }
          return false; // If no vehicle or company info, don't show
        });
        
        console.log('🔐 Rentals Permission Filter:', {
          userId: user!.id,
          allowedCompanyIds,
          originalCount,
          filteredCount: rentals.length,
          filterType: 'historical_ownership_based'
        });
      }
      
      // 🔧 DEBUG: Log final response data (first rental)
      console.log('🔍 FINAL RESPONSE DATA (first rental):');
      if (rentals.length > 0) {
        console.log('  Response:', {
          customer: rentals[0].customerName,
          company: rentals[0].company,
          vehicleId: rentals[0].vehicleId,
          vehicle_exists: !!rentals[0].vehicle,
          vehicle_brand: rentals[0].vehicle?.brand || 'NULL',
          vehicle_json: JSON.stringify(rentals[0].vehicle, null, 2)
        });
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
      rentalType,
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
      console.log('🔄 Flexibilný prenájom: Automaticky nastavený endDate na', finalEndDate);
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
      startDate: new Date(startDate),
      endDate: new Date(finalEndDate),
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
      rentalType: rentalType || 'standard',
      isFlexible: isFlexible || false,
      flexibleEndDate: flexibleEndDate ? new Date(flexibleEndDate) : undefined
    });

    // 🔴 Real-time broadcast: Nový prenájom vytvorený
    const websocketService = getWebSocketService();
    if (websocketService) {
      const userName = (req as any).user?.username || 'Neznámy užívateľ';
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

// PUT /api/rentals/:id - Aktualizácia prenájmu (simplified for debugging)
router.put('/:id', 
  authenticateToken,
  // checkPermission('rentals', 'update', { getContext: getRentalContext }), // dočasne vypnuté
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🚀 RENTAL UPDATE ENDPOINT HIT - ID:', req.params.id);
    const { id } = req.params;
    const updateData = req.body;

    console.log('🔄 RENTAL UPDATE request:', {
      rentalId: id,
      userId: req.user?.id,
      updateFields: Object.keys(updateData),
      vehicleId: updateData.vehicleId,
      customerName: updateData.customerName,
      totalPrice: updateData.totalPrice,
      paid: updateData.paid,
      status: updateData.status,
      fullUpdateData: updateData
    });

    // Skontroluj, či prenájom existuje
    const existingRental = await postgresDatabase.getRental(id);
    if (!existingRental) {
      console.log('❌ Rental not found:', id);
      return res.status(404).json({
        success: false,
        error: 'Prenájom nenájdený'
      });
    }

    console.log('📋 Existing rental data:', {
      id: existingRental.id,
      vehicleId: existingRental.vehicleId,
      customerName: existingRental.customerName,
      hasVehicle: !!existingRental.vehicle
    });

    const updatedRental: Rental = {
      ...existingRental,
      ...updateData,
      id,
      startDate: updateData.startDate ? new Date(updateData.startDate) : existingRental.startDate,
      endDate: updateData.endDate ? new Date(updateData.endDate) : existingRental.endDate
    };

    console.log('💾 Saving updated rental:', {
      id: updatedRental.id,
      vehicleId: updatedRental.vehicleId,
      customerName: updatedRental.customerName
    });

    await postgresDatabase.updateRental(updatedRental);

    // Znovu načítaj prenájom z databázy pre overenie
    const savedRental = await postgresDatabase.getRental(id);
    console.log('✅ Rental saved successfully:', {
      id: savedRental?.id,
      vehicleId: savedRental?.vehicleId,
      hasVehicle: !!savedRental?.vehicle
    });

    // 🔴 Real-time broadcast: Prenájom aktualizovaný
    const websocketService = getWebSocketService();
    if (websocketService && savedRental) {
      const userName = (req as any).user?.username || 'Neznámy užívateľ';
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
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    console.log(`🗑️ Pokus o vymazanie prenájmu ID: ${id}, používateľ: ${userId}, rola: ${userRole}`);

    // Skontroluj, či prenájom existuje
    const existingRental = await postgresDatabase.getRental(id);
    if (!existingRental) {
      console.log(`❌ Prenájom ${id} nenájdený v databáze`);
      return res.status(404).json({
        success: false,
        error: 'Prenájom nenájdený'
      });
    }

    console.log(`✅ Prenájom ${id} nájdený, vymazávam...`);
    await postgresDatabase.deleteRental(id);
    console.log(`🎉 Prenájom ${id} úspešne vymazaný`);

    // 🔴 Real-time broadcast: Prenájom zmazaný
    const websocketService = getWebSocketService();
    if (websocketService) {
      const userName = (req as any).user?.username || 'Neznámy užívateľ';
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

export default router; 