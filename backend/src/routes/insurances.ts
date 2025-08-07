import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Insurance, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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
    const { vehicleId, type, policyNumber, validFrom, validTo, price, company, paymentFrequency, filePath } = req.body;

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
      paymentFrequency,
      filePath
    });

    res.json({
      success: true,
      message: 'Poistka úspešne aktualizovaná',
      data: updatedInsurance
    });

  } catch (error) {
    console.error('❌ UPDATE INSURANCE ERROR:', error);
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