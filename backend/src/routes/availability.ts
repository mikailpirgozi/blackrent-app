import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

const router = Router();

// GET /api/availability/calendar - Kalendárne dáta pre mesiac
router.get('/calendar', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { year, month } = req.query;
    
    console.log('🗓️ Availability calendar request:', { year, month });
    
    // Ak nie sú zadané, použiť aktuálny mesiac
    const currentDate = new Date();
    const targetYear = year ? Number(year) : currentDate.getFullYear();
    const targetMonth = month ? Number(month) - 1 : currentDate.getMonth();
    
    const startDate = startOfMonth(new Date(targetYear, targetMonth));
    const endDate = endOfMonth(startDate);
    
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
      
      // Generovať kalendárne dáta
      const calendarData = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dayRentals = monthRentals.filter(rental => {
          const rentalStart = new Date(rental.startDate);
          const rentalEnd = new Date(rental.endDate);
          return rentalStart <= date && rentalEnd >= date;
        });

        const vehicleAvailability = vehicles.map(vehicle => {
          const isRented = dayRentals.some(rental => rental.vehicleId === vehicle.id);
          const rental = dayRentals.find(r => r.vehicleId === vehicle.id);
          
          return {
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            licensePlate: vehicle.licensePlate,
            status: vehicle.status === 'maintenance' ? 'maintenance' : (isRented ? 'rented' : 'available'),
            rentalId: rental?.id || null,
            customerName: rental?.customerName || null
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
          period: {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            year: targetYear,
            month: targetMonth + 1
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