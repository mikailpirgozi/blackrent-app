/**
 * Utility funkcie pre formátovanie v Email Management Dashboard
 */

export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
  }).format(numAmount);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const getStatusColor = (status: string, actionTaken?: string) => {
  if (status === 'processed' && actionTaken === 'approved') return 'success';
  if (status === 'rejected') return 'error';
  if (status === 'archived') return 'default';
  if (status === 'new') return 'warning';
  return 'info';
};

export const getStatusLabel = (status: string, actionTaken?: string): string => {
  if (status === 'processed' && actionTaken === 'approved') return 'Schválený';
  if (status === 'rejected') return 'Zamietnutý';
  if (status === 'archived') return 'Archivovaný';
  if (status === 'new') return 'Nový';
  return status;
};
