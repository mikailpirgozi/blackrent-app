// 💀 Enhanced Skeleton Loader Component
// Beautiful animated skeleton screens with gradient shimmer effects

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

// Enhanced Skeleton component with custom styling
const EnhancedSkeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
}> = ({ className, variant = 'rounded', width, height, ...props }) => {
  const baseClasses = "animate-pulse bg-muted/50";
  
  const variantClasses = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rounded: "rounded-lg"
  };

  return (
    <Skeleton
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
      {...props}
    />
  );
};

// Shimmer Card for card layouts
const ShimmerCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <Card className={cn("bg-background/60 backdrop-blur-sm border shadow-sm", className)}>
    {children}
  </Card>
);

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'dashboard' | 'form' | 'custom';
  count?: number;
  height?: number | string;
  width?: number | string;
  animation?: 'pulse' | 'wave' | false;
  showAvatar?: boolean;
  showText?: boolean;
  showButtons?: boolean;
  rows?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 3,
  height = 200,
  width = '100%',
  // animation = 'wave',
  showAvatar = true,
  showText = true,
  showButtons = true,
  rows = 3,
}) => {

  const renderCardSkeleton = (index: number) => (
    <ShimmerCard key={index}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {showAvatar && (
            <EnhancedSkeleton
              variant="circular"
              width={48}
              height={48}
            />
          )}
          <div className="flex-1">
            <EnhancedSkeleton
              variant="ghost"
              width="60%"
              height={24}
              className="mb-2"
            />
            <EnhancedSkeleton
              variant="ghost"
              width="40%"
              height={16}
            />
          </div>
        </div>

        {showText && (
          <div className="mb-4 space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
              <EnhancedSkeleton
                key={i}
                variant="ghost"
                width={i === rows - 1 ? '70%' : '100%'}
                height={16}
              />
            ))}
          </div>
        )}

        {showButtons && (
          <div className="flex gap-2 mt-4">
            <EnhancedSkeleton
              variant="rounded"
              width={80}
              height={36}
            />
            <EnhancedSkeleton
              variant="rounded"
              width={100}
              height={36}
            />
          </div>
        )}
      </CardContent>
    </ShimmerCard>
  );

  const renderListSkeleton = (index: number) => (
    <div
      key={index}
      className="flex items-center gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm"
    >
      {showAvatar && (
        <EnhancedSkeleton
          variant="circular"
          width={40}
          height={40}
        />
      )}
      <div className="flex-1">
        <EnhancedSkeleton
          variant="ghost"
          width="80%"
          height={20}
          className="mb-1"
        />
        <EnhancedSkeleton
          variant="ghost"
          width="50%"
          height={16}
        />
      </div>
      {showButtons && (
        <EnhancedSkeleton
          variant="rounded"
          width={60}
          height={32}
        />
      )}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="bg-background/80 backdrop-blur-sm rounded-lg overflow-hidden border border-border">
      {/* Table Header */}
      <div className="flex p-4 gap-4 bg-muted/50">
        <EnhancedSkeleton
          variant="ghost"
          width="25%"
          height={24}
        />
        <EnhancedSkeleton
          variant="ghost"
          width="30%"
          height={24}
        />
        <EnhancedSkeleton
          variant="ghost"
          width="20%"
          height={24}
        />
        <EnhancedSkeleton
          variant="ghost"
          width="25%"
          height={24}
        />
      </div>

      {/* Table Rows */}
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex p-4 gap-4",
            index < count - 1 && "border-b border-border"
          )}
        >
          <EnhancedSkeleton
            variant="ghost"
            width="25%"
            height={16}
          />
          <EnhancedSkeleton
            variant="ghost"
            width="30%"
            height={16}
          />
          <EnhancedSkeleton
            variant="ghost"
            width="20%"
            height={16}
          />
          <EnhancedSkeleton
            variant="ghost"
            width="25%"
            height={16}
          />
        </div>
      ))}
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {/* Stats Cards */}
      {Array.from({ length: 4 }).map((_, index) => (
        <ShimmerCard key={index}>
          <CardContent>
            <div className="flex items-center gap-4">
              <EnhancedSkeleton
                variant="circular"
                width={48}
                height={48}
              />
              <div className="flex-1">
                <EnhancedSkeleton
                  variant="ghost"
                  width={index === 1 ? "70%" : index === 2 ? "55%" : index === 3 ? "65%" : "60%"}
                  height={20}
                />
                <EnhancedSkeleton
                  variant="ghost"
                  width={index === 1 ? "50%" : index === 2 ? "35%" : index === 3 ? "45%" : "40%"}
                  height={32}
                />
              </div>
            </div>
          </CardContent>
        </ShimmerCard>
      ))}

      {/* Chart Area */}
      <div className="col-span-1 md:col-span-3">
        <ShimmerCard>
          <CardContent>
            <EnhancedSkeleton
              variant="ghost"
              width="30%"
              height={24}
              className="mb-4"
            />
            <EnhancedSkeleton
              variant="rounded"
              width="100%"
              height={300}
            />
          </CardContent>
        </ShimmerCard>
      </div>

      {/* Side Panel */}
      <div className="col-span-1 md:col-span-1">
        <ShimmerCard>
          <CardContent>
            <EnhancedSkeleton
              variant="ghost"
              width="40%"
              height={24}
              className="mb-4"
            />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <EnhancedSkeleton
                    variant="circular"
                    width={32}
                    height={32}
                  />
                  <div className="flex-1">
                    <EnhancedSkeleton
                      variant="ghost"
                      width="70%"
                      height={16}
                    />
                    <EnhancedSkeleton
                      variant="ghost"
                      width="50%"
                      height={14}
                    />
                  </div>
                  <EnhancedSkeleton
                    variant="ghost"
                    width="25%"
                    height={16}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </ShimmerCard>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <ShimmerCard>
      <CardContent className="p-6">
        <EnhancedSkeleton
          variant="ghost"
          width="40%"
          height={32}
          className="mb-6"
        />

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <EnhancedSkeleton
              variant="ghost"
              width="30%"
              height={16}
              className="mb-2"
            />
            <EnhancedSkeleton
              variant="rounded"
              width="100%"
              height={56}
            />
          </div>
          <div className="flex-1">
            <EnhancedSkeleton
              variant="ghost"
              width="35%"
              height={16}
              className="mb-2"
            />
            <EnhancedSkeleton
              variant="rounded"
              width="100%"
              height={56}
            />
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <EnhancedSkeleton
                variant="ghost"
                width="25%"
                height={16}
                className="mb-2"
              />
              <EnhancedSkeleton
                variant="rounded"
                width="100%"
                height={56}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end mt-8">
          <EnhancedSkeleton
            variant="rounded"
            width={100}
            height={40}
          />
          <EnhancedSkeleton
            variant="rounded"
            width={120}
            height={40}
          />
        </div>
      </CardContent>
    </ShimmerCard>
  );

  const renderCustomSkeleton = () => (
    <EnhancedSkeleton
      variant="rounded"
      width={width}
      height={height}
    />
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) =>
              renderCardSkeleton(index)
            )}
          </div>
        );
      case 'list':
        return (
          <div>
            {Array.from({ length: count }).map((_, index) =>
              renderListSkeleton(index)
            )}
          </div>
        );
      case 'table':
        return renderTableSkeleton();
      case 'dashboard':
        return renderDashboardSkeleton();
      case 'form':
        return renderFormSkeleton();
      case 'custom':
        return renderCustomSkeleton();
      default:
        return null;
    }
  };

  return <div>{renderSkeleton()}</div>;
};

// Quick skeleton variants for common use cases
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <SkeletonLoader variant="card" count={count} />
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <SkeletonLoader variant="list" count={count} />
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <SkeletonLoader variant="table" count={rows} />
);

export const DashboardSkeleton: React.FC = () => (
  <SkeletonLoader variant="dashboard" />
);

export const FormSkeleton: React.FC = () => <SkeletonLoader variant="form" />;

export default SkeletonLoader;
