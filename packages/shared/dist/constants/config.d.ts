export declare const APP_CONFIG: {
    readonly NAME: "BlackRent";
    readonly VERSION: "1.0.0";
    readonly DESCRIPTION: "Platforma pre prenájom áut na Slovensku";
    readonly LANGUAGES: {
        readonly SK: "sk";
        readonly EN: "en";
        readonly DE: "de";
        readonly CZ: "cz";
    };
    readonly DEFAULT_LANGUAGE: "sk";
    readonly CURRENCIES: {
        readonly EUR: "EUR";
        readonly USD: "USD";
        readonly CZK: "CZK";
    };
    readonly DEFAULT_CURRENCY: "EUR";
    readonly BOOKING: {
        readonly MIN_ADVANCE_HOURS: 2;
        readonly MAX_ADVANCE_DAYS: 365;
        readonly MIN_RENTAL_HOURS: 4;
        readonly MAX_RENTAL_DAYS: 90;
    };
    readonly DELIVERY: {
        readonly FREE_DISTANCE_KM: 5;
        readonly BASE_FEE: 10;
        readonly PER_KM_FEE: 1.5;
        readonly MAX_DISTANCE_KM: 200;
    };
    readonly PAGINATION: {
        readonly DEFAULT_PAGE_SIZE: 20;
        readonly MAX_PAGE_SIZE: 100;
    };
    readonly CACHE: {
        readonly VEHICLES_TTL: number;
        readonly BOOKINGS_TTL: number;
        readonly USER_TTL: number;
    };
    readonly UPLOAD: {
        readonly MAX_FILE_SIZE: number;
        readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
        readonly ALLOWED_DOCUMENT_TYPES: readonly ["application/pdf", "image/jpeg", "image/png"];
    };
};
export type AppConfig = typeof APP_CONFIG;
