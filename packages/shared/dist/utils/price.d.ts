export declare const formatPrice: (price: number, currency?: string) => string;
export declare const formatPriceWithoutCurrency: (price: number) => string;
export declare const calculateTotalPrice: (basePrice: number, days: number, deliveryFee?: number, extras?: number, discount?: number) => number;
export declare const calculateVAT: (price: number, vatRate?: number) => number;
export declare const calculatePriceWithVAT: (price: number, vatRate?: number) => number;
export declare const calculateDeliveryFee: (distance: number, // in km
baseFee?: number, perKmFee?: number) => number;
export declare const applyDiscount: (price: number, discountPercent: number) => number;
export declare const calculateDeposit: (totalPrice: number, depositPercent?: number) => number;
