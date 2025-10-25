/**
 * 📋 UNIFIED FORM COMPONENT
 *
 * Konzistentný form pre celú BlackRent aplikáciu
 * Nahradí všetky MUI Form implementácie
 *
 * Features:
 * - Form validation
 * - Error handling
 * - Field arrays
 * - MUI Form API kompatibilita
 */

import React, {
  createContext,
  useContext,
  forwardRef,
  useCallback,
} from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

// Form context
interface FormContextValue {
  disabled?: boolean;
  readOnly?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const FormContext = createContext<FormContextValue>({});

export const useUnifiedFormContext = () => useContext(FormContext);

// Form field wrapper
export interface UnifiedFormFieldProps {
  name: string;
  children: (field: Record<string, unknown>) => React.ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export const UnifiedFormField: React.FC<UnifiedFormFieldProps> = ({
  name,
  children,
  disabled,
  readOnly,
  className,
}) => {
  const form = useUnifiedFormContext();

  return (
    <div className={cn('space-y-2', className)}>
      {children({
        name,
        disabled: disabled ?? form.disabled,
        readOnly: readOnly ?? form.readOnly,
        variant: form.variant,
        size: form.size,
        fullWidth: form.fullWidth,
      })}
    </div>
  );
};

// Form item wrapper
export interface UnifiedFormItemProps {
  children: React.ReactNode;
  className?: string;
}

export const UnifiedFormItem: React.FC<UnifiedFormItemProps> = ({
  children,
  className,
}) => {
  return <div className={cn('space-y-2', className)}>{children}</div>;
};

// Form label
export interface UnifiedFormLabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const UnifiedFormLabel: React.FC<UnifiedFormLabelProps> = ({
  children,
  required = false,
  className,
}) => {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
    >
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  );
};

// Form control
export interface UnifiedFormControlProps {
  children: React.ReactNode;
  className?: string;
}

export const UnifiedFormControl: React.FC<UnifiedFormControlProps> = ({
  children,
  className,
}) => {
  return <div className={cn('relative', className)}>{children}</div>;
};

// Form description
export interface UnifiedFormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const UnifiedFormDescription: React.FC<UnifiedFormDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  );
};

// Form message (error)
export interface UnifiedFormMessageProps {
  children?: React.ReactNode;
  className?: string;
}

export const UnifiedFormMessage: React.FC<UnifiedFormMessageProps> = ({
  children,
  className,
}) => {
  if (!children) return null;

  return (
    <p
      className={cn(
        'text-sm font-medium text-destructive flex items-center gap-1',
        className
      )}
    >
      <AlertCircle className="h-3 w-3" />
      {children}
    </p>
  );
};

// Main form component
export interface UnifiedFormProps {
  // Form configuration
  defaultValues?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationSchema?: any;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';

  // Form behavior
  disabled?: boolean;
  readOnly?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;

  // Event handlers
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onError?: (errors: Record<string, unknown>) => void;
  onChange?: (data: Record<string, unknown>) => void;

  // MUI compatibility
  sx?: Record<string, unknown>;

  // Styling
  className?: string;
  children: React.ReactNode;
}

export const UnifiedForm = forwardRef<HTMLFormElement, UnifiedFormProps>(
  (
    {
      defaultValues,
      validationSchema,
      mode = 'onSubmit',
      reValidateMode = 'onChange',
      disabled = false,
      readOnly = false,
      variant = 'outlined',
      size = 'medium',
      fullWidth = true,
      onSubmit,
      onError,
      onChange,
      sx,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Form configuration
    const formConfig = {
      defaultValues,
      mode,
      reValidateMode,

      ...(validationSchema && {
        resolver: zodResolver(validationSchema) as never,
      }),
    };

    const methods = useForm(formConfig);
    const { handleSubmit, watch } = methods;

    // Watch for changes
    const watchedValues = watch();

    // Handle form submission
    const handleFormSubmit = useCallback(
      async (data: Record<string, unknown>) => {
        try {
          await onSubmit?.(data);
        } catch (error) {
          console.error('Form submission error:', error);
          onError?.(error as Record<string, unknown>);
        }
      },
      [onSubmit, onError]
    );

    // Handle form errors
    const handleFormError = useCallback(
      (errors: Record<string, unknown>) => {
        console.error('Form validation errors:', errors);
        onError?.(errors);
      },
      [onError]
    );

    // Notify parent of changes
    React.useEffect(() => {
      onChange?.(watchedValues);
    }, [watchedValues, onChange]);

    // Form context value
    const formContextValue: FormContextValue = {
      disabled,
      readOnly,
      variant,
      size,
      fullWidth,
    };

    return (
      <FormProvider {...methods}>
        <FormContext.Provider value={formContextValue}>
          <form
            ref={ref}
            onSubmit={handleSubmit(handleFormSubmit, handleFormError)}
            className={cn(fullWidth && 'w-full', className)}
            {...props}
          >
            {children}
          </form>
        </FormContext.Provider>
      </FormProvider>
    );
  }
);

UnifiedForm.displayName = 'UnifiedForm';

// Export convenience aliases
export const Form = UnifiedForm;
export const FormField = UnifiedFormField;
export const FormItem = UnifiedFormItem;
export const FormLabel = UnifiedFormLabel;
export const FormControl = UnifiedFormControl;
export const FormDescription = UnifiedFormDescription;
export const FormMessage = UnifiedFormMessage;
export const useFormContext = useUnifiedFormContext;

export default UnifiedForm;
