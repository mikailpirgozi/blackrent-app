import {
  Bell as NotificationIcon,
  User as PersonIcon,
  Shield as SecurityIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useMobile } from '../../hooks/use-mobile';
import { useState } from 'react';

import { RoleGuard } from '../common/PermissionGuard';
import PushNotificationManager from '../common/PushNotificationManager';

import RolePermissionsDisplay from './RolePermissionsDisplay';
import BasicUserManagement from './BasicUserManagement';

export default function IntegratedUserManagement() {
  const isMobile = useMobile();

  // Tab management - start with Basic tab (index 0) as it's the main feature
  const [currentTab, setCurrentTab] = useState('users');

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  return (
    <RoleGuard allowedRoles={['admin']} showAccessDeniedMessage>
      <div className={`p-4 min-h-screen ${isMobile ? 'bg-muted' : 'bg-transparent'}`}>
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-3'} mb-6`}>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <PersonIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>Správa používateľov</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <SecurityIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>Práva rolí</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <NotificationIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <span className={isMobile ? 'text-sm' : 'text-base'}>Push notifikácie</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0">
            <BasicUserManagement />
          </TabsContent>
          <TabsContent value="permissions" className="mt-0">
            <RolePermissionsDisplay />
          </TabsContent>
          <TabsContent value="notifications" className="mt-0">
            <PushNotificationManager />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
