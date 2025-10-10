import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { Platform, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router: Router = Router();

// ============================================================================
// 🌐 PLATFORM MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/platforms - Get all platforms
 * Only super_admin can access this endpoint
 */
router.get('/', 
  authenticateToken,
  async (req: Request, res: Response<ApiResponse<Platform[]>>) => {
    try {
      // 🛡️ SECURITY: Only super_admin or admin can view all platforms
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý. Len super admin môže vidieť platformy.'
        });
      }

      const platforms = await postgresDatabase.getPlatforms();
      
      logger.info(`✅ Platforms retrieved by super admin: ${req.user.username}`, {
        count: platforms.length,
        userId: req.user.id
      });

      res.json({
        success: true,
        data: platforms
      });
    } catch (error) {
      logger.error('❌ Get platforms error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní platforiem'
      });
    }
  }
);

/**
 * GET /api/platforms/:id - Get platform by ID
 */
router.get('/:id',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse<Platform>>) => {
    try {
      const { id } = req.params;

      // 🛡️ SECURITY: Only super_admin or admin can view platform details
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý'
        });
      }

      const platform = await postgresDatabase.getPlatform(id);

      if (!platform) {
        return res.status(404).json({
          success: false,
          error: 'Platforma nenájdená'
        });
      }

      res.json({
        success: true,
        data: platform
      });
    } catch (error) {
      logger.error('❌ Get platform error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní platformy'
      });
    }
  }
);

/**
 * GET /api/platforms/:id/stats - Get platform statistics
 */
router.get('/:id/stats',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse<{
    totalCompanies: number;
    totalUsers: number;
    totalVehicles: number;
    totalRentals: number;
  }>>) => {
    try {
      const { id } = req.params;

      // 🛡️ SECURITY: Only super_admin or admin can view platform stats
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý'
        });
      }

      const stats = await postgresDatabase.getPlatformStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('❌ Get platform stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní štatistík platformy'
      });
    }
  }
);

/**
 * POST /api/platforms - Create new platform
 */
router.post('/',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse<Platform>>) => {
    try {
      // 🛡️ SECURITY: Only super_admin or admin can create platforms
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý. Len super admin môže vytvárať platformy.'
        });
      }

      const { name, displayName, subdomain, logoUrl, settings } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Názov platformy je povinný'
        });
      }

      const platform = await postgresDatabase.createPlatform({
        name,
        displayName,
        subdomain,
        logoUrl,
        settings
      });

      logger.info(`✅ Platform created by super admin: ${req.user.username}`, {
        platformId: platform.id,
        platformName: platform.name,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Platforma úspešne vytvorená',
        data: platform
      });
    } catch (error) {
      logger.error('❌ Create platform error:', error);
      res.status(500).json({
        success: false,
        error: `Chyba pri vytváraní platformy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
      });
    }
  }
);

/**
 * PUT /api/platforms/:id - Update platform
 */
router.put('/:id',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse<Platform>>) => {
    try {
      const { id } = req.params;

      // 🛡️ SECURITY: Only super_admin or admin can update platforms
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý'
        });
      }

      const platform = await postgresDatabase.updatePlatform(id, req.body);

      if (!platform) {
        return res.status(404).json({
          success: false,
          error: 'Platforma nenájdená'
        });
      }

      logger.info(`✅ Platform updated by super admin: ${req.user.username}`, {
        platformId: id,
        platformName: platform.name,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Platforma úspešne aktualizovaná',
        data: platform
      });
    } catch (error) {
      logger.error('❌ Update platform error:', error);
      res.status(500).json({
        success: false,
        error: `Chyba pri aktualizácii platformy: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
      });
    }
  }
);

/**
 * DELETE /api/platforms/:id - Delete platform
 */
router.delete('/:id',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse<void>>) => {
    try {
      const { id } = req.params;

      // 🛡️ SECURITY: Only super_admin or admin can delete platforms
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý'
        });
      }

      const deleted = await postgresDatabase.deletePlatform(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Platforma nenájdená'
        });
      }

      logger.info(`✅ Platform deleted by super admin: ${req.user.username}`, {
        platformId: id,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Platforma úspešne vymazaná'
      });
    } catch (error) {
      logger.error('❌ Delete platform error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vymazávaní platformy'
      });
    }
  }
);

/**
 * POST /api/platforms/:platformId/assign-company/:companyId - Assign company to platform
 */
router.post('/:platformId/assign-company/:companyId',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse<void>>) => {
    try {
      const { platformId, companyId } = req.params;

      // 🛡️ SECURITY: Only super_admin or admin can assign companies to platforms
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý'
        });
      }

      const success = await postgresDatabase.assignCompanyToPlatform(companyId, platformId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Firma alebo platforma nenájdená'
        });
      }

      logger.info(`✅ Company assigned to platform by super admin: ${req.user.username}`, {
        platformId,
        companyId,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Firma úspešne priradená k platforme'
      });
    } catch (error) {
      logger.error('❌ Assign company to platform error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri priraďovaní firmy k platforme'
      });
    }
  }
);

export default router;

