import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  HomeOutlined,
  TimeToLeave,
  AttachMoney,
  BarChartOutlined,
  MoreHorizOutlined,
  GetApp as InstallIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
  badge?: number;
  action?: () => void;
}

interface MobileNavigationProps {
  isDarkMode: boolean;
  onMoreClick: () => void;
  mobileOpen: boolean;
  isInstallable?: boolean;
  onInstallClick?: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isDarkMode,
  onMoreClick,
  mobileOpen,
  isInstallable = false,
  onInstallClick,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Simuluje notification badges (v realite by to bolo z API/context)
  const [notificationCounts, setNotificationCounts] = useState({
    rentals: 3,
    expenses: 0,
    statistics: 0,
    more: 2
  });

  // Active item state
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Navigation items configuration - dynamically add install button if available
  const baseNavItems: NavItem[] = [
    {
      id: 'rentals',
      label: 'Prenájmy',
      path: '/rentals',
      icon: <HomeOutlined />,
      badge: notificationCounts.rentals,
    },
    {
      id: 'availability',
      label: 'Vozidlá',
      path: '/availability',
      icon: <TimeToLeave />,
    },
    {
      id: 'expenses',
      label: 'Náklady',
      path: '/expenses',
      icon: <AttachMoney />,
      badge: notificationCounts.expenses,
    },
    {
      id: 'statistics',
      label: 'Prehľad',
      path: '/statistics',
      icon: <BarChartOutlined />,
      badge: notificationCounts.statistics,
    },
  ];

  // Add install button if available (only on mobile)
  const navItems: NavItem[] = isInstallable && onInstallClick 
    ? [
        ...baseNavItems,
        {
          id: 'install',
          label: 'Inštalovať',
          icon: <InstallIcon />,
          action: onInstallClick,
        },
      ]
    : [
        ...baseNavItems,
        {
          id: 'more',
          label: 'Viac',
          icon: <MoreHorizOutlined />,
          badge: notificationCounts.more,
          action: onMoreClick,
        },
      ];

  // Determine active item based on current path
  const getActiveItemId = () => {
    const currentPath = location.pathname;
    const activeNav = navItems.find(item => item.path === currentPath);
    return activeNav?.id || null;
  };

  const currentActiveId = mobileOpen ? 'more' : getActiveItemId();

  // Handle navigation with haptic feedback simulation
  const handleNavigate = (item: NavItem) => {
    // Simulate haptic feedback (works on mobile browsers with vibration API)
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // 10ms gentle vibration
    }

    // Set active state for animation
    setActiveItem(item.id);
    
    // Reset active state after animation
    setTimeout(() => setActiveItem(null), 200);

    // Navigate or execute action
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Update notification counts (simulácia real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationCounts(prev => ({
        ...prev,
        rentals: Math.random() > 0.7 ? prev.rentals + 1 : prev.rentals,
      }));
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const NavigationItem: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = currentActiveId === item.id;
    const isPressed = activeItem === item.id;
    
    return (
      <Box
        onClick={() => handleNavigate(item)}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          position: 'relative',
          py: 1,
          px: 0.5,
          borderRadius: 2,
          minHeight: 60,
          
          // Enhanced touch target - 44px minimum
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 44,
            height: 44,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            zIndex: -1,
          },
          
          // Enhanced animations
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isPressed 
            ? 'scale(0.95) translateY(2px)' 
            : isActive 
              ? 'scale(1.05)' 
              : 'scale(1)',
          
          // Active state background pulse
          '&::after': isActive ? {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 40,
            height: 40,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.2)})`,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            zIndex: -1,
          } : {},
        }}
      >
        {/* Icon container with enhanced active state */}
        <Box
          sx={{
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            mb: 0.5,
            position: 'relative',
            
            // Enhanced background for active state
            background: isActive 
              ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
              : 'transparent',
            
            // Shadow for active state
            boxShadow: isActive 
              ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}` 
              : 'none',
            
            // Smooth transitions
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            
            // Hover effect for better feedback
            '&:hover': {
              transform: 'scale(1.1)',
              background: isActive 
                ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                : alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          {/* Badge wrapper */}
          <Badge
            badgeContent={item.badge && item.badge > 0 ? item.badge : null}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                height: 16,
                minWidth: 16,
                borderRadius: '50%',
                border: `2px solid ${theme.palette.background.paper}`,
                // Animate badge appearance
                animation: item.badge && item.badge > 0 ? 'badgePulse 0.5s ease-out' : 'none',
              },
            }}
          >
            {React.cloneElement(item.icon as React.ReactElement, {
              sx: {
                fontSize: 22,
                color: isActive ? 'white' : 'text.secondary',
                transition: 'color 0.3s ease',
              }
            })}
          </Badge>
        </Box>
        
        {/* Label with better typography */}
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? 'primary.main' : 'text.secondary',
            lineHeight: 1,
            textAlign: 'center',
            transition: 'all 0.3s ease',
            letterSpacing: isActive ? '0.02em' : '0',
            textShadow: isActive ? `0 1px 3px ${alpha(theme.palette.primary.main, 0.3)}` : 'none',
          }}
        >
          {item.label}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        
        // Enhanced background with better blur
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        
        // Enhanced shadow
        boxShadow: `
          0 -10px 40px ${alpha(theme.palette.common.black, 0.15)},
          0 -4px 20px ${alpha(theme.palette.common.black, 0.1)}
        `,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        
        // Before element for enhanced background
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode 
            ? 'linear-gradient(to top, rgba(18, 18, 18, 0.95), rgba(18, 18, 18, 0.9))'
            : 'linear-gradient(to top, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))',
          backdropFilter: 'blur(20px)',
        },
        
        // Safe area support for devices with home indicator
        pb: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          py: 1,
          px: 0.5,
          minHeight: 64,
        }}
      >
        {navItems.map((item) => (
          <NavigationItem key={item.id} item={item} />
        ))}
      </Box>
      
      {/* CSS animations for enhanced effects */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
          }
          
          @keyframes badgePulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default MobileNavigation;