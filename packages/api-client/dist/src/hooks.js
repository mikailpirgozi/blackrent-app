import { useInfiniteQuery, useMutation, useQuery, useQueryClient, } from '@tanstack/react-query';
import { authApi } from './endpoints/auth';
import { bookingApi, } from './endpoints/booking';
import { vehiclesApi, } from './endpoints/vehicles';
// Query keys
export const queryKeys = {
    vehicles: ['vehicles'],
    vehiclesList: (params) => [...queryKeys.vehicles, 'list', params],
    vehicleDetail: (id) => [...queryKeys.vehicles, 'detail', id],
    vehicleAvailability: (params) => [...queryKeys.vehicles, 'availability', params],
    vehicleReviews: (id, page) => [...queryKeys.vehicles, 'reviews', id, page],
    featuredVehicles: (limit) => [...queryKeys.vehicles, 'featured', limit],
    // Auth keys
    auth: ['auth'],
    profile: () => [...queryKeys.auth, 'profile'],
    // Booking keys
    bookings: ['bookings'],
    userBookings: (params) => [...queryKeys.bookings, 'user', params],
    bookingDetail: (id) => [...queryKeys.bookings, 'detail', id],
};
/**
 * Hook to get paginated list of vehicles
 */
export const useVehicles = (params = {}, options) => {
    return useQuery({
        queryKey: queryKeys.vehiclesList(params),
        queryFn: () => vehiclesApi.getVehicles(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
};
/**
 * Hook to get infinite list of vehicles (for infinite scrolling)
 */
export const useInfiniteVehicles = (params = {}, options) => {
    return useInfiniteQuery({
        queryKey: queryKeys.vehiclesList({ ...params, page: 0 }),
        queryFn: ({ pageParam }) => vehiclesApi.getVehicles({ ...params, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.hasMore) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
};
/**
 * Hook to get vehicle by ID
 */
export const useVehicle = (id, options) => {
    return useQuery({
        queryKey: queryKeys.vehicleDetail(id),
        queryFn: () => vehiclesApi.getVehicleById(id),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};
/**
 * Alias for useVehicle for consistency
 */
export const useVehicleById = useVehicle;
/**
 * Hook to check vehicle availability
 */
export const useVehicleAvailability = (params, options) => {
    return useQuery({
        queryKey: queryKeys.vehicleAvailability(params),
        queryFn: () => vehiclesApi.checkAvailability(params),
        enabled: !!(params.vehicleId && params.startDate && params.endDate),
        staleTime: 2 * 60 * 1000, // 2 minutes
        ...options,
    });
};
/**
 * Hook to get vehicle reviews
 */
export const useVehicleReviews = (vehicleId, page = 1, limit = 10, options) => {
    return useQuery({
        queryKey: queryKeys.vehicleReviews(vehicleId, page),
        queryFn: () => vehiclesApi.getVehicleReviews(vehicleId, page, limit),
        enabled: !!vehicleId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};
/**
 * Hook to get featured vehicles
 */
export const useFeaturedVehicles = (limit = 10, options) => {
    return useQuery({
        queryKey: queryKeys.featuredVehicles(limit),
        queryFn: () => vehiclesApi.getFeaturedVehicles(limit),
        staleTime: 15 * 60 * 1000, // 15 minutes
        ...options,
    });
};
// ===== AUTH HOOKS =====
/**
 * Hook for user login
 */
export const useLogin = (options) => {
    return useMutation({
        mutationFn: authApi.login,
        ...options,
    });
};
/**
 * Hook for user registration
 */
export const useRegister = (options) => {
    return useMutation({
        mutationFn: authApi.register,
        ...options,
    });
};
/**
 * Hook for user logout
 */
export const useLogout = (options) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            // Clear all cached data on logout
            queryClient.clear();
        },
        ...options,
    });
};
/**
 * Hook to get user profile
 */
export const useProfile = (options) => {
    return useQuery({
        queryKey: queryKeys.profile(),
        queryFn: authApi.getProfile,
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};
// ===== BOOKING HOOKS =====
/**
 * Hook to get booking quote
 */
export const useBookingQuote = (options) => {
    return useMutation({
        mutationFn: bookingApi.getQuote,
        ...options,
    });
};
/**
 * Hook to create booking
 */
export const useCreateBooking = (options) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bookingApi.createBooking,
        onSuccess: () => {
            // Invalidate user bookings to refresh the list
            queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
        },
        ...options,
    });
};
/**
 * Hook to get user bookings
 */
export const useUserBookings = (params = {}, options) => {
    return useQuery({
        queryKey: queryKeys.userBookings(params),
        queryFn: () => bookingApi.getUserBookings(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
};
/**
 * Hook to get booking by ID
 */
export const useBooking = (id, options) => {
    return useQuery({
        queryKey: queryKeys.bookingDetail(id),
        queryFn: () => bookingApi.getBookingById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
};
/**
 * Hook to cancel booking
 */
export const useCancelBooking = (options) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }) => bookingApi.cancelBooking(id, reason),
        onSuccess: () => {
            // Invalidate bookings to refresh the list
            queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
        },
        ...options,
    });
};
// Legacy alias for backward compatibility
export const useBookings = useUserBookings;
