import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Vehicle, ApiResponse, VehicleStatus } from '../types';
import { authenticateToken, requireRole } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 🔍 CONTEXT FUNCTIONS
const getVehicleContext = async (req: Request) => {
  const vehicleId = req.params.id;
  if (!vehicleId) return {};
  
  const vehicle = await postgresDatabase.getVehicle(vehicleId);
  return {
    resourceOwnerId: vehicle?.assignedMechanicId,
    resourceCompanyId: vehicle?.ownerCompanyId
  };
};

// GET /api/vehicles - Získanie všetkých vozidiel
router.get('/', 
  authenticateToken, 
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response<ApiResponse<Vehicle[]>>) => {
    try {
      let vehicles = await postgresDatabase.getVehicles();
      
      console.log('🚗 Vehicles GET - user:', { 
        role: req.user?.role, 
        userId: req.user?.id,
        totalVehicles: vehicles.length 
      });
      
      // 🔐 NON-ADMIN USERS - filter podľa company permissions
      if (req.user?.role !== 'admin' && req.user) {
        const user = req.user; // TypeScript safe assignment
        const originalCount = vehicles.length;
        
        // Získaj company access pre používateľa
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user!.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        // Filter vozidlá len pre firmy, ku ktorým má používateľ prístup
        // ✅ Všetky vozidlá majú teraz owner_company_id - používame len to
        vehicles = vehicles.filter(v => {
          return v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId);
        });
        
        console.log('🔐 Company Permission Filter:', {
          userId: user!.id,
          allowedCompanyIds,
          userCompanyAccess: userCompanyAccess.map(a => ({ id: a.companyId, name: a.companyName })),
          originalCount,
          filteredCount: vehicles.length,
          sampleResults: vehicles.slice(0, 3).map(v => ({ 
            licensePlate: v.licensePlate, 
            company: v.company, 
            ownerCompanyId: v.ownerCompanyId 
          }))
        });
      }
      
      res.json({
        success: true,
        data: vehicles
      });
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní vozidiel'
      });
    }
  }
);

// 🧪 TEST endpoint pre CSV funkcionalitu
router.get('/test-csv', 
  authenticateToken,
  async (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'CSV endpointy sú dostupné',
      timestamp: new Date().toISOString()
    });
  }
);

// GET /api/vehicles/:id - Získanie konkrétneho vozidla
router.get('/:id', 
  authenticateToken,
  checkPermission('vehicles', 'read', { getContext: getVehicleContext }),
  async (req: Request, res: Response<ApiResponse<Vehicle>>) => {
    try {
      const { id } = req.params;
      const vehicle = await postgresDatabase.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vozidlo nenájdené'
        });
      }

      res.json({
        success: true,
        data: vehicle
      });
    } catch (error) {
      console.error('Get vehicle error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní vozidla'
      });
    }
  }
);

// POST /api/vehicles - Vytvorenie nového vozidla
router.post('/', 
  authenticateToken,
  checkPermission('vehicles', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { brand, model, licensePlate, company, pricing, commission, status, year } = req.body;

    if (!brand || !model || !company) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const createdVehicle = await postgresDatabase.createVehicle({
      brand,
      model,
      year: year || 2024,
      licensePlate: licensePlate || '',
      company,
      pricing: pricing || [],
      commission: commission || { type: 'percentage', value: 0 },
      status: status || 'available'
    });

    res.status(201).json({
      success: true,
      message: 'Vozidlo úspešne vytvorené',
      data: createdVehicle
    });

  } catch (error) {
    console.error('Create vehicle error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Chyba pri vytváraní vozidla';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// PUT /api/vehicles/:id - Aktualizácia vozidla
router.put('/:id', 
  authenticateToken,
  checkPermission('vehicles', 'update', { getContext: getVehicleContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { brand, model, licensePlate, company, pricing, commission, status, year, stk } = req.body;

    // Skontroluj, či vozidlo existuje
    const existingVehicle = await postgresDatabase.getVehicle(id);
    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vozidlo nenájdené'
      });
    }

    const updatedVehicle: Vehicle = {
      id,
      brand: brand || existingVehicle.brand,
      model: model || existingVehicle.model,
      licensePlate: licensePlate || existingVehicle.licensePlate,
      company: company || existingVehicle.company,
      pricing: pricing || existingVehicle.pricing,
      commission: commission || existingVehicle.commission,
      status: status || existingVehicle.status,
      year: year !== undefined ? year : existingVehicle.year,
      stk: stk !== undefined ? (stk ? new Date(stk) : undefined) : existingVehicle.stk,
      ownerCompanyId: existingVehicle.ownerCompanyId,
      assignedMechanicId: existingVehicle.assignedMechanicId,
      createdAt: existingVehicle.createdAt
    };

    await postgresDatabase.updateVehicle(updatedVehicle);

    res.json({
      success: true,
      message: 'Vozidlo úspešne aktualizované',
      data: updatedVehicle
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii vozidla'
    });
  }
});

