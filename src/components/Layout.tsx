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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from './auth/ChangePasswordForm';

const drawerWidth = 280;

const allMenuItems = [
  { text: 'Prenájmy', icon: <ReceiptLongOutlined />, path: '/rentals', resource: 'rentals' },
  { text: 'Databáza vozidiel', icon: <CarRental />, path: '/vehicles', resource: 'vehicles' },
  { text: 'Zákazníci', icon: <GroupOutlined />, path: '/customers', resource: 'customers' },
  { text: 'Náklady', icon: <AttachMoney />, path: '/expenses', resource: 'expenses' },
  { text: 'Vyúčtovanie', icon: <AssessmentOutlined />, path: '/settlements', resource: 'settlements' },
  { text: 'Poistky', icon: <SecurityOutlined />, path: '/insurances', resource: 'insurances' },
  { text: 'Správa používateľov', icon: <AdminPanelSettingsOutlined />, path: '/users', resource: 'users' },
  { text: 'Štatistiky', icon: <DashboardOutlined />, path: '/statistics', resource: 'statistics' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout, hasPermission } = useAuth();
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  // Filtruj menu items podľa permissions
  const menuItems = allMenuItems.filter(item => 
    hasPermission(item.resource, 'read')
  );

  // Nájdi aktívny index pre bottom navigation
  React.useEffect(() => {
    const activeIndex = menuItems.findIndex(item => location.pathname === item.path);
    if (activeIndex !== -1) {
      setBottomNavValue(activeIndex);
    }
  }, [location.pathname, menuItems]);

  const drawer = (
    <Box 
      sx={{ 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.1)',
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
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <CarRental sx={{ color: '#2563eb', fontSize: 24 }} />
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
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  minHeight: 48,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
                {state.user?.role === 'admin' ? 'Administrátor' : 'Používateľ'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      <CssBaseline />
      
      {/* Desktop/Tablet AppBar */}
      {!isMobile && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            boxShadow: 'none',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#1e293b',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: '#1e293b',
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
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ 
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
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
                    border: '1px solid #e2e8f0',
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  border: '1px solid #e2e8f0',
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
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        {!isMobile && <Toolbar />}
        {isMobile && <Toolbar />}
        
        <Box 
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

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <BottomNavigation
            value={bottomNavValue}
            onChange={(event, newValue) => {
              setBottomNavValue(newValue);
              if (menuItems[newValue]) {
                navigate(menuItems[newValue].path);
              }
            }}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
              '& .MuiBottomNavigationAction-root': {
                color: '#64748b',
                '&.Mui-selected': {
                  color: '#2563eb',
                },
              },
            }}
          >
            {menuItems.slice(0, 5).map((item, index) => (
              <BottomNavigationAction
                key={item.text}
                label={item.text}
                icon={item.icon}
                sx={{
                  fontSize: '0.75rem',
                  '& .MuiSvgIcon-root': {
                    fontSize: 20,
                  },
                }}
              />
            ))}
          </BottomNavigation>
        )}
      </Box>

      {/* Password Change Dialog */}
      <ChangePasswordForm
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />
    </Box>
  );
}