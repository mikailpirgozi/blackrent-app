/**
 * ===================================================================
 * LEASING LIST - Hlavná stránka so zoznamom leasingov
 * ===================================================================
 * Created: 2025-10-02
 * Description: Moderný zoznam leasingov s filtrovacím a dashboard
 * ===================================================================
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useLeasings,
  useLeasingDashboard,
} from '@/lib/react-query/hooks/useLeasings';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { LeasingFilters } from '@/types/leasing-types';
import { LeasingDashboard } from './LeasingDashboard';
import { LeasingFiltersForm } from './LeasingFiltersForm';
import { LeasingCard } from './LeasingCard';
import { LeasingForm } from './LeasingForm';

export default function LeasingList() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeasingFilters>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: leasings, isLoading, refetch } = useLeasings(filters);
  const { data: dashboard, refetch: refetchDashboard } = useLeasingDashboard();

  const handleFormSuccess = async () => {
    setIsFormOpen(false);
    // 🔥 FORCE REFRESH: Explicitný refetch po create/update
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.leasings.all }),
      queryClient.refetchQueries({ queryKey: queryKeys.leasings.all }),
      refetch(),
      refetchDashboard(),
    ]);
    // Force re-render všetkých cards
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leasingy</h1>
          <p className="text-muted-foreground">Evidencia leasingov vozidiel</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nový leasing
        </Button>
      </div>

      {/* Dashboard Overview */}
      {dashboard && <LeasingDashboard data={dashboard} />}

      {/* Filters */}
      <LeasingFiltersForm filters={filters} onFiltersChange={setFilters} />

      {/* Leasing List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : leasings && leasings.length > 0 ? (
          // Leasing cards
          leasings.map(leasing => (
            <LeasingCard
              key={`${leasing.id}-${refreshKey}-${leasing.updatedAt}`}
              leasing={leasing}
            />
          ))
        ) : (
          // Empty state
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Žiadne leasingy</h3>
                <p className="text-sm text-muted-foreground">
                  Vytvor prvý leasing kliknutím na tlačidlo vyššie
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Create Leasing Form Dialog */}
      {isFormOpen && (
        <LeasingForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
