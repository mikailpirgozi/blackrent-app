// 📝 Mobile Optimized Form Component
// Enhanced form with mobile-first design, better touch targets, and accessibility

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  IconButton,
  InputAdornment,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Clear as ClearIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { isMobile, getResponsiveValue } from '../../utils/mobileOptimization';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select' | 'checkbox' | 'switch' | 'slider' | 'textarea';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string | number; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  multiline?: boolean;
  rows?: number;
  validation?: (value: any) => string | null;
  helperText?: string;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'search' | 'url';
}

interface MobileOptimizedFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  loading?: boolean;
  collapsible?: boolean;
  initialCollapsed?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

const MobileOptimizedForm: React.FC<MobileOptimizedFormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Odoslať',
  loading = false,
  collapsible = false,
  initialCollapsed = false,
  title,
  subtitle,
  className,
}) => {
  const theme = useTheme();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Initialize form data
  useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      switch (field.type) {
        case 'checkbox':
        case 'switch':
          initialData[field.name] = false;
          break;
        case 'slider':
          initialData[field.name] = field.min || 0;
          break;
        case 'select':
          initialData[field.name] = field.options?.[0]?.value || '';
          break;
        default:
          initialData[field.name] = '';
      }
    });
    setFormData(initialData);
  }, [fields]);

  // Handle input changes
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Validate field if it has validation
    const field = fields.find(f => f.name === name);
    if (field?.validation) {
      const error = field.validation(value);
      if (error) {
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name];
      
      // Required field validation
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} je povinné pole`;
        isValid = false;
      }
      
      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);

    if (isValid) {
      onSubmit(formData);
    } else {
      // Focus first error field
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        const element = formRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        element?.focus();
      }
    }
  };

  // Clear field value
  const clearField = (name: string) => {
    handleChange(name, '');
  };

  // Toggle password visibility
  const togglePasswordVisibility = (name: string) => {
    setShowPassword(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Render individual field
  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const isFocused = focusedField === field.name;

    const baseProps = {
      name: field.name,
      disabled: field.disabled || loading,
      onFocus: () => setFocusedField(field.name),
      onBlur: () => setFocusedField(null),
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <TextField
            key={field.name}
            {...baseProps}
            label={field.label}
            type={field.type === 'number' ? 'text' : field.type}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            error={!!error}
            helperText={error || field.helperText}
            required={field.required}
            fullWidth
            autoComplete={field.autoComplete}
            inputMode={field.inputMode}
            InputProps={{
              sx: {
                minHeight: isMobile() ? 56 : 48,
                fontSize: isMobile() ? '16px' : '14px', // Prevent zoom on iOS
              },
              endAdornment: value && !field.disabled ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => clearField(field.name)}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: getResponsiveValue({
                  xs: 2,
                  md: 1.5,
                }, 2),
                transition: 'all 0.2s ease',
                '&.Mui-focused': {
                  transform: 'scale(1.02)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
          />
        );

      case 'password':
        return (
          <TextField
            key={field.name}
            {...baseProps}
            label={field.label}
            type={showPassword[field.name] ? 'text' : 'password'}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            error={!!error}
            helperText={error || field.helperText}
            required={field.required}
            fullWidth
            autoComplete={field.autoComplete}
            InputProps={{
              sx: {
                minHeight: isMobile() ? 56 : 48,
                fontSize: isMobile() ? '16px' : '14px',
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility(field.name)}
                    edge="end"
                    size="small"
                  >
                    {showPassword[field.name] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: getResponsiveValue({
                  xs: 2,
                  md: 1.5,
                }, 2),
                transition: 'all 0.2s ease',
                '&.Mui-focused': {
                  transform: 'scale(1.02)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            key={field.name}
            {...baseProps}
            label={field.label}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            error={!!error}
            helperText={error || field.helperText}
            required={field.required}
            fullWidth
            multiline
            rows={getResponsiveValue({
              xs: field.rows || 3,
              md: field.rows || 4,
            }, 3)}
            InputProps={{
              sx: {
                fontSize: isMobile() ? '16px' : '14px',
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: getResponsiveValue({
                  xs: 2,
                  md: 1.5,
                }, 2),
              },
            }}
          />
        );

      case 'select':
        return (
          <FormControl key={field.name} fullWidth error={!!error}>
            <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
              {field.label}
              {field.required && <span style={{ color: theme.palette.error.main }}> *</span>}
            </FormLabel>
            <Select
              {...baseProps}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              displayEmpty
              IconComponent={KeyboardArrowDown}
              sx={{
                minHeight: isMobile() ? 56 : 48,
                borderRadius: getResponsiveValue({
                  xs: 2,
                  md: 1.5,
                }, 2),
                '&.Mui-focused': {
                  transform: 'scale(1.02)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              }}
            >
              <MenuItem value="" disabled>
                <em>{field.placeholder || `Vyberte ${field.label.toLowerCase()}`}</em>
              </MenuItem>
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || field.helperText) && (
              <FormHelperText>{error || field.helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                {...baseProps}
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                sx={{
                  '& .MuiSvgIcon-root': {
                    fontSize: isMobile() ? 28 : 24,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {field.label}
                  {field.required && <span style={{ color: theme.palette.error.main }}> *</span>}
                </Typography>
                {field.helperText && (
                  <Typography variant="caption" color="text.secondary">
                    {field.helperText}
                  </Typography>
                )}
              </Box>
            }
            sx={{
              alignItems: 'flex-start',
              '& .MuiFormControlLabel-label': {
                mt: 0.5,
              },
            }}
          />
        );

      case 'switch':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Switch
                {...baseProps}
                checked={!!value}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase': {
                    '&.Mui-checked': {
                      transform: 'translateX(20px)',
                    },
                  },
                  '& .MuiSwitch-thumb': {
                    width: isMobile() ? 24 : 20,
                    height: isMobile() ? 24 : 20,
                  },
                  '& .MuiSwitch-track': {
                    borderRadius: 12,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {field.label}
                </Typography>
                {field.helperText && (
                  <Typography variant="caption" color="text.secondary">
                    {field.helperText}
                  </Typography>
                )}
              </Box>
            }
            sx={{ justifyContent: 'space-between', ml: 0, width: '100%' }}
          />
        );

      case 'slider':
        return (
          <Box key={field.name}>
            <FormLabel sx={{ display: 'block', mb: 2, fontSize: '0.875rem', fontWeight: 500 }}>
              {field.label}: {value}
              {field.required && <span style={{ color: theme.palette.error.main }}> *</span>}
            </FormLabel>
            <Slider
              {...baseProps}
              value={value}
              onChange={(_, newValue) => handleChange(field.name, newValue)}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              valueLabelDisplay="auto"
              sx={{
                '& .MuiSlider-thumb': {
                  width: isMobile() ? 24 : 20,
                  height: isMobile() ? 24 : 20,
                },
                '& .MuiSlider-track': {
                  height: isMobile() ? 6 : 4,
                },
                '& .MuiSlider-rail': {
                  height: isMobile() ? 6 : 4,
                },
              }}
            />
            {(error || field.helperText) && (
              <FormHelperText error={!!error}>
                {error || field.helperText}
              </FormHelperText>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const formContent = (
    <Box
      component="form"
      ref={formRef}
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: getResponsiveValue({
          xs: 3,
          md: 2.5,
        }, 3),
        p: getResponsiveValue({
          xs: 2,
          md: 3,
        }, 2),
      }}
    >
      {fields.map(renderField)}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        sx={{
          mt: 2,
          minHeight: getResponsiveValue({
            xs: 56,
            md: 48,
          }, 56),
          borderRadius: getResponsiveValue({
            xs: 3,
            md: 2,
          }, 3),
          fontSize: getResponsiveValue({
            xs: '1.1rem',
            md: '1rem',
          }, '1.1rem'),
          fontWeight: 600,
          background: theme.gradients.primary,
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
          '&:hover': {
            background: theme.gradients.primary,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }}
      >
        {loading ? 'Odosielam...' : submitLabel}
      </Button>
    </Box>
  );

  if (!collapsible) {
    return (
      <Box className={className}>
        {(title || subtitle) && (
          <Box sx={{ mb: 2, px: 2 }}>
            {title && (
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
        {formContent}
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Box
        onClick={() => setCollapsed(!collapsed)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          cursor: 'pointer',
          borderRadius: 2,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <Box>
          {title && (
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton>
          {collapsed ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
        </IconButton>
      </Box>

      <Collapse in={!collapsed}>
        {formContent}
      </Collapse>
    </Box>
  );
};

export default MobileOptimizedForm;
