/**
 * 🌐 NETWORK STATUS HOOK
 * 
 * React hook pre monitoring network connectivity:
 * - Online/offline detection
 * - Connection quality estimation
 * - Auto-retry when connection restored
 */

import { useState, useEffect, useCallback } from 'react';
import { createNetworkMonitor } from '../utils/errorHandling';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface UseNetworkStatusReturn {
  isOnline: boolean;
  wasOffline: boolean;
  connectionQuality: 'slow' | 'good' | 'fast' | 'unknown';
  networkStatus: NetworkStatus;
  triggerRetry: () => void;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  
  // Get network connection info (if available)
  const getNetworkInfo = useCallback((): NetworkStatus => {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      wasOffline,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }, [wasOffline]);
  
  // Determine connection quality
  const getConnectionQuality = useCallback((): 'slow' | 'good' | 'fast' | 'unknown' => {
    const info = getNetworkInfo();
    
    if (!isOnline) return 'unknown';
    
    // Ak nemáme connection API, assume good
    if (info.effectiveType === 'unknown') return 'good';
    
    // Based on effective connection type
    switch (info.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'good';
      case '4g':
        return 'fast';
      default:
        return 'good';
    }
  }, [isOnline, getNetworkInfo]);
  
  // Handle status changes
  const handleStatusChange = useCallback((online: boolean) => {
    setIsOnline(online);
    
    if (!online) {
      setWasOffline(true);
      console.log('📡 Network connection lost');
    } else if (wasOffline) {
      console.log('🌐 Network connection restored - triggering retry');
      setRetryTrigger(prev => prev + 1);
    }
  }, [wasOffline]);
  
  // Manual retry trigger
  const triggerRetry = useCallback(() => {
    console.log('🔄 Manual retry triggered');
    setRetryTrigger(prev => prev + 1);
  }, []);
  
  // Setup network monitoring
  useEffect(() => {
    const cleanup = createNetworkMonitor(handleStatusChange);
    
    return cleanup;
  }, [handleStatusChange]);
  
  // Log network changes
  useEffect(() => {
    if (retryTrigger > 0) {
      console.log(`🔄 Network retry trigger: ${retryTrigger}`);
    }
  }, [retryTrigger]);
  
  return {
    isOnline,
    wasOffline,
    connectionQuality: getConnectionQuality(),
    networkStatus: getNetworkInfo(),
    triggerRetry
  };
};