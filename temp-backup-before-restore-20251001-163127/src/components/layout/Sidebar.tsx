import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Car,
  Receipt,
  Mail,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Shield,
  UserCog,
  Palette
} from 'lucide-react';

import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { getUserRoleDisplayName, usePermissions } from '../../hooks/usePermissions';

const iconMap = {
  Receipt,
  Mail,
  Car,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Shield,
  UserCog,
  Palette
};

const allMenuItems = [
  {
    text: 'Prenájmy',
    icon: 'Receipt',
    path: '/rentals',
    resource: 'rentals' as const,
  },
  {
    text: 'Email Monitoring',
    icon: 'Mail',
    path: '/email-monitoring',
    resource: 'users' as const,
  },
  {
    text: 'Databáza vozidiel',
    icon: 'Car',
    path: '/vehicles',
    resource: 'vehicles' as const,
  },
  {
    text: 'Zákazníci',
    icon: 'Users',
    path: '/customers',
    resource: 'customers' as const,
  },
  {
    text: 'Dostupnosť áut',
    icon: 'Calendar',
    path: '/availability',
    resource: 'vehicles' as const,
  },
  {
    text: 'Náklady',
    icon: 'DollarSign',
    path: '/expenses',
    resource: 'expenses' as const,
  },
  {
    text: 'Vyúčtovanie',
    icon: 'BarChart3',
    path: '/settlements',
    resource: 'settlements' as const,
  },
  {
    text: 'Poistky/STK/Dialničné',
    icon: 'Shield',
    path: '/insurances',
    resource: 'insurances' as const,
  },
  {
    text: 'Správa používateľov',
    icon: 'UserCog',
    path: '/users',
    resource: 'users' as const,
  },
  {
    text: 'Štatistiky',
    icon: 'BarChart3',
    path: '/statistics',
    resource: 'statistics' as const,
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export default function Sidebar({ className, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAuth();
  const permissions = usePermissions();
  const { isDarkMode } = useThemeMode();

  // Filtruj menu items podľa permissions
  const menuItems = allMenuItems.filter(item =>
    permissions.canRead(item.resource)
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">BlackRent</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-4">
          {menuItems.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive && "bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                )}
                onClick={() => handleNavigate(item.path)}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-sm font-medium">{item.text}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              {state.user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {state.user?.username || 'Používateľ'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {state.user?.role ? getUserRoleDisplayName(state.user.role) : 'Používateľ'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
