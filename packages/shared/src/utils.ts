// Shared utilities
export const formatPrice = (price: number): string => {
  return `€${price.toFixed(2)}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

