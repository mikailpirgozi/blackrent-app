/**
 * 🧱 Base Components pre BlackRent Mobile
 * Konzistentné komponenty používajúce centralizovaný theme systém
 */

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  Text,
  TextProps,
  TextInput,
  TextInputProps,
  ScrollView,
  ScrollViewProps,
  ActivityIndicator,
  ActivityIndicatorProps,
} from 'react-native';
import { theme, themeUtils, styledSystem } from '../../styles/theme';

// ===================================
// 🎨 BASE BUTTON COMPONENT
// ===================================
export interface BaseButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  style,
  disabled,
  ...props
}) => {
  const buttonVariant = themeUtils.getVariant('button', variant);
  
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: 24, minHeight: 44 },
    lg: { paddingVertical: 16, paddingHorizontal: 32, minHeight: 52 },
  };

  const buttonStyle = [
    buttonVariant,
    sizeStyles[size],
    fullWidth && { width: '100%' as const },
    disabled && { opacity: 0.5 },
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.colors.systemBlue} 
          size="small" 
        />
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// ===================================
// 📝 BASE TEXT COMPONENT
// ===================================
export interface BaseTextProps extends Omit<TextProps, 'children'> {
  variant?: 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'subheadline' | 'footnote' | 'caption1' | 'caption2';
  color?: 'primary' | 'secondary' | 'muted' | 'brand' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

export const BaseText: React.FC<BaseTextProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  weight,
  style,
  children,
  ...props
}) => {
  const typographyStyle = theme.typography[variant];
  
  const colorStyles = {
    primary: { color: theme.colors.label },
    secondary: { color: theme.colors.secondaryLabel },
    muted: { color: theme.colors.tertiaryLabel },
    brand: { color: theme.brand.primary },
    success: { color: theme.semantic.success },
    warning: { color: theme.semantic.warning },
    error: { color: theme.semantic.error },
  };

  const alignStyles = {
    left: { textAlign: 'left' as const },
    center: { textAlign: 'center' as const },
    right: { textAlign: 'right' as const },
  };

  const weightStyles = weight ? { fontWeight: weight } : {};

  const textStyle = [
    typographyStyle,
    colorStyles[color],
    alignStyles[align],
    weightStyles,
    style,
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

// ===================================
// 🃏 BASE CARD COMPONENT
// ===================================
export interface BaseCardProps extends Omit<ViewProps, 'children'> {
  variant?: 'default' | 'elevated' | 'flat';
  padding?: number;
  margin?: number;
  children: React.ReactNode;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  variant = 'default',
  padding,
  margin,
  style,
  children,
  ...props
}) => {
  const cardVariant = themeUtils.getVariant('card', variant);
  
  const cardStyle = [
    cardVariant,
    padding !== undefined && { padding: themeUtils.spacing(padding) },
    margin !== undefined && { margin: themeUtils.spacing(margin) },
    style,
  ];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

// ===================================
// 📄 BASE CONTAINER COMPONENT
// ===================================
export interface BaseContainerProps extends Omit<ViewProps, 'children'> {
  variant?: 'screen' | 'section' | 'card';
  padding?: boolean;
  safeArea?: boolean;
  children: React.ReactNode;
}

export const BaseContainer: React.FC<BaseContainerProps> = ({
  variant = 'screen',
  padding = true,
  safeArea = false,
  style,
  children,
  ...props
}) => {
  const variantStyles = {
    screen: theme.layout.container,
    section: theme.layout.section,
    card: theme.components.card,
  };

  const containerStyle = [
    variantStyles[variant],
    padding && theme.layout.screenPadding,
    safeArea && theme.layout.safeArea,
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

// ===================================
// 📝 BASE INPUT COMPONENT
// ===================================
export interface BaseInputProps extends Omit<TextInputProps, 'style'> {
  variant?: 'default' | 'error' | 'focused';
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: any;
}

export const BaseInput: React.FC<BaseInputProps> = ({
  variant = 'default',
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const inputVariant = themeUtils.getVariant('input', error ? 'error' : variant);
  
  const inputStyle = [
    inputVariant,
    leftIcon && { paddingLeft: 48 },
    rightIcon && { paddingRight: 48 },
    style,
  ];

  return (
    <View>
      {label && (
        <BaseText variant="subheadline" color="secondary" style={{ marginBottom: 8 }}>
          {label}
        </BaseText>
      )}
      
      <View style={{ position: 'relative' }}>
        {leftIcon && (
          <View style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: [{ translateY: -12 }],
            zIndex: 1,
          }}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={inputStyle}
          placeholderTextColor={theme.colors.tertiaryLabel}
          {...props}
        />
        
        {rightIcon && (
          <View style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: [{ translateY: -12 }],
            zIndex: 1,
          }}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <BaseText variant="footnote" color="error" style={{ marginTop: 4 }}>
          {error}
        </BaseText>
      )}
    </View>
  );
};

// ===================================
// 📜 BASE SCROLL VIEW COMPONENT
// ===================================
export interface BaseScrollViewProps extends Omit<ScrollViewProps, 'children'> {
  padding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}

export const BaseScrollView: React.FC<BaseScrollViewProps> = ({
  padding = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  children,
  ...props
}) => {
  const scrollStyle = [
    { flex: 1 },
    style,
  ];

  const contentStyle = [
    padding && theme.layout.screenPadding,
    contentContainerStyle,
  ];

  return (
    <ScrollView
      style={scrollStyle}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      {...(refreshing !== undefined && { refreshing })}
      {...(onRefresh && { onRefresh })}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

// ===================================
// 🔄 BASE LOADING COMPONENT
// ===================================
export interface BaseLoadingProps extends Omit<ActivityIndicatorProps, 'size' | 'color'> {
  text?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export const BaseLoading: React.FC<BaseLoadingProps> = ({
  text,
  overlay = false,
  size = 'large',
  color = theme.brand.primary,
  style,
  ...props
}) => {
  const loadingStyle = [
    styledSystem.flex.center,
    { padding: theme.spacing.xl },
    overlay && {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: theme.zIndex.overlay,
    },
    style,
  ];

  return (
    <View style={loadingStyle}>
      <ActivityIndicator size={size} color={color} {...props} />
      {text && (
        <BaseText 
          variant="subheadline" 
          color="secondary" 
          align="center"
          style={{ marginTop: theme.spacing.md }}
        >
          {text}
        </BaseText>
      )}
    </View>
  );
};

// ===================================
// 🚨 BASE ERROR COMPONENT
// ===================================
export interface BaseErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export const BaseError: React.FC<BaseErrorProps> = ({
  title = 'Chyba',
  message,
  onRetry,
  retryText = 'Skúsiť znovu',
}) => {
  return (
    <View style={[styledSystem.flex.center, { padding: theme.spacing.xl }]}>
      <BaseText variant="headline" color="error" align="center" style={{ marginBottom: theme.spacing.md }}>
        {title}
      </BaseText>
      
      <BaseText variant="body" color="secondary" align="center" style={{ marginBottom: theme.spacing.xl }}>
        {message}
      </BaseText>
      
      {onRetry && (
        <BaseButton variant="outline" onPress={onRetry}>
          <BaseText variant="callout" color="brand">
            {retryText}
          </BaseText>
        </BaseButton>
      )}
    </View>
  );
};

// ===================================
// 📱 BASE SAFE AREA COMPONENT
// ===================================
export interface BaseSafeAreaProps extends Omit<ViewProps, 'children'> {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
  children: React.ReactNode;
}

export const BaseSafeArea: React.FC<BaseSafeAreaProps> = ({
  edges = ['top', 'bottom'],
  backgroundColor = theme.colors.systemBackground,
  style,
  children,
  ...props
}) => {
  const safeAreaStyle = [
    theme.layout.safeArea,
    { backgroundColor },
    style,
  ];

  return (
    <View style={safeAreaStyle} {...props}>
      {children}
    </View>
  );
};

// Export all base components
export {
  theme,
  themeUtils,
  styledSystem,
};
