import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';

const router: Router = Router();

// ⚡ BULK DATA ENDPOINT - Načíta všetky dáta jedným requestom
router.get('/data', 
  authenticateToken, 
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('🚀 BULK: Loading all data in single request...');
      const startTime = Date.now();
      
      const user = req.user!;
      console.log('👤 BULK: User info:', { 
        id: user.id, 
        role: user.role, 
        companyId: user.companyId 
      });

      // ⚡ PHASE 1: Load all data in parallel (no filtering yet)
      console.log('📦 BULK: Phase 1 - Loading raw data...');
      const rawDataStart = Date.now();
      
      try {
        const [
          vehicles,
          rentals,
          customers,
          companies,
          insurers,
          expenses,
          insurances,
          settlements,
          vehicleDocuments,
          insuranceClaims
        ] = await Promise.all([
          postgresDatabase.getVehicles(true, true), // Zahrnúť všetky vozidlá vrátane vyradených a súkromných
          postgresDatabase.getRentals(),
          postgresDatabase.getCustomers(),
          postgresDatabase.getCompanies(),
          postgresDatabase.getInsurers(),
          postgresDatabase.getExpenses(),
          postgresDatabase.getInsurances(),
          postgresDatabase.getSettlements(), // ✅ OPRAVENÉ - načítavame settlements z databázy
          postgresDatabase.getVehicleDocuments(),
          postgresDatabase.getInsuranceClaims()
        ]);

        const rawDataTime = Date.now() - rawDataStart;
        console.log(`✅ BULK: Raw data loaded in ${rawDataTime}ms`);

        // ⚡ PHASE 2: Apply permission filtering (only if not admin)
        let filteredData = {
          vehicles,
          rentals,
          customers,
          companies,
          insurers,
          expenses,
          insurances,
          settlements,
          vehicleDocuments,
          insuranceClaims
        };

        if (user.role !== 'admin' && user.role !== 'super_admin') {
          console.log('🔐 BULK: Applying permission filtering...');
          const filterStart = Date.now();
          
          let allowedCompanyIds: string[] = [];
          let allowedCompanyNames: string[] = [];
          
          // ✅ PLATFORM FILTERING: Company admin with platformId sees all platform companies
          if (user.role === 'company_admin' && user.platformId) {
            console.log('🌐 BULK: Company admin - filtering by platform:', user.platformId);
            const platformCompanies = companies.filter(c => c.platformId === user.platformId);
            allowedCompanyIds = platformCompanies.map(c => c.id);
            allowedCompanyNames = platformCompanies.map(c => c.name);
          } else {
            // Get user permissions once (should be cached from Phase 2 optimization)
            const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
            allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
            allowedCompanyNames = userCompanyAccess.map(access => access.companyName);
          }
          
          console.log('🔐 BULK: User access:', {
            allowedCompanyIds: allowedCompanyIds.length,
            allowedCompanyNames: allowedCompanyNames.length,
            userRole: user.role,
            platformId: user.platformId
          });

          // Filter data based on permissions
          filteredData = {
            // Vehicles: filter by owner_company_id
            vehicles: vehicles.filter(v => 
              v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId)
            ),
            
            // Rentals: filter by vehicle ownership (historical)
            rentals: rentals.filter(rental => {
              if (rental.vehicle && rental.vehicle.ownerCompanyId) {
                return allowedCompanyIds.includes(rental.vehicle.ownerCompanyId);
              } else if (rental.vehicle && rental.vehicle.company) {
                return allowedCompanyNames.includes(rental.vehicle.company);
              }
              return false;
            }),
            
            // Customers: no filtering (all users can see all customers)
            customers,
            
            // Companies: filter to only accessible companies
            companies: companies.filter(c => 
              allowedCompanyIds.includes(c.id) || allowedCompanyNames.includes(c.name)
            ),
            
            // Insurers: no filtering
            insurers,
            
            // Expenses: filter by company
            expenses: expenses.filter(e => 
              allowedCompanyNames.includes(e.company)
            ),
            
            // Insurances: filter by company  
            insurances: insurances.filter(i => 
              i.company && allowedCompanyNames.includes(i.company)
            ),
            
            // Settlements: filter by company
            settlements: settlements.filter(s => 
              s.company && allowedCompanyNames.includes(s.company)
            ),
            
            // Vehicle Documents: filter by vehicle access
            vehicleDocuments: vehicleDocuments.filter(doc => {
              const allowedVehicleIds = filteredData.vehicles.map(v => v.id);
              return allowedVehicleIds.includes(doc.vehicleId);
            }),
            
            // Insurance Claims: filter by vehicle access
            insuranceClaims: insuranceClaims.filter(claim => {
              const allowedVehicleIds = filteredData.vehicles.map(v => v.id);
              return claim.vehicleId && allowedVehicleIds.includes(claim.vehicleId);
            })
          };

          const filterTime = Date.now() - filterStart;
          console.log(`🔐 BULK: Permission filtering applied in ${filterTime}ms`);
        }

        const totalTime = Date.now() - startTime;
        
        console.log('✅ BULK: All data loaded successfully:', {
          totalTime: `${totalTime}ms`,
          vehicles: filteredData.vehicles.length,
          rentals: filteredData.rentals.length,
          customers: filteredData.customers.length,
          companies: filteredData.companies.length,
          insurers: filteredData.insurers.length,
          expenses: filteredData.expenses.length,
          insurances: filteredData.insurances.length,
          settlements: filteredData.settlements.length,
          vehicleDocuments: filteredData.vehicleDocuments.length,
          insuranceClaims: filteredData.insuranceClaims.length
        });

        res.json({
          success: true,
          data: {
            ...filteredData,
            metadata: {
              loadTimeMs: totalTime,
              userRole: user.role,
              isFiltered: user.role !== 'admin',
              timestamp: new Date().toISOString()
            }
          }
        });

      } catch (dataError) {
        console.error('❌ BULK: Data loading error:', dataError);
        throw dataError;
      }

    } catch (error) {
      console.error('❌ BULK: Error loading bulk data:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri načítaní dát',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;