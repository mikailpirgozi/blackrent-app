// 📶 Network Status Hook
// Monitors network connectivity and provides connection status

import { useEffect, useState } from 'react';

import { useError } from '../context/ErrorContext';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  wasOffline: boolean;
  reconnectedAt?: Date;
  networkQuality: 'slow' | 'medium' | 'fast' | 'unknown';
}

// Network quality assessment based on connection info
const assessNetworkQuality = (
  connection: Record<string, unknown>
): 'slow' | 'medium' | 'fast' | 'unknown' => {
  if (!connection) return 'unknown';

  const { effectiveType, downlink, rtt } = connection;

  // Based on effective connection type
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
  if (effectiveType === '3g') return 'medium';
  if (effectiveType === '4g') return 'fast';

  // Based on downlink speed (Mbps) and RTT (ms)
  if (typeof downlink === 'number' && typeof rtt === 'number') {
    if (downlink < 1 || rtt > 500) return 'slow';
    if (downlink < 5 || rtt > 200) return 'medium';
    return 'fast';
  }

  return 'unknown';
};

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const { showError } = useError();

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined,
    saveData: undefined,
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [reconnectedAt, setReconnectedAt] = useState<Date>();

  useEffect(() => {
    // Get initial network connection info
    const updateConnectionInfo = () => {
      const connection =
        (navigator as unknown as Record<string, unknown>).connection ||
        (navigator as unknown as Record<string, unknown>).mozConnection ||
        (navigator as unknown as Record<string, unknown>).webkitConnection;

      if (connection && typeof connection === 'object') {
        const conn = connection as Record<string, unknown>;
        setNetworkStatus(prev => ({
          ...prev,
          effectiveType: conn.effectiveType as string,
          downlink: conn.downlink as number,
          rtt: conn.rtt as number,
          saveData: conn.saveData as boolean,
        }));
      }
    };

    const handleOnline = () => {
      const now = new Date();
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));

      if (wasOffline) {
        setReconnectedAt(now);
        setWasOffline(false);

        // Show reconnection success message
        showError({
          message: '✅ Pripojenie k internetu obnovené',
          category: 'network',
          severity: 'info',
          details: `Obnovené o ${now.toLocaleTimeString()}`,
          retry: false,
        });
      }

      updateConnectionInfo();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
      setWasOffline(true);

      // Show offline warning
      showError({
        message: '⚠️ Stratené internetové pripojenie',
        category: 'network',
        severity: 'warning',
        details:
          'Niektoré funkcie môžu byť obmedzené až do obnovenia pripojenia.',
        retry: false,
      });
    };

    const handleConnectionChange = () => {
      updateConnectionInfo();
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection =
      (navigator as unknown as Record<string, unknown>).connection ||
      (navigator as unknown as Record<string, unknown>).mozConnection ||
      (navigator as unknown as Record<string, unknown>).webkitConnection;

    if (connection && typeof connection === 'object') {
      const conn = connection as Record<string, unknown>;
      if (typeof conn.addEventListener === 'function') {
        conn.addEventListener('change', handleConnectionChange);
      }
    }

    // Initial connection info
    updateConnectionInfo();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection && typeof connection === 'object') {
        const conn = connection as Record<string, unknown>;
        if (typeof conn.removeEventListener === 'function') {
          conn.removeEventListener('change', handleConnectionChange);
        }
      }
    };
  }, [wasOffline, showError]);

  const networkQuality = assessNetworkQuality(
    (navigator as unknown as Record<string, unknown>).connection as Record<
      string,
      unknown
    >
  );

  return {
    ...networkStatus,
    wasOffline,
    reconnectedAt,
    networkQuality,
  };
};

// Hook for detecting poor network conditions
export const useNetworkQuality = () => {
  const { networkQuality, rtt, downlink } = useNetworkStatus();

  const isSlowConnection =
    networkQuality === 'slow' ||
    (rtt && rtt > 500) ||
    (downlink && downlink < 1);
  const isFastConnection =
    networkQuality === 'fast' && rtt && rtt < 100 && downlink && downlink > 5;

  return {
    networkQuality,
    isSlowConnection,
    isFastConnection,
    shouldReduceRequests: isSlowConnection,
    shouldEnableOptimizations: isSlowConnection,
  };
};
