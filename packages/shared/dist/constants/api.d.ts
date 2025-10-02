export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER: "/auth/register";
        readonly REFRESH: "/auth/refresh";
        readonly LOGOUT: "/auth/logout";
        readonly VERIFY_EMAIL: "/auth/verify-email";
        readonly RESET_PASSWORD: "/auth/reset-password";
        readonly OAUTH: {
            readonly GOOGLE: "/auth/oauth/google";
            readonly APPLE: "/auth/oauth/apple";
        };
    };
    readonly VEHICLES: {
        readonly LIST: "/vehicles";
        readonly DETAIL: "/vehicles/:id";
        readonly AVAILABILITY: "/vehicles/:id/availability";
        readonly REVIEWS: "/vehicles/:id/reviews";
        readonly SEARCH: "/vehicles/search";
    };
    readonly BOOKINGS: {
        readonly QUOTE: "/bookings/quote";
        readonly CREATE: "/bookings";
        readonly LIST: "/bookings";
        readonly DETAIL: "/bookings/:id";
        readonly CANCEL: "/bookings/:id/cancel";
        readonly MODIFY: "/bookings/:id/modify";
    };
    readonly PAYMENTS: {
        readonly INTENT: "/payments/intent";
        readonly CONFIRM: "/payments/confirm";
        readonly WEBHOOK: "/payments/webhook";
    };
    readonly USER: {
        readonly PROFILE: "/me/profile";
        readonly BOOKINGS: "/me/bookings";
        readonly NOTIFICATIONS: "/me/notifications";
        readonly PREFERENCES: "/me/preferences";
    };
    readonly STORE: {
        readonly PRODUCTS: "/store/products";
        readonly CART: "/store/cart";
        readonly CHECKOUT: "/store/checkout";
        readonly VOUCHERS: "/me/vouchers";
    };
    readonly ADMIN: {
        readonly VEHICLES: "/admin/vehicles";
        readonly BOOKINGS: "/admin/bookings";
        readonly STATISTICS: "/admin/statistics";
        readonly PAYOUTS: "/admin/payouts";
    };
};
export declare const API_BASE_URL: string;
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
};
