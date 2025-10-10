// Debug endpoint to check user permissions
import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';

const router: Router = Router();

// GET /api/debug/user-info - Get current user info with permissions
router.get('/user-info', 
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      // Get user from database
      const user = await postgresDatabase.getUserById(req.user.id);
      
      res.json({
        success: true,
        data: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          role: user?.role,
          companyId: user?.companyId,
          platformId: user?.platformId,
          isActive: user?.isActive
        }
      });
    } catch (error) {
      console.error('Debug user info error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní info o používateľovi'
      });
    }
});

// GET /api/debug/rental/:id - Get rental info with vehicle company
router.get('/rental/:id',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { id } = req.params;
      
      const rental = await postgresDatabase.getRental(id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          error: 'Rental not found'
        });
      }

      let vehicle = null;
      if (rental.vehicleId) {
        vehicle = await postgresDatabase.getVehicle(rental.vehicleId);
      }

      res.json({
        success: true,
        data: {
          rental: {
            id: rental.id,
            customerName: rental.customerName,
            vehicleId: rental.vehicleId,
            startDate: rental.startDate,
            endDate: rental.endDate
          },
          vehicle: vehicle ? {
            id: vehicle.id,
            licensePlate: vehicle.licensePlate,
            ownerCompanyId: vehicle.ownerCompanyId
          } : null,
          access: {
            userRole: req.user?.role,
            userCompanyId: req.user?.companyId,
            vehicleCompanyId: vehicle?.ownerCompanyId,
            hasAccess: 
              req.user?.role === 'admin' || 
              req.user?.role === 'super_admin' ||
              (req.user?.role === 'company_admin' && req.user?.companyId === vehicle?.ownerCompanyId)
          }
        }
      });
    } catch (error) {
      console.error('Debug rental info error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní info o prenájme'
      });
    }
});

export default router;

