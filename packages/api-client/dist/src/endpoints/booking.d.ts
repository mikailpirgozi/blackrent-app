import type { Booking, BookingQuoteRequest as SharedBookingQuoteRequest, BookingStatus } from '@blackrent/shared';
export interface BookingQuoteResponse {
    vehiclePrice: number;
    extrasPrice: number;
    deliveryPrice: number;
    totalPrice: number;
    currency: string;
    validUntil: string;
}
export interface BookingListParams {
    page?: number;
    limit?: number;
    status?: BookingStatus;
    startDate?: string;
    endDate?: string;
}
/**
 * Booking API endpoints
 */
export declare const bookingApi: {
    /**
     * Get booking quote
     */
    getQuote: (request: SharedBookingQuoteRequest) => Promise<BookingQuoteResponse>;
    /**
     * Create new booking
     */
    createBooking: (request: SharedBookingQuoteRequest) => Promise<Booking>;
    /**
     * Get user bookings
     */
    getUserBookings: (params?: BookingListParams) => Promise<Booking[]>;
    /**
     * Get booking by ID
     */
    getBookingById: (id: string) => Promise<Booking>;
    /**
     * Update booking
     */
    updateBooking: (id: string, updates: Partial<SharedBookingQuoteRequest>) => Promise<Booking>;
    /**
     * Cancel booking
     */
    cancelBooking: (id: string, reason?: string) => Promise<void>;
};
//# sourceMappingURL=booking.d.ts.map