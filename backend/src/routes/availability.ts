import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addDays, startOfDay } from 'date-fns';

const router = Router();

// GET /api/availability/calendar - Kalendárne dáta pre mesiac
router.get('/calendar', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { year, month, startDate: customStartDate, endDate: customEndDate, phase } = req.query;
    
    console.log('🗓️ Availability calendar request:', { year, month, customStartDate, customEndDate, phase });
    
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
      // 🚀 PROGRESSIVE LOADING: Optimalizované načítanie podľa fázy
      const today = startOfDay(new Date());
      const currentMonth = startOfMonth(today);
      const endOfCurrentMonth = endOfMonth(today);
      
      switch (phase) {
        case 'current':
          // FÁZA 1: Len aktuálny mesiac (najrýchlejšie)
          startDate = currentMonth;
          endDate = endOfCurrentMonth;
          console.log('🎯 PHASE 1: Loading current month only:', { startDate, endDate });
          break;
          
        case 'past':
          // FÁZA 2: Minulé dáta (3 mesiace dozadu)
          startDate = addDays(today, -90);
          endDate = addDays(currentMonth, -1); // Do konca predchádzajúceho mesiaca
          console.log('📜 PHASE 2: Loading past data (-90 days to current month):', { startDate, endDate });
          break;
          
        case 'future':
          // FÁZA 3: Budúce dáta (6 mesiacov dopredu)
          startDate = addDays(endOfCurrentMonth, 1); // Od začiatku nasledujúceho mesiaca
          endDate = addDays(today, 180);
          console.log('🔮 PHASE 3: Loading future data (next month to +180 days):', { startDate, endDate });
          break;
          
        default:
          // PÔVODNÉ SPRÁVANIE: Celý rozšírený rozsah (pre backward compatibility)
          startDate = addDays(today, -90);
          endDate = addDays(today, 180);
          console.log('📅 FULL RANGE: Loading complete extended range (-90 to +180 days):', { startDate, endDate });
      }
    }
    
    console.log('📅 Date range:', { startDate, endDate });
    
    // 🚀 FÁZA 1.2: UNIFIED SQL QUERY - 1 optimalizovaný query namiesto 3 + JS processing
    console.log('🚀 Using unified calendar data query...');
    
    const unifiedResult = await postgresDatabase.getCalendarDataUnified(startDate, endDate);
    
    console.log('✅ Unified calendar data loaded:', {
      calendarDays: unifiedResult.calendar.length,
      vehicles: unifiedResult.vehicles.length,
      unavailabilities: unifiedResult.unavailabilities.length
    });
    
    // Extrakcia dát z unified result
    const calendarData = unifiedResult.calendar;
    const vehicles = unifiedResult.vehicles;
    const monthRentals = unifiedResult.rentals;
    const monthUnavailabilities = unifiedResult.unavailabilities;

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
            month: month ? Number(month) : startDate.getMonth() + 1,
            // 🚀 PROGRESSIVE LOADING: Metadata o fáze
            phase: phase || 'full',
            isProgressive: !!phase,
            dayCount: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
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