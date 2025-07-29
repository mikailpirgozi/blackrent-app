import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar,
  Receipt,
  AttachMoney,
  Assessment,
  Security,
  People,
  AccountCircle,
  Logout,
  MoreVert,
  Lock as LockIcon,
  DashboardOutlined,
  CarRental,
  GroupOutlined,
  ReceiptLongOutlined,
  AssessmentOutlined,
  SecurityOutlined,
  AdminPanelSettingsOutlined,
  LightMode,
  DarkMode,
  CalendarToday,
  SwapHoriz,
  HomeOutlined,
  TimeToLeave,
  PersonOutlined,
  BarChartOutlined,
  MoreHorizOutlined,
  NotificationsNoneOutlined,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import { usePermissions, getUserRoleDisplayName } from '../hooks/usePermissions';
import { useThemeMode } from '../context/ThemeContext';
import ChangePasswordForm from './auth/ChangePasswordForm';
import UserProfile from './users/UserProfile';
import { ErrorToast } from './common/ErrorToast';
import { EnhancedError } from '../utils/errorHandling';

const drawerWidth = 280;

const allMenuItems = [
  { text: 'Prenájmy', icon: <ReceiptLongOutlined />, path: '/rentals', resource: 'rentals' as const },
  { text: 'Databáza vozidiel', icon: <CarRental />, path: '/vehicles', resource: 'vehicles' as const },
  { text: 'Zákazníci', icon: <GroupOutlined />, path: '/customers', resource: 'customers' as const },
  { text: 'Dostupnosť áut', icon: <CalendarToday />, path: '/availability', resource: 'vehicles' as const }, // availability uses vehicles permissions
  { text: 'Náklady', icon: <AttachMoney />, path: '/expenses', resource: 'expenses' as const },
  { text: 'Vyúčtovanie', icon: <AssessmentOutlined />, path: '/settlements', resource: 'finances' as const },
  { text: 'Poistky/STK/Dialničné', icon: <SecurityOutlined />, path: '/insurances', resource: 'insurances' as const },
  { text: 'Správa používateľov', icon: <AdminPanelSettingsOutlined />, path: '/users', resource: 'users' as const },
  { text: 'Transfer vlastníctva', icon: <SwapHoriz />, path: '/admin/vehicle-ownership', resource: 'admin' as const },
  { text: 'Štatistiky', icon: <DashboardOutlined />, path: '/statistics', resource: 'finances' as const }, // statistics need finance access
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // 🛡️ Error handling state
  const [currentError, setCurrentError] = useState<EnhancedError | null>(null);
  
  // Error handling functions
  const handleError = (error: EnhancedError) => {
    setCurrentError(error);
  };
  
  const handleErrorClose = () => {
    setCurrentError(null);
  };
  
  const handleErrorRetry = async () => {
    // The retry logic is handled by the component that triggered the error
    // This is just for UI feedback
    console.log('🔄 Retry requested from ErrorToast');
  };
  
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useAuth();
  const permissions = usePermissions();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    handleNavigate('/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePasswordChange = () => {
    setPasswordDialogOpen(true);
    handleMenuClose();
  };

  const handleProfileOpen = () => {
    setProfileDialogOpen(true);
    handleMenuClose();
  };

  // Filtruj menu items podľa permissions
  const menuItems = allMenuItems.filter(item => 
    permissions.canRead(item.resource)
  );

  // Nájdi aktívny index pre bottom navigation
  React.useEffect(() => {
    const activeIndex = menuItems.findIndex(item => location.pathname === item.path);
    if (activeIndex !== -1) {
      setBottomNavValue(activeIndex);
    }
  }, [location.pathname, menuItems]);

  // Oprava navigácie pre správne fungovanie
  const handleNavigate = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const drawer = (
    <Box 
      sx={{ 
        height: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDarkMode 
            ? 'rgba(0, 0, 0, 0.1)'
            : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Toolbar 
          sx={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 2,
            py: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #334155 0%, #475569 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <CarRental sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                letterSpacing: '0.5px'
              }}
            >
              BlackRent
            </Typography>
          </Box>
        </Toolbar>
        
        <List sx={{ px: 2, pb: 12 }}>
          {menuItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  minHeight: 48,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&.Mui-selected': {
                    backgroundColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      backgroundColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(255, 255, 255, 0.25)',
                    },
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: 'inherit',
                    minWidth: 40,
                    '& .MuiSvgIcon-root': {
                      fontSize: 22,
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* User info v spodnej časti */}
        <Box 
          sx={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            borderTop: '1px solid',
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.2)',
            backgroundColor: isDarkMode 
              ? 'rgba(0, 0, 0, 0.1)'
              : 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 36,
                height: 36,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {state.user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {state.user?.username}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                }}
              >
                {state.user?.role ? getUserRoleDisplayName(state.user.role) : 'Používateľ'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
            <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default', overflow: 'hidden' }}>
      <CssBaseline />
      
      {/* Desktop/Tablet AppBar */}
      {!isMobile && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  fontSize: '1.125rem',
                }}
              >
                BlackRent
              </Typography>
              <Chip
                label="Pro"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#2563eb',
                  color: 'white',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={state.user?.role === 'admin' ? 'Admin' : 'User'}
                size="small"
                color={state.user?.role === 'admin' ? 'primary' : 'default'}
                sx={{ fontSize: '0.75rem' }}
              />
              <IconButton
                onClick={toggleTheme}
                sx={{ 
                  borderRadius: '8px',
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                title={isDarkMode ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
              >
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ 
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    minWidth: 180,
                  },
                }}
              >
                <MenuItem onClick={handleProfileOpen}>
                  <AccountCircle sx={{ mr: 1, fontSize: 18 }} />
                  Môj profil
                </MenuItem>
              <MenuItem onClick={handlePasswordChange}>
                <LockIcon sx={{ mr: 1, fontSize: 18 }} />
                Zmeniť heslo
              </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1, fontSize: 18 }} />
                  Odhlásiť sa
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: isDarkMode 
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              BlackRent
            </Typography>
            <IconButton
              onClick={toggleTheme}
              sx={{ 
                color: 'inherit',
                mr: 1,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              title={isDarkMode ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  minWidth: 180,
                },
              }}
            >
              <MenuItem onClick={handlePasswordChange}>
                <LockIcon sx={{ mr: 1, fontSize: 18 }} />
                Zmeniť heslo
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1, fontSize: 18 }} />
                Odhlásiť sa
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              backgroundColor: 'background.paper',
              boxShadow: isMobile ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          position: 'relative',
        }}
      >
        {!isMobile && <Toolbar />}
        {isMobile && <Toolbar />}
        
        <Box 
          className="custom-font-app protocol-custom-font"
          sx={{ 
            p: { xs: 2, md: 3 },
            maxWidth: '1400px',
            mx: 'auto',
            minHeight: 'calc(100vh - 64px - 56px)',
            overflowX: 'hidden',
            width: '100%',
          }}
        >
          {children}
        </Box>

        {/* Mobile Bottom Navigation - Booking/Airbnb Style */}
        {isMobile && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
              backdropFilter: 'blur(20px)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isDarkMode 
                  ? 'rgba(18, 18, 18, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
              }
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                py: 1.5,
                px: 1,
                minHeight: 70,
              }}
            >
              {/* Prenájmy */}
              <Box
                onClick={() => handleNavigate('/rentals')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  py: 0.5,
                  px: 0.5,
                  borderRadius: 2,
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: location.pathname === '/rentals' 
                      ? 'primary.main' 
                      : 'transparent',
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <HomeOutlined 
                    sx={{ 
                      fontSize: 20,
                      color: location.pathname === '/rentals' 
                        ? 'white' 
                        : 'text.secondary'
                    }} 
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: location.pathname === '/rentals' ? 600 : 400,
                    color: location.pathname === '/rentals' 
                      ? 'primary.main' 
                      : 'text.secondary',
                    lineHeight: 1,
                  }}
                >
                  Prenájmy
                </Typography>
              </Box>

              {/* Vozidlá */}
              <Box
                onClick={() => handleNavigate('/availability')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  py: 0.5,
                  px: 0.5,
                  borderRadius: 2,
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: location.pathname === '/availability' 
                      ? 'primary.main' 
                      : 'transparent',
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <TimeToLeave 
                    sx={{ 
                      fontSize: 20,
                      color: location.pathname === '/availability' 
                        ? 'white' 
                        : 'text.secondary'
                    }} 
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: location.pathname === '/availability' ? 600 : 400,
                    color: location.pathname === '/availability' 
                      ? 'primary.main' 
                      : 'text.secondary',
                    lineHeight: 1,
                  }}
                >
                  Vozidlá
                </Typography>
              </Box>

              {/* Náklady */}
              <Box
                onClick={() => handleNavigate('/expenses')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  py: 0.5,
                  px: 0.5,
                  borderRadius: 2,
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: location.pathname === '/expenses' 
                      ? 'primary.main' 
                      : 'transparent',
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <AttachMoney 
                    sx={{ 
                      fontSize: 20,
                      color: location.pathname === '/expenses' 
                        ? 'white' 
                        : 'text.secondary'
                    }} 
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: location.pathname === '/expenses' ? 600 : 400,
                    color: location.pathname === '/expenses' 
                      ? 'primary.main' 
                      : 'text.secondary',
                    lineHeight: 1,
                  }}
                >
                  Náklady
                </Typography>
              </Box>

              {/* Štatistiky */}
              <Box
                onClick={() => handleNavigate('/statistics')}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  py: 0.5,
                  px: 0.5,
                  borderRadius: 2,
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: location.pathname === '/statistics' 
                      ? 'primary.main' 
                      : 'transparent',
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <BarChartOutlined 
                    sx={{ 
                      fontSize: 20,
                      color: location.pathname === '/statistics' 
                        ? 'white' 
                        : 'text.secondary'
                    }} 
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: location.pathname === '/statistics' ? 600 : 400,
                    color: location.pathname === '/statistics' 
                      ? 'primary.main' 
                      : 'text.secondary',
                    lineHeight: 1,
                  }}
                >
                  Prehľad
                </Typography>
              </Box>

              {/* Viac */}
              <Box
                onClick={() => setMobileOpen(true)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  py: 0.5,
                  px: 0.5,
                  borderRadius: 2,
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: mobileOpen 
                      ? 'primary.main' 
                      : 'transparent',
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <MoreHorizOutlined 
                    sx={{ 
                      fontSize: 20,
                      color: mobileOpen 
                        ? 'white' 
                        : 'text.secondary'
                    }} 
                  />
                  {/* Notifikačný badge pre demo */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'error.main',
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: mobileOpen ? 600 : 400,
                    color: mobileOpen 
                      ? 'primary.main' 
                      : 'text.secondary',
                    lineHeight: 1,
                  }}
                >
                  Viac
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Password Change Dialog */}
      <ChangePasswordForm
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />

      {/* User Profile Dialog */}
      <UserProfile
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />

      {/* 🛡️ Global Error Toast */}
      <ErrorToast
        error={currentError}
        onClose={handleErrorClose}
        onRetry={handleErrorRetry}
      />
    </Box>
  );
}