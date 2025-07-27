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
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        // Získaj všetky vehicles pre mapping
        const vehicles = await postgresDatabase.getVehicles();
        
        // Filter prenájmy len pre vozidlá firiem, ku ktorým má používateľ prístup
        rentals = rentals.filter(r => {
          if (!r.vehicleId) return false;
          
          const vehicle = vehicles.find(v => v.id === r.vehicleId);
          if (!vehicle) return false;
          
          // Ak má vozidlo nastavené owner_company_id, skontroluj to
          if (vehicle.ownerCompanyId && allowedCompanyIds.includes(vehicle.ownerCompanyId)) {
            return true;
          }
          
          // Fallback - textový matching company názvu
          if (!vehicle.ownerCompanyId && vehicle.company) {
            return userCompanyAccess.some(access => 
              access.companyName === vehicle.company || 
              access.companyName.includes(vehicle.company) ||
              vehicle.company.includes(access.companyName)
            );
          }
          
          return false;
        });
        
        console.log('🔐 Rentals Company Permission Filter:', {
          userId: user.id,
          allowedCompanyIds,
          originalCount,
          filteredCount: rentals.length
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

    // Skontroluj, či prenájom existuje
    const existingRental = await postgresDatabase.getRental(id);
    if (!existingRental) {
      return res.status(404).json({
        success: false,
        error: 'Prenájom nenájdený'
      });
    }

    const updatedRental: Rental = {
      ...existingRental,
      ...updateData,
      id,
      startDate: updateData.startDate ? new Date(updateData.startDate) : existingRental.startDate,
      endDate: updateData.endDate ? new Date(updateData.endDate) : existingRental.endDate
    };

    await postgresDatabase.updateRental(updatedRental);

    res.json({
      success: true,
      message: 'Prenájom úspešne aktualizovaný',
      data: updatedRental
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