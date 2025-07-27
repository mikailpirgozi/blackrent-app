import express, { Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { postgresDatabase } from '../models/postgres-database';
import { ApiResponse, UserCompanyAccess, CompanyPermissions } from '../types';

const router = express.Router();

// GET /api/permissions/user/:userId - Získanie práv používateľa
router.get('/user/:userId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    const permissions = await postgresDatabase.getUserPermissions(userId);
    
    res.json({
      success: true,
      data: permissions,
      message: 'Práva používateľa úspešne načítané'
    });
  } catch (error: any) {
    console.error('❌ Chyba pri získavaní práv používateľa:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní práv používateľa'
    });
  }
});

// GET /api/permissions/user/:userId/access - Získanie prístupu používateľa k firmám
router.get('/user/:userId/access', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    
    // Kontrola - používateľ môže vidieť len svoje práva, admin všetky
    if (req.user?.role !== 'admin' && req.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Nemáte oprávnenie na zobrazenie týchto práv'
      });
    }
    
    const access = await postgresDatabase.getUserCompanyAccess(userId);
    
    // ✅ Dáta už obsahujú správne company UUID a názvy z migrácie 13
    console.log(`🔐 API getUserCompanyAccess - returning ${access.length} company access records for user ${userId}`);
    
    res.json({
      success: true,
      data: access,
      message: 'Prístup k firmám úspešne načítaný'
    });
  } catch (error: any) {
    console.error('❌ Chyba pri získavaní prístupu k firmám:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní prístupu k firmám'
    });
  }
});

// POST /api/permissions/user/:userId/company/:companyId - Nastavenie práv používateľa na firmu
router.post('/user/:userId/company/:companyId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId, companyId } = req.params;
    const permissions: CompanyPermissions = req.body.permissions;
    
    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: 'Práva sú povinné'
      });
    }
    
    await postgresDatabase.setUserPermission(userId, companyId, permissions);
    
    res.json({
      success: true,
      message: 'Práva používateľa úspešne nastavené'
    });
  } catch (error: any) {
    console.error('❌ Chyba pri nastavovaní práv:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri nastavovaní práv'
    });
  }
});

// DELETE /api/permissions/user/:userId/company/:companyId - Odstránenie práv používateľa na firmu
router.delete('/user/:userId/company/:companyId', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId, companyId } = req.params;
    
    await postgresDatabase.removeUserPermission(userId, companyId);
    
    res.json({
      success: true,
      message: 'Práva používateľa úspešne odstránené'
    });
  } catch (error: any) {
    console.error('❌ Chyba pri odstraňovaní práv:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri odstraňovaní práv'
    });
  }
});

// GET /api/permissions/company/:companyId/users - Získanie používateľov s prístupom k firme
router.get('/company/:companyId/users', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { companyId } = req.params;
    const users = await postgresDatabase.getUsersWithCompanyAccess(companyId);
    
    res.json({
      success: true,
      data: users,
      message: 'Používatelia s prístupom k firme úspešne načítaní'
    });
  } catch (error: any) {
    console.error('❌ Chyba pri získavaní používateľov firmy:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní používateľov firmy'
    });
  }
});

// POST /api/permissions/bulk - Hromadné nastavenie práv
router.post('/bulk', authenticateToken, requireRole(['admin']), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { assignments } = req.body;
    
    if (!Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        error: 'Assignments musí byť pole'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const assignment of assignments) {
      try {
        const { userId, companyId, permissions } = assignment;
        await postgresDatabase.setUserPermission(userId, companyId, permissions);
        results.push({ userId, companyId, success: true });
      } catch (error: any) {
        errors.push({ 
          userId: assignment.userId, 
          companyId: assignment.companyId, 
          error: error.message 
        });
      }
    }
    
    res.json({
      success: true,
      data: { results, errors },
      message: `Hromadné nastavenie práv dokončené: ${results.length} úspešných, ${errors.length} chýb`
    });
  } catch (error: any) {
    console.error('❌ Chyba pri hromadnom nastavovaní práv:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri hromadnom nastavovaní práv'
    });
  }
});

export default router; 