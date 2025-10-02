import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { CompanyInvestor, CompanyInvestorShare, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';

const router = Router();

// GET /api/company-investors - Získanie všetkých spoluinvestorov
router.get('/', 
  authenticateToken,
  checkPermission('companies', 'read'),
  async (req: Request, res: Response<ApiResponse<CompanyInvestor[]>>) => {
    try {
      const investors = await postgresDatabase.getCompanyInvestors();
      
      console.log('🤝 Company Investors GET:', { 
        role: req.user?.role, 
        totalInvestors: investors.length 
      });
      
      res.json({
        success: true,
        data: investors
      });
    } catch (error) {
      console.error('Get company investors error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní spoluinvestorov'
      });
    }
  }
);

// POST /api/company-investors - Vytvorenie nového spoluinvestora
router.post('/', 
  authenticateToken,
  checkPermission('companies', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { firstName, lastName, email, phone, personalId, address, notes } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Meno a priezvisko sú povinné'
        });
      }

      const createdInvestor = await postgresDatabase.createCompanyInvestor({
        firstName,
        lastName,
        email,
        phone,
        personalId,
        address,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Spoluinvestor úspešne vytvorený',
        data: createdInvestor
      });

    } catch (error) {
      console.error('Create company investor error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní spoluinvestora'
      });
    }
  }
);

// PUT /api/company-investors/:id - Aktualizácia spoluinvestora
router.put('/:id', 
  authenticateToken,
  checkPermission('companies', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedInvestor = await postgresDatabase.updateCompanyInvestor(id, updateData);

      res.json({
        success: true,
        message: 'Spoluinvestor úspešne aktualizovaný',
        data: updatedInvestor
      });

    } catch (error) {
      console.error('Update company investor error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii spoluinvestora'
      });
    }
  }
);

// DELETE /api/company-investors/:id - Vymazanie spoluinvestora
router.delete('/:id', 
  authenticateToken,
  checkPermission('companies', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      await postgresDatabase.deleteCompanyInvestor(id);

      res.json({
        success: true,
        message: 'Spoluinvestor úspešne vymazaný'
      });

    } catch (error) {
      console.error('Delete company investor error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vymazávaní spoluinvestora'
      });
    }
  }
);

// GET /api/company-investors/:companyId/shares - Získanie podielov pre firmu
router.get('/:companyId/shares', 
  authenticateToken,
  checkPermission('companies', 'read'),
  async (req: Request, res: Response<ApiResponse<CompanyInvestorShare[]>>) => {
    try {
      const { companyId } = req.params;
      const shares = await postgresDatabase.getCompanyInvestorShares(companyId);

      res.json({
        success: true,
        data: shares
      });
    } catch (error) {
      console.error('Get company investor shares error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní podielov'
      });
    }
  }
);

// POST /api/company-investors/shares - Priradenie spoluinvestora k firme
router.post('/shares', 
  authenticateToken,
  checkPermission('companies', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { 
        companyId, 
        investorId, 
        ownershipPercentage, 
        investmentAmount,
        isPrimaryContact,
        profitSharePercentage 
      } = req.body;

      if (!companyId || !investorId || ownershipPercentage === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Company ID, investor ID a ownership percentage sú povinné'
        });
      }

      const createdShare = await postgresDatabase.createCompanyInvestorShare({
        companyId,
        investorId,
        ownershipPercentage,
        investmentAmount,
        isPrimaryContact: isPrimaryContact || false,
        profitSharePercentage
      });

      res.status(201).json({
        success: true,
        message: 'Podiel spoluinvestora úspešne vytvorený',
        data: createdShare
      });

    } catch (error) {
      console.error('Create company investor share error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní podielu'
      });
    }
  }
);

// PUT /api/company-investors/shares/:id - Aktualizácia podielu
router.put('/shares/:id', 
  authenticateToken,
  checkPermission('companies', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedShare = await postgresDatabase.updateCompanyInvestorShare(id, updateData);

      res.json({
        success: true,
        message: 'Podiel úspešne aktualizovaný',
        data: updatedShare
      });

    } catch (error) {
      console.error('Update company investor share error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri aktualizácii podielu'
      });
    }
  }
);

// DELETE /api/company-investors/shares/:id - Vymazanie podielu
router.delete('/shares/:id', 
  authenticateToken,
  checkPermission('companies', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;

      await postgresDatabase.deleteCompanyInvestorShare(id);

      res.json({
        success: true,
        message: 'Podiel úspešne vymazaný'
      });

    } catch (error) {
      console.error('Delete company investor share error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vymazávaní podielu'
      });
    }
  }
);

export default router;
