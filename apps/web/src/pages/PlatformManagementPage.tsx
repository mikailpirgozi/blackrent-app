import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlatformManagementDashboard from '@/components/platforms/PlatformManagementDashboard';
import CompanyAssignment from '@/components/platforms/CompanyAssignment';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';

/**
 * Platform Management Page
 * Only accessible by super_admin
 */
export default function PlatformManagementPage() {
  const { isSuperAdmin, state } = useAuth();

  // 🛡️ HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState('platforms');

  // 🛡️ SECURITY: Only super_admin or admin can access (AFTER ALL HOOKS)
  const isAdmin =
    state.user?.role === 'admin' || state.user?.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <p className="text-destructive">
            Prístup zamietnutý. Len super admin môže spravovať platformy.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <div className="container mx-auto">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="platforms">Platformy</TabsTrigger>
              <TabsTrigger value="companies">Priradenie firiem</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="platforms" className="mt-0">
          <PlatformManagementDashboard />
        </TabsContent>

        <TabsContent value="companies" className="mt-0">
          <CompanyAssignment />
        </TabsContent>
      </Tabs>
    </div>
  );
}
