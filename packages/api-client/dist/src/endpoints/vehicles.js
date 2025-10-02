import { apiClient } from '../client';
// Transform backend vehicle data to mobile format
const transformBackendVehicle = (backendVehicle) => {
    // Get base price (first pricing tier)
    const basePrice = backendVehicle.pricing?.[0]?.pricePerDay || 50;
    // Generate vehicle name from brand and model
    const name = `${backendVehicle.brand} ${backendVehicle.model}`;
    // Map category to type
    const getVehicleType = (category) => {
        if (!category)
            return 'standard';
        const categoryMap = {
            'mala-trieda': 'economy',
            'stredna-trieda': 'intermediate',
            'velka-trieda': 'full_size',
            premium: 'premium',
            luxury: 'luxury',
            suv: 'suv',
            electric: 'electric',
        };
        return categoryMap[category] || 'standard';
    };
    return {
        id: backendVehicle.id,
        name,
        type: getVehicleType(backendVehicle.category),
        brand: backendVehicle.brand,
        model: backendVehicle.model,
        year: backendVehicle.year,
        fuelType: 'gasoline', // Default, could be enhanced
        transmission: 'manual', // Default, could be enhanced
        seats: 5, // Default
        doors: 4, // Default
        features: ['GPS', 'Klimatizácia'], // Default features
        images: backendVehicle.images || [], // Use real images from R2 storage
        pricePerDay: basePrice,
        pricePerKm: backendVehicle.extraKilometerRate || 0.3,
        deposit: Math.round(basePrice * 5), // 5x daily rate as deposit
        available: backendVehicle.status === 'available',
        location: {
            city: 'Bratislava', // Default, could be enhanced
            address: 'Hlavná 1, Bratislava', // Default
            coordinates: { lat: 48.1486, lng: 17.1077 },
        },
        company: {
            id: 'company-1', // Default
            name: backendVehicle.company,
            rating: 4.5, // Default
            reviewsCount: 50, // Default
        },
        rating: 4.5, // Default
        reviewsCount: 50, // Default
        createdAt: backendVehicle.createdAt,
        updatedAt: backendVehicle.createdAt,
    };
};
/**
 * Vehicle API endpoints
 */
export const vehiclesApi = {
    /**
     * Get list of vehicles with pagination and filters
     */
    getVehicles: async (params = {}) => {
        try {
            console.log('🚗 Fetching vehicles with params:', params);
            // Use public endpoint for mobile app (no auth required)
            const response = await apiClient.get('/public/vehicles', {
                params,
                timeout: 5000,
            });
            console.log('✅ Vehicles API response:', {
                success: response.data?.success,
                dataLength: response.data?.data?.length,
                total: response.data?.total,
            });
            if (response.data?.success && response.data?.data) {
                // Transform backend data to mobile format
                const transformedVehicles = response.data.data.map(transformBackendVehicle);
                // Get pagination info from _meta or fallback to defaults
                const meta = response.data._meta || {};
                const total = meta.total || response.data.data.length;
                const page = meta.page || params.page || 1;
                const limit = meta.limit || params.limit || 10;
                const totalPages = meta.totalPages || Math.ceil(total / limit);
                const hasMore = meta.hasMore !== undefined ? meta.hasMore : page < totalPages;
                return {
                    data: transformedVehicles,
                    total,
                    page,
                    limit,
                    totalPages,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
                    hasMore,
                };
            }
            // Fallback to mock data
            console.warn('⚠️ API returned no vehicles, using mock data');
            return getMockVehiclesPaginated(params);
        }
        catch (error) {
            console.error('❌ Error fetching vehicles from API:', {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                baseURL: apiClient.defaults.baseURL,
            });
            console.warn('🔄 Using mock data as fallback');
            return getMockVehiclesPaginated(params);
        }
    },
    /**
     * Get vehicle by ID
     */
    getVehicleById: async (id) => {
        try {
            console.log('🚗 Fetching vehicle by ID:', id);
            // Use public endpoint for mobile app (no auth required)
            const response = await apiClient.get(`/public/vehicles/${id}`, {
                timeout: 5000,
            });
            console.log('✅ Vehicle by ID API response:', {
                success: response.data?.success,
                hasData: !!response.data?.data,
                vehicleId: id,
            });
            if (response.data?.success && response.data?.data) {
                return transformBackendVehicle(response.data.data);
            }
            // Fallback to mock data
            console.warn(`⚠️ API returned no data for vehicle ${id}, using mock data`);
            const mockVehicle = getMockFeaturedVehicles(10).find(v => v.id === id);
            if (!mockVehicle) {
                throw new Error(`Vehicle with ID ${id} not found`);
            }
            return mockVehicle;
        }
        catch (error) {
            console.error(`❌ Error fetching vehicle ${id} from API:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                baseURL: apiClient.defaults.baseURL,
            });
            console.warn('🔄 Using mock data as fallback');
            const mockVehicle = getMockFeaturedVehicles(10).find(v => v.id === id);
            if (!mockVehicle) {
                throw new Error(`Vehicle with ID ${id} not found in mock data`);
            }
            return mockVehicle;
        }
    },
    /**
     * Check vehicle availability for specific dates
     */
    checkAvailability: async (params) => {
        const response = await apiClient.post(`/vehicles/${params.vehicleId}/availability`, {
            startDate: params.startDate,
            endDate: params.endDate,
        });
        return response.data;
    },
    /**
     * Get vehicle reviews
     */
    getVehicleReviews: async (vehicleId, page = 1, limit = 10) => {
        const response = await apiClient.get(`/vehicles/${vehicleId}/reviews`, {
            params: { page, limit },
        });
        return response.data;
    },
    /**
     * Get featured vehicles
     */
    getFeaturedVehicles: async (limit = 10) => {
        try {
            console.log('🚗 Fetching featured vehicles from:', apiClient.defaults.baseURL);
            // Try public vehicles endpoint first (no auth required)
            const response = await apiClient.get('/public/vehicles', {
                params: {
                    limit,
                    featured: true,
                    includeRemoved: false,
                    includePrivate: false,
                },
                timeout: 5000, // 5 second timeout
            });
            console.log('✅ Featured vehicles API response:', {
                success: response.data?.success,
                dataLength: response.data?.data?.length,
                status: response.status,
            });
            if (response.data?.success && response.data?.data) {
                // Transform backend data to mobile format
                const transformedVehicles = response.data.data.map(transformBackendVehicle);
                return transformedVehicles.slice(0, limit);
            }
            // Fallback to mock data
            console.warn('⚠️ API returned no featured vehicles, using mock data');
            return getMockFeaturedVehicles(limit);
        }
        catch (error) {
            // Enhanced error logging
            const errorInfo = {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                baseURL: apiClient.defaults.baseURL,
                isNetworkError: error.code === 'NETWORK_ERROR' ||
                    error.message?.includes('Network Error'),
                isTimeoutError: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
            };
            console.error('❌ Error fetching featured vehicles from API:', errorInfo);
            // Provide helpful error message for development
            if (errorInfo.isNetworkError) {
                console.error('🔧 Network Error Help:');
                console.error('1. Check if backend is running on port 3001');
                console.error("2. For mobile: Replace IP in API_BASE_URL with your computer's IP");
                console.error('3. Run: ifconfig | grep "inet " | grep -v 127.0.0.1');
                console.error('4. Current API URL:', apiClient.defaults.baseURL);
            }
            console.warn('🔄 Using mock data as fallback');
            return getMockFeaturedVehicles(limit);
        }
    },
    /**
     * Search vehicles by location
     */
    searchByLocation: async (location, params = {}) => {
        const response = await apiClient.get('/vehicles/search', {
            params: { location, ...params },
        });
        return response.data;
    },
};
// Mock data for development fallback
const getMockFeaturedVehicles = (limit) => {
    const mockVehicles = [
        {
            id: 'mock-1',
            name: 'BMW 3 Series',
            brand: 'BMW',
            model: '3 Series',
            type: 'premium',
            pricePerDay: 89,
            deposit: 500,
            available: true,
            rating: 4.8,
            reviewsCount: 124,
            company: {
                id: 'company-1',
                name: 'Premium Cars SK',
                rating: 4.8,
                reviewsCount: 124,
            },
            location: {
                city: 'Bratislava',
                address: 'Hlavná 1, Bratislava',
                coordinates: { lat: 48.1486, lng: 17.1077 },
            },
            features: ['GPS', 'Klimatizácia', 'Bluetooth', 'Kožené sedadlá'],
            seats: 5,
            doors: 4,
            transmission: 'automatic',
            fuelType: 'gasoline',
            images: [
                '/assets/images/vehicles/hero-image-1.webp',
                '/assets/images/vehicles/vehicle-thumb-1.png',
            ],
            year: 2022,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'mock-2',
            name: 'Volkswagen Golf',
            brand: 'Volkswagen',
            model: 'Golf',
            type: 'economy',
            pricePerDay: 45,
            deposit: 300,
            available: true,
            rating: 4.6,
            reviewsCount: 89,
            company: {
                id: 'company-2',
                name: 'Budget Rent SK',
                rating: 4.6,
                reviewsCount: 89,
            },
            location: {
                city: 'Košice',
                address: 'Hlavná 5, Košice',
                coordinates: { lat: 48.7164, lng: 21.2611 },
            },
            features: ['GPS', 'Klimatizácia', 'USB porty'],
            seats: 5,
            doors: 4,
            transmission: 'manual',
            fuelType: 'gasoline',
            images: [
                '/assets/images/vehicles/hero-image-2.webp',
                '/assets/images/vehicles/vehicle-thumb-2.png',
            ],
            year: 2021,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'mock-3',
            name: 'Tesla Model 3',
            brand: 'Tesla',
            model: 'Model 3',
            type: 'electric',
            pricePerDay: 120,
            deposit: 800,
            available: true,
            rating: 4.9,
            reviewsCount: 156,
            company: {
                id: 'company-3',
                name: 'Electric Cars SK',
                rating: 4.9,
                reviewsCount: 156,
            },
            location: {
                city: 'Trenčín',
                address: 'Mierová 10, Trenčín',
                coordinates: { lat: 48.8946, lng: 18.0446 },
            },
            features: [
                'Autopilot',
                'Supercharging',
                'Premium Audio',
                'Panoramatická strecha',
            ],
            seats: 5,
            doors: 4,
            transmission: 'automatic',
            fuelType: 'electric',
            images: [
                '/assets/images/vehicles/tesla-model-s-42bc2b.webp',
                '/assets/images/vehicles/hero-image-3.webp',
            ],
            year: 2023,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'mock-4',
            name: 'Škoda Octavia',
            brand: 'Škoda',
            model: 'Octavia',
            type: 'standard',
            pricePerDay: 55,
            deposit: 400,
            available: true,
            rating: 4.5,
            reviewsCount: 203,
            company: {
                id: 'company-4',
                name: 'Family Rent SK',
                rating: 4.5,
                reviewsCount: 203,
            },
            location: {
                city: 'Žilina',
                address: 'Národná 15, Žilina',
                coordinates: { lat: 49.2233, lng: 18.7408 },
            },
            features: ['GPS', 'Klimatizácia', 'Veľký kufor', 'Bluetooth'],
            seats: 5,
            doors: 4,
            transmission: 'manual',
            fuelType: 'diesel',
            images: [
                '/assets/images/vehicles/hero-image-4.webp',
                '/assets/images/vehicles/vehicle-thumb-3.png',
            ],
            year: 2022,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'mock-5',
            name: 'Audi A4',
            brand: 'Audi',
            model: 'A4',
            type: 'premium',
            pricePerDay: 95,
            deposit: 600,
            available: true,
            rating: 4.7,
            reviewsCount: 87,
            company: {
                id: 'company-5',
                name: 'Luxury Drive SK',
                rating: 4.7,
                reviewsCount: 87,
            },
            location: {
                city: 'Bratislava',
                address: 'Štúrova 20, Bratislava',
                coordinates: { lat: 48.1486, lng: 17.1077 },
            },
            features: [
                'GPS',
                'Klimatizácia',
                'Kožené sedadlá',
                'Xenón svetlá',
                'Parkovacie senzory',
            ],
            seats: 5,
            doors: 4,
            transmission: 'automatic',
            fuelType: 'gasoline',
            images: [
                '/assets/images/vehicles/hero-image-5.webp',
                '/assets/images/vehicles/vehicle-thumb-4.png',
            ],
            year: 2023,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'mock-6',
            name: 'Hyundai i30',
            brand: 'Hyundai',
            model: 'i30',
            type: 'economy',
            pricePerDay: 40,
            deposit: 250,
            available: true,
            rating: 4.4,
            reviewsCount: 156,
            company: {
                id: 'company-6',
                name: 'City Cars SK',
                rating: 4.4,
                reviewsCount: 156,
            },
            location: {
                city: 'Prešov',
                address: 'Hlavná 25, Prešov',
                coordinates: { lat: 49.0014, lng: 21.2393 },
            },
            features: ['GPS', 'Klimatizácia', 'Bluetooth', 'USB porty'],
            seats: 5,
            doors: 4,
            transmission: 'manual',
            fuelType: 'gasoline',
            images: [
                '/assets/images/vehicles/hero-image-6.webp',
                '/assets/images/vehicles/vehicle-card-default.webp',
            ],
            year: 2021,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];
    console.log(`🔄 Returning ${Math.min(limit, mockVehicles.length)} mock vehicles out of ${mockVehicles.length} available`);
    return mockVehicles.slice(0, limit);
};
// Mock paginated vehicles
const getMockVehiclesPaginated = (params) => {
    let vehicles = getMockFeaturedVehicles(10);
    // Apply search filter
    if (params.search) {
        const searchLower = params.search.toLowerCase();
        vehicles = vehicles.filter(v => v.name.toLowerCase().includes(searchLower) ||
            v.company.name.toLowerCase().includes(searchLower) ||
            v.brand.toLowerCase().includes(searchLower) ||
            v.model.toLowerCase().includes(searchLower));
    }
    // Apply type filter (was category)
    if (params.filters?.type && params.filters.type.length > 0) {
        vehicles = vehicles.filter(v => params.filters?.type?.includes(v.type));
    }
    // Apply sorting
    if (params.sortBy) {
        vehicles.sort((a, b) => {
            let aValue, bValue;
            switch (params.sortBy) {
                case 'price':
                    aValue = a.pricePerDay;
                    bValue = b.pricePerDay;
                    break;
                case 'rating':
                    aValue = a.rating || 0;
                    bValue = b.rating || 0;
                    break;
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'newest':
                    aValue = a.year || 2020;
                    bValue = b.year || 2020;
                    break;
                default:
                    return 0;
            }
            if (params.sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            }
            return aValue > bValue ? 1 : -1;
        });
    }
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVehicles = vehicles.slice(startIndex, endIndex);
    const total = vehicles.length;
    const totalPages = Math.ceil(total / limit);
    return {
        data: paginatedVehicles,
        total,
        page,
        limit,
        totalPages,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
        hasMore: page < totalPages,
    };
};
