import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Vehicle, ApiResponse } from '../types';
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

// 📥 CSV IMPORT - Import vozidiel z CSV
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
    const dataLines = lines.slice(1); // Preskočiť header

    const results = [];
    const errors = [];

    console.log(`📊 Processing ${dataLines.length} vehicles from CSV...`);

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i].trim();
        if (!line) continue;

        // Parsuj CSV riadok (jednoduché parsovanie)
        const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
        
        if (fields.length < 4) {
          errors.push({ row: i + 2, error: 'Nedostatok stĺpcov' });
          continue;
        }

        const [, brand, model, licensePlate, company, year, status] = fields;

        if (!brand || !model || !company) {
          errors.push({ row: i + 2, error: 'Značka, model a firma sú povinné' });
          continue;
        }

        // Vytvor vozidlo s kompletným pricing a správnym statusom
        const vehicleData = {
          brand: brand.trim(),
          model: model.trim(),
          licensePlate: licensePlate?.trim() || '',
          company: company.trim(),
          year: year ? parseInt(year) : 2024,
          status: 'available', // ✅ Vždy dostupné
          pricing: [
            {
              duration: 'daily',
              price: 50,
              currency: 'EUR'
            },
            {
              duration: 'weekly', 
              price: 300,
              currency: 'EUR'
            },
            {
              duration: 'monthly',
              price: 1000,
              currency: 'EUR'
            }
          ], // ✅ Základná cenotvorba
          commission: { type: 'percentage', value: 20 }
        };

        console.log(`🚗 Creating vehicle ${i + 1}/${dataLines.length}: ${brand} ${model}`);
        const createdVehicle = await postgresDatabase.createVehicle(vehicleData);
        results.push({ row: i + 2, vehicle: createdVehicle });

      } catch (error: any) {
        console.error(`❌ Error creating vehicle at row ${i + 2}:`, error);
        errors.push({ 
          row: i + 2, 
          error: error.message || 'Chyba pri vytváraní vozidla' 
        });
      }
    }

    console.log(`✅ CSV Import completed: ${results.length} successful, ${errors.length} errors`);

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

  } catch (error) {
    console.error('❌ CSV import error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri CSV importe'
    });
  }
});

export default router; 