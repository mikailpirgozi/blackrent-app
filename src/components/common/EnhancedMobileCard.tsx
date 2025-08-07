// 📱 Enhanced Mobile Card Component
// Optimized card design with touch interactions, swipe gestures, and mobile-first UX

import React, { useState, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  IconButton,
  Collapse,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreVertIcon,
  SwipeRounded as SwipeIcon,
} from '@mui/icons-material';
import { touchManager } from '../../utils/mobileOptimization';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  action: () => void;
}

interface EnhancedMobileCardProps {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  actions?: React.ReactNode;
  swipeActions?: SwipeAction[];
  expandable?: boolean;
  loading?: boolean;
  onTap?: () => void;
  onLongPress?: () => void;
  className?: string;
  elevation?: number;
  variant?: 'default' | 'outlined' | 'elevated';
}

const EnhancedMobileCard: React.FC<EnhancedMobileCardProps> = ({
  title,
  subtitle,
  content,
  actions,
  swipeActions = [],
  expandable = false,
  loading = false,
  onTap,
  onLongPress,
  className,
  elevation = 2,
  variant = 'default',
}) => {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [activeSwipeAction, setActiveSwipeAction] = useState<SwipeAction | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  // Touch interaction handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    setIsPressed(true);
    touchManager.handleTouchStart(event.nativeEvent, {
      onLongPressStart: onLongPress,
    });
  }, [onLongPress]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    touchManager.handleTouchMove(event.nativeEvent);
    
    // Handle horizontal swipe for actions
    if (swipeActions.length > 0) {
      const touch = event.touches[0];
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        const startX = rect.left;
        const currentX = touch.clientX;
        const offset = currentX - startX - rect.width / 2;
        
        // Limit swipe offset
        const maxOffset = 80;
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
        setSwipeOffset(clampedOffset);

        // Determine active swipe action
        if (Math.abs(clampedOffset) > 40) {
          const actionIndex = clampedOffset > 0 ? 0 : swipeActions.length - 1;
          setActiveSwipeAction(swipeActions[actionIndex] || null);
        } else {
          setActiveSwipeAction(null);
        }
      }
    }
  }, [swipeActions]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    setIsPressed(false);
    
    touchManager.handleTouchEnd(event.nativeEvent, {
      onTap: () => {
        if (Math.abs(swipeOffset) < 10) {
          if (expandable) {
            setExpanded(!expanded);
          }
          onTap?.();
        }
      },
      onSwipeLeft: () => {
        if (swipeActions.length > 0) {
          const action = swipeActions[swipeActions.length - 1];
          action?.action();
          touchManager.triggerHapticFeedback('medium');
        }
      },
      onSwipeRight: () => {
        if (swipeActions.length > 0) {
          const action = swipeActions[0];
          action?.action();
          touchManager.triggerHapticFeedback('medium');
        }
      },
    });

    // Reset swipe state
    setSwipeOffset(0);
    setActiveSwipeAction(null);
  }, [swipeOffset, swipeActions, expandable, expanded, onTap]);

  const getCardVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
        };
      case 'elevated':
        return {
          boxShadow: theme.shadows[elevation + 2],
          backgroundColor: theme.palette.background.paper,
        };
      default:
        return {
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
        };
    }
  };

  if (loading) {
    return (
      <Card
        className={className}
        sx={{
          m: 1,
          borderRadius: 3,
          ...getCardVariantStyles(),
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          <Skeleton variant="rectangular" height={60} sx={{ mt: 2, borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        m: 1,
      }}
    >
      {/* Swipe action indicators */}
      {swipeActions.length > 0 && (
        <>
          {/* Left swipe action */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: swipeActions[0]?.color ? theme.palette[swipeActions[0].color].main : theme.palette.primary.main,
              opacity: swipeOffset > 40 ? 1 : 0,
              transition: 'opacity 0.2s ease',
              zIndex: 0,
            }}
          >
            {swipeActions[0]?.icon}
            <Typography variant="caption" sx={{ ml: 1, color: 'white', fontWeight: 600 }}>
              {swipeActions[0]?.label}
            </Typography>
          </Box>

          {/* Right swipe action */}
          {swipeActions.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: swipeActions[swipeActions.length - 1]?.color 
                  ? theme.palette[swipeActions[swipeActions.length - 1].color].main 
                  : theme.palette.secondary.main,
                opacity: swipeOffset < -40 ? 1 : 0,
                transition: 'opacity 0.2s ease',
                zIndex: 0,
              }}
            >
              {swipeActions[swipeActions.length - 1]?.icon}
              <Typography variant="caption" sx={{ ml: 1, color: 'white', fontWeight: 600 }}>
                {swipeActions[swipeActions.length - 1]?.label}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Main card */}
      <Card
        ref={cardRef}
        className={className}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          position: 'relative',
          zIndex: 1,
          borderRadius: 3,
          cursor: onTap || expandable ? 'pointer' : 'default',
          
          // Transform for swipe and press effects
          transform: `translateX(${swipeOffset}px) scale(${isPressed ? 0.98 : 1})`,
          transition: isPressed ? 'transform 0.1s ease' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          
          // Enhanced styling
          ...getCardVariantStyles(),
          
          // Enhanced shadow when pressed
          boxShadow: isPressed 
            ? theme.shadows[elevation + 4]
            : theme.shadows[elevation],
          
          // Touch target optimization
          minHeight: 80,
          
          // Backdrop blur effect
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          
          // Hover effects (for devices that support it)
          '&:hover': {
            transform: `translateX(${swipeOffset}px) scale(1.02)`,
            boxShadow: theme.shadows[elevation + 2],
          },
          
          // Active state
          '&:active': {
            transform: `translateX(${swipeOffset}px) scale(0.98)`,
          },
        }}
      >
        <CardContent
          sx={{
            pb: actions ? 1 : 2,
            '&:last-child': {
              pb: actions ? 1 : 2,
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: subtitle ? 1 : 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  lineHeight: 1.3,
                  mb: subtitle ? 0.5 : 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Typography>
              
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              {swipeActions.length > 0 && (
                <SwipeIcon
                  sx={{
                    fontSize: 16,
                    color: 'text.disabled',
                    mr: 1,
                    opacity: 0.6,
                  }}
                />
              )}
              
              {expandable && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    p: 0.5,
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              )}
              
              <IconButton
                size="small"
                sx={{ p: 0.5, ml: 0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Box
            sx={{
              '& > *': {
                mb: 1,
                '&:last-child': { mb: 0 },
              },
            }}
          >
            {content}
          </Box>

          {/* Expandable content */}
          {expandable && (
            <Collapse in={expanded} timeout={300}>
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                {typeof content === 'string' ? (
                  <Typography variant="body2" color="text.secondary">
                    Additional details would go here...
                  </Typography>
                ) : (
                  content
                )}
              </Box>
            </Collapse>
          )}
        </CardContent>

        {/* Actions */}
        {actions && (
          <CardActions
            sx={{
              px: 2,
              pb: 2,
              pt: 0,
              justifyContent: 'flex-end',
              '& .MuiButton-root': {
                minHeight: 36,
                borderRadius: 2,
              },
            }}
          >
            {actions}
          </CardActions>
        )}

        {/* Active swipe action indicator */}
        {activeSwipeAction && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: alpha(activeSwipeAction.color ? theme.palette[activeSwipeAction.color].main : theme.palette.primary.main, 0.9),
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 2,
            }}
          >
            {activeSwipeAction.icon}
            {activeSwipeAction.label}
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default EnhancedMobileCard;
