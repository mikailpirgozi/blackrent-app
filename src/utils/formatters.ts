// Date formatting utilities
export function formatDate(date: string | Date): string {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
}

export function formatDateTime(date: string | Date): string {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'N/A';
  }
}

export function formatTime(date: string | Date): string {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'N/A';

    return dateObj.toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'N/A';
  }
}

// Currency formatting utilities
export function formatCurrency(amount: number | string): string {
  if (amount === null || amount === undefined || amount === '') return '0,00 €';

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '0,00 €';

  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatNumber(number: number | string): string {
  if (number === null || number === undefined || number === '') return '0';

  const numValue = typeof number === 'string' ? parseFloat(number) : number;

  if (isNaN(numValue)) return '0';

  return new Intl.NumberFormat('sk-SK').format(numValue);
}

// Duration formatting utilities
export function formatDuration(
  startDate: string | Date,
  endDate: string | Date
): string {
  if (!startDate || !endDate) return 'N/A';

  try {
    const start =
      typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 deň';
    if (diffDays < 5) return `${diffDays} dni`;
    return `${diffDays} dní`;
  } catch (error) {
    return 'N/A';
  }
}

// Text formatting utilities
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Slovak phone number formatting
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+421 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith('421')) {
    const national = cleaned.substring(3);
    return `+421 ${national.substring(0, 3)} ${national.substring(3, 6)} ${national.substring(6)}`;
  }

  // Return original if doesn't match expected format
  return phone;
}

// Status formatting
export function getStatusDisplayText(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Aktívny',
    completed: 'Dokončený',
    pending: 'Čakajúci',
    cancelled: 'Zrušený',
    draft: 'Koncept',
    confirmed: 'Potvrdený',
    paid: 'Zaplatené',
    unpaid: 'Nezaplatené',
    overdue: 'Po termíne',
  };

  return statusMap[status.toLowerCase()] || capitalizeFirst(status);
}
