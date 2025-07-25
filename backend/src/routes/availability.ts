import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addDays, startOfDay } from 'date-fns';

const router = Router();

// GET /api/availability/calendar - Kalendárne dáta pre mesiac
router.get('/calendar', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { year, month, startDate: customStartDate, endDate: customEndDate } = req.query;
    
    console.log('🗓️ Availability calendar request:', { year, month, customStartDate, customEndDate });
    
    let startDate: Date;
    let endDate: Date;
    
    if (customStartDate && customEndDate) {
      // Custom date range (od-do)
      startDate = startOfDay(new Date(customStartDate as string));
      endDate = startOfDay(new Date(customEndDate as string));
      console.log('📅 Using custom date range:', { startDate, endDate });
    } else if (year && month) {
      // Ak sú zadané rok a mesiac, zobraziť celý mesiac (pre navigáciu)
      const targetYear = Number(year);
      const targetMonth = Number(month) - 1;
      startDate = startOfMonth(new Date(targetYear, targetMonth));
      endDate = endOfMonth(startDate);
      console.log('📅 Using month navigation:', { startDate, endDate });
    } else {
      // Default: od dnešného dňa + 30 dní dopredu
      const today = startOfDay(new Date());
      startDate = today;
      endDate = addDays(today, 30);
      console.log('📅 Using default range (today + 30 days):', { startDate, endDate });
    }
    
    console.log('📅 Date range:', { startDate, endDate });
    
    // Get all vehicles - this works fine
    const vehicles = await postgresDatabase.getVehicles();
    console.log('🚗 Found vehicles:', vehicles.length);
    
    // Get rental data for the month range
    let monthRentals: any[] = [];
    try {
      console.log('📋 Fetching rentals data...');
      const allRentals = await postgresDatabase.getRentals();
      
      // Filter rentals that overlap with our month
      monthRentals = allRentals.filter(rental => {
        const rentalStart = new Date(rental.startDate);
        const rentalEnd = new Date(rental.endDate);
        
        // Check if rental overlaps with our month range
        return rentalStart <= endDate && rentalEnd >= startDate;
      });
      
      console.log('📋 Found rentals in month:', monthRentals.length, 'out of', allRentals.length, 'total');
    } catch (rentalError) {
      console.error('⚠️ Error loading rentals, using empty array:', rentalError);
      monthRentals = []; // Fallback to empty array
    }

    // Get vehicle unavailabilities for the date range
    let monthUnavailabilities: any[] = [];
    try {
      console.log('🔧 Fetching vehicle unavailabilities...');
      
      const allUnavailabilities = await postgresDatabase.getUnavailabilitiesForDateRange(startDate, endDate);
      monthUnavailabilities = allUnavailabilities || [];
      
      console.log('🔧 Found unavailabilities in period:', monthUnavailabilities.length);
    } catch (unavailabilityError) {
      console.error('⚠️ Error loading unavailabilities, using empty array:', unavailabilityError);
      monthUnavailabilities = []; // Fallback to empty array
    }
      
      // Generovať kalendárne dáta
      const calendarData = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dayRentals = monthRentals.filter(rental => {
          const rentalStart = new Date(rental.startDate);
          const rentalEnd = new Date(rental.endDate);
          return rentalStart <= date && rentalEnd >= date;
        });

        // Check unavailabilities for this date
        const dayUnavailabilities = monthUnavailabilities.filter(unavailability => {
          const unavailabilityStart = new Date(unavailability.startDate);
          const unavailabilityEnd = new Date(unavailability.endDate);
          return unavailabilityStart <= date && unavailabilityEnd >= date;
        });

        const vehicleAvailability = vehicles.map(vehicle => {
          const isRented = dayRentals.some(rental => rental.vehicleId === vehicle.id);
          const rental = dayRentals.find(r => r.vehicleId === vehicle.id);
          
          // Check if vehicle has unavailability on this date
          const unavailability = dayUnavailabilities.find(u => u.vehicleId === vehicle.id);
          
          let status = 'available';
          let additionalData = {};
          
          if (isRented) {
            status = 'rented';
            additionalData = {
              rentalId: rental?.id || null,
              customerName: rental?.customerName || null
            };
          } else if (unavailability) {
            status = unavailability.type; // maintenance, service, repair, blocked, cleaning, inspection
            additionalData = {
              unavailabilityId: unavailability.id,
              unavailabilityReason: unavailability.reason,
              unavailabilityType: unavailability.type,
              unavailabilityPriority: unavailability.priority
            };
          } else if (vehicle.status === 'maintenance') {
            status = 'maintenance'; // Fallback to vehicle's own status
          }
          
          return {
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            licensePlate: vehicle.licensePlate,
            status: status,
            ...additionalData
          };
        });

        return {
          date: format(date, 'yyyy-MM-dd'),
          vehicles: vehicleAvailability
        };
      });

      res.json({
        success: true,
        data: {
          calendar: calendarData,
          vehicles: vehicles,
          rentals: monthRentals,
          unavailabilities: monthUnavailabilities,
          period: {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            type: (year && month) ? 'month' : 'days',
            year: year ? Number(year) : startDate.getFullYear(),
            month: month ? Number(month) : startDate.getMonth() + 1
          }
        }
             });
    
  } catch (error) {
    console.error('❌ Get availability calendar error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní kalendárnych dát'
    });
  }
});

// GET /api/availability/test - Jednoduchý test endpoint BEZ autentifikácie
router.get('/test', async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🧪 Availability test endpoint called');
    
    // SIMPLIFIED: Test without getRentals()
    const vehicles = await postgresDatabase.getVehicles();
    
    res.json({
      success: true,
      message: 'Availability API funguje!',
      data: {
        vehicleCount: vehicles.length,
        rentalCount: 0, // Simplified for now
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Availability test error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri testovaní availability API'
    });
  }
});

export default router; 