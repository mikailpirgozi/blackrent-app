import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Rental, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';

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
      
      // 🔐 NON-ADMIN USERS - filter podľa company permissions
      if (req.user?.role !== 'admin' && req.user) {
        const user = req.user; // TypeScript safe assignment
        const originalCount = rentals.length;
        
        // Získaj company access pre používateľa
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user!.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        // Získaj všetky vehicles pre mapping
        // ⚡⚡ SUPER OPTIMIZED: Bulk ownership checking pre rental filtering
        console.log(`🚀 BULK: Filtering ${rentals.length} rentals with historical ownership...`);
        const rentalBulkStartTime = Date.now();
        
        // 1. Filter rentals with valid vehicle and date first
        const validRentals = rentals.filter(rental => rental.vehicleId && rental.startDate);
        console.log(`📊 Valid rentals for ownership check: ${validRentals.length}/${rentals.length}`);
        
        let filteredRentals = [];
        
        if (validRentals.length === 0) {
          console.log(`✅ No valid rentals for ownership checking`);
        } else {
          // 2. Bulk ownership checking
          const ownershipChecks = validRentals.map(rental => ({
            vehicleId: rental.vehicleId!,
            timestamp: new Date(rental.startDate)
          }));
          
          // 3. Get allowed company names once
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
          
          const [historicalOwners, currentOwners] = await Promise.all([
            postgresDatabase.getBulkVehicleOwnersAtTime(ownershipChecks),
            postgresDatabase.getBulkCurrentVehicleOwners(validRentals.map(r => r.vehicleId!))
          ]);
          
          // 4. Create lookup maps
          const historicalOwnerMap = new Map();
          historicalOwners.forEach(result => {
            const key = `${result.vehicleId}-${result.timestamp.toISOString()}`;
            historicalOwnerMap.set(key, result.owner);
          });
          
          const currentOwnerMap = new Map();
          currentOwners.forEach(result => {
            currentOwnerMap.set(result.vehicleId, result.owner);
          });
          
          // 5. Filter rentals using bulk data
          for (const rental of validRentals) {
            const rentalStart = new Date(rental.startDate);
            const historicalKey = `${rental.vehicleId}-${rentalStart.toISOString()}`;
            const historicalOwner = historicalOwnerMap.get(historicalKey);
            
            if (historicalOwner && allowedCompanyIds.includes(historicalOwner.ownerCompanyId)) {
              filteredRentals.push(rental);
            } else {
              // FALLBACK: Current ownership
              const currentOwner = currentOwnerMap.get(rental.vehicleId);
              if (currentOwner && allowedCompanyIds.includes(currentOwner.ownerCompanyId)) {
                console.log(`📝 Using current ownership for rental ${rental.id} (historical not found)`);
                filteredRentals.push(rental);
              } else {
                // FALLBACK 2: Legacy company matching
                const vehicleCompany = rental.vehicle?.company;
                if (vehicleCompany && validCompanyNames.includes(vehicleCompany)) {
                  console.log(`📝 Using legacy company matching for rental ${rental.id}`);
                  filteredRentals.push(rental);
                }
              }
            }
          }
          
          const rentalBulkTime = Date.now() - rentalBulkStartTime;
          console.log(`⚡ BULK: Filtered ${filteredRentals.length} rentals in ${rentalBulkTime}ms (vs ~${validRentals.length * 100}ms individually)`);
        }
        
        // Include invalid rentals without ownership checking (emergency fallback)
        const invalidRentals = rentals.filter(rental => !rental.vehicleId || !rental.startDate);
        if (invalidRentals.length > 0) {
          console.log(`🚨 Including ${invalidRentals.length} invalid rentals as emergency fallback`);
          filteredRentals = [...filteredRentals, ...invalidRentals];
        }
        
        rentals = filteredRentals;
        
        console.log('🔐 Rentals Historical Ownership Filter:', {
          userId: user!.id,
          allowedCompanyIds,
          originalCount,
          filteredCount: rentals.length,
          filterType: 'historical_ownership'
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
});

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
      returnProtocolId
    } = req.body;

    if (!customerName || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const createdRental = await postgresDatabase.createRental({
      vehicleId,
      customerId,
      customerName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
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
      returnProtocolId
    });

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

// PUT /api/rentals/:id - Aktualizácia prenájmu
router.put('/:id', 
  authenticateToken,
  checkPermission('rentals', 'update', { getContext: getRentalContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('🔄 Rental UPDATE request:', {
      rentalId: id,
      userId: req.user?.id,
      updateFields: Object.keys(updateData),
      vehicleId: updateData.vehicleId,
      customerName: updateData.customerName
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