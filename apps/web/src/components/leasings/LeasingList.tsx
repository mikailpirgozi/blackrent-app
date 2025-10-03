/**
 * ===================================================================
 * LEASING LIST - Hlavná stránka so zoznamom leasingov
 * ===================================================================
 * Created: 2025-10-02
 * Updated: 2025-10-03 - Refactored to useInfiniteLeasings
 * Description: Moderný zoznam leasingov s infinite scroll a real-time updates
 * ===================================================================
 */

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeasingDashboard } from '@/lib/react-query/hooks/useLeasings';
import { useInfiniteLeasings } from '@/hooks/useInfiniteLeasings';
import type { LeasingFilters } from '@/types/leasing-types';
import { LeasingDashboard } from './LeasingDashboard';
import { LeasingFiltersForm } from './LeasingFiltersForm';
import { LeasingCard } from './LeasingCard';
import { LeasingForm } from './LeasingForm';
import { logger } from '@/utils/smartLogger';

export default function LeasingList() {
  const [filters, setFilters] = useState<LeasingFilters>({});
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 🚀 NEW: Use infinite scroll hook
  const {
    leasings,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    updateFilters,
  } = useInfiniteLeasings(filters);

  const { data: dashboard, refetch: refetchDashboard } = useLeasingDashboard();

  const handleFormSuccess = async () => {
    setIsFormOpen(false);
    // 🔥 Smart refresh - useInfiniteLeasings will handle via WebSocket events
    await Promise.all([refresh(), refetchDashboard()]);
  };

  // Handle filter updates
  const handleFiltersChange = (newFilters: LeasingFilters) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  // Debug logging
  useEffect(() => {
    logger.debug('📊 LeasingList state', {
      leasingsCount: leasings.length,
      totalCount,
      hasMore,
      loading,
      error,
    });
  }, [leasings.length, totalCount, hasMore, loading, error]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leasingy</h1>
          <p className="text-muted-foreground">
            Evidencia leasingov vozidiel
            {totalCount > 0 && ` (${totalCount})`}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nový leasing
        </Button>
      </div>

      {/* Dashboard Overview */}
      {dashboard && <LeasingDashboard data={dashboard} />}

      {/* Filters */}
      <LeasingFiltersForm
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Error State */}
      {error && (
        <Card className="p-4 border-destructive">
          <p className="text-destructive">❌ {error}</p>
          <Button variant="outline" onClick={refresh} className="mt-2">
            Skúsiť znova
          </Button>
        </Card>
      )}

      {/* Leasing List */}
      <div className="space-y-4">
        {loading && leasings.length === 0 ? (
          // Initial loading skeleton
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : leasings.length > 0 ? (
          // Leasing cards
          <>
            {leasings.map(leasing => (
              <LeasingCard
                key={`${leasing.id}-${leasing.updatedAt}`}
                leasing={leasing}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button variant="outline" onClick={loadMore} disabled={loading}>
                  {loading ? 'Načítavam...' : 'Načítať ďalšie'}
                </Button>
              </div>
            )}

            {/* Loading more indicator */}
            {loading && leasings.length > 0 && (
              <div className="flex justify-center py-4">
                <Skeleton className="h-32 w-full" />
              </div>
            )}
          </>
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
