import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { Company, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { cacheResponse, userSpecificCache, invalidateCache } from '../middleware/cache-middleware';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

// GET /api/companies - Získanie všetkých firiem
router.get('/', 
  authenticateToken,
  checkPermission('companies', 'read'),
  async (req: Request, res: Response<ApiResponse<Company[]>>) => {
  try {
    let companies = await postgresDatabase.getCompanies();
    
    console.log('🏢 Companies GET - user:', { 
      role: req.user?.role, 
      platformId: req.user?.platformId, 
      totalCompanies: companies.length 
    });
    
    // ✅ PLATFORM FILTERING: Admin a Company Admin vidia len firmy zo svojej platformy
    // Super admin vidí VŠETKY firmy (všetky platformy)
    if (req.user?.role !== 'super_admin' && (req.user?.role === 'admin' || req.user?.role === 'company_admin') && req.user.platformId) {
      const originalCount = companies.length;
      companies = companies.filter(c => c.platformId === req.user?.platformId);
      console.log('🌐 Platform Admin Filter:', {
        userRole: req.user.role,
        userPlatformId: req.user.platformId,
        originalCount,
        filteredCount: companies.length
      });
    }
    
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní firiem'
    });
  }
});

// POST /api/companies - Vytvorenie novej firmy
router.post('/', 
  authenticateToken,
  checkPermission('companies', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🏢 POST /api/companies - Creating company');
    console.log('🏢 Request body:', req.body);
    console.log('🏢 User:', req.user);
    
    const { name } = req.body;

    if (!name) {
      console.log('❌ Company name is missing');
      return res.status(400).json({
        success: false,
        error: 'Názov firmy je povinný'
      });
    }

    console.log('🏢 Creating company with name:', name);
    const createdCompany = await postgresDatabase.createCompany({ name });
    console.log('🏢 Company created:', createdCompany);

    res.status(201).json({
      success: true,
      message: 'Firma úspešne vytvorená',
      data: createdCompany
    });

      } catch (error) {
      console.error('❌ Create company error:', error);
      res.status(500).json({
        success: false,
        error: `Chyba pri vytváraní firmy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
      });
    }
});

// PUT /api/companies/:id - Aktualizácia firmy
router.put('/:id', 
  authenticateToken,
  checkPermission('companies', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const companyData = req.body;

    console.log('🏢 PUT /api/companies/:id - Updating company', id, companyData);

    const updatedCompany = await postgresDatabase.updateCompany(id, companyData);

    res.json({
      success: true,
      message: 'Firma úspešne aktualizovaná',
      data: updatedCompany
    });

  } catch (error) {
    console.error('❌ Update company error:', error);
    res.status(500).json({
      success: false,
      error: `Chyba pri aktualizácii firmy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
    });
  }
});

// DELETE /api/companies/:id - Vymazanie firmy
router.delete('/:id', 
  authenticateToken,
  checkPermission('companies', 'delete'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteCompany(id);

    res.json({
      success: true,
      message: 'Firma úspešne vymazaná'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní firmy'
    });
  }
});

// 🚀 GMAIL APPROACH: GET /api/companies/paginated - Rýchle vyhľadávanie firiem
router.get('/paginated', 
  authenticateToken,
  checkPermission('companies', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        search = '',
        city = 'all',
        country = 'all',
        status = 'all'
      } = req.query;

      console.log('🏢 Companies PAGINATED GET - params:', { 
        page, limit, search, city, country, status,
        role: req.user?.role, 
        userId: req.user?.id
      });

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Získaj paginated companies s filtrami
      const result = await postgresDatabase.getCompaniesPaginated({
        limit: limitNum,
        offset,
        search: search as string,
        city: city as string,
        country: country as string,
        status: status as string,
        userId: req.user?.id,
        userRole: req.user?.role
      });

      console.log(`📊 Found ${result.companies.length}/${result.total} companies (page ${pageNum})`);

      res.json({
        success: true,
        data: {
          companies: result.companies,
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
      console.error('Get paginated companies error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní firiem'
      });
    }
  }
);

export default router; 