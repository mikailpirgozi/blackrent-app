// Shared utilities
export const formatPrice = (price) => {
    return `€${price.toFixed(2)}`;
};
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};
