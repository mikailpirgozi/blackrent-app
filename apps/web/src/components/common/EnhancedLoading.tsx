import { UnifiedCard } from '../ui/UnifiedCard';
import { UnifiedTypography } from '../ui/UnifiedTypography';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';
import { cn } from '../../lib/utils';
import React from 'react';

interface EnhancedLoadingProps {
  variant?: 'card' | 'list' | 'table' | 'button' | 'inline' | 'page';
  count?: number;
  height?: number | string;
  width?: number | string;
  message?: string;
  showMessage?: boolean;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  variant = 'card',
  count = 1,
  height = 'auto',
  width = '100%',
  message = 'Načítavam...',
  showMessage = true,
}) => {
  // Card skeleton - pre všetky entity (rentals, vehicles, customers)
  const CardSkeleton = () => (
    <UnifiedCard variant="default" className="mb-4 opacity-70">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="w-10 h-10 rounded-full mr-4" />
          <div className="flex-1">
            <Skeleton className="w-3/5 h-6 mb-2" />
            <Skeleton className="w-2/5 h-5" />
          </div>
        </div>
        <Skeleton className="w-full h-16 rounded mb-4" />
        <div className="flex gap-2">
          <Skeleton className="w-20 h-8 rounded" />
          <Skeleton className="w-20 h-8 rounded" />
          <Skeleton className="w-20 h-8 rounded" />
        </div>
      </div>
    </UnifiedCard>
  );

  // List skeleton - pre jednoduché zoznamy
  const ListSkeleton = () => (
    <div className="mb-2">
      <div className="flex items-center p-4">
        <Skeleton className="w-6 h-6 rounded-full mr-4" />
        <Skeleton className="w-3/5 h-5 mr-4" />
        <Skeleton className="w-1/3 h-5" />
      </div>
    </div>
  );

  // Table skeleton - pre tabuľky
  const TableSkeleton = () => (
    <div className="mb-2">
      <div className="flex items-center p-4 border-b border-border">
        <Skeleton className="w-1/5 h-5 mr-4" />
        <Skeleton className="w-1/4 h-5 mr-4" />
        <Skeleton className="w-1/6 h-5 mr-4" />
        <Skeleton className="w-1/5 h-5 mr-4" />
        <Skeleton className="w-20 h-8 rounded" />
      </div>
    </div>
  );

  // Button loading - pre buttons
  const ButtonLoading = () => (
    <Spinner
      size={20}
      className={cn(
        "text-current",
        showMessage ? "mr-2" : ""
      )}
    />
  );

  // Inline loading - pre menšie komponenty
  const InlineLoading = () => (
    <div className="flex items-center justify-center p-4">
      <Spinner
        size={24}
        className={cn(
          "text-primary",
          showMessage ? "mr-4" : ""
        )}
      />
      {showMessage && (
        <UnifiedTypography variant="body2" color="textSecondary">
          {message}
        </UnifiedTypography>
      )}
    </div>
  );

  // Page loading - pre celé stránky
  const PageLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-8">
      <Spinner
        size={50}
        className="text-primary mb-4"
      />
      {showMessage && (
        <>
          <UnifiedTypography variant="h6" className="mb-2 font-medium">
            {message}
          </UnifiedTypography>
          <UnifiedTypography variant="body2" color="textSecondary">
            Optimalizované načítavanie
          </UnifiedTypography>
        </>
      )}
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return Array.from({ length: count }, (_, index) => (
          <CardSkeleton key={index} />
        ));
      case 'list':
        return Array.from({ length: count }, (_, index) => (
          <ListSkeleton key={index} />
        ));
      case 'table':
        return Array.from({ length: count }, (_, index) => (
          <TableSkeleton key={index} />
        ));
      case 'button':
        return <ButtonLoading />;
      case 'inline':
        return <InlineLoading />;
      case 'page':
        return <PageLoading />;
      default:
        return <InlineLoading />;
    }
  };

  return <div className={cn("w-full")} style={{ width, height }}>{renderSkeleton()}</div>;
};

// Convenience hooks pre rôzne use cases
export const useLoadingState = () => {
  const [loading, setLoading] = React.useState(false);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

  return { loading, startLoading, stopLoading };
};

// HOC pre automatic loading wrapping
export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingVariant: EnhancedLoadingProps['variant'] = 'card'
) => {
  const WithLoadingComponent = (props: P & { loading?: boolean }) => {
    const { loading, ...otherProps } = props;

    if (loading) {
      return <EnhancedLoading variant={loadingVariant} />;
    }

    return <WrappedComponent {...(otherProps as P)} />;
  };

  WithLoadingComponent.displayName = `withLoading(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithLoadingComponent;
};

export default EnhancedLoading;
