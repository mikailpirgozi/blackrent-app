/**
 * Availability Hooks
 * Real-time vehicle availability with WebSocket updates
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { websocketService } from '../../services/websocket-service';
import api from '../../config/api';

interface AvailabilityData {
  vehicleId: string;
  isAvailable: boolean;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  unavailableDates: string[]; // ISO date strings
  nextAvailableDate?: string;
  currentRentalEndDate?: string;
}

interface AvailabilityResponse {
  success: boolean;
  data?: AvailabilityData;
  error?: string;
}

/**
 * Fetch vehicle availability from API
 */
const fetchVehicleAvailability = async (vehicleId: string): Promise<AvailabilityData> => {
  const response = await api.get<AvailabilityResponse>(`/public/availability/${vehicleId}`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch availability');
  }

  return response.data.data;
};

/**
 * Hook for vehicle availability with real-time updates
 */
export const useVehicleAvailability = (
  vehicleId: string,
  options?: {
    enableRealtime?: boolean;
  }
): UseQueryResult<AvailabilityData, Error> & {
  isRealTimeConnected: boolean;
} => {
  const queryClient = useQueryClient();
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const enableRealtime = options?.enableRealtime ?? true;

  const query = useQuery<AvailabilityData, Error>({
    queryKey: ['availability', vehicleId],
    queryFn: () => fetchVehicleAvailability(vehicleId),
    enabled: !!vehicleId,
    staleTime: 60000, // 1 minute
    refetchInterval: enableRealtime ? false : 60000, // Don't poll if realtime enabled
  });

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!enableRealtime || !vehicleId) return;

    // Connect to WebSocket
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }

    // Subscribe to vehicle updates
    websocketService.subscribeToVehicleAvailability(vehicleId);
    setIsRealTimeConnected(true);

    // Handle availability updates
    const unsubscribe = websocketService.on('availability_changed', (data) => {
      const typedData = data as { vehicleId: string; availability: Partial<AvailabilityData> };
      
      if (typedData.vehicleId === vehicleId) {
        // Update query cache with new data
        queryClient.setQueryData(
          ['availability', vehicleId],
          (old: AvailabilityData | undefined) => {
            if (!old) return old;
            return { ...old, ...typedData.availability };
          }
        );
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      websocketService.unsubscribeFromVehicleAvailability(vehicleId);
      setIsRealTimeConnected(false);
    };
  }, [vehicleId, enableRealtime, queryClient]);

  return {
    ...query,
    isRealTimeConnected,
  };
};

/**
 * Hook to check if date range is available for a vehicle
 */
export const useCheckDateAvailability = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkAvailability = useCallback(async (
    vehicleId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    isAvailable: boolean;
    conflicts?: string[];
    message?: string;
  }> => {
    setIsChecking(true);
    
    try {
      const response = await api.post<{
        success: boolean;
        data?: {
          isAvailable: boolean;
          conflicts?: string[];
          message?: string;
        };
        error?: string;
      }>('/public/availability/check', {
        vehicleId,
        startDate,
        endDate,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to check availability');
      }

      return response.data.data;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkAvailability,
    isChecking,
  };
};

/**
 * Hook for booking conflict prevention with temporary lock
 */
export const useBookingLock = () => {
  const [isLocking, setIsLocking] = useState(false);
  const [lockId, setLockId] = useState<string | null>(null);

  const acquireLock = useCallback(async (
    vehicleId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    lockId?: string;
    expiresAt?: string;
    message?: string;
  }> => {
    setIsLocking(true);
    
    try {
      const response = await api.post<{
        success: boolean;
        data?: {
          lockId: string;
          expiresAt: string;
        };
        error?: string;
      }>('/availability/lock', {
        vehicleId,
        startDate,
        endDate,
      });

      if (response.data.success && response.data.data) {
        setLockId(response.data.data.lockId);
        return {
          success: true,
          lockId: response.data.data.lockId,
          expiresAt: response.data.data.expiresAt,
        };
      }

      return {
        success: false,
        message: response.data.error,
      };
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      return {
        success: false,
        message: 'Failed to reserve vehicle',
      };
    } finally {
      setIsLocking(false);
    }
  }, []);

  const releaseLock = useCallback(async (lockIdToRelease?: string): Promise<void> => {
    const id = lockIdToRelease || lockId;
    if (!id) return;

    try {
      await api.delete(`/availability/lock/${id}`);
      setLockId(null);
    } catch (error) {
      console.error('Failed to release lock:', error);
    }
  }, [lockId]);

  return {
    acquireLock,
    releaseLock,
    isLocking,
    lockId,
  };
};

