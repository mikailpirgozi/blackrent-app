/**
 * Helper functions for rental-related operations
 * Extracted from RentalListNew.tsx for better reusability
 */

/**
 * Formats a number as Slovak currency (EUR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Formats a date string to Slovak locale format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('sk-SK');
};

/**
 * Gets the appropriate Material-UI color for a rental status
 */
export const getStatusColor = (
  status: string
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Gets the Slovak label for a rental status
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Aktívne';
    case 'pending':
      return 'Čakajúci';
    case 'completed':
      return 'Ukončené';
    case 'cancelled':
      return 'Zrušené';
    default:
      return status;
  }
};

/**
 * Gets the Slovak label for a payment method
 */
export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'cash':
      return 'Hotovosť';
    case 'bank_transfer':
      return 'Bankový prevod';
    case 'direct_to_owner':
      return 'Priamo majiteľovi';
    case 'card':
      return 'Kartou';
    case 'crypto':
      return 'Kryptomeny';
    default:
      return method;
  }
};
