/**
 * 📝 Centralizované validátory pre BlackRent Mobile
 * Konzistentná validácia formulárov v celej aplikácii
 */

import { logger } from './logger';

// ===================================
// 🎯 VALIDATION RESULT TYPE
// ===================================
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

// ===================================
// 🔧 BASIC VALIDATORS
// ===================================
export const validators = {
  // Email validation
  email: (email: string): ValidationResult => {
    if (!email) {
      return { isValid: false, error: 'Email je povinný' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, error: 'Neplatný formát emailu' };
    }
    
    return { isValid: true };
  },

  // Password validation
  password: (password: string): ValidationResult => {
    if (!password) {
      return { isValid: false, error: 'Heslo je povinné' };
    }
    
    if (password.length < 8) {
      return { isValid: false, error: 'Heslo musí mať aspoň 8 znakov' };
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, error: 'Heslo musí obsahovať malé písmeno' };
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, error: 'Heslo musí obsahovať veľké písmeno' };
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Heslo musí obsahovať číslo' };
    }
    
    return { isValid: true };
  },

  // Confirm password validation
  confirmPassword: (password: string, confirmPassword: string): ValidationResult => {
    if (!confirmPassword) {
      return { isValid: false, error: 'Potvrdenie hesla je povinné' };
    }
    
    if (password !== confirmPassword) {
      return { isValid: false, error: 'Heslá sa nezhodujú' };
    }
    
    return { isValid: true };
  },

  // Phone number validation
  phone: (phone: string): ValidationResult => {
    if (!phone) {
      return { isValid: false, error: 'Telefónne číslo je povinné' };
    }
    
    // Slovak phone number format
    const phoneRegex = /^(\+421|0)[0-9]{9}$/;
    const cleanPhone = phone.replace(/\s|-/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return { isValid: false, error: 'Neplatný formát telefónneho čísla' };
    }
    
    return { isValid: true };
  },

  // Name validation
  name: (name: string, fieldName: string = 'Meno'): ValidationResult => {
    if (!name) {
      return { isValid: false, error: `${fieldName} je povinné` };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, error: `${fieldName} musí mať aspoň 2 znaky` };
    }
    
    if (!/^[a-zA-ZáäčďéíĺľňóôŕšťúýžÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ\s]+$/.test(name)) {
      return { isValid: false, error: `${fieldName} môže obsahovať len písmená` };
    }
    
    return { isValid: true };
  },

  // Required field validation
  required: (value: any, fieldName: string = 'Pole'): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, error: `${fieldName} je povinné` };
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      return { isValid: false, error: `${fieldName} je povinné` };
    }
    
    return { isValid: true };
  },

  // Date validation
  date: (date: string | Date, fieldName: string = 'Dátum'): ValidationResult => {
    if (!date) {
      return { isValid: false, error: `${fieldName} je povinný` };
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: `${fieldName} má neplatný formát` };
    }
    
    return { isValid: true };
  },

  // Future date validation
  futureDate: (date: string | Date, fieldName: string = 'Dátum'): ValidationResult => {
    const dateValidation = validators.date(date, fieldName);
    if (!dateValidation.isValid) {
      return dateValidation;
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateObj < today) {
      return { isValid: false, error: `${fieldName} musí byť v budúcnosti` };
    }
    
    return { isValid: true };
  },

  // Age validation (18+)
  age: (birthDate: string | Date): ValidationResult => {
    const dateValidation = validators.date(birthDate, 'Dátum narodenia');
    if (!dateValidation.isValid) {
      return dateValidation;
    }
    
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      if (age - 1 < 18) {
        return { isValid: false, error: 'Musíte mať aspoň 18 rokov' };
      }
    } else if (age < 18) {
      return { isValid: false, error: 'Musíte mať aspoň 18 rokov' };
    }
    
    return { isValid: true };
  },

  // Credit card validation (basic Luhn algorithm)
  creditCard: (cardNumber: string): ValidationResult => {
    if (!cardNumber) {
      return { isValid: false, error: 'Číslo karty je povinné' };
    }
    
    const cleanNumber = cardNumber.replace(/\s|-/g, '');
    
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return { isValid: false, error: 'Neplatný formát čísla karty' };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    if (sum % 10 !== 0) {
      return { isValid: false, error: 'Neplatné číslo karty' };
    }
    
    return { isValid: true };
  },

  // CVV validation
  cvv: (cvv: string, cardType: string = 'visa'): ValidationResult => {
    if (!cvv) {
      return { isValid: false, error: 'CVV je povinné' };
    }
    
    const expectedLength = cardType.toLowerCase() === 'amex' ? 4 : 3;
    
    if (!/^\d+$/.test(cvv) || cvv.length !== expectedLength) {
      return { isValid: false, error: `CVV musí mať ${expectedLength} číslice` };
    }
    
    return { isValid: true };
  },

  // License number validation (Slovak format)
  licenseNumber: (license: string): ValidationResult => {
    if (!license) {
      return { isValid: false, error: 'Číslo vodičského je povinné' };
    }
    
    // Slovak license format: 12345678 (8 digits)
    if (!/^\d{8}$/.test(license.replace(/\s/g, ''))) {
      return { isValid: false, error: 'Neplatný formát vodičského preukazu' };
    }
    
    return { isValid: true };
  },
};

