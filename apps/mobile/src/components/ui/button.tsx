import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle } from 'react-native';
import { cn } from '@/utils/cn';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  style,
  textStyle,
}: ButtonProps) {
  const getButtonClasses = () => {
    const baseClasses = 'flex-row items-center justify-center rounded-lg';
    
    const variantClasses = {
      default: 'bg-blue-500 active:bg-blue-600',
      outline: 'border border-gray-300 bg-white active:bg-gray-50',
      ghost: 'bg-transparent active:bg-gray-100',
      destructive: 'bg-red-500 active:bg-red-600',
    };
    
    const sizeClasses = {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4',
    };
    
    const disabledClasses = disabled ? 'opacity-50' : '';
    
    return cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      disabledClasses,
      className
    );
  };

  const getTextClasses = () => {
    const baseClasses = 'font-medium';
    
    const variantTextClasses = {
      default: 'text-white',
      outline: 'text-gray-700',
      ghost: 'text-gray-700',
      destructive: 'text-white',
    };
    
    const sizeTextClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };
    
    return cn(
      baseClasses,
      variantTextClasses[variant],
      sizeTextClasses[size]
    );
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={getButtonClasses()}
      style={style}
      disabled={disabled}
    >
      {typeof children === 'string' ? (
        <Text className={getTextClasses()} style={textStyle}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
