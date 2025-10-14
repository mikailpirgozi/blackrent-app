/**
 * Public API Routes
 * Public endpoints for unauthenticated access (mobile app customers)
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse, Vehicle } from '../types';
import { logger } from '../utils/logger';

const router: Router = Router();

// ============================================================================
// 🌐 PUBLIC VEHICLE ENDPOINTS (No authentication required)
// ============================================================================

/**
 * GET /api/public/vehicles - Get list of available vehicles
 * Public endpoint for mobile app
 */
router.get('/vehicles', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = 'all',
      brand = 'all',
      transmission = 'all',
      fuelType = 'all',
      priceMin = '',
      priceMax = '',
      seats = '',
      location = '',
      sort = 'newest',
    } = req.query;

    logger.info('📱 Public API: Fetching vehicles', {
      page,
      limit,
      search,
      category,
      brand,
    });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get vehicles from database
    let vehicles = await postgresDatabase.getVehicles(false, false); // Don't include removed or private

    // Filter only available vehicles for public
    vehicles = vehicles.filter((v) => v.status === 'available');

    // Apply search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      vehicles = vehicles.filter(
        (v) =>
          v.brand?.toLowerCase().includes(searchLower) ||
          v.model?.toLowerCase().includes(searchLower) ||
          v.licensePlate?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (category && category !== 'all') {
      vehicles = vehicles.filter((v) => v.category === category);
    }

    // Apply brand filter
    if (brand && brand !== 'all') {
      const brands = (brand as string).split(',');
      vehicles = vehicles.filter((v) => brands.includes(v.brand));
    }

    // Apply price filters
    if (priceMin) {
      const min = parseFloat(priceMin as string);
      vehicles = vehicles.filter((v) => {
        const lowestPrice = Math.min(...v.pricing.map((p) => p.pricePerDay));
        return lowestPrice >= min;
      });
    }

    if (priceMax) {
      const max = parseFloat(priceMax as string);
      vehicles = vehicles.filter((v) => {
        const lowestPrice = Math.min(...v.pricing.map((p) => p.pricePerDay));
        return lowestPrice <= max;
      });
    }

    // Apply sorting
    if (sort === 'price_asc') {
      vehicles.sort((a, b) => {
        const priceA = Math.min(...a.pricing.map((p) => p.pricePerDay));
        const priceB = Math.min(...b.pricing.map((p) => p.pricePerDay));
        return priceA - priceB;
      });
    } else if (sort === 'price_desc') {
      vehicles.sort((a, b) => {
        const priceA = Math.min(...a.pricing.map((p) => p.pricePerDay));
        const priceB = Math.min(...b.pricing.map((p) => p.pricePerDay));
        return priceB - priceA;
      });
    } else if (sort === 'name_asc') {
      vehicles.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
    } else if (sort === 'name_desc') {
      vehicles.sort((a, b) => `${b.brand} ${b.model}`.localeCompare(`${a.brand} ${a.model}`));
    } else if (sort === 'newest') {
      vehicles.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Pagination
    const total = vehicles.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginatedVehicles = vehicles.slice(offset, offset + limitNum);
    const hasMore = pageNum < totalPages;

    logger.info('✅ Public API: Vehicles fetched', {
      total,
      page: pageNum,
      returned: paginatedVehicles.length,
    });

    res.json({
      success: true,
      data: {
        vehicles: paginatedVehicles,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          hasMore,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    logger.error('❌ Public API: Get vehicles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicles',
    });
  }
});

/**
 * GET /api/public/vehicles/:id - Get single vehicle by ID
 */
router.get('/vehicles/:id', async (req: Request, res: Response<ApiResponse<Vehicle>>) => {
  try {
    const { id } = req.params;

    logger.info('📱 Public API: Fetching vehicle', { id });

    const vehicle = await postgresDatabase.getVehicle(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
    }

    // Only return if vehicle is available (not removed or private)
    if (vehicle.status === 'removed' || vehicle.status === 'private') {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
    }

    logger.info('✅ Public API: Vehicle fetched', { id, vehicle: `${vehicle.brand} ${vehicle.model}` });

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    logger.error('❌ Public API: Get vehicle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle',
    });
  }
});

/**
 * GET /api/public/vehicles/featured - Get featured vehicles
 */
router.get('/vehicles/featured', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit as string);

    logger.info('📱 Public API: Fetching featured vehicles', { limit: limitNum });

    let vehicles = await postgresDatabase.getVehicles(false, false);

    // Filter only available vehicles
    vehicles = vehicles.filter((v) => v.status === 'available');

    // Sort by newest and take top N
    vehicles.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const featuredVehicles = vehicles.slice(0, limitNum);

    logger.info('✅ Public API: Featured vehicles fetched', { count: featuredVehicles.length });

    res.json({
      success: true,
      data: {
        vehicles: featuredVehicles,
      },
    });
  } catch (error) {
    logger.error('❌ Public API: Get featured vehicles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured vehicles',
    });
  }
});

/**
 * GET /api/public/vehicles/brands - Get list of available brands
 */
router.get('/vehicles/brands', async (req: Request, res: Response<ApiResponse<string[]>>) => {
  try {
    logger.info('📱 Public API: Fetching vehicle brands');

    const vehicles = await postgresDatabase.getVehicles(false, false);
    const availableVehicles = vehicles.filter((v) => v.status === 'available');
    
    const brands = [...new Set(availableVehicles.map((v) => v.brand))].filter(Boolean).sort();

    logger.info('✅ Public API: Vehicle brands fetched', { count: brands.length });

    res.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    logger.error('❌ Public API: Get vehicle brands error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle brands',
    });
  }
});

/**
 * GET /api/public/vehicles/:id/availability - Check vehicle availability
 */
router.get('/vehicles/:id/availability', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    logger.info('📱 Public API: Checking vehicle availability', {
      id,
      startDate,
      endDate,
    });

    const vehicle = await postgresDatabase.getVehicle(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
    }

    // Get rentals for this vehicle in the date range
    const rentals = await postgresDatabase.getRentals();
    const vehicleRentals = rentals.filter((r) => r.vehicleId === id);

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Check for conflicts
    const conflicts = vehicleRentals.filter((rental) => {
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.endDate);

      // Check if dates overlap
      return (
        (start >= rentalStart && start <= rentalEnd) ||
        (end >= rentalStart && end <= rentalEnd) ||
        (start <= rentalStart && end >= rentalEnd)
      );
    });

    const available = conflicts.length === 0 && vehicle.status === 'available';

    logger.info('✅ Public API: Availability checked', {
      id,
      available,
      conflicts: conflicts.length,
    });

    res.json({
      success: true,
      data: {
        available,
        conflicts: conflicts.map((c) => ({
          startDate: c.startDate,
          endDate: c.endDate,
          reason: 'Vehicle is already rented',
        })),
      },
    });
  } catch (error) {
    logger.error('❌ Public API: Check availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability',
    });
  }
});

export default router;



