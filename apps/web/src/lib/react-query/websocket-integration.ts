import { getWebSocketClient } from '@/services/websocket-client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Customer, Rental, Vehicle } from '../../types';
import type { Leasing } from '@/types/leasing-types';
import { useBulkCacheInvalidation } from './hooks/useBulkCache';
import { queryKeys } from './queryKeys';
import { logger } from '@/utils/smartLogger';

/**
 * Hook pre automatickú invalidáciu React Query cache na základe WebSocket udalostí
 * Zabezpečuje real-time synchronizáciu dát medzi všetkými používateľmi
 */
export function useWebSocketInvalidation() {
  const queryClient = useQueryClient();
  const { invalidateBulkCache } = useBulkCacheInvalidation();

  useEffect(() => {
    const client = getWebSocketClient();

    logger.debug(
      'Setting up WebSocket invalidation for React Query',
      undefined,
      'websocket'
    );

    // Rental events
    const handleRentalCreated = (data: {
      rental: Rental;
      createdBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Rental created, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Invalidate BULK cache for AppContext refresh
      invalidateBulkCache();
    };

    const handleRentalUpdated = (data: {
      rental: Rental;
      updatedBy: string;
      changes?: string[];
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Rental updated, invalidating queries',
        { data },
        'websocket'
      );
      if (data.rental.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentals.detail(data.rental.id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Invalidate BULK cache for AppContext refresh
      invalidateBulkCache();
    };

    const handleRentalDeleted = (data: {
      rentalId: string;
      customerName: string;
      deletedBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Rental deleted, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Invalidate BULK cache for AppContext refresh
      invalidateBulkCache();
    };

    // Vehicle events
    const handleVehicleUpdated = (data: {
      vehicle: Vehicle;
      updatedBy: string;
      changes?: string[];
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Vehicle updated, invalidating queries',
        { data },
        'websocket'
      );
      if (data.vehicle.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.vehicles.detail(data.vehicle.id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.vehicles.availability(data.vehicle.id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.lists(),
      });
    };

    // Protocol events
    const handleProtocolCreated = (data: {
      rentalId: string;
      protocolType: 'handover' | 'return';
      protocolId: string;
      createdBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Protocol created, invalidating queries',
        { data },
        'websocket'
      );
      if (data.rentalId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocols.byRental(data.rentalId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentals.detail(data.rentalId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.lists(),
      });
    };

    const handleProtocolUpdated = (data: {
      rentalId: string;
      protocolType: 'handover' | 'return';
      protocolId: string;
      updatedBy: string;
      changes?: string[];
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Protocol updated, invalidating queries',
        { data },
        'websocket'
      );
      if (data.rentalId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocols.byRental(data.rentalId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentals.detail(data.rentalId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.all,
      });
    };

    // Customer events
    const handleCustomerCreated = (data: {
      customer: Customer;
      createdBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Customer created, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      });
    };

    // Leasing events
    const handleLeasingCreated = (data: {
      leasing: Leasing;
      createdBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Leasing created, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Invalidate vehicle if leasing is associated
      if (data.leasing.vehicleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.leasings.byVehicle(data.leasing.vehicleId),
        });
      }
      // Invalidate BULK cache for AppContext refresh
      invalidateBulkCache();
    };

    const handleLeasingUpdated = (data: {
      leasing: Leasing;
      updatedBy: string;
      changes?: string[];
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Leasing updated, invalidating queries',
        { data },
        'websocket'
      );
      if (data.leasing.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.leasings.detail(data.leasing.id),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.leasings.schedule(data.leasing.id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Invalidate BULK cache for AppContext refresh
      invalidateBulkCache();
    };

    const handleLeasingDeleted = (data: {
      leasingId: string;
      vehicleId?: string;
      deletedBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Leasing deleted, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
      // Invalidate vehicle leasing cache
      if (data.vehicleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.leasings.byVehicle(data.vehicleId),
        });
      }
      // Invalidate BULK cache for AppContext refresh
      invalidateBulkCache();
    };

    const handlePaymentMarked = (data: {
      leasingId: string;
      installmentNumber: number;
      markedBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Leasing payment marked, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.detail(data.leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.schedule(data.leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    const handlePaymentUnmarked = (data: {
      leasingId: string;
      installmentNumber: number;
      unmarkedBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Leasing payment unmarked, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.detail(data.leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.schedule(data.leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    const handleBulkPaymentMarked = (data: {
      leasingId: string;
      installmentNumbers: number[];
      markedBy: string;
      timestamp: string;
      message: string;
    }) => {
      logger.debug(
        'WebSocket: Leasing bulk payment marked, invalidating queries',
        { data },
        'websocket'
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.detail(data.leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.schedule(data.leasingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.leasings.dashboard(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    // Register all listeners
    client.on('rental:created', handleRentalCreated);
    client.on('rental:updated', handleRentalUpdated);
    client.on('rental:deleted', handleRentalDeleted);

    client.on('vehicle:updated', handleVehicleUpdated);

    client.on('protocol:created', handleProtocolCreated);
    client.on('protocol:updated', handleProtocolUpdated);

    client.on('customer:created', handleCustomerCreated);

    client.on('leasing:created', handleLeasingCreated);
    client.on('leasing:updated', handleLeasingUpdated);
    client.on('leasing:deleted', handleLeasingDeleted);
    client.on('leasing:payment-marked', handlePaymentMarked);
    client.on('leasing:payment-unmarked', handlePaymentUnmarked);
    client.on('leasing:bulk-payment-marked', handleBulkPaymentMarked);

    return () => {
      logger.debug(
        'Cleaning up WebSocket invalidation listeners',
        undefined,
        'websocket'
      );

      // Cleanup all listeners
      client.off('rental:created', handleRentalCreated);
      client.off('rental:updated', handleRentalUpdated);
      client.off('rental:deleted', handleRentalDeleted);

      client.off('vehicle:updated', handleVehicleUpdated);

      client.off('protocol:created', handleProtocolCreated);
      client.off('protocol:updated', handleProtocolUpdated);

      client.off('customer:created', handleCustomerCreated);

      client.off('leasing:created', handleLeasingCreated);
      client.off('leasing:updated', handleLeasingUpdated);
      client.off('leasing:deleted', handleLeasingDeleted);
      client.off('leasing:payment-marked', handlePaymentMarked);
      client.off('leasing:payment-unmarked', handlePaymentUnmarked);
      client.off('leasing:bulk-payment-marked', handleBulkPaymentMarked);
    };
  }, [queryClient, invalidateBulkCache]);
}