// DELETE /api/vehicles/:id - Vymazanie vozidla
router.delete('/:id', 
  authenticateToken,
  checkPermission('vehicles', 'delete', { getContext: getVehicleContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    // Skontroluj, či vozidlo existuje
    const existingVehicle = await postgresDatabase.getVehicle(id);
    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vozidlo nenájdené'
      });
    }

    await postgresDatabase.deleteVehicle(id);

    res.json({
      success: true,
      message: 'Vozidlo úspešne vymazané'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní vozidla'
    });
  }
});

// 🔧 ADMIN TOOL - Priradenie vozidiel k firme
router.post('/assign-to-company', 
  authenticateToken, 
  requireRole(['admin']),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { vehicleIds, companyId } = req.body;

      if (!vehicleIds || !Array.isArray(vehicleIds) || !companyId) {
        return res.status(400).json({
          success: false,
          error: 'vehicleIds (array) a companyId sú povinné'
        });
      }

      // Verify company exists
      const companies = await postgresDatabase.getCompanies();
      const company = companies.find(c => c.id === companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Firma nenájdená'
        });
      }

      // Update vehicles using database method
      await postgresDatabase.assignVehiclesToCompany(vehicleIds, companyId);

      console.log(`🏢 Assigned ${vehicleIds.length} vehicles to company ${company.name}`);

      res.json({
        success: true,
        message: `${vehicleIds.length} vozidiel úspešne priradených k firme ${company.name}`,
        data: {
          companyId,
          companyName: company.name,
          assignedVehicleIds: vehicleIds
        }
      });

    } catch (error) {
      console.error('Assign vehicles to company error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri priradzovaní vozidiel'
      });
    }
  }
);

// 📊 CSV EXPORT - Export vozidiel do CSV
router.get('/export/csv', 
  authenticateToken,
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response) => {
    try {
      let vehicles = await postgresDatabase.getVehicles();
      
      // 🔐 NON-ADMIN USERS - filter podľa company permissions
      if (req.user?.role !== 'admin' && req.user) {
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(req.user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        vehicles = vehicles.filter(v => v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId));
      }

      // Vytvor CSV hlavičky
      const csvHeaders = [
        'ID',
        'Značka',
        'Model', 
        'ŠPZ',
        'Firma',
        'Rok',
        'Status',
        'STK',
        'Vytvorené'
      ];

      // Konvertuj vozidlá na CSV riadky
      const csvRows = vehicles.map(vehicle => [
        vehicle.id,
        vehicle.brand,
        vehicle.model,
        vehicle.licensePlate,
        vehicle.company,
        vehicle.year || '',
        vehicle.status,
        vehicle.stk ? vehicle.stk.toISOString().split('T')[0] : '',
        vehicle.createdAt ? vehicle.createdAt.toISOString().split('T')[0] : ''
      ]);

      // Vytvor CSV obsah
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Nastav response headers pre CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="vozidla-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Pridaj BOM pre správne zobrazenie diakritiky v Exceli
      res.send('\ufeff' + csvContent);

      console.log(`📊 CSV Export: ${vehicles.length} vozidiel exportovaných pre používateľa ${req.user?.username}`);

    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri exporte CSV'
      });
    }
  }
);

