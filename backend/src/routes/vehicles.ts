import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { cacheResponse, invalidateCache, userSpecificCache } from '../middleware/cache-middleware';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse, Vehicle, VehicleStatus } from '../types';

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

// GET /api/vehicles - Získanie všetkých vozidiel s cache
router.get('/', 
  authenticateToken, 
  checkPermission('vehicles', 'read'),
  cacheResponse('vehicles', {
    cacheKey: userSpecificCache,
    ttl: 10 * 60 * 1000, // 10 minutes
    tags: ['vehicles']
  }),
  async (req: Request, res: Response<ApiResponse<Vehicle[]>>) => {
    try {
      // Podporuj parametre pre zahrnutie vyradených a súkromných vozidiel
      const includeRemoved = req.query.includeRemoved === 'true';
      const includePrivate = req.query.includePrivate === 'true';
      let vehicles = await postgresDatabase.getVehicles(includeRemoved, includePrivate);
      
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

// ⚡ GET /api/vehicles/bulk-ownership-history - História vlastníctva všetkých vozidiel NARAZ
router.get('/bulk-ownership-history',
  authenticateToken,
  requireRole(['admin']),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('🚀 BULK: Loading ownership history for all vehicles...');
      const startTime = Date.now();

      // ⚡⚡ SKUTOČNÝ BULK: Jeden SQL query pre všetky vehicle histories naraz
      const client = await (postgresDatabase as any).pool.connect();
      
      try {
        // 1. Získaj všetky vozidlá
        const vehiclesResult = await client.query(`
          SELECT id, brand, model, license_plate, company_id 
          FROM vehicles 
          ORDER BY brand, model
        `);
        const vehicles = vehiclesResult.rows;
        
        console.log(`📊 Loading history for ${vehicles.length} vehicles...`);
        
        // 2. Získaj všetky ownership histories jedným query
        const historiesResult = await client.query(`
          SELECT 
            vehicle_id,
            id,
            company_id,
            owner_company_name,
            valid_from,
            valid_to,
            transfer_reason,
            transfer_notes
          FROM vehicle_ownership_history
          ORDER BY vehicle_id, valid_from DESC
        `);
        
        // 3. Group histories by vehicle_id
        const historiesByVehicle = new Map();
        historiesResult.rows.forEach((row: any) => {
          if (!historiesByVehicle.has(row.vehicle_id)) {
            historiesByVehicle.set(row.vehicle_id, []);
          }
          historiesByVehicle.get(row.vehicle_id).push({
            id: row.id,
            ownerCompanyId: row.company_id,
            ownerCompanyName: row.owner_company_name,
            validFrom: row.valid_from,
            validTo: row.valid_to,
            transferReason: row.transfer_reason,
            transferNotes: row.transfer_notes
          });
        });
        
        // 4. Combine vehicle data with histories
        const allHistories = vehicles.map((vehicle: any) => ({
          vehicleId: vehicle.id,
          vehicle: {
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            licensePlate: vehicle.license_plate,
            ownerCompanyId: vehicle.company_id
          },
          history: historiesByVehicle.get(vehicle.id) || []
        }));
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ BULK: Loaded ownership history for ${vehicles.length} vehicles in ${loadTime}ms using 2 SQL queries instead of ${vehicles.length + 1}`);

        res.json({
          success: true,
          data: {
            vehicleHistories: allHistories,
            totalVehicles: vehicles.length,
            loadTimeMs: loadTime
          }
        });
        
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Bulk ownership history error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to load bulk ownership history: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
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

// GET /api/vehicles/check-duplicate/:licensePlate - Kontrola duplicitnej ŠPZ
router.get('/check-duplicate/:licensePlate',
  authenticateToken,
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response<ApiResponse<{ exists: boolean; vehicle?: Vehicle }>>) => {
    try {
      const { licensePlate } = req.params;
      
      if (!licensePlate) {
        return res.status(400).json({
          success: false,
          error: 'ŠPZ je povinná'
        });
      }

      // Získaj všetky vozidlá a kontroluj duplicitu
      const vehicles = await postgresDatabase.getVehicles();
      const existingVehicle = vehicles.find(
        v => v.licensePlate?.toLowerCase() === licensePlate.toLowerCase()
      );

      if (existingVehicle) {
        return res.status(200).json({
          success: true,
          data: {
            exists: true,
            vehicle: existingVehicle
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { exists: false }
      });

    } catch (error) {
      console.error('Check duplicate vehicle error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri kontrole duplicity vozidla'
      });
    }
  }
);

// POST /api/vehicles - Vytvorenie nového vozidla s cache invalidation
router.post('/', 
  authenticateToken,
  checkPermission('vehicles', 'create'),
  invalidateCache('vehicle'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { brand, model, licensePlate, vin, company, pricing, commission, status, year, extraKilometerRate } = req.body;

    if (!brand || !model || !company) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    // ✅ Kontrola duplicitnej ŠPZ pred vytvorením
    if (licensePlate) {
      const vehicles = await postgresDatabase.getVehicles();
      const existingVehicle = vehicles.find(
        v => v.licensePlate?.toLowerCase() === licensePlate.toLowerCase()
      );

      if (existingVehicle) {
        return res.status(409).json({
          success: false,
          error: `Vozidlo s ŠPZ "${licensePlate}" už existuje v databáze`,
          code: 'DUPLICATE_LICENSE_PLATE'
        });
      }
    }

    const createdVehicle = await postgresDatabase.createVehicle({
      brand,
      model,
      year: year || 2024,
      licensePlate: licensePlate || '',
      vin: vin || null,
      company,
      pricing: pricing || [],
      commission: commission || { type: 'percentage', value: 0 },
      status: status || 'available',
      extraKilometerRate: extraKilometerRate || 0.30 // 🚗 NOVÉ: Extra kilometer rate
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

// PUT /api/vehicles/:id - Aktualizácia vozidla s cache invalidation
router.put('/:id', 
  authenticateToken,
  checkPermission('vehicles', 'update', { getContext: getVehicleContext }),
  invalidateCache('vehicle'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { brand, model, licensePlate, vin, company, category, pricing, commission, status, year, stk, extraKilometerRate } = req.body;

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
      vin: vin !== undefined ? vin : existingVehicle.vin,
      company: company || existingVehicle.company,
      category: category || existingVehicle.category,
      pricing: pricing || existingVehicle.pricing,
      commission: commission || existingVehicle.commission,
      status: status || existingVehicle.status,
      year: year !== undefined ? year : existingVehicle.year,
      stk: stk !== undefined ? (stk ? new Date(stk) : undefined) : existingVehicle.stk,
      extraKilometerRate: extraKilometerRate !== undefined ? extraKilometerRate : existingVehicle.extraKilometerRate, // 🚗 NOVÉ: Extra kilometer rate
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

// DELETE /api/vehicles/:id - Vymazanie vozidla s cache invalidation
router.delete('/:id', 
  authenticateToken,
  checkPermission('vehicles', 'delete', { getContext: getVehicleContext }),
  invalidateCache('vehicle'),
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

      // Vytvor CSV hlavičky s cenotvorbou
      const csvHeaders = [
        'ID',
        'Značka',
        'Model', 
        'ŠPZ',
        'Firma',
        'Rok',
        'Status',
        'STK',
        'Vytvorené',
        // 💰 CENOTVORBA - 7 cenových pásiem
        'Cena_0-1_dni',
        'Cena_2-3_dni', 
        'Cena_4-7_dni',
        'Cena_8-14_dni',
        'Cena_15-22_dni',
        'Cena_23-30_dni',
        'Cena_31+_dni',
        // 💼 PROVÍZIA
        'Provizia_typ',
        'Provizia_hodnota'
      ];

      // Konvertuj vozidlá na CSV riadky s cenotvorbou
      const csvRows = vehicles.map(vehicle => {
        // 💰 EXTRAKCIA CENOTVORBY - 7 štandardných pásiem
        const pricing = vehicle.pricing || [];
        const getPriceForDays = (minDays: number, maxDays: number) => {
          const tier = pricing.find(p => p.minDays === minDays && p.maxDays === maxDays);
          return tier ? tier.pricePerDay : '';
        };

        return [
          vehicle.id,
          vehicle.brand,
          vehicle.model,
          vehicle.licensePlate,
          vehicle.company,
          vehicle.year || '',
          vehicle.status,
          vehicle.stk ? vehicle.stk.toISOString().split('T')[0] : '',
          vehicle.createdAt ? vehicle.createdAt.toISOString().split('T')[0] : '',
          // 💰 CENOTVORBA - 7 cenových pásiem
          getPriceForDays(0, 1),    // 0-1 dní
          getPriceForDays(2, 3),    // 2-3 dni
          getPriceForDays(4, 7),    // 4-7 dní
          getPriceForDays(8, 14),   // 8-14 dní
          getPriceForDays(15, 22),  // 15-22 dní
          getPriceForDays(23, 30),  // 23-30 dní
          getPriceForDays(31, 365), // 31+ dní
          // 💼 PROVÍZIA
          vehicle.commission?.type || 'percentage',
          vehicle.commission?.value || 20
        ];
      });

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

        // Mapovanie základných stĺpcov s podporou slovenských názvov
        const fieldMap: { [key: string]: string } = {};
        header.forEach((headerName: string, index: number) => {
          fieldMap[headerName] = fields[index] || '';
        });

        // 🔧 OPRAVENÉ: Podpora slovenských aj anglických názvov stĺpcov
        const brand = fieldMap['brand'] || fieldMap['Značka'];
        const model = fieldMap['model'] || fieldMap['Model'];
        const licensePlate = fieldMap['licensePlate'] || fieldMap['ŠPZ'];
        const company = fieldMap['company'] || fieldMap['Firma'];
        const year = fieldMap['year'] || fieldMap['Rok'];
        const status = fieldMap['status'] || fieldMap['Status'];
        const stk = fieldMap['stk'] || fieldMap['STK'];

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
        
        // 💰 MAPOVANIE CENOVÝCH STĹPCOV - podpora nových názvov z exportu
        const priceColumns = [
          { columns: ['cena_0_1', 'Cena_0-1_dni'], minDays: 0, maxDays: 1 },
          { columns: ['cena_2_3', 'Cena_2-3_dni'], minDays: 2, maxDays: 3 },
          { columns: ['cena_4_7', 'Cena_4-7_dni'], minDays: 4, maxDays: 7 },
          { columns: ['cena_8_14', 'Cena_8-14_dni'], minDays: 8, maxDays: 14 },
          { columns: ['cena_15_22', 'Cena_15-22_dni'], minDays: 15, maxDays: 22 },
          { columns: ['cena_23_30', 'Cena_23-30_dni'], minDays: 23, maxDays: 30 },
          { columns: ['cena_31_9999', 'Cena_31+_dni'], minDays: 31, maxDays: 365 }
        ];

        priceColumns.forEach((priceCol, index) => {
          // Skús nájsť hodnotu v ktoromkoľvek z možných názvov stĺpcov
          let priceValue = '';
          for (const columnName of priceCol.columns) {
            if (fieldMap[columnName]) {
              priceValue = fieldMap[columnName];
              break;
            }
          }
          
          if (priceValue && !isNaN(parseFloat(priceValue))) {
            pricing.push({
              id: (index + 1).toString(),
              minDays: priceCol.minDays,
              maxDays: priceCol.maxDays,
              pricePerDay: parseFloat(priceValue)
            });
          }
        });

        // 💼 PARSOVANIE PROVÍZIE - podpora nových názvov z exportu
        const commissionType = (
          fieldMap['commissionType'] || 
          fieldMap['Provizia_typ'] || 
          'percentage'
        ) as 'percentage' | 'fixed';
        
        const commissionValue = fieldMap['commissionValue'] || fieldMap['Provizia_hodnota'] 
          ? parseFloat(fieldMap['commissionValue'] || fieldMap['Provizia_hodnota']) 
          : 20;

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

// 🚀 GMAIL APPROACH: GET /api/vehicles/paginated - Rýchle vyhľadávanie s pagination
router.get('/paginated', 
  authenticateToken,
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        search = '',
        company = 'all',
        brand = 'all',
        category = 'all',
        status = 'all',
        yearMin = '',
        yearMax = '',
        priceMin = '',
        priceMax = ''
      } = req.query;

      console.log('🚗 Vehicles PAGINATED GET - params:', { 
        page, limit, search, company, brand, category,
        role: req.user?.role, 
        userId: req.user?.id
      });

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Získaj paginated vehicles s filtrami
      const result = await postgresDatabase.getVehiclesPaginated({
        limit: limitNum,
        offset,
        search: search as string,
        company: company as string,
        brand: brand as string,
        category: category as string,
        status: status as string,
        yearMin: yearMin as string,
        yearMax: yearMax as string,
        priceMin: priceMin as string,
        priceMax: priceMax as string,
        userId: req.user?.id,
        userRole: req.user?.role
      });

      console.log(`📊 Found ${result.vehicles.length}/${result.total} vehicles (page ${pageNum})`);

      res.json({
        success: true,
        data: {
          vehicles: result.vehicles,
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
      console.error('Get paginated vehicles error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní vozidiel'
      });
    }
  }
);

// 📥 BATCH CSV IMPORT - Rýchly import viacerých vozidiel naraz
router.post('/batch-import', 
  authenticateToken,
  checkPermission('vehicles', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('📥 Starting batch vehicle import...');
      const { vehicles } = req.body;

      if (!vehicles || !Array.isArray(vehicles)) {
        return res.status(400).json({
          success: false,
          error: 'Vehicles array je povinný'
        });
      }

      console.log(`📊 Processing ${vehicles.length} vehicles in batch...`);
      
      const results = [];
      const errors = [];
      const updated = [];
      let processed = 0;

      // Progress tracking
      const progressInterval = Math.max(1, Math.floor(vehicles.length / 10));

      // Získaj existujúce vozidlá pre kontrolu duplicít
      const existingVehicles = await postgresDatabase.getVehicles();
      const existingByLicensePlate = new Map(
        existingVehicles.map(v => [v.licensePlate?.toLowerCase(), v])
      );

      for (let i = 0; i < vehicles.length; i++) {
        // Progress logging
        if (i % progressInterval === 0 || i === vehicles.length - 1) {
          const progress = Math.round(((i + 1) / vehicles.length) * 100);
          console.log(`📊 Batch Import Progress: ${progress}% (${i + 1}/${vehicles.length})`);
        }

        try {
          const vehicleData = vehicles[i];
          
          // Validácia povinných polí
          if (!vehicleData.brand || !vehicleData.model || !vehicleData.company) {
            errors.push({ 
              index: i + 1, 
              error: 'Značka, model a firma sú povinné',
              vehicle: `${vehicleData.brand || 'N/A'} ${vehicleData.model || 'N/A'}`
            });
            continue;
          }

          // Kontrola duplicít podľa ŠPZ
          const licensePlateLower = vehicleData.licensePlate?.toLowerCase();
          const existingVehicle = existingByLicensePlate.get(licensePlateLower);

          if (existingVehicle) {
            // Update existujúceho vozidla
            const updatedVehicle = {
              ...existingVehicle,
              ...vehicleData,
              id: existingVehicle.id // Zachovaj originálne ID
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
            // Vytvor nové vozidlo
            const createdVehicle = await postgresDatabase.createVehicle(vehicleData);
            results.push({
              id: createdVehicle.id,
              brand: vehicleData.brand,
              model: vehicleData.model,
              licensePlate: vehicleData.licensePlate,
              action: 'created'
            });
          }

          processed++;

        } catch (error) {
          console.error(`❌ Error processing vehicle ${i + 1}:`, error);
          errors.push({ 
            index: i + 1, 
            error: error instanceof Error ? error.message : 'Neznáma chyba',
            vehicle: `${vehicles[i].brand || 'N/A'} ${vehicles[i].model || 'N/A'}`
          });
        }
      }

      const successRate = Math.round((processed / vehicles.length) * 100);
      
      console.log(`✅ Batch vehicle import completed: ${results.length} created, ${updated.length} updated, ${errors.length} errors`);

      res.json({
        success: true,
        message: `Batch import dokončený: ${results.length} vytvorených, ${updated.length} aktualizovaných, ${errors.length} chýb`,
        data: {
          processed,
          total: vehicles.length,
          created: results.length,
          updated: updated.length,
          errorsCount: errors.length,
          successRate: `${successRate}%`,
          results: [...results, ...updated],
          errors: errors.slice(0, 10) // Limit na prvých 10 chýb
        }
      });

    } catch (error) {
      console.error('❌ Batch vehicle import failed:', error);
      res.status(500).json({
        success: false,
        error: 'Batch import vozidiel zlyhal',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

export default router; 