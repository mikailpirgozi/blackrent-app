/**
 * 🔍 useValidation Hook
 * React hook pre jednoduchú integráciu validácie do formulárov
 */

import { useState, useCallback, useMemo } from 'react';
import { validators, formValidators, validationUtils, ValidationResult } from '../utils/validation';
import { logger } from '../utils/logger';

// ===================================
// 🎯 TYPES
// ===================================
interface FieldValidation {
  value: any;
  error?: string;
  isValid: boolean;
  isTouched: boolean;
}

interface ValidationConfig {
  validator: keyof typeof validators | keyof typeof formValidators;
  args?: any[];
  required?: boolean;
  customValidator?: (value: any) => ValidationResult;
}

interface UseValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showErrorsOnlyAfterSubmit?: boolean;
}

// ===================================
// 🪝 USE VALIDATION HOOK
// ===================================
export const useValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationConfig: Record<keyof T, ValidationConfig>,
  options: UseValidationOptions = {}
) => {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    showErrorsOnlyAfterSubmit = false,
  } = options;

  // State
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validate single field
  const validateField = useCallback((
    fieldName: keyof T,
    value: any,
    config: ValidationConfig
  ): ValidationResult => {
    try {
      // Check if field is required
      if (config.required && !value) {
        return { isValid: false, error: `${String(fieldName)} je povinné` };
      }

      // Skip validation if not required and empty
      if (!config.required && !value) {
        return { isValid: true };
      }

      // Use custom validator if provided
      if (config.customValidator) {
        return config.customValidator(value);
      }

      // Use built-in validator
      if (config.validator in validators) {
        const validator = validators[config.validator as keyof typeof validators] as any;
        return validator(value, ...(config.args || []));
      }

      // Use form validator
      if (config.validator in formValidators) {
        const validator = formValidators[config.validator as keyof typeof formValidators] as any;
        return validator(value);
      }

      return { isValid: true };
    } catch (error) {
      logger.error(`Validation error for field ${String(fieldName)}:`, error as Error);
      return { isValid: false, error: 'Chyba pri validácii' };
    }
  }, []);

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
    let isFormValid = true;

    Object.keys(validationConfig).forEach((fieldName) => {
      const _config = validationConfig[fieldName as keyof T];
      const _value = values[fieldName as keyof T];
      const result = validateField(fieldName as keyof T, value, config);

      if (!result.isValid && result.error) {
        newErrors[fieldName as keyof T] = result.error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [values, validationConfig, validateField]);

  // Handle field change
  const handleChange = useCallback((fieldName: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));

    // Validate on change if enabled
    if (validateOnChange || (isSubmitted && showErrorsOnlyAfterSubmit)) {
      const _config = validationConfig[fieldName];
      const result = validateField(fieldName, value, config);

      setErrors(prev => ({
        ...prev,
        [fieldName]: result.isValid ? '' : (result.error || ''),
      }));
    }
  }, [validateOnChange, isSubmitted, showErrorsOnlyAfterSubmit, validationConfig, validateField]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: keyof T) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));

    // Validate on blur if enabled
    if (validateOnBlur || (isSubmitted && showErrorsOnlyAfterSubmit)) {
      const _config = validationConfig[fieldName];
      const _value = values[fieldName];
      const result = validateField(fieldName, value, config);

      setErrors(prev => ({
        ...prev,
        [fieldName]: result.isValid ? '' : (result.error || ''),
      }));
    }
  }, [validateOnBlur, isSubmitted, showErrorsOnlyAfterSubmit, values, validationConfig, validateField]);

  // Handle form submit
  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async (e?: any) => {
      if (e?.preventDefault) {
        e.preventDefault();
      }

      setIsSubmitted(true);
      
      // Mark all fields as touched
      const allTouched = Object.keys(validationConfig).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      setTouched(allTouched);

      // Validate all fields
      const isValid = validateAllFields();

      if (isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          logger.error('Form submission error:', error as Error);
        }
      }
    };
  }, [values, validationConfig, validateAllFields]);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
    setIsSubmitted(false);
  }, [initialValues]);

  // Set field value
  const setValue = useCallback((fieldName: keyof T, value: any) => {
    handleChange(fieldName, value);
  }, [handleChange]);

  // Set field error
  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((fieldName: keyof T) => {
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  }, []);

  // Get field props for easy integration with input components
  const getFieldProps = useCallback((fieldName: keyof T) => {
    const shouldShowError = showErrorsOnlyAfterSubmit 
      ? isSubmitted && errors[fieldName]
      : (touched[fieldName] || isSubmitted) && errors[fieldName];

    return {
      value: values[fieldName],
      error: shouldShowError ? errors[fieldName] : undefined,
      onChangeText: (value: any) => handleChange(fieldName, value),
      onBlur: () => handleBlur(fieldName),
    };
  }, [values, errors, touched, isSubmitted, showErrorsOnlyAfterSubmit, handleChange, handleBlur]);

  // Computed properties
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  const hasErrors = useMemo(() => {
    return Object.values(errors).some(error => !!error);
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => 
      values[key as keyof T] !== initialValues[key as keyof T]
    );
  }, [values, initialValues]);

  const touchedFields = useMemo(() => {
    return Object.keys(touched).filter(key => touched[key as keyof T]);
  }, [touched]);

  return {
    // Values and state
    values,
    errors,
    touched,
    isSubmitted,
    
    // Computed properties
    isValid,
    hasErrors,
    isDirty,
    touchedFields,
    
    // Actions
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setValue,
    setFieldError,
    clearFieldError,
    validateAllFields,
    
    // Helpers
    getFieldProps,
  };
};

// ===================================
// 🎯 SPECIALIZED HOOKS
// ===================================

// Hook for login form
export const useLoginValidation = (options?: UseValidationOptions) => {
  return useValidation(
    { email: '', password: '' },
    {
      email: { validator: 'email', required: true },
      password: { validator: 'required', args: ['Heslo'], required: true },
    },
    options
  );
};

// Hook for registration form
export const useRegistrationValidation = (options?: UseValidationOptions) => {
  return useValidation(
    {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      birthDate: '',
      acceptTerms: false,
    },
    {
      firstName: { validator: 'name', args: ['Meno'], required: true },
      lastName: { validator: 'name', args: ['Priezvisko'], required: true },
      email: { validator: 'email', required: true },
      phone: { validator: 'phone', required: true },
      password: { validator: 'password', required: true },
      confirmPassword: { 
        validator: 'confirmPassword',
        required: true,
        customValidator: (value: string) => {
          // This will be handled by the component using the hook
          return { isValid: true };
        }
      },
      birthDate: { validator: 'age', required: true },
      acceptTerms: { 
        validator: 'required',
        args: ['Súhlas s podmienkami'],
        required: true 
      },
    },
    options
  );
};

// Hook for booking form
export const useBookingValidation = (options?: UseValidationOptions) => {
  return useValidation(
    {
      startDate: '',
      endDate: '',
      pickupLocation: '',
      returnLocation: '',
      driverLicense: '',
    },
    {
      startDate: { validator: 'futureDate', args: ['Dátum začiatku'], required: true },
      endDate: { validator: 'futureDate', args: ['Dátum konca'], required: true },
      pickupLocation: { validator: 'required', args: ['Miesto vyzdvihnutia'], required: true },
      returnLocation: { validator: 'required', args: ['Miesto vrátenia'], required: true },
      driverLicense: { validator: 'licenseNumber', required: true },
    },
    options
  );
};

// Hook for payment form
export const usePaymentValidation = (options?: UseValidationOptions) => {
  return useValidation(
    {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
    },
    {
      cardNumber: { validator: 'creditCard', required: true },
      expiryMonth: { validator: 'required', args: ['Mesiac expirácie'], required: true },
      expiryYear: { validator: 'required', args: ['Rok expirácie'], required: true },
      cvv: { validator: 'cvv', required: true },
      cardholderName: { validator: 'name', args: ['Meno držiteľa karty'], required: true },
    },
    options
  );
};

export default useValidation;