// 📥 CSV IMPORT - Import vozidiel z CSV s kontrolou duplicít a update
router.post('/import/csv', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.log('📥 Starting CSV import for vehicles...');
    const { csvData } = req.body;

    if (!csvData) {
      return res.status(400).json({
        success: false,
        error: 'CSV dáta sú povinné'
      });
    }

    // Parsuj CSV dáta
    const lines = csvData.split('\n').filter((line: string) => line.trim());
    const header = lines[0].split(',').map((h: string) => h.replace(/^"|"$/g, '').trim());
    const dataLines = lines.slice(1); // Preskočiť header

    console.log('📊 CSV Header:', header);

    const results = [];
    const errors = [];
    const updated = [];
    const skipped = [];

    console.log(`📊 Processing ${dataLines.length} vehicles from CSV...`);

    // Získaj existujúce vozidlá pre kontrolu duplicít
    const existingVehicles = await postgresDatabase.getVehicles();
    const existingByLicensePlate = new Map(
      existingVehicles.map(v => [v.licensePlate?.toLowerCase(), v])
    );

    // Progress tracking
    const progressInterval = Math.max(1, Math.floor(dataLines.length / 10)); // Log každých 10% alebo každý záznam ak je menej ako 10

    for (let i = 0; i < dataLines.length; i++) {
      // Progress logging
      if (i % progressInterval === 0 || i === dataLines.length - 1) {
        const progress = Math.round(((i + 1) / dataLines.length) * 100);
        console.log(`📊 CSV Import Progress: ${progress}% (${i + 1}/${dataLines.length})`);
      }
      try {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Parsuj CSV riadok
        const fields = line.split(',').map((field: string) => field.replace(/^"|"$/g, '').trim());
        
        if (fields.length < 4) {
          errors.push({ row: i + 2, error: 'Nedostatok stĺpcov' });
          continue;
        }

        // Mapovanie základných stĺpcov
        const fieldMap: { [key: string]: string } = {};
        header.forEach((headerName: string, index: number) => {
          fieldMap[headerName] = fields[index] || '';
        });

        const brand = fieldMap['brand'];
        const model = fieldMap['model'];
        const licensePlate = fieldMap['licensePlate'];
        const company = fieldMap['company'];
        const year = fieldMap['year'];
        const status = fieldMap['status'];
        const stk = fieldMap['stk'];

        if (!brand || !model || !company) {
          errors.push({ row: i + 2, error: 'Značka, model a firma sú povinné' });
          continue;
        }

        // ✅ PARSOVANIE CENOTVORBY Z CSV
        const pricing: Array<{
          id: string;
          minDays: number;
          maxDays: number;
          pricePerDay: number;
        }> = [];
        
        // Mapovanie cenových stĺpcov na pricing formát
        const priceColumns = [
          { column: 'cena_0_1', minDays: 0, maxDays: 1 },
          { column: 'cena_2_3', minDays: 2, maxDays: 3 },
          { column: 'cena_4_7', minDays: 4, maxDays: 7 },
          { column: 'cena_8_14', minDays: 8, maxDays: 14 },
          { column: 'cena_15_22', minDays: 15, maxDays: 22 },
          { column: 'cena_23_30', minDays: 23, maxDays: 30 },
          { column: 'cena_31_9999', minDays: 31, maxDays: 9999 }
        ];

        priceColumns.forEach((priceCol, index) => {
          const priceValue = fieldMap[priceCol.column];
          if (priceValue && !isNaN(parseFloat(priceValue))) {
            pricing.push({
              id: (index + 1).toString(),
              minDays: priceCol.minDays,
              maxDays: priceCol.maxDays,
              pricePerDay: parseFloat(priceValue)
            });
          }
        });

        // Parsovanie commission
        const commissionType = (fieldMap['commissionType'] || 'percentage') as 'percentage' | 'fixed';
        const commissionValue = fieldMap['commissionValue'] ? parseFloat(fieldMap['commissionValue']) : 20;

        // Vytvor vehicle data
        const vehicleData = {
          brand: brand.trim(),
          model: model.trim(),
          licensePlate: licensePlate?.trim() || '',
          company: company.trim(),
          year: year && year.trim() && !isNaN(parseInt(year)) ? parseInt(year) : 2024,
          status: (status?.trim() || 'available') as VehicleStatus,
          stk: stk && stk.trim() ? new Date(stk.trim()) : undefined,
          pricing: pricing,
          commission: { 
            type: commissionType, 
            value: commissionValue 
          }
        };

        // 🔍 KONTROLA DUPLICÍT - Ak existuje vozidlo s rovnakou ŠPZ
        const licensePlateLower = vehicleData.licensePlate.toLowerCase();
        const existingVehicle = existingByLicensePlate.get(licensePlateLower);

        if (existingVehicle) {
          // ✅ UPDATE EXISTUJÚCEHO ZÁZNAMU
          console.log(`🔄 Updating existing vehicle ${i + 1}/${dataLines.length}: ${brand} ${model} (${licensePlate})`);
          
          const updatedVehicle = {
            ...existingVehicle,
            brand: vehicleData.brand,
            model: vehicleData.model,
            company: vehicleData.company,
            year: vehicleData.year,
            status: vehicleData.status,
            stk: vehicleData.stk,
            pricing: vehicleData.pricing,
            commission: vehicleData.commission
          };

          await postgresDatabase.updateVehicle(updatedVehicle);
          updated.push({
            id: existingVehicle.id,
            brand: vehicleData.brand,
            model: vehicleData.model,
            licensePlate: vehicleData.licensePlate,
            action: 'updated'
          });
        } else {
          // ✅ VYTVOR NOVÉ VOZIDLO
          console.log(`🚗 Creating new vehicle ${i + 1}/${dataLines.length}: ${brand} ${model} with ${pricing.length} price tiers`);
          console.log('💰 Pricing:', pricing);
          
          const createdVehicle = await postgresDatabase.createVehicle(vehicleData);
          results.push({
            id: createdVehicle.id,
            brand: vehicleData.brand,
            model: vehicleData.model,
            licensePlate: vehicleData.licensePlate,
            action: 'created'
          });
        }

      } catch (error) {
        console.error(`❌ Error processing row ${i + 2}:`, error);
        errors.push({ 
          row: i + 2, 
          error: error instanceof Error ? error.message : 'Neznáma chyba' 
        });
      }
    }

    console.log(`✅ CSV import completed: ${results.length} created, ${updated.length} updated, ${errors.length} errors`);

    res.json({
      success: true,
      message: `CSV import dokončený: ${results.length} vytvorených, ${updated.length} aktualizovaných, ${errors.length} chýb`,
      data: {
        imported: results.length,
        updated: updated.length,
        errorsCount: errors.length,
        results: [...results, ...updated],
        errors: errors.slice(0, 10) // Limit na prvých 10 chýb
      }
    });

  } catch (error) {
    console.error('❌ CSV import error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri CSV importe',
      details: error instanceof Error ? error.message : 'Neznáma chyba'
    });
  }
});

