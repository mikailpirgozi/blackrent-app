import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

const router = Router();

// GET /api/availability/paginated - Paginated availability calendar
router.get('/paginated',
  authenticateToken,
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response) => {
    try {
      const {
        vehiclePage = '1',
        vehicleLimit = '20',
        dateFrom = format(new Date(), 'yyyy-MM-dd'),
        dateTo = format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        search = '',
        categories = [],
        brands = [],
        companies = [],
        locations = [],
        availableOnly = 'false',
        minAvailabilityPercent = '0'
      } = req.query;

      const pageNum = parseInt(vehiclePage as string, 10);
      const limitNum = parseInt(vehicleLimit as string, 10);
      const offset = (pageNum - 1) * limitNum;
      const minAvailability = parseInt(minAvailabilityPercent as string, 10);

      // Parse array parameters
      const categoryList = Array.isArray(categories) ? categories : categories ? [categories] : [];
      const brandList = Array.isArray(brands) ? brands : brands ? [brands] : [];
      const companyList = Array.isArray(companies) ? companies : companies ? [companies] : [];
      const locationList = Array.isArray(locations) ? locations : locations ? [locations] : [];

      console.log('📅 Availability PAGINATED GET:', {
        role: req.user?.role,
        userId: req.user?.id,
        page: pageNum,
        limit: limitNum,
        dateFrom,
        dateTo
      });

      // Get all vehicles with permission filtering
      let vehicles = await postgresDatabase.getVehicles();
      
      // Permission filtering for non-admin users
      if (req.user?.role !== 'admin' && req.user) {
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(req.user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        vehicles = vehicles.filter(v => 
          v.ownerCompanyId && allowedCompanyIds.includes(v.ownerCompanyId)
        );
      }

      // Apply search and filters
      let filteredVehicles = [...vehicles];

      // Search filter
      if (search) {
        const searchLower = search.toString().toLowerCase();
        filteredVehicles = filteredVehicles.filter(v =>
          v.brand?.toLowerCase().includes(searchLower) ||
          v.model?.toLowerCase().includes(searchLower) ||
          v.licensePlate?.toLowerCase().includes(searchLower) ||
          v.company?.toLowerCase().includes(searchLower)
        );
      }

      // Category filter
      if (categoryList.length > 0) {
        filteredVehicles = filteredVehicles.filter(v =>
          categoryList.includes(v.category)
        );
      }

      // Brand filter
      if (brandList.length > 0) {
        filteredVehicles = filteredVehicles.filter(v =>
          brandList.includes(v.brand)
        );
      }

      // Company filter
      if (companyList.length > 0) {
        filteredVehicles = filteredVehicles.filter(v =>
          companyList.includes(v.company)
        );
      }

      // Location filter (if location field exists)
      if (locationList.length > 0) {
        filteredVehicles = filteredVehicles.filter(v =>
          locationList.includes((v as any).location || '')
        );
      }

      // Sort vehicles
      filteredVehicles.sort((a, b) => {
        const brandCompare = (a.brand || '').localeCompare(b.brand || '');
        if (brandCompare !== 0) return brandCompare;
        return (a.model || '').localeCompare(b.model || '');
      });

      // Calculate total before pagination
      const totalVehicles = filteredVehicles.length;
      const totalPages = Math.ceil(totalVehicles / limitNum);
      const hasMore = pageNum < totalPages;

      // Get paginated vehicles
      const paginatedVehicles = filteredVehicles.slice(offset, offset + limitNum);

      // Get rentals for the date range
      const rentals = await postgresDatabase.getRentals();
      
      // Generate date range
      const startDate = parseISO(dateFrom as string);
      const endDate = parseISO(dateTo as string);
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Calculate availability for each paginated vehicle
      const vehicleAvailability = paginatedVehicles.map(vehicle => {
        const dailyStatus = dateRange.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // Find rentals for this vehicle on this date
          const dayRentals = rentals.filter(rental => {
            if (rental.vehicleId !== vehicle.id) return false;
            
            const rentalStart = new Date(rental.startDate);
            const rentalEnd = new Date(rental.endDate);
            
            return date >= rentalStart && date <= rentalEnd;
          });

          if (dayRentals.length > 0) {
            const rental = dayRentals[0];
            const customer = rental.customerName || 'Neznámy zákazník';
            
            return {
              date: dateStr,
              status: 'rented' as const,
              reason: 'Prenájom',
              customerName: customer,
              rentalId: rental.id
            };
          }

          // Check for maintenance/service (if such data exists)
          // For now, assume available if not rented
          return {
            date: dateStr,
            status: 'available' as const,
            reason: undefined,
            customerName: undefined,
            rentalId: undefined
          };
        });

        const availableDays = dailyStatus.filter(d => d.status === 'available').length;
        const totalDays = dailyStatus.length;
        const availabilityPercent = totalDays > 0 
          ? Math.round((availableDays / totalDays) * 100) 
          : 0;

        // Apply availability filters
        if (availableOnly === 'true' && availabilityPercent < 100) {
          return null;
        }
        if (availabilityPercent < minAvailability) {
          return null;
        }

        return {
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          category: vehicle.category || 'other',
          company: vehicle.company || '',
          location: (vehicle as any).location || '',
          dailyStatus,
          availableDays,
          totalDays,
          availabilityPercent
        };
      }).filter(v => v !== null);

      console.log('📊 Paginated availability:', {
        totalVehicles,
        currentPage: pageNum,
        totalPages,
        hasMore,
        vehiclesReturned: vehicleAvailability.length,
        dateRangeDays: dateRange.length
      });

      res.json({
        success: true,
        vehicles: vehicleAvailability,
        pagination: {
          currentVehiclePage: pageNum,
          totalVehiclePages: totalPages,
          totalVehicles,
          hasMoreVehicles: hasMore,
          vehiclesPerPage: limitNum
        }
      });

    } catch (error) {
      console.error('Get paginated availability error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní dostupnosti'
      });
    }
  });

// GET /api/availability/calendar - Legacy endpoint for compatibility
router.get('/calendar',
  authenticateToken,
  checkPermission('vehicles', 'read'),
  async (req: Request, res: Response) => {
    try {
      const { dateFrom, dateTo } = req.query;
      
      // Redirect to paginated endpoint with full data
      const vehicles = await postgresDatabase.getVehicles();
      const rentals = await postgresDatabase.getRentals();
      
      // Generate calendar data (simplified)
      const startDate = parseISO(dateFrom as string || format(new Date(), 'yyyy-MM-dd'));
      const endDate = parseISO(dateTo as string || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      const calendar = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const vehicleStatuses = vehicles.map(vehicle => {
          const dayRentals = rentals.filter(rental => {
            if (rental.vehicleId !== vehicle.id) return false;
            
            const rentalStart = new Date(rental.startDate);
            const rentalEnd = new Date(rental.endDate);
            
            return date >= rentalStart && date <= rentalEnd;
          });

          if (dayRentals.length > 0) {
            const rental = dayRentals[0];
            return {
              vehicleId: vehicle.id,
              status: 'rented',
              customer_name: rental.customerName,
              rental_id: rental.id
            };
          }

          return {
            vehicleId: vehicle.id,
            status: 'available'
          };
        });

        return {
          date: dateStr,
          vehicles: vehicleStatuses
        };
      });

      res.json({
        success: true,
        calendar
      });

    } catch (error) {
      console.error('Get calendar error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní kalendára'
      });
    }
  });

export default router; 