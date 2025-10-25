import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse, Insurance } from '../types';

// 🕐 TIMEZONE FIX: Parse date string without timezone conversion
function parseDateWithoutTimezone(dateValue: string | Date): Date {
  if (dateValue instanceof Date) return dateValue;
  
  const dateStr = String(dateValue);
  // Extract YYYY-MM-DD part only
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create Date at midnight local time (NO UTC conversion!)
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

const router: Router = Router();

// Helper function for filtering insurances based on query parameters
const filterInsurances = (insurances: Insurance[], query: Record<string, unknown>, vehicles?: any[]) => {
  let filtered = [...insurances];
  
  // Search filter
  if (query.search && typeof query.search === 'string') {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(insurance => {
      // Search in insurance fields
      const matchesInsurance = 
        insurance.type?.toLowerCase().includes(searchTerm) ||
        insurance.company?.toLowerCase().includes(searchTerm) ||
        insurance.policyNumber?.toLowerCase().includes(searchTerm);
      
      // Search in vehicle name (brand + model + license plate)
      if (vehicles && insurance.vehicleId) {
        const vehicle = vehicles.find(v => v.id === insurance.vehicleId);
        if (vehicle) {
          const vehicleName = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.licensePlate || ''}`.toLowerCase();
          return matchesInsurance || vehicleName.includes(searchTerm);
        }
      }
      
      return matchesInsurance;
    });
  }
  
  // Type filter
  if (query.type && typeof query.type === 'string') {
    filtered = filtered.filter(insurance => insurance.type === query.type);
  }
  
  // Company filter
  if (query.company && typeof query.company === 'string') {
    filtered = filtered.filter(insurance => insurance.company === query.company);
  }
  
  // Status filter (valid, expiring, expired)
  if (query.status && typeof query.status === 'string' && query.status !== 'all') {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    filtered = filtered.filter(insurance => {
      const validTo = new Date(insurance.validTo);
      
      switch (query.status) {
        case 'valid':
          return validTo > thirtyDaysFromNow;
        case 'expiring':
          return validTo > today && validTo <= thirtyDaysFromNow;
        case 'expired':
          return validTo <= today;
        default:
          return true;
      }
    });
  }
  
  // Vehicle filter
  if (query.vehicleId && typeof query.vehicleId === 'string') {
    filtered = filtered.filter(insurance => insurance.vehicleId === query.vehicleId);
  }
  
  return filtered;
};

// 🔍 CONTEXT FUNCTIONS
const getInsuranceContext = async (req: Request) => {
  const insuranceId = req.params.id;
  if (!insuranceId) return {};
  
  const insurances = await postgresDatabase.getInsurances();
  const insurance = insurances.find(i => i.id === insuranceId);
  if (!insurance || !insurance.vehicleId) return {};
  
  // Získaj vehicle pre company context
  const vehicle = await postgresDatabase.getVehicle(insurance.vehicleId);
  return {
    resourceCompanyId: vehicle?.ownerCompanyId,
    amount: insurance.price
  };
};

// GET /api/insurances - Získanie všetkých poistiek
router.get('/', 
  authenticateToken,
  checkPermission('insurances', 'read'),
  async (req: Request, res: Response<ApiResponse<Insurance[]>>) => {
    try {
      let insurances = await postgresDatabase.getInsurances();
      
      // ✅ PLATFORM FILTERING: Admin and company_admin see only their platform insurances
      if (req.user && (req.user.role === 'admin' || req.user.role === 'company_admin') && req.user.platformId) {
        console.log('🌐 INSURANCES: Filtering by platform:', req.user.platformId);
        const vehicles = await postgresDatabase.getVehicles();
        const platformVehicleIds = vehicles
          .filter(v => v.platformId === req.user?.platformId)
          .map(v => v.id);
        
        const originalCount = insurances.length;
        insurances = insurances.filter(i => 
          i.vehicleId && platformVehicleIds.includes(i.vehicleId)
        );
        console.log('🌐 INSURANCES: Platform filter applied:', { originalCount, filteredCount: insurances.length });
      }
      
      res.json({
        success: true,
        data: insurances
      });
    } catch (error) {
      console.error('Get insurances error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní poistiek'
      });
    }
  });

// GET /api/insurances/paginated - Získanie poistiek s pagináciou a filtrovaním
router.get('/paginated', 
  authenticateToken,
  checkPermission('insurances', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('📄 INSURANCES: Paginated request:', req.query);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      
      // Load all insurances first
      let allInsurances = await postgresDatabase.getInsurances();
      
      // Load vehicles for search filtering
      const vehicles = await postgresDatabase.getVehicles();
      
      // 🏢 COMPANY OWNER - filter len poistky vlastných vozidiel
      if (req.user?.role === 'company_admin' && req.user.companyId) {
        const companyVehicleIds = vehicles
          .filter(v => v.ownerCompanyId === req.user?.companyId)
          .map(v => v.id);
        
        allInsurances = allInsurances.filter(i => 
          i.vehicleId && companyVehicleIds.includes(i.vehicleId)
        );
      }
      
      // Apply filters (pass vehicles for search)
      const filteredInsurances = filterInsurances(allInsurances, req.query, vehicles);
      
      // Sort by valid to date (newest first) since createdAt might not exist
      filteredInsurances.sort((a, b) => 
        new Date(b.validTo).getTime() - new Date(a.validTo).getTime()
      );
      
      // Apply pagination
      const paginatedInsurances = filteredInsurances.slice(offset, offset + limit);
      const totalCount = filteredInsurances.length;
      const totalPages = Math.ceil(totalCount / limit);
      
      console.log(`📄 INSURANCES: Returning page ${page}/${totalPages} (${paginatedInsurances.length}/${totalCount} items)`);
      
      res.json({
        success: true,
        data: {
          insurances: paginatedInsurances,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            hasMore: page < totalPages
          }
        }
      });
    } catch (error) {
      console.error('❌ INSURANCES: Paginated error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítavaní poistiek'
      });
    }
  });

// POST /api/insurances - Vytvorenie novej poistky
router.post('/', 
  authenticateToken,
  checkPermission('insurances', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔧 INSURANCE POST: Request body:', JSON.stringify(req.body, null, 2));
    
    const { vehicleId, type, policyNumber, validFrom, validTo, price, company, paymentFrequency, filePath, filePaths, greenCardValidFrom, greenCardValidTo, deductibleAmount, deductiblePercentage, kmState, brokerCompany } = req.body;

    // ✅ vehicleId JE POVINNÉ - poistka musí byť priradená k vozidlu
    if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || typeof price !== 'number' || price < 0 || !company) {
      console.log('🔧 INSURANCE POST: Validation failed:', {
        vehicleId: vehicleId,
        vehicleIdType: typeof vehicleId,
        type: type,
        policyNumber: policyNumber,
        validFrom: validFrom,
        validTo: validTo,
        price: price,
        priceType: typeof price,
        company: company
      });
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené (vehicleId, type, policyNumber, validFrom, validTo, price, company)'
      });
    }

    console.log('🔧 INSURANCE POST: Calling createInsurance with data:', {
      vehicleId,
      type,
      policyNumber,
      validFrom: parseDateWithoutTimezone(validFrom), // 🕐 TIMEZONE FIX
      validTo: parseDateWithoutTimezone(validTo), // 🕐 TIMEZONE FIX
      price,
      company,
      paymentFrequency,
      filePath,
      filePaths,
      greenCardValidFrom: greenCardValidFrom ? new Date(greenCardValidFrom) : undefined,
      greenCardValidTo: greenCardValidTo ? new Date(greenCardValidTo) : undefined,
      deductibleAmount,
      deductiblePercentage
    });

    const createdInsurance = await postgresDatabase.createInsurance({
      vehicleId,
      type,
      policyNumber,
      validFrom: parseDateWithoutTimezone(validFrom), // 🕐 TIMEZONE FIX
      validTo: parseDateWithoutTimezone(validTo), // 🕐 TIMEZONE FIX
      price,
      company,
      paymentFrequency,
      filePath,
      filePaths,
      greenCardValidFrom: greenCardValidFrom ? parseDateWithoutTimezone(greenCardValidFrom) : undefined, // 🕐 TIMEZONE FIX
      greenCardValidTo: greenCardValidTo ? parseDateWithoutTimezone(greenCardValidTo) : undefined, // 🕐 TIMEZONE FIX
      kmState: kmState || undefined, // 🚗 Stav kilometrov pre Kasko
      brokerCompany: brokerCompany || undefined, // 🏢 Maklerská spoločnosť
      deductibleAmount,
      deductiblePercentage
    });

    console.log('🔧 INSURANCE POST: Successfully created insurance:', createdInsurance);

    res.status(201).json({
      success: true,
      message: 'Poistka úspešne vytvorená',
      data: createdInsurance
    });

  } catch (error) {
    console.error('🔧 INSURANCE POST: Create insurance error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní poistky'
    });
  }
});

// PUT /api/insurances/:id - Aktualizácia poistky
router.put('/:id', 
  authenticateToken,
  checkPermission('insurances', 'update', { getContext: getInsuranceContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  const { id } = req.params; // 🔧 FIX: Move outside try-catch for error handler access
  const { vehicleId, type, policyNumber, validFrom, validTo, price, company, insurerId, paymentFrequency, filePath, filePaths, greenCardValidFrom, greenCardValidTo, deductibleAmount, deductiblePercentage, kmState, brokerCompany } = req.body;
  
  try {

    console.log('🔧 INSURANCE PUT: Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔧 INSURANCE PUT: Validation check:', {
      vehicleId: vehicleId,
      vehicleIdType: typeof vehicleId,
      type: type,
      policyNumber: policyNumber,
      validFrom: validFrom,
      validTo: validTo,
      price: price,
      priceType: typeof price,
      company: company
    });

    // ✅ vehicleId JE POVINNÉ - poistka musí byť priradená k vozidlu
    if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || typeof price !== 'number' || price < 0 || !company) {
      console.error('🔧 INSURANCE PUT: Validation FAILED');
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené (vehicleId, type, policyNumber, validFrom, validTo, price, company)'
      });
    }

    console.log('🔧 INSURANCE PUT: Validation PASSED, calling updateInsurance...');

    const updatedInsurance = await postgresDatabase.updateInsurance(id, {
      vehicleId,
      type,
      policyNumber,
      validFrom: parseDateWithoutTimezone(validFrom), // 🕐 TIMEZONE FIX
      validTo: parseDateWithoutTimezone(validTo), // 🕐 TIMEZONE FIX
      price,
      company,
      brokerCompany, // 🏢 Maklerská spoločnosť
      insurerId, // Nový parameter
      paymentFrequency,
      filePath,
      filePaths,
      greenCardValidFrom: greenCardValidFrom ? parseDateWithoutTimezone(greenCardValidFrom) : undefined, // 🕐 TIMEZONE FIX
      greenCardValidTo: greenCardValidTo ? parseDateWithoutTimezone(greenCardValidTo) : undefined, // 🕐 TIMEZONE FIX
      kmState: kmState || undefined, // ✅ Pridané kmState
      deductibleAmount,
      deductiblePercentage
    });

    res.json({
      success: true,
      message: 'Poistka úspešne aktualizovaná',
      data: updatedInsurance
    });

  } catch (error) {
    console.error('❌ INSURANCE PUT ERROR:', error);
    console.error('❌ INSURANCE PUT ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ INSURANCE PUT ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
    console.error('❌ INSURANCE PUT ID:', id);
    console.error('❌ INSURANCE PUT vehicleId:', vehicleId, 'type:', typeof vehicleId);
    res.status(500).json({
      success: false,
      error: `Chyba pri aktualizácii poistky: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// DELETE /api/insurances/:id - Zmazanie poistky
router.delete('/:id', 
  authenticateToken,
  checkPermission('insurances', 'delete', { getContext: getInsuranceContext }),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteInsurance(id);

    res.json({
      success: true,
      message: 'Poistka úspešne zmazaná'
    });

  } catch (error) {
    console.error('Delete insurance error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri mazaní poistky'
    });
  }
});

export default router; 