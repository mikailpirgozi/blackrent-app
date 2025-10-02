// 🌀 Enhanced Loading States Components
// Beautiful loading indicators with smooth animations and modern design

import {
  Progress,
} from '../ui';
import React from 'react';

// Loading Container Component
const LoadingContainer: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  transparent?: boolean;
}> = ({ children, className = '', transparent = false }) => (
  <div className={`
    flex flex-col items-center justify-center min-h-[200px] p-8
    ${transparent ? 'bg-transparent' : 'bg-background/90 backdrop-blur-sm'}
    ${transparent ? '' : 'border border-border/20 rounded-2xl'}
    ${className}
  `}>
    {children}
  </div>
);

// Gradient Spinner Component
const GradientSpinner: React.FC<{ size: number }> = ({ size }) => (
  <div className="relative inline-flex">
    <div 
      className="animate-spin rounded-full border-4 border-transparent"
      style={{
        width: size,
        height: size,
        background: 'conic-gradient(from 0deg, transparent 0%, #667eea 50%, #764ba2 100%)',
        mask: 'radial-gradient(farthest-side, transparent calc(50% - 4px), black calc(50% - 3px))',
        WebkitMask: 'radial-gradient(farthest-side, transparent calc(50% - 4px), black calc(50% - 3px))',
      }}
    />
  </div>
);

// Floating Icon Component
const FloatingIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-5xl animate-bounce">
    {children}
  </div>
);

// Gradient Progress Component
const GradientProgress: React.FC = () => (
  <div className="w-full max-w-xs">
    <Progress 
      value={undefined} 
      className="h-2 bg-muted/30"
    />
  </div>
);

interface LoadingStateProps {
  variant?: 'spinner' | 'linear' | 'dots' | 'pulse' | 'custom';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  transparent?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
  icon?: React.ReactNode;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'medium',
  message = 'Načítavam...',
  submessage,
  fullScreen = false,
  transparent = false,
  // color = 'primary', // Currently not used
  icon = '🚗',
}) => {
  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { spinner: 24, container: 'min-h-[120px]', text: 'text-sm' };
      case 'large':
        return { spinner: 60, container: 'min-h-[300px]', text: 'text-lg' };
      default:
        return { spinner: 40, container: 'min-h-[200px]', text: 'text-base' };
    }
  };

  const sizeValues = getSizeValues();

  const renderSpinner = () => (
    <GradientSpinner size={sizeValues.spinner} />
  );

  const renderLinear = () => <GradientProgress />;

  const renderDots = () => (
    <div className="flex gap-1">
      {[0, 1, 2].map(index => (
        <div
          key={index}
          className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-bounce"
          style={{ animationDelay: `${index * 0.2}s` }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"
      style={{ 
        width: sizeValues.spinner, 
        height: sizeValues.spinner 
      }}
    />
  );

  const renderCustom = () => <FloatingIcon>{icon}</FloatingIcon>;

  const renderLoader = () => {
    switch (variant) {
      case 'linear':
        return renderLinear();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'custom':
        return renderCustom();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <LoadingContainer
      className={sizeValues.container}
      transparent={transparent}
    >
      <div className="mb-4">{renderLoader()}</div>

      <p className={`${sizeValues.text} font-semibold text-center ${submessage ? 'mb-2' : ''}`}>
        {message}
      </p>

      {submessage && (
        <p className="text-sm text-muted-foreground text-center opacity-80">
          {submessage}
        </p>
      )}
    </LoadingContainer>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="animate-in fade-in duration-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Specialized loading components
export const PageLoader: React.FC<{ message?: string }> = ({
  message = 'Načítavam stránku...',
}) => (
  <LoadingState
    variant="custom"
    className="h-12 px-8 text-base"
    message={message}
    submessage="Prosím počkajte"
    icon="🚗"
  />
);

export const ComponentLoader: React.FC<{ message?: string }> = ({
  message = 'Načítavam...',
}) => (
  <LoadingState
    variant="spinner"
    className="h-10 px-4"
    message={message}
    transparent={true}
  />
);

export const ButtonLoader: React.FC<{ size?: 'small' | 'medium' }> = ({
  size = 'small',
}) => (
  <GradientSpinner size={size === 'small' ? 16 : 20} />
);

export const FormLoader: React.FC = () => (
  <LoadingState
    variant="linear"
    className="h-10 px-4"
    message="Spracovávam..."
    submessage="Ukladám zmeny"
  />
);

export const DataLoader: React.FC<{
  message?: string;
  count?: number;
}> = ({ message = 'Načítavam dáta...', count }) => (
  <LoadingState
    variant="dots"
    className="h-10 px-4"
    message={message}
    {...(count && { submessage: `${count} položiek` })}
  />
);

export const FullScreenLoader: React.FC<{
  message?: string;
  submessage?: string;
}> = ({
  message = 'BlackRent sa načítava...',
  submessage = 'Pripravujeme všetko pre vás',
}) => (
  <LoadingState
    variant="custom"
    className="h-12 px-8 text-base"
    message={message}
    submessage={submessage}
    fullScreen={true}
    icon="🚗"
  />
);

export default LoadingState;