// POST /api/vehicles/:id/transfer-ownership - Transfer vlastníctva vozidla
router.post('/:id/transfer-ownership', 
  authenticateToken,
  requireRole(['admin']), // Len admin môže robiť transfer
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id: vehicleId } = req.params;
      const { 
        newOwnerCompanyId, 
        transferReason = 'manual_transfer',
        transferNotes = null,
        transferDate 
      } = req.body;

      console.log('🔄 Vehicle Ownership Transfer:', {
        vehicleId,
        newOwnerCompanyId,
        transferReason,
        transferDate: transferDate || 'now',
        requestedBy: req.user?.username
      });

      // Validácia
      if (!newOwnerCompanyId) {
        return res.status(400).json({
          success: false,
          error: 'New owner company ID is required'
        });
      }

      // Overenie, že vozidlo existuje
      const vehicle = await postgresDatabase.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Získanie súčasného vlastníka pre logovanie
      const currentOwner = await postgresDatabase.getCurrentVehicleOwner(vehicleId);
      
      // Transfer ownership
      const transferDate_parsed = transferDate ? new Date(transferDate) : new Date();
      
      await postgresDatabase.transferVehicleOwnership(
        vehicleId,
        newOwnerCompanyId,
        transferReason,
        transferNotes,
        transferDate_parsed
      );

      // Získanie nového vlastníka pre response
      const newOwner = await postgresDatabase.getCurrentVehicleOwner(vehicleId);

      console.log('✅ Vehicle ownership transferred successfully:', {
        vehicleId,
        vehicle: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
        fromCompany: currentOwner?.ownerCompanyName || 'Unknown',
        toCompany: newOwner?.ownerCompanyName || 'Unknown',
        transferDate: transferDate_parsed,
        reason: transferReason
      });

      res.json({
        success: true,
        message: `Vehicle ownership transferred successfully from ${currentOwner?.ownerCompanyName || 'Unknown'} to ${newOwner?.ownerCompanyName || 'Unknown'}`,
        data: {
          vehicleId,
          vehicle: {
            brand: vehicle.brand,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate
          },
          previousOwner: currentOwner,
          newOwner: newOwner,
          transferDate: transferDate_parsed,
          transferReason,
          transferNotes
        }
      });

    } catch (error) {
      console.error('Vehicle ownership transfer error:', error);
      res.status(500).json({
        success: false,
        error: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
);

// PUT /api/vehicles/ownership-history/:historyId - Úprava transferu vlastníctva
router.put('/ownership-history/:historyId',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { historyId } = req.params;
      const { 
        ownerCompanyId,
        transferReason,
        transferNotes,
        validFrom
      } = req.body;

      console.log('📝 Editing ownership transfer:', {
        historyId,
        ownerCompanyId,
        transferReason,
        validFrom,
        requestedBy: req.user?.username
      });

      // Validácia
      if (!ownerCompanyId || !transferReason || !validFrom) {
        return res.status(400).json({
          success: false,
          error: 'Required fields: ownerCompanyId, transferReason, validFrom'
        });
      }

      await postgresDatabase.updateVehicleOwnershipHistory(historyId, {
        ownerCompanyId,
        transferReason,
        transferNotes,
        validFrom: new Date(validFrom)
      });

      console.log('✅ Ownership transfer updated successfully:', historyId);

      res.json({
        success: true,
        message: 'Transfer vlastníctva úspešne upravený'
      });

    } catch (error) {
      console.error('Update ownership transfer error:', error);
      res.status(500).json({
        success: false,
        error: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
);

// DELETE /api/vehicles/ownership-history/:historyId - Vymazanie transferu vlastníctva
router.delete('/ownership-history/:historyId',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { historyId } = req.params;

      console.log('🗑️ Deleting ownership transfer:', {
        historyId,
        requestedBy: req.user?.username
      });

      // Overenie, že transfer existuje
      const exists = await postgresDatabase.checkOwnershipHistoryExists(historyId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: 'Ownership transfer not found'
        });
      }

      await postgresDatabase.deleteVehicleOwnershipHistory(historyId);

      console.log('✅ Ownership transfer deleted successfully:', historyId);

      res.json({
        success: true,
        message: 'Transfer vlastníctva úspešne vymazaný'
      });

    } catch (error) {
      console.error('Delete ownership transfer error:', error);
      res.status(500).json({
        success: false,
        error: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
);

// GET /api/vehicles/:id/ownership-history - História vlastníctva vozidla
router.get('/:id/ownership-history',
  authenticateToken,
  requireRole(['admin']), // Len admin môže vidieť históriu
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id: vehicleId } = req.params;

      // Overenie, že vozidlo existuje
      const vehicle = await postgresDatabase.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Získanie ownership history
      const history = await postgresDatabase.getVehicleOwnershipHistory(vehicleId);

      res.json({
        success: true,
        data: {
          vehicle: {
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate
          },
          ownershipHistory: history
        }
      });

    } catch (error) {
      console.error('Get ownership history error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get ownership history: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
);

// GET /api/vehicles/:id/owner-at-date - Získanie majiteľa vozidla k dátumu
router.get('/:id/owner-at-date',
  authenticateToken,
  checkPermission('vehicles', 'read', { getContext: getVehicleContext }),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id: vehicleId } = req.params;
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Date parameter is required'
        });
      }

      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format'
        });
      }

      // Overenie, že vozidlo existuje
      const vehicle = await postgresDatabase.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found'
        });
      }

      // Získanie majiteľa k dátumu
      const owner = await postgresDatabase.getVehicleOwnerAtDate(vehicleId, targetDate);

      res.json({
        success: true,
        data: {
          vehicleId,
          date: targetDate.toISOString(),
          owner: owner || {
            ownerCompanyId: null,
            ownerCompanyName: 'Neznámy majiteľ'
          }
        }
      });

    } catch (error) {
      console.error('Get vehicle owner at date error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get vehicle owner: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
);

export default router; 