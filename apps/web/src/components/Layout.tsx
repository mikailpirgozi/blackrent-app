// Lucide icons (replacing MUI icons)
import {
  User as AccountCircle,
  Shield as AdminPanelSettingsOutlined,
  BarChart3 as AssessmentOutlined,
  DollarSign as AttachMoney,
  Calendar as CalendarToday,
  Car as CarRental,
  Moon as DarkMode,
  LayoutDashboard as DashboardOutlined,
  Users as GroupOutlined,
  Sun as LightMode,
  Lock as LockIcon,
  LogOut as Logout,
  Menu as MenuIcon,
  Mail as MailIcon,
  Receipt as ReceiptLongOutlined,
  Shield as SecurityOutlined,
  CreditCard as CreditCardIcon,
  Building2 as Building2Icon,
  HardDrive as HardDriveIcon,
} from 'lucide-react';

// shadcn/ui components
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import {
  getUserRoleDisplayName,
  usePermissions,
} from '../hooks/usePermissions';
import type { EnhancedError } from '../utils/errorHandling';

import ChangePasswordForm from './auth/ChangePasswordForm';
import { EnhancedErrorToast } from './common/EnhancedErrorToast';
import MobileDebugPanel from './common/MobileDebugPanel';
import RealTimeNotifications from './common/RealTimeNotifications';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  resource:
    | 'vehicles'
    | 'rentals'
    | 'customers'
    | 'finances'
    | 'users'
    | 'companies'
    | 'maintenance'
    | 'protocols'
    | 'pricing'
    | 'expenses'
    | 'insurances'
    | 'platforms'
    | 'statistics'
    | '*';
  superAdminOnly?: boolean;
  adminOnly?: boolean;
  blackrentOnly?: boolean;
}
import { SuccessToast } from './common/SuccessToast';
import UserProfile from './users/UserProfile';

// Sidebar width is handled by Tailwind classes (w-64 = 16rem = 256px)

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // Removed - using DropdownMenu
  const [dialogOpen, setDialogOpen] = useState<
    'changePassword' | 'profile' | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<EnhancedError | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { state, logout } = useAuth();
  const { user } = state || {};
  const { isDarkMode, toggleTheme } = useThemeMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCloseMenu = () => {
    // Menu is now handled by DropdownMenu
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/login');
  };

  const handleOpenDialog = (dialog: 'changePassword' | 'profile') => {
    setDialogOpen(dialog);
    handleCloseMenu();
  };

  const handleCloseDialog = () => {
    setDialogOpen(null);
  };

  // Pôvodné menu položky ako v backup verzii
  const allMenuItems: MenuItem[] = [
    {
      text: 'Dashboard',
      icon: <DashboardOutlined />,
      path: '/dashboard',
      resource: 'rentals' as const,
    },
    {
      text: 'Prenájmy',
      icon: <ReceiptLongOutlined />,
      path: '/rentals',
      resource: 'rentals' as const,
    },
    {
      text: 'Databáza vozidiel',
      icon: <CarRental />,
      path: '/vehicles',
      resource: 'vehicles' as const,
    },
    {
      text: 'Zákazníci',
      icon: <GroupOutlined />,
      path: '/customers',
      resource: 'customers' as const,
    },
    {
      text: 'Dostupnosť áut',
      icon: <CalendarToday />,
      path: '/availability',
      resource: 'vehicles' as const,
    },
    {
      text: 'Leasingy',
      icon: <CreditCardIcon />,
      path: '/leasings',
      resource: 'finances' as const,
    },
    {
      text: 'Náklady',
      icon: <AttachMoney />,
      path: '/expenses',
      resource: 'expenses' as const,
    },
    {
      text: 'Vyúčtovanie',
      icon: <AssessmentOutlined />,
      path: '/settlements',
      resource: 'finances' as const,
    },
    {
      text: 'Poistky/STK/Dialničné',
      icon: <SecurityOutlined />,
      path: '/insurances',
      resource: 'insurances' as const,
    },
    {
      text: 'Správa používateľov',
      icon: <AdminPanelSettingsOutlined />,
      path: '/users',
      resource: 'users' as const,
    },
    {
      text: 'Platformy',
      icon: <Building2Icon />,
      path: '/platforms',
      resource: 'platforms' as const,
      superAdminOnly: true, // Admin a Super Admin majú prístup
    },
    {
      text: 'Štatistiky',
      icon: <DashboardOutlined />,
      path: '/statistics',
      resource: 'finances' as const,
    },
    {
      text: 'Email monitoring',
      icon: <MailIcon />,
      path: '/email-monitoring',
      resource: 'users' as const,
      adminOnly: true, // ✅ Only for admin users
    },
    {
      text: 'R2 File Manager',
      icon: <HardDriveIcon />,
      path: '/admin/r2-files',
      resource: '*' as const,
      adminOnly: true, // ✅ Only for admin users
      superAdminOnly: true, // 🔒 Only for username: 'admin'
    },
  ];

  // ✅ Blackrent platform ID
  const BLACKRENT_PLATFORM_ID = '56d0d727-f725-47be-9508-d988ecfc0705';

  // Filtruj menu items podľa permissions
  const menuItems = allMenuItems.filter(item => {
    // 🛡️ ADMIN OVERRIDE: Admin roles majú prístup ku všetkému
    const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin';

    // ✅ Check blackrentOnly flag - hide for non-Blackrent platforms
    if (item.blackrentOnly) {
      // Super admin sees everything
      if (user?.role === 'super_admin') {
        return true;
      }
      // Platform admin/company_admin only sees if they're on Blackrent platform
      if (user?.role === 'admin' || user?.role === 'company_admin') {
        return user?.platformId === BLACKRENT_PLATFORM_ID;
      }
      // Other roles don't see blackrentOnly items
      return false;
    }

    // Check superAdminOnly flag NAJPRV (username 'admin' alebo role 'super_admin')
    if (item.superAdminOnly) {
      return user?.username === 'admin' || user?.role === 'super_admin';
    }

    // Check adminOnly flag
    if (item.adminOnly) {
      return isAdminUser;
    }

    // Admin roles majú automatický prístup ku všetkému
    if (isAdminUser) {
      return true;
    }

    // Pre ostatných kontroluj permissions
    if (!hasPermission(item.resource, 'read').hasAccess) {
      return false;
    }

    return true;
  });

  const drawer = (
    <div className="h-full bg-white border-r border-gray-200">
      {/* Content */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <CarRental className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              BlackRent
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 pb-24">
          <div className="space-y-1">
            {menuItems.map(item => (
              <Button
                key={item.path}
                variant="ghost"
                className={`w-full justify-start h-12 px-4 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium'
                }`}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
              >
                <span
                  className={`mr-3 flex-shrink-0 text-lg ${
                    location.pathname === item.path ? 'text-white' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-sm font-bold ${
                    location.pathname === item.path
                      ? 'text-white'
                      : 'font-medium'
                  }`}
                >
                  {item.text}
                </span>
              </Button>
            ))}
          </div>
        </nav>

        {/* User info v spodnej časti */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 bg-gray-100 border border-gray-200">
              <AvatarFallback className="bg-gray-100 text-gray-700 font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user?.username || 'Používateľ'}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-gray-600 truncate">
                  {user?.role
                    ? getUserRoleDisplayName(user.role)
                    : 'Používateľ'}
                </p>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 h-4">
                    👑
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop AppBar */}
      {!isMobile && (
        <header className="fixed top-0 left-64 right-0 z-50 bg-background border-b border-border h-16">
          <div className="flex items-center justify-between px-4 py-2 h-full">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-foreground">BlackRent</h1>
              <Badge
                variant="default"
                className="bg-blue-600 text-white text-xs font-semibold"
              >
                Pro
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Super Admin / Admin Badge */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold shadow-sm">
                  👑 {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
              )}

              {/* Company Admin Badge */}
              {user?.role === 'company_admin' && (
                <Badge className="bg-blue-600 text-white text-xs font-semibold">
                  🏢 Company Admin
                </Badge>
              )}

              {/* Other Roles */}
              {user?.role &&
                !['admin', 'super_admin', 'company_admin'].includes(
                  user.role
                ) && (
                  <Badge variant="secondary" className="text-xs">
                    {getUserRoleDisplayName(user.role)}
                  </Badge>
                )}

              {/* Notifications */}
              <RealTimeNotifications />

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-lg"
              >
                {isDarkMode ? (
                  <LightMode className="h-4 w-4" />
                ) : (
                  <DarkMode className="h-4 w-4" />
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-lg">
                    <AccountCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl border shadow-lg"
                >
                  <DropdownMenuItem
                    onClick={() => handleOpenDialog('profile')}
                    className="flex items-center gap-2"
                  >
                    <AccountCircle className="h-4 w-4" />
                    Môj profil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenDialog('changePassword')}
                    className="flex items-center gap-2"
                  >
                    <LockIcon className="h-4 w-4" />
                    Zmeniť heslo
                  </DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <Logout className="h-4 w-4" />
                    Odhlásiť sa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      {/* Mobile AppBar */}
      {isMobile && (
        <header
          className={`fixed top-0 left-0 right-0 z-50 h-16 ${
            isDarkMode
              ? 'bg-gradient-to-r from-slate-800 to-slate-700'
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
          } shadow-lg`}
        >
          <div className="flex items-center px-4 py-3 h-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDrawerToggle}
              className="text-white hover:bg-white/20 mr-3"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold text-white flex-1 drop-shadow-sm">
              BlackRent
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-white hover:bg-white/20 mr-2"
            >
              {isDarkMode ? (
                <LightMode className="h-4 w-4" />
              ) : (
                <DarkMode className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <AccountCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl border shadow-lg"
              >
                <DropdownMenuItem
                  onClick={() => handleOpenDialog('changePassword')}
                  className="flex items-center gap-2"
                >
                  <LockIcon className="h-4 w-4" />
                  Zmeniť heslo
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <Logout className="h-4 w-4" />
                  Odhlásiť sa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed left-0 top-0 z-40">
        {drawer}
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 md:hidden border-0">
          {drawer}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="md:pl-64 pt-16 min-h-screen">
        <div className="p-6 md:p-8">{children}</div>
      </main>

      {/* Dialogs */}
      <ChangePasswordForm
        open={dialogOpen === 'changePassword'}
        onClose={() => {
          handleCloseDialog();
          setSuccessMessage('Heslo bolo úspešne zmenené');
        }}
      />

      <UserProfile
        open={dialogOpen === 'profile'}
        onClose={() => {
          handleCloseDialog();
          setSuccessMessage('Profil bol úspešne aktualizovaný');
        }}
      />

      {/* Notifications */}
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {error && (
        <EnhancedErrorToast
          error={error}
          onClose={() => setError(null)}
          autoHideDuration={6000}
        />
      )}

      {/* Mobile Debug Panel - only in development */}
      {process.env.NODE_ENV === 'development' && isMobile && (
        <MobileDebugPanel />
      )}
    </div>
  );
}
