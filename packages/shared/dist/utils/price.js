// Price utilities
export const formatPrice = (price, currency = 'EUR') => {
    return new Intl.NumberFormat('sk-SK', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
};
export const formatPriceWithoutCurrency = (price) => {
    return new Intl.NumberFormat('sk-SK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
};
export const calculateTotalPrice = (basePrice, days, deliveryFee = 0, extras = 0, discount = 0) => {
    const subtotal = (basePrice * days) + deliveryFee + extras;
    return Math.max(0, subtotal - discount);
};
export const calculateVAT = (price, vatRate = 0.20) => {
    return price * vatRate;
};
export const calculatePriceWithVAT = (price, vatRate = 0.20) => {
    return price + calculateVAT(price, vatRate);
};
export const calculateDeliveryFee = (distance, // in km
baseFee = 10, perKmFee = 1.5) => {
    if (distance <= 5)
        return 0; // Free delivery within 5km
    return baseFee + (distance - 5) * perKmFee;
};
export const applyDiscount = (price, discountPercent) => {
    const discount = price * (discountPercent / 100);
    return Math.max(0, price - discount);
};
export const calculateDeposit = (totalPrice, depositPercent = 20) => {
    return totalPrice * (depositPercent / 100);
};
