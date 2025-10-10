import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  Lock,
  Bell,
  Car
} from 'lucide-react';

import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';

import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { getUserRoleDisplayName } from '../../hooks/usePermissions';
import RealTimeNotifications from '../common/RealTimeNotifications';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobile: boolean;
  onPasswordChange: () => void;
  onProfileOpen: () => void;
}

export default function Header({ 
  onMenuToggle, 
  isMobile, 
  onPasswordChange, 
  onProfileOpen 
}: HeaderProps) {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-white" />
            <h1 className="text-lg font-bold text-white">BlackRent</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-white hover:bg-white/10"
              title={isDarkMode ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onProfileOpen}>
                  <User className="mr-2 h-4 w-4" />
                  Môj profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPasswordChange}>
                  <Lock className="mr-2 h-4 w-4" />
                  Zmeniť heslo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Odhlásiť sa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">BlackRent</h1>
          </div>
          <Badge variant="default" className="bg-blue-600 text-white">
            Pro
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Badge 
            variant={state.user?.role === 'admin' ? 'default' : 'secondary'}
            className={state.user?.role === 'admin' ? 'bg-blue-600 text-white' : ''}
          >
            {state.user?.role === 'admin' ? 'Admin' : 'User'}
          </Badge>

          {/* Real-time Notifications */}
          <RealTimeNotifications />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDarkMode ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {state.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{state.user?.username || 'Používateľ'}</p>
                  <p className="text-xs text-muted-foreground">
                    {state.user?.role ? getUserRoleDisplayName(state.user.role) : 'Používateľ'}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onProfileOpen}>
                <User className="mr-2 h-4 w-4" />
                Môj profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPasswordChange}>
                <Lock className="mr-2 h-4 w-4" />
                Zmeniť heslo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Odhlásiť sa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
