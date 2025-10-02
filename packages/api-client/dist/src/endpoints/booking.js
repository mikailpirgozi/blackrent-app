import { apiClient } from '../client';
/**
 * Booking API endpoints
 */
export const bookingApi = {
    /**
     * Get booking quote
     */
    getQuote: async (request) => {
        try {
            const response = await apiClient.post('/booking/quote', request);
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            // Fallback to mock quote
            console.warn('API quote failed, using mock quote');
            return getMockQuote(request);
        }
        catch (error) {
            console.error('Booking quote error, using mock quote:', error);
            return getMockQuote(request);
        }
    },
    /**
     * Create new booking
     */
    createBooking: async (request) => {
        try {
            const response = await apiClient.post('/booking/create', request);
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            // Fallback to mock booking
            console.warn('API booking creation failed, using mock booking');
            return getMockBooking(request);
        }
        catch (error) {
            console.error('Create booking error, using mock booking:', error);
            return getMockBooking(request);
        }
    },
    /**
     * Get user bookings
     */
    getUserBookings: async (params = {}) => {
        try {
            const response = await apiClient.get('/booking/my-bookings', { params });
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            // Fallback to mock bookings
            console.warn('API bookings failed, using mock bookings');
            return getMockUserBookings(params);
        }
        catch (error) {
            console.error('Get user bookings error, using mock bookings:', error);
            return getMockUserBookings(params);
        }
    },
    /**
     * Get booking by ID
     */
    getBookingById: async (id) => {
        try {
            const response = await apiClient.get(`/booking/${id}`);
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            // Fallback to mock booking
            const mockBooking = getMockUserBookings().find(b => b.id === id);
            if (!mockBooking) {
                throw new Error(`Booking with ID ${id} not found`);
            }
            return mockBooking;
        }
        catch (error) {
            console.error(`Get booking ${id} error:`, error);
            const mockBooking = getMockUserBookings().find(b => b.id === id);
            if (!mockBooking) {
                throw new Error(`Booking with ID ${id} not found`);
            }
            return mockBooking;
        }
    },
    /**
     * Update booking
     */
    updateBooking: async (id, updates) => {
        try {
            const response = await apiClient.put(`/booking/${id}`, updates);
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            throw new Error('Failed to update booking');
        }
        catch (error) {
            console.error('Update booking error:', error);
            throw error;
        }
    },
    /**
     * Cancel booking
     */
    cancelBooking: async (id, reason) => {
        try {
            await apiClient.post(`/booking/${id}/cancel`, { reason });
        }
        catch (error) {
            console.error('Cancel booking error:', error);
            throw error;
        }
    },
};
// Mock data functions
const getMockQuote = (request) => {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const vehiclePrice = 50 * days; // Base price per day
    const extrasPrice = (request.extras?.length || 0) * 15; // 15€ per extra
    const deliveryPrice = request.pickupLocation !== request.dropoffLocation ? 25 : 0;
    return {
        vehiclePrice,
        extrasPrice,
        deliveryPrice,
        totalPrice: vehiclePrice + extrasPrice + deliveryPrice,
        currency: 'EUR',
        validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };
};
const getMockBooking = (request) => {
    return {
        id: 'booking-' + Date.now(),
        userId: 'mock-user-1',
        vehicleId: request.vehicleId,
        status: 'pending_payment',
        startDate: request.startDate,
        endDate: request.endDate,
        pickupLocation: request.pickupLocation,
        dropoffLocation: request.dropoffLocation,
        totalPrice: 150,
        priceBreakdown: {
            basePrice: 120,
            deliveryFee: 20,
            extras: 10,
            taxes: 0,
            discount: 0,
        },
        extras: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};
const getMockUserBookings = (params) => {
    const mockBookings = [
        {
            id: '1',
            userId: 'mock-user-1',
            vehicleId: '1',
            status: 'confirmed',
            startDate: '2024-12-20T10:00:00Z',
            endDate: '2024-12-22T10:00:00Z',
            pickupLocation: {
                address: 'Bratislava Airport',
                coordinates: { lat: 48.1702, lng: 17.2127 }
            },
            dropoffLocation: {
                address: 'Bratislava Airport',
                coordinates: { lat: 48.1702, lng: 17.2127 }
            },
            totalPrice: 178,
            priceBreakdown: {
                basePrice: 150,
                deliveryFee: 20,
                extras: 8,
                taxes: 0,
                discount: 0,
            },
            extras: [
                { id: 'gps', name: 'GPS', price: 5, quantity: 1 },
                { id: 'child-seat', name: 'Detská sedačka', price: 3, quantity: 1 }
            ],
            createdAt: '2024-12-15T10:00:00Z',
            updatedAt: '2024-12-15T10:00:00Z',
        },
        {
            id: '2',
            userId: 'mock-user-1',
            vehicleId: '2',
            status: 'active',
            startDate: '2024-12-18T09:00:00Z',
            endDate: '2024-12-19T18:00:00Z',
            pickupLocation: {
                address: 'Košice centrum',
                coordinates: { lat: 48.7164, lng: 21.2611 }
            },
            dropoffLocation: {
                address: 'Košice centrum',
                coordinates: { lat: 48.7164, lng: 21.2611 }
            },
            totalPrice: 65,
            priceBreakdown: {
                basePrice: 60,
                deliveryFee: 0,
                extras: 5,
                taxes: 0,
                discount: 0,
            },
            extras: [
                { id: 'gps', name: 'GPS', price: 5, quantity: 1 }
            ],
            createdAt: '2024-12-16T14:30:00Z',
            updatedAt: '2024-12-16T14:30:00Z',
        },
        {
            id: '3',
            userId: 'mock-user-1',
            vehicleId: '3',
            status: 'completed',
            startDate: '2024-12-10T08:00:00Z',
            endDate: '2024-12-12T20:00:00Z',
            pickupLocation: {
                address: 'Trenčín',
                coordinates: { lat: 48.8946, lng: 18.0446 }
            },
            dropoffLocation: {
                address: 'Bratislava',
                coordinates: { lat: 48.1486, lng: 17.1077 }
            },
            totalPrice: 265,
            priceBreakdown: {
                basePrice: 240,
                deliveryFee: 15,
                extras: 10,
                taxes: 0,
                discount: 0,
            },
            extras: [
                { id: 'autopilot', name: 'Autopilot', price: 5, quantity: 1 },
                { id: 'premium-audio', name: 'Premium Audio', price: 5, quantity: 1 }
            ],
            createdAt: '2024-12-08T16:00:00Z',
            updatedAt: '2024-12-12T20:30:00Z',
        },
    ];
    let filteredBookings = [...mockBookings];
    // Apply status filter
    if (params?.status) {
        filteredBookings = filteredBookings.filter(b => b.status === params.status);
    }
    // Apply date filters
    if (params?.startDate) {
        filteredBookings = filteredBookings.filter(b => b.startDate >= params.startDate);
    }
    if (params?.endDate) {
        filteredBookings = filteredBookings.filter(b => b.endDate <= params.endDate);
    }
    // Apply pagination
    if (params?.page && params?.limit) {
        const startIndex = (params.page - 1) * params.limit;
        const endIndex = startIndex + params.limit;
        filteredBookings = filteredBookings.slice(startIndex, endIndex);
    }
    return filteredBookings;
};
