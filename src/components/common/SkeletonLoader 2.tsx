// 💀 Enhanced Skeleton Loader Component
// Beautiful animated skeleton screens with gradient shimmer effects

import {
  Box,
  Skeleton,
  Card,
  CardContent,
  Grid,
  useTheme,
  styled,
  keyframes,
} from '@mui/material';
import React from 'react';

// Shimmer animation
const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

// Enhanced Skeleton with custom shimmer
const EnhancedSkeleton = styled(Skeleton)(({ theme }) => ({
  borderRadius: 12,
  background: `linear-gradient(
    90deg,
    ${theme.palette.mode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(241, 245, 249, 0.8)'} 0px,
    ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)'} 40px,
    ${theme.palette.mode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(241, 245, 249, 0.8)'} 80px
  )`,
  backgroundSize: '468px 104px',
  animation: `${shimmer} 1.6s ease-in-out infinite`,
  '&::after': {
    content: '" "',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: `linear-gradient(
      90deg,
      transparent,
      ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.05)'},
      transparent
    )`,
    transform: 'translateX(-100%)',
    animation: `${shimmer} 2s ease-in-out infinite`,
  },
}));

// Shimmer Card for card layouts
const ShimmerCard = styled(Card)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(26, 31, 46, 0.6)'
      : 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${
    theme.palette.mode === 'dark'
      ? 'rgba(102, 126, 234, 0.1)'
      : 'rgba(102, 126, 234, 0.1)'
  }`,
  borderRadius: 20,
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(
      90deg,
      transparent,
      ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.05)'},
      transparent
    )`,
    animation: `${shimmer} 2s ease-in-out infinite`,
  },
}));

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
  animation = 'wave',
  showAvatar = true,
  showText = true,
  showButtons = true,
  rows = 3,
}) => {
  const theme = useTheme();

  const renderCardSkeleton = (index: number) => (
    <ShimmerCard key={index}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {showAvatar && (
            <EnhancedSkeleton
              variant="circular"
              width={48}
              height={48}
              animation={animation}
            />
          )}
          <Box flex={1}>
            <EnhancedSkeleton
              variant="text"
              width="60%"
              height={24}
              animation={animation}
              sx={{ mb: 1 }}
            />
            <EnhancedSkeleton
              variant="text"
              width="40%"
              height={16}
              animation={animation}
            />
          </Box>
        </Box>

        {showText && (
          <Box mb={2}>
            {Array.from({ length: rows }).map((_, i) => (
              <EnhancedSkeleton
                key={i}
                variant="text"
                width={i === rows - 1 ? '70%' : '100%'}
                height={16}
                animation={animation}
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        )}

        {showButtons && (
          <Box display="flex" gap={1} mt={2}>
            <EnhancedSkeleton
              variant="rounded"
              width={80}
              height={36}
              animation={animation}
            />
            <EnhancedSkeleton
              variant="rounded"
              width={100}
              height={36}
              animation={animation}
            />
          </Box>
        )}
      </CardContent>
    </ShimmerCard>
  );

  const renderListSkeleton = (index: number) => (
    <Box
      key={index}
      display="flex"
      alignItems="center"
      gap={2}
      p={2}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === 'dark'
            ? 'rgba(26, 31, 46, 0.3)'
            : 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {showAvatar && (
        <EnhancedSkeleton
          variant="circular"
          width={40}
          height={40}
          animation={animation}
        />
      )}
      <Box flex={1}>
        <EnhancedSkeleton
          variant="text"
          width="80%"
          height={20}
          animation={animation}
          sx={{ mb: 0.5 }}
        />
        <EnhancedSkeleton
          variant="text"
          width="50%"
          height={16}
          animation={animation}
        />
      </Box>
      {showButtons && (
        <EnhancedSkeleton
          variant="rounded"
          width={60}
          height={32}
          animation={animation}
        />
      )}
    </Box>
  );

  const renderTableSkeleton = () => (
    <Box
      sx={{
        background:
          theme.palette.mode === 'dark'
            ? 'rgba(26, 31, 46, 0.6)'
            : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Table Header */}
      <Box
        display="flex"
        p={2}
        gap={2}
        sx={{
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(102, 126, 234, 0.1)'
              : 'rgba(102, 126, 234, 0.05)',
        }}
      >
        <EnhancedSkeleton
          variant="text"
          width="25%"
          height={24}
          animation={animation}
        />
        <EnhancedSkeleton
          variant="text"
          width="30%"
          height={24}
          animation={animation}
        />
        <EnhancedSkeleton
          variant="text"
          width="20%"
          height={24}
          animation={animation}
        />
        <EnhancedSkeleton
          variant="text"
          width="25%"
          height={24}
          animation={animation}
        />
      </Box>

      {/* Table Rows */}
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          display="flex"
          p={2}
          gap={2}
          sx={{
            borderBottom:
              index < count - 1 ? `1px solid ${theme.palette.divider}` : 'none',
          }}
        >
          <EnhancedSkeleton
            variant="text"
            width="25%"
            height={16}
            animation={animation}
          />
          <EnhancedSkeleton
            variant="text"
            width="30%"
            height={16}
            animation={animation}
          />
          <EnhancedSkeleton
            variant="text"
            width="20%"
            height={16}
            animation={animation}
          />
          <EnhancedSkeleton
            variant="text"
            width="25%"
            height={16}
            animation={animation}
          />
        </Box>
      ))}
    </Box>
  );

  const renderDashboardSkeleton = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <ShimmerCard>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <EnhancedSkeleton
                variant="circular"
                width={48}
                height={48}
                animation={animation}
              />
              <Box flex={1}>
                <EnhancedSkeleton
                  variant="text"
                  width="60%"
                  height={20}
                  animation={animation}
                />
                <EnhancedSkeleton
                  variant="text"
                  width="40%"
                  height={32}
                  animation={animation}
                />
              </Box>
            </Box>
          </CardContent>
        </ShimmerCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <ShimmerCard>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <EnhancedSkeleton
                variant="circular"
                width={48}
                height={48}
                animation={animation}
              />
              <Box flex={1}>
                <EnhancedSkeleton
                  variant="text"
                  width="70%"
                  height={20}
                  animation={animation}
                />
                <EnhancedSkeleton
                  variant="text"
                  width="50%"
                  height={32}
                  animation={animation}
                />
              </Box>
            </Box>
          </CardContent>
        </ShimmerCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <ShimmerCard>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <EnhancedSkeleton
                variant="circular"
                width={48}
                height={48}
                animation={animation}
              />
              <Box flex={1}>
                <EnhancedSkeleton
                  variant="text"
                  width="55%"
                  height={20}
                  animation={animation}
                />
                <EnhancedSkeleton
                  variant="text"
                  width="35%"
                  height={32}
                  animation={animation}
                />
              </Box>
            </Box>
          </CardContent>
        </ShimmerCard>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <ShimmerCard>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <EnhancedSkeleton
                variant="circular"
                width={48}
                height={48}
                animation={animation}
              />
              <Box flex={1}>
                <EnhancedSkeleton
                  variant="text"
                  width="65%"
                  height={20}
                  animation={animation}
                />
                <EnhancedSkeleton
                  variant="text"
                  width="45%"
                  height={32}
                  animation={animation}
                />
              </Box>
            </Box>
          </CardContent>
        </ShimmerCard>
      </Grid>

      {/* Chart Area */}
      <Grid item xs={12} md={8}>
        <ShimmerCard>
          <CardContent>
            <EnhancedSkeleton
              variant="text"
              width="30%"
              height={24}
              animation={animation}
              sx={{ mb: 2 }}
            />
            <EnhancedSkeleton
              variant="rounded"
              width="100%"
              height={300}
              animation={animation}
            />
          </CardContent>
        </ShimmerCard>
      </Grid>

      {/* Side Panel */}
      <Grid item xs={12} md={4}>
        <ShimmerCard>
          <CardContent>
            <EnhancedSkeleton
              variant="text"
              width="40%"
              height={24}
              animation={animation}
              sx={{ mb: 2 }}
            />
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} display="flex" alignItems="center" gap={2} mb={2}>
                <EnhancedSkeleton
                  variant="circular"
                  width={32}
                  height={32}
                  animation={animation}
                />
                <Box flex={1}>
                  <EnhancedSkeleton
                    variant="text"
                    width="70%"
                    height={16}
                    animation={animation}
                  />
                  <EnhancedSkeleton
                    variant="text"
                    width="50%"
                    height={14}
                    animation={animation}
                  />
                </Box>
                <EnhancedSkeleton
                  variant="text"
                  width="25%"
                  height={16}
                  animation={animation}
                />
              </Box>
            ))}
          </CardContent>
        </ShimmerCard>
      </Grid>
    </Grid>
  );

  const renderFormSkeleton = () => (
    <ShimmerCard>
      <CardContent sx={{ p: 3 }}>
        <EnhancedSkeleton
          variant="text"
          width="40%"
          height={32}
          animation={animation}
          sx={{ mb: 3 }}
        />

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <EnhancedSkeleton
              variant="text"
              width="30%"
              height={16}
              animation={animation}
              sx={{ mb: 1 }}
            />
            <EnhancedSkeleton
              variant="rounded"
              width="100%"
              height={56}
              animation={animation}
            />
          </Box>
          <Box flex={1}>
            <EnhancedSkeleton
              variant="text"
              width="35%"
              height={16}
              animation={animation}
              sx={{ mb: 1 }}
            />
            <EnhancedSkeleton
              variant="rounded"
              width="100%"
              height={56}
              animation={animation}
            />
          </Box>
        </Box>

        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i} mb={3}>
            <EnhancedSkeleton
              variant="text"
              width="25%"
              height={16}
              animation={animation}
              sx={{ mb: 1 }}
            />
            <EnhancedSkeleton
              variant="rounded"
              width="100%"
              height={56}
              animation={animation}
            />
          </Box>
        ))}

        <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
          <EnhancedSkeleton
            variant="rounded"
            width={100}
            height={40}
            animation={animation}
          />
          <EnhancedSkeleton
            variant="rounded"
            width={120}
            height={40}
            animation={animation}
          />
        </Box>
      </CardContent>
    </ShimmerCard>
  );

  const renderCustomSkeleton = () => (
    <EnhancedSkeleton
      variant="rounded"
      width={width}
      height={height}
      animation={animation}
    />
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Grid container spacing={3}>
            {Array.from({ length: count }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                {renderCardSkeleton(index)}
              </Grid>
            ))}
          </Grid>
        );
      case 'list':
        return (
          <Box>
            {Array.from({ length: count }).map((_, index) =>
              renderListSkeleton(index)
            )}
          </Box>
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

  return <Box>{renderSkeleton()}</Box>;
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
