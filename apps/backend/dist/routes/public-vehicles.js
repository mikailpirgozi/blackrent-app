"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cache_middleware_1 = require("../middleware/cache-middleware");
const postgres_database_1 = require("../models/postgres-database");
const router = (0, express_1.Router)();
// Helper function to generate vehicle image URLs using local mobile app assets
const generateVehicleImageUrls = (vehicle) => {
    const images = [];
    try {
        // Map vehicle categories to appropriate images
        const categoryImageMap = {
            'mala-trieda': ['hero-image-1.webp', 'hero-image-2.webp', 'vehicle-1.webp'],
            'stredna-trieda': ['hero-image-3.webp', 'hero-image-4.webp', 'hero-image-5.webp'],
            'velka-trieda': ['hero-image-6.webp', 'hero-image-7.webp', 'hero-image-8.webp'],
            'premium': ['tesla-model-s.webp', 'tesla-model-s-42bc2b.webp', 'hero-image-9.webp'],
            'luxury': ['tesla-model-s.webp', 'tesla-model-s-42bc2b.webp', 'hero-image-10.webp'],
            'suv': ['hero-image-8.webp', 'hero-image-9.webp', 'hero-image-10.webp'],
            'electric': ['tesla-model-s.webp', 'tesla-model-s-42bc2b.webp']
        };
        // Get category-specific images or default images
        const category = vehicle.category || 'stredna-trieda';
        const categoryImages = categoryImageMap[category] || categoryImageMap['stredna-trieda'];
        // Use vehicle ID to consistently assign images (same vehicle = same images)
        const vehicleId = parseInt(vehicle.id) || 1;
        const imageIndex = vehicleId % categoryImages.length;
        // Add primary image and additional images for variety
        for (let i = 0; i < 3; i++) {
            const imgIndex = (imageIndex + i) % categoryImages.length;
            const imageName = categoryImages[imgIndex];
            // For mobile app, we'll use relative paths that the mobile app can resolve
            // The mobile app will handle these as local assets
            images.push(`assets/images/vehicles/${imageName}`);
        }
        // Add some generic vehicle images as fallbacks
        images.push('assets/images/vehicles/vehicle-card-default.webp');
        images.push('assets/images/vehicles/vehicle-main-image.png');
        // Final fallback placeholder
        images.push('https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Vehicle+Image');
    }
    catch (error) {
        console.error('Error generating vehicle image URLs:', error);
        // Return default images if error
        images.push('assets/images/vehicles/vehicle-card-default.webp');
        images.push('https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Vehicle+Image');
    }
    return images;
};
// GET /api/public/vehicles - Public endpoint pre mobilnú aplikáciu (bez autentifikácie)
router.get('/', (0, cache_middleware_1.cacheResponse)('vehicles', {
    ttl: 15 * 60 * 1000, // 15 minutes cache
    tags: ['vehicles', 'public']
}), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const featured = req.query.featured === 'true';
        const search = req.query.search;
        const sort = req.query.sort || 'popularity';
        // Získaj len aktívne vozidlá (nie vyradené, nie súkromné)
        let vehicles = await postgres_database_1.postgresDatabase.getVehicles(false, false);
        console.log('🚗 Public Vehicles GET:', {
            totalVehicles: vehicles.length,
            limit,
            page,
            featured,
            search,
            sort
        });
        // Filter len vozidlá ktoré sú dostupné pre verejnosť
        vehicles = vehicles.filter(v => {
            return v.status === 'available';
        });
        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            vehicles = vehicles.filter(v => v.brand?.toLowerCase().includes(searchLower) ||
                v.model?.toLowerCase().includes(searchLower) ||
                v.company?.toLowerCase().includes(searchLower) ||
                v.licensePlate?.toLowerCase().includes(searchLower));
        }
        // Apply sorting
        vehicles = vehicles.sort((a, b) => {
            switch (sort) {
                case 'price_asc':
                    // Get the lowest price from pricing tiers
                    const aMinPrice = Math.min(...(a.pricing?.map(p => p.pricePerDay) || [0]));
                    const bMinPrice = Math.min(...(b.pricing?.map(p => p.pricePerDay) || [0]));
                    return aMinPrice - bMinPrice;
                case 'price_desc':
                    // Get the lowest price from pricing tiers
                    const aMaxPrice = Math.min(...(a.pricing?.map(p => p.pricePerDay) || [0]));
                    const bMaxPrice = Math.min(...(b.pricing?.map(p => p.pricePerDay) || [0]));
                    return bMaxPrice - aMaxPrice;
                case 'rating':
                    // Sort by year as fallback (rating not available in Vehicle type)
                    const aYear = a.year || 2000;
                    const bYear = b.year || 2000;
                    return bYear - aYear;
                case 'name_asc':
                    return (a.brand + ' ' + a.model).localeCompare(b.brand + ' ' + b.model);
                case 'name_desc':
                    return (b.brand + ' ' + b.model).localeCompare(a.brand + ' ' + a.model);
                case 'popularity':
                default:
                    // Default sorting: newer vehicles first, then by brand
                    const aYearDefault = a.year || 2000;
                    const bYearDefault = b.year || 2000;
                    if (aYearDefault !== bYearDefault) {
                        return bYearDefault - aYearDefault;
                    }
                    return (a.brand + ' ' + a.model).localeCompare(b.brand + ' ' + b.model);
            }
        });
        // Ak chceme featured vozidlá, môžeme ich zoradiť podľa roku alebo názvu
        if (featured) {
            vehicles = vehicles.sort((a, b) => {
                // Zoradiť podľa roku (novšie vozidlá prvé)
                const aYear = a.year || 2000;
                const bYear = b.year || 2000;
                return bYear - aYear;
            });
        }
        // Apply pagination
        const total = vehicles.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedVehicles = vehicles.slice(startIndex, endIndex);
        // Add image URLs to each vehicle
        const vehiclesWithImages = paginatedVehicles.map(vehicle => ({
            ...vehicle,
            images: generateVehicleImageUrls(vehicle)
        }));
        res.json({
            success: true,
            data: vehiclesWithImages,
            _meta: {
                total,
                page,
                limit,
                totalPages,
                hasMore: page < totalPages,
            }
        });
    }
    catch (error) {
        console.error('Get public vehicles error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní vozidiel'
        });
    }
});
// GET /api/public/vehicles/:id - Public detail vozidla
router.get('/:id', (0, cache_middleware_1.cacheResponse)('vehicles', {
    ttl: 10 * 60 * 1000, // 10 minutes cache
    tags: ['vehicles', 'public']
}), async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const vehicle = await postgres_database_1.postgresDatabase.getVehicle(vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nenájdené'
            });
        }
        // Skontroluj či je vozidlo dostupné pre verejnosť
        if (vehicle.status !== 'available') {
            return res.status(404).json({
                success: false,
                error: 'Vozidlo nie je dostupné'
            });
        }
        console.log('🚗 Public Vehicle Detail GET:', {
            vehicleId,
            licensePlate: vehicle.licensePlate
        });
        // Add image URLs to vehicle
        const vehicleWithImages = {
            ...vehicle,
            images: generateVehicleImageUrls(vehicle)
        };
        res.json({
            success: true,
            data: vehicleWithImages
        });
    }
    catch (error) {
        console.error('Get public vehicle detail error:', error);
        res.status(500).json({
            success: false,
            error: 'Chyba pri získavaní detailu vozidla'
        });
    }
});
exports.default = router;
//# sourceMappingURL=public-vehicles.js.map