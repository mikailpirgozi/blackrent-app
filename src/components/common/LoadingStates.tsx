// 🌀 Enhanced Loading States Components
// Beautiful loading indicators with smooth animations and modern design

import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  useTheme,
  styled,
  keyframes,
  Fade,
  Backdrop,
} from '@mui/material';
import React from 'react';

// Gradient pulse animation
const gradientPulse = keyframes`
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
`;

// Floating animation
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Spin with gradient
const spinGradient = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled Loading Container
const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  padding: theme.spacing(4),
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(26, 31, 46, 0.8)'
      : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(8px)',
  borderRadius: '20px',
  border: `1px solid ${
    theme.palette.mode === 'dark'
      ? 'rgba(102, 126, 234, 0.2)'
      : 'rgba(102, 126, 234, 0.1)'
  }`,
}));

// Gradient CircularProgress
const GradientCircularProgress = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  '& .MuiCircularProgress-root': {
    color: 'transparent',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `conic-gradient(
      from 0deg,
      transparent 0%,
      ${theme.palette.mode === 'dark' ? '#667eea' : '#667eea'} 50%,
      ${theme.palette.mode === 'dark' ? '#764ba2' : '#764ba2'} 100%
    )`,
    borderRadius: '50%',
    animation: `${spinGradient} 1.5s linear infinite`,
    mask: 'radial-gradient(farthest-side, transparent calc(50% - 4px), black calc(50% - 3px))',
    WebkitMask:
      'radial-gradient(farthest-side, transparent calc(50% - 4px), black calc(50% - 3px))',
  },
}));

// Floating Icon
const FloatingIcon = styled(Box)(() => ({
  fontSize: '3rem',
  animation: `${float} 3s ease-in-out infinite`,
}));

// Gradient LinearProgress
const GradientLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(45, 55, 72, 0.3)'
      : 'rgba(241, 245, 249, 0.8)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundSize: '200% 200%',
    animation: `${gradientPulse} 2s ease-in-out infinite`,
  },
}));

interface LoadingStateProps {
  variant?: 'spinner' | 'linear' | 'dots' | 'pulse' | 'custom';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  transparent?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
  icon?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'medium',
  message = 'Načítavam...',
  submessage,
  fullScreen = false,
  transparent = false,
  color = 'primary',
  icon = '🚗',
}) => {
  const theme = useTheme();

  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { spinner: 24, container: 120, text: 'body2' };
      case 'large':
        return { spinner: 60, container: 300, text: 'h6' };
      default:
        return { spinner: 40, container: 200, text: 'body1' };
    }
  };

  const sizeValues = getSizeValues();

  const renderSpinner = () => (
    <GradientCircularProgress>
      <CircularProgress
        size={sizeValues.spinner}
        thickness={4}
        sx={{ color: 'transparent' }}
      />
    </GradientCircularProgress>
  );

  const renderLinear = () => (
    <Box width="100%" maxWidth={300}>
      <GradientLinearProgress />
    </Box>
  );

  const renderDots = () => (
    <Box display="flex" gap={1}>
      {[0, 1, 2].map(index => (
        <Box
          key={index}
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            animation: `${float} 1.4s ease-in-out infinite`,
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </Box>
  );

  const renderPulse = () => (
    <Box
      sx={{
        width: sizeValues.spinner,
        height: sizeValues.spinner,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        animation: `${gradientPulse} 2s ease-in-out infinite`,
        backgroundSize: '200% 200%',
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
      sx={{
        minHeight: sizeValues.container,
        background: transparent ? 'transparent' : undefined,
        border: transparent ? 'none' : undefined,
        backdropFilter: transparent ? 'none' : undefined,
      }}
    >
      <Box mb={2}>{renderLoader()}</Box>

      <Typography
        variant={sizeValues.text as any}
        color="textPrimary"
        fontWeight={600}
        textAlign="center"
        sx={{ mb: submessage ? 1 : 0 }}
      >
        {message}
      </Typography>

      {submessage && (
        <Typography
          variant="body2"
          color="textSecondary"
          textAlign="center"
          sx={{ opacity: 0.8 }}
        >
          {submessage}
        </Typography>
      )}
    </LoadingContainer>
  );

  if (fullScreen) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme => theme.zIndex.drawer + 1,
          background:
            theme.palette.mode === 'dark'
              ? 'rgba(10, 15, 28, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
        }}
        open={true}
      >
        <Fade in={true}>
          <div>{content}</div>
        </Fade>
      </Backdrop>
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
    size="large"
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
    size="medium"
    message={message}
    transparent={true}
  />
);

export const ButtonLoader: React.FC<{ size?: 'small' | 'medium' }> = ({
  size = 'small',
}) => (
  <GradientCircularProgress>
    <CircularProgress
      size={size === 'small' ? 16 : 20}
      thickness={4}
      sx={{ color: 'transparent' }}
    />
  </GradientCircularProgress>
);

export const FormLoader: React.FC = () => (
  <LoadingState
    variant="linear"
    size="medium"
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
    size="medium"
    message={message}
    submessage={count ? `${count} položiek` : undefined}
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
    size="large"
    message={message}
    submessage={submessage}
    fullScreen={true}
    icon="🚗"
  />
);

export default LoadingState;
