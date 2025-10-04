/**
 * ENHANCED USER MANAGEMENT
 * Complete user management with integrated permission controls
 */

import React, { useState } from 'react';
import { 
  Shield, 
  Building2,
  User as PersonIcon,
  Bell as NotificationIcon 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { useMobile } from '@/hooks/use-mobile';

import PushNotificationManager from '../common/PushNotificationManager';
import PermissionManagement from '../admin/PermissionManagement';
import RolePermissionsDisplay from './RolePermissionsDisplay';
import BasicUserManagement from './BasicUserManagement';
import { useAuth } from '@/context/AuthContext';

export default function EnhancedUserManagement() {
  const isMobile = useMobile();
  const { state, isSuperAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState('users');

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  const isAdminUser = state.user?.role === 'admin' || state.user?.role === 'super_admin';

  return (
    <div className={`p-4 min-h-screen ${isMobile ? 'bg-muted' : 'bg-transparent'}`}>
        {/* Super Admin Indicator */}
        {isAdminUser && (
          <div className="mb-4">
            <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white">
              👑 {state.user?.role === 'super_admin' ? 'Super Admin' : 'Admin'} Panel
            </Badge>
          </div>
        )}

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full ${isAdminUser ? 'grid-cols-4' : 'grid-cols-3'} mb-6`}>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <PersonIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>Používatelia</span>
            </TabsTrigger>

            {/* Super Admin Only - Permission Management */}
            {isAdminUser && (
              <TabsTrigger value="permissions-mgmt" className="flex items-center gap-2">
                <Shield className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                <span className={isMobile ? 'text-sm' : 'text-base'}>Oprávnenia</span>
                <Badge className="ml-1 bg-red-600 text-white text-xs">Admin</Badge>
              </TabsTrigger>
            )}

            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Building2 className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>Role Info</span>
            </TabsTrigger>

            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <NotificationIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>Notifikácie</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-0">
            <BasicUserManagement />
          </TabsContent>

          {/* Permission Management Tab - Super Admin Only */}
          {isAdminUser && (
            <TabsContent value="permissions-mgmt" className="mt-0">
              <PermissionManagement />
            </TabsContent>
          )}

          {/* Roles Tab */}
          <TabsContent value="roles" className="mt-0">
            <RolePermissionsDisplay />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <PushNotificationManager />
          </TabsContent>
        </Tabs>
      </div>
  );
}

