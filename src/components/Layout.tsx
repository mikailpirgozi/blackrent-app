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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from './auth/ChangePasswordForm';

const drawerWidth = 240;

const allMenuItems = [
  { text: 'Prenájmy', icon: <Receipt />, path: '/rentals', resource: 'rentals' },
  { text: 'Databáza vozidiel', icon: <DirectionsCar />, path: '/vehicles', resource: 'vehicles' },
  { text: 'Zákazníci', icon: <People />, path: '/customers', resource: 'customers' },
  { text: 'Náklady', icon: <AttachMoney />, path: '/expenses', resource: 'expenses' },
  { text: 'Vyúčtovanie', icon: <Assessment />, path: '/settlements', resource: 'settlements' },
  { text: 'Poistky', icon: <Security />, path: '/insurances', resource: 'insurances' },
  { text: 'Správa používateľov', icon: <AccountCircle />, path: '/users', resource: 'users' },
  { text: 'Štatistiky', icon: <Assessment />, path: '/statistics', resource: 'statistics' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [bottomNav, setBottomNav] = useState(location.pathname);
  const { state, logout, hasPermission } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleChangePassword = () => {
    setChangePasswordOpen(true);
    handleClose();
  };

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => 
    hasPermission(item.resource, 'read')
  );

  // Filter items for mobile bottom navigation - exclude insurances
  const filteredBottomNavItems = menuItems.filter(item => 
    item.resource !== 'insurances'
  ).slice(0, 5); // Limit to 5 items for bottom nav

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'employee': return 'warning';
      case 'company': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrátor';
      case 'employee': return 'Zamestnanec';
      case 'company': return 'Firma';
      default: return role;
    }
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'white', mb: 1 }}>
          BlackRent
        </Typography>
        {state.user && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Prihlásený ako:
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              {state.user.username}
            </Typography>
            <Chip
              label={getRoleLabel(state.user.role)}
              color={getRoleColor(state.user.role)}
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'BlackRent'}
          </Typography>
          
          {state.user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {state.user.username}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {state.user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {state.user.email}
                    </Typography>
                    <Chip
                      label={getRoleLabel(state.user.role)}
                      color={getRoleColor(state.user.role)}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleChangePassword}>
                  <ListItemIcon>
                    <LockIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Zmeniť heslo</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Odhlásiť sa</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          mb: isMobile ? 7 : 0,
        }}
      >
        {children}
      </Box>
      {/* Bottom navigation for mobile */}
      {isMobile && (
        <BottomNavigation
          value={bottomNav}
          onChange={(_, newValue) => {
            setBottomNav(newValue);
            navigate(newValue);
          }}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100vw',
            zIndex: 1201,
            borderTop: '1px solid #222',
            background: '#181c20',
          }}
        >
          {filteredBottomNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.text.split(' ')[0]}
              value={item.path}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
      
      <ChangePasswordForm
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Box>
  );
}