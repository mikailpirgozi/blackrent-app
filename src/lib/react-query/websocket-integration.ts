import { getWebSocketClient } from '@/services/websocket-client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from './queryKeys';

/**
 * Hook pre automatickú invalidáciu React Query cache na základe WebSocket udalostí
 * Zabezpečuje real-time synchronizáciu dát medzi všetkými používateľmi
 */
export function useWebSocketInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = getWebSocketClient();

    console.log('🔌 Setting up WebSocket invalidation for React Query');

    // Rental events
    const handleRentalCreated = (data: { rentalId?: string; id?: string }) => {
      console.log('🔄 WebSocket: Rental created, invalidating queries', data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    const handleRentalUpdated = (data: { rentalId?: string; id?: string }) => {
      console.log('🔄 WebSocket: Rental updated, invalidating queries', data);
      const rentalId = data.rentalId || data.id;
      if (rentalId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentals.detail(rentalId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    const handleRentalDeleted = (data: { rentalId?: string; id?: string }) => {
      console.log('🔄 WebSocket: Rental deleted, invalidating queries', data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    // Vehicle events
    const handleVehicleCreated = (data: {
      vehicleId?: string;
      id?: string;
    }) => {
      console.log('🔄 WebSocket: Vehicle created, invalidating queries', data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
    };

    const handleVehicleUpdated = (data: {
      vehicleId?: string;
      id?: string;
    }) => {
      console.log('🔄 WebSocket: Vehicle updated, invalidating queries', data);
      const vehicleId = data.vehicleId || data.id;
      if (vehicleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.vehicles.detail(vehicleId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.vehicles.availability(vehicleId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.lists(),
      });
    };

    const handleVehicleDeleted = (data: {
      vehicleId?: string;
      id?: string;
    }) => {
      console.log('🔄 WebSocket: Vehicle deleted, invalidating queries', data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.all,
      });
    };

    // Protocol events
    const handleProtocolCreated = (data: {
      rentalId?: string;
      rental_id?: string;
    }) => {
      console.log('🔄 WebSocket: Protocol created, invalidating queries', data);
      const rentalId = data.rentalId || data.rental_id;
      if (rentalId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocols.byRental(rentalId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentals.detail(rentalId),
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
      rentalId?: string;
      rental_id?: string;
    }) => {
      console.log('🔄 WebSocket: Protocol updated, invalidating queries', data);
      const rentalId = data.rentalId || data.rental_id;
      if (rentalId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocols.byRental(rentalId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.rentals.detail(rentalId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocols.all,
      });
    };

    // Customer events
    const handleCustomerCreated = (data: {
      customerId?: string;
      id?: string;
    }) => {
      console.log('🔄 WebSocket: Customer created, invalidating queries', data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all,
      });
    };

    const handleCustomerUpdated = (data: {
      customerId?: string;
      id?: string;
    }) => {
      console.log('🔄 WebSocket: Customer updated, invalidating queries', data);
      const customerId = data.customerId || data.id;
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customers.detail(customerId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.lists(),
      });
    };

    // Expense events
    const handleExpenseCreated = (data: {
      expenseId?: string;
      id?: string;
    }) => {
      console.log('🔄 WebSocket: Expense created, invalidating queries', data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    const handleExpenseUpdated = (data: {
      expenseId?: string;
      id?: string;
    }) => {
      console.log('🔄 WebSocket: Expense updated, invalidating queries', data);
      queryClient.invalidateQueries({
        queryKey: queryKeys.expenses.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    // Settlement events
    const handleSettlementCreated = (data: {
      settlementId?: string;
      id?: string;
    }) => {
      console.log(
        '🔄 WebSocket: Settlement created, invalidating queries',
        data
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.statistics.all,
      });
    };

    // Register all listeners
    client.on('rental:created', handleRentalCreated);
    client.on('rental:updated', handleRentalUpdated);
    client.on('rental:deleted', handleRentalDeleted);

    client.on('vehicle:created', handleVehicleCreated);
    client.on('vehicle:updated', handleVehicleUpdated);
    client.on('vehicle:deleted', handleVehicleDeleted);

    client.on('protocol:created', handleProtocolCreated);
    client.on('protocol:updated', handleProtocolUpdated);

    client.on('customer:created', handleCustomerCreated);
    client.on('customer:updated', handleCustomerUpdated);

    client.on('expense:created', handleExpenseCreated);
    client.on('expense:updated', handleExpenseUpdated);

    client.on('settlement:created', handleSettlementCreated);

    // Global refresh event
    client.on('data:refresh', () => {
      console.log('🔄 WebSocket: Global refresh requested');
      queryClient.invalidateQueries();
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket invalidation listeners');

      // Cleanup all listeners
      client.off('rental:created', handleRentalCreated);
      client.off('rental:updated', handleRentalUpdated);
      client.off('rental:deleted', handleRentalDeleted);

      client.off('vehicle:created', handleVehicleCreated);
      client.off('vehicle:updated', handleVehicleUpdated);
      client.off('vehicle:deleted', handleVehicleDeleted);

      client.off('protocol:created', handleProtocolCreated);
      client.off('protocol:updated', handleProtocolUpdated);

      client.off('customer:created', handleCustomerCreated);
      client.off('customer:updated', handleCustomerUpdated);

      client.off('expense:created', handleExpenseCreated);
      client.off('expense:updated', handleExpenseUpdated);

      client.off('settlement:created', handleSettlementCreated);
    };
  }, [queryClient]);
}