// ===================================
// 🔄 FORM VALIDATORS
// ===================================
export const formValidators = {
  // Login form validation
  loginForm: (data: { email: string; password: string }): ValidationResult => {
    const errors: string[] = [];
    
    const emailResult = validators.email(data.email);
    if (!emailResult.isValid) {
      errors.push(emailResult.error!);
    }
    
    const passwordResult = validators.required(data.password, 'Heslo');
    if (!passwordResult.isValid) {
      errors.push(passwordResult.error!);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  // Registration form validation
  registrationForm: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    birthDate: string;
    acceptTerms: boolean;
  }): ValidationResult => {
    const errors: string[] = [];
    
    const firstNameResult = validators.name(data.firstName, 'Meno');
    if (!firstNameResult.isValid) {
      errors.push(firstNameResult.error!);
    }
    
    const lastNameResult = validators.name(data.lastName, 'Priezvisko');
    if (!lastNameResult.isValid) {
      errors.push(lastNameResult.error!);
    }
    
    const emailResult = validators.email(data.email);
    if (!emailResult.isValid) {
      errors.push(emailResult.error!);
    }
    
    const phoneResult = validators.phone(data.phone);
    if (!phoneResult.isValid) {
      errors.push(phoneResult.error!);
    }
    
    const passwordResult = validators.password(data.password);
    if (!passwordResult.isValid) {
      errors.push(passwordResult.error!);
    }
    
    const confirmPasswordResult = validators.confirmPassword(data.password, data.confirmPassword);
    if (!confirmPasswordResult.isValid) {
      errors.push(confirmPasswordResult.error!);
    }
    
    const ageResult = validators.age(data.birthDate);
    if (!ageResult.isValid) {
      errors.push(ageResult.error!);
    }
    
    if (!data.acceptTerms) {
      errors.push('Musíte súhlasiť s obchodnými podmienkami');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  // Booking form validation
  bookingForm: (data: {
    startDate: string;
    endDate: string;
    pickupLocation: string;
    returnLocation: string;
    driverLicense: string;
  }): ValidationResult => {
    const errors: string[] = [];
    
    const startDateResult = validators.futureDate(data.startDate, 'Dátum začiatku');
    if (!startDateResult.isValid) {
      errors.push(startDateResult.error!);
    }
    
    const endDateResult = validators.futureDate(data.endDate, 'Dátum konca');
    if (!endDateResult.isValid) {
      errors.push(endDateResult.error!);
    }
    
    // Check if end date is after start date
    if (startDateResult.isValid && endDateResult.isValid) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      
      if (end <= start) {
        errors.push('Dátum konca musí byť po dátume začiatku');
      }
    }
    
    const pickupResult = validators.required(data.pickupLocation, 'Miesto vyzdvihnutia');
    if (!pickupResult.isValid) {
      errors.push(pickupResult.error!);
    }
    
    const returnResult = validators.required(data.returnLocation, 'Miesto vrátenia');
    if (!returnResult.isValid) {
      errors.push(returnResult.error!);
    }
    
    const licenseResult = validators.licenseNumber(data.driverLicense);
    if (!licenseResult.isValid) {
      errors.push(licenseResult.error!);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  // Payment form validation
  paymentForm: (data: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  }): ValidationResult => {
    const errors: string[] = [];
    
    const cardResult = validators.creditCard(data.cardNumber);
    if (!cardResult.isValid) {
      errors.push(cardResult.error!);
    }
    
    const cvvResult = validators.cvv(data.cvv);
    if (!cvvResult.isValid) {
      errors.push(cvvResult.error!);
    }
    
    const nameResult = validators.name(data.cardholderName, 'Meno držiteľa karty');
    if (!nameResult.isValid) {
      errors.push(nameResult.error!);
    }
    
    // Validate expiry date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(data.expiryYear);
    const expiryMonth = parseInt(data.expiryMonth);
    
    if (isNaN(expiryYear) || isNaN(expiryMonth)) {
      errors.push('Neplatný dátum expirácie');
    } else if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      errors.push('Karta je expirovaná');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

// ===================================
// 🎯 VALIDATION UTILITIES
// ===================================
export const _validationUtils = {
  // Validate single field
  validateField: (
    value: any,
    validatorName: keyof typeof validators,
    ...args: any[]
  ): ValidationResult => {
    try {
      const validator = validators[validatorName] as any;
      return validator(value, ...args);
    } catch (error) {
      logger.error(`Validation error for ${validatorName}:`, error as Error);
      return { isValid: false, error: 'Chyba pri validácii' };
    }
  },

  // Validate multiple fields
  validateFields: (
    fields: Array<{
      value: any;
      validator: keyof typeof validators;
      args?: any[];
    }>
  ): ValidationResult => {
    const errors: string[] = [];
    
    for (const field of fields) {
      const result = validationUtils.validateField(
        field.value,
        field.validator,
        ...(field.args || [])
      );
      
      if (!result.isValid && result.error) {
        errors.push(result.error);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  // Format validation errors for display
  formatErrors: (errors: string[]): string => {
    if (errors.length === 1) {
      return errors[0];
    }
    
    return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
  },

  // Create custom validator
  createValidator: (
    validationFn: (value: any, ...args: any[]) => boolean,
    errorMessage: string
  ) => {
    return (value: any, ...args: any[]): ValidationResult => {
      try {
        const isValid = validationFn(value, ...args);
        return {
          isValid,
          error: isValid ? undefined : errorMessage,
        };
      } catch (error) {
        logger.error('Custom validator error:', error as Error);
        return { isValid: false, error: 'Chyba pri validácii' };
      }
    };
  },
};

// Export default validators
export default validators;
