import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Insurance, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';
import { textIncludes } from '../utils/textNormalization';

const router = Router();

// GET /api/insurances/paginated - Paginated insurances with filters
router.get('/paginated', 
  authenticateToken,
  checkPermission('insurances', 'read'),
  async (req: Request, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        search = '',
        type = '',
        insurerId = '',
        vehicleId = '',
        status = '',
        dateFrom = '',
        dateTo = ''
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      let insurances = await postgresDatabase.getInsurances();
      
      console.log('🛡️ Insurances PAGINATED GET - user:', { 
        role: req.user?.role, 
        userId: req.user?.id, 
        totalInsurances: insurances.length,
        page: pageNum,
        limit: limitNum
      });
      
      // 🏢 COMPANY OWNER - filter len poistky vlastných vozidiel
      if (req.user?.role === 'company_owner' && req.user.companyId) {
        const vehicles = await postgresDatabase.getVehicles();
        const companyVehicleIds = vehicles
          .filter(v => v.ownerCompanyId === req.user?.companyId)
          .map(v => v.id);
        
        insurances = insurances.filter(i => 
          i.vehicleId && companyVehicleIds.includes(i.vehicleId)
        );
      }

      // 🔍 Apply filters
      let filteredInsurances = [...insurances];

      // Search filter - bez diakritiky
      if (search) {
        const searchTerm = search.toString();
        filteredInsurances = filteredInsurances.filter(i => 
          textIncludes(i.policyNumber, searchTerm) ||
          textIncludes(i.type, searchTerm) ||
          textIncludes(i.note, searchTerm)
        );
      }

      // Type filter
      if (type) {
        filteredInsurances = filteredInsurances.filter(i => 
          i.type === type.toString()
        );
      }

      // Insurer filter
      if (insurerId) {
        filteredInsurances = filteredInsurances.filter(i => 
          i.insurerId === insurerId.toString()
        );
      }

      // Vehicle filter
      if (vehicleId) {
        filteredInsurances = filteredInsurances.filter(i => 
          i.vehicleId === vehicleId.toString()
        );
      }

      // Status filter
      if (status) {
        filteredInsurances = filteredInsurances.filter(i => 
          i.status === status.toString()
        );
      }

      // Date filters
      if (dateFrom) {
        const fromDate = new Date(dateFrom.toString());
        filteredInsurances = filteredInsurances.filter(i => {
          if (!i.startDate) return false;
          const insuranceDate = new Date(i.startDate);
          return insuranceDate >= fromDate;
        });
      }

      if (dateTo) {
        const toDate = new Date(dateTo.toString());
        filteredInsurances = filteredInsurances.filter(i => {
          if (!i.endDate) return false;
          const insuranceDate = new Date(i.endDate);
          return insuranceDate <= toDate;
        });
      }

      // Sort by start date (newest first)
      filteredInsurances.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });

      // Calculate pagination
      const totalItems = filteredInsurances.length;
      const totalPages = Math.ceil(totalItems / limitNum);
      const hasMore = pageNum < totalPages;

      // Get paginated results
      const paginatedInsurances = filteredInsurances.slice(offset, offset + limitNum);

      console.log('📄 Paginated insurances:', {
        totalItems,
        currentPage: pageNum,
        totalPages,
        hasMore,
        resultsCount: paginatedInsurances.length
      });

      res.json({
        success: true,
        insurances: paginatedInsurances,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          hasMore,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      console.error('Get paginated insurances error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní poistení'
      });
    }
  });

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
      
      // 🏢 COMPANY OWNER - filter len poistky vlastných vozidiel
      if (req.user?.role === 'company_owner' && req.user.companyId) {
        const vehicles = await postgresDatabase.getVehicles();
        const companyVehicleIds = vehicles
          .filter(v => v.ownerCompanyId === req.user?.companyId)
          .map(v => v.id);
        
        insurances = insurances.filter(i => 
          i.vehicleId && companyVehicleIds.includes(i.vehicleId)
        );
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

// POST /api/insurances - Vytvorenie novej poistky
router.post('/', 
  authenticateToken,
  checkPermission('insurances', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { vehicleId, type, policyNumber, validFrom, validTo, price, company, paymentFrequency, filePath } = req.body;

    if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || !price || !company) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const createdInsurance = await postgresDatabase.createInsurance({
      vehicleId,
      type,
      policyNumber,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      price,
      company,
      paymentFrequency,
      filePath
    });

    res.status(201).json({
      success: true,
      message: 'Poistka úspešne vytvorená',
      data: createdInsurance
    });

  } catch (error) {
    console.error('Create insurance error:', error);
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
  try {
    const { id } = req.params;
    const { vehicleId, type, policyNumber, validFrom, validTo, price, company, insurerId, paymentFrequency, filePath } = req.body;

    if (!vehicleId || !type || !policyNumber || !validFrom || !validTo || !price || !company) {
      return res.status(400).json({
        success: false,
        error: 'Všetky povinné polia musia byť vyplnené'
      });
    }

    const updatedInsurance = await postgresDatabase.updateInsurance(id, {
      vehicleId,
      type,
      policyNumber,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      price,
      company,
      insurerId, // Nový parameter
      paymentFrequency,
      filePath
    });

    res.json({
      success: true,
      message: 'Poistka úspešne aktualizovaná',
      data: updatedInsurance
    });

  } catch (error) {
    console.error('Update insurance error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii poistky'
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