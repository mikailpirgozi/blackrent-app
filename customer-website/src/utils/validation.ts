/**
 * Validates email format using regex
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates Slovak phone number formats
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const cleanPhone = phone.replace(/\s+/g, '');
  
  // Slovak phone number patterns
  const patterns = [
    /^\+421\d{9}$/, // +421901234567
    /^0\d{9}$/, // 0901234567
    /^\d{9}$/ // 901234567
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
}

/**
 * Validates required fields
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (typeof value === 'number') {
    return true; // 0 is valid for numbers
  }
  
  return Boolean(value);
}

/**
 * Validates price range
 */
export function validatePriceRange(minPrice: number, maxPrice: number): boolean {
  if (typeof minPrice !== 'number' || typeof maxPrice !== 'number') {
    return false;
  }
  
  if (minPrice < 0 || maxPrice < 0) {
    return false;
  }
  
  return minPrice <= maxPrice;
}

/**
 * Formats currency with Euro symbol
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number') {
    return '0€';
  }
  
  // Format with thousands separator if needed
  if (amount >= 1000) {
    return amount.toLocaleString('en-US') + '€';
  }
  
  // Handle decimal places
  if (amount % 1 !== 0) {
    return amount.toFixed(2) + '€';
  }
  
  return amount + '€';
}

/**
 * Formats date in Slovak format (DD.MM.YYYY)
 */
export function formatDate(date: Date | string): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  
  return `${day}.${month}.${year}`;
}
