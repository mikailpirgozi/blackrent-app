// 🚑 Mobile Recovery Hook - Emergency recovery for mobile refresh issues
// Provides automatic recovery and state restoration after unexpected refreshes

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMobileStabilizer } from '../utils/mobileStabilizer';

interface RecoveryState {
  isRecovering: boolean;
  recoveredData: any;
  lastKnownPath: string;
  refreshCount: number;
}

interface UseMobileRecoveryOptions {
  enableAutoRecovery: boolean;
  maxRefreshCount: number;
  recoveryTimeout: number;
  debugMode: boolean;
}

export const useMobileRecovery = (options: Partial<UseMobileRecoveryOptions> = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const config = {
    enableAutoRecovery: true,
    maxRefreshCount: 3,
    recoveryTimeout: 5000,
    debugMode: false,
    ...options
  };

  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    isRecovering: false,
    recoveredData: null,
    lastKnownPath: '',
    refreshCount: 0
  });

  const lastLocationRef = useRef<string>('');
  const refreshCountRef = useRef<number>(0);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout>();

  const log = (message: string, data?: any) => {
    if (config.debugMode) {
      console.log(`🚑 MobileRecovery: ${message}`, data || '');
    }
  };

  // Check for unexpected refresh on mount
  useEffect(() => {
    if (!config.enableAutoRecovery) return;

    const checkForUnexpectedRefresh = () => {
      const wasUnexpectedRefresh = sessionStorage.getItem('mobileStabilizer_unexpectedRefresh');
      const lastPath = sessionStorage.getItem('mobileRecovery_lastPath');
      const currentPath = location.pathname;
      
      log('Checking for unexpected refresh', {
        wasUnexpectedRefresh: !!wasUnexpectedRefresh,
        lastPath,
        currentPath,
        isMainPage: currentPath === '/' || currentPath === '/vehicles' || currentPath === '/rentals'
      });

      // If we're on main page but last path was a form/protocol page, it's likely a refresh
      if (lastPath && lastPath !== currentPath) {
        const wasInForm = lastPath.includes('/protocols/') || 
                         lastPath.includes('/edit/') || 
                         lastPath.includes('/create/');
        const isNowOnMain = currentPath === '/' || 
                           currentPath === '/vehicles' || 
                           currentPath === '/rentals';

        if (wasInForm && isNowOnMain) {
          log('Detected unexpected refresh from form to main page', {
            from: lastPath,
            to: currentPath
          });
          
          handleUnexpectedRefresh(lastPath);
        }
      }

      if (wasUnexpectedRefresh) {
        log('Found unexpected refresh marker');
        handleUnexpectedRefresh(lastPath || currentPath);
        sessionStorage.removeItem('mobileStabilizer_unexpectedRefresh');
      }
    };

    // Check after a short delay to allow other components to initialize
    const checkTimeout = setTimeout(checkForUnexpectedRefresh, 500);
    
    return () => clearTimeout(checkTimeout);
  }, [location.pathname, config.enableAutoRecovery]);

  // Track current location
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Only update if path actually changed
    if (lastLocationRef.current !== currentPath) {
      lastLocationRef.current = currentPath;
      sessionStorage.setItem('mobileRecovery_lastPath', currentPath);
      
      log('Location tracked', { path: currentPath });
    }
  }, [location.pathname]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden - save current state
        saveCurrentState();
      } else {
        // Page is becoming visible - check if we need recovery
        setTimeout(() => {
          checkForRecoveryNeeded();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUnexpectedRefresh = (expectedPath: string) => {
    const currentRefreshCount = refreshCountRef.current + 1;
    refreshCountRef.current = currentRefreshCount;

    log('Handling unexpected refresh', {
      expectedPath,
      currentPath: location.pathname,
      refreshCount: currentRefreshCount,
      maxRefreshCount: config.maxRefreshCount
    });

    // If too many refreshes, stop trying to recover
    if (currentRefreshCount > config.maxRefreshCount) {
      log('Too many refreshes, giving up recovery');
      showRecoveryNotification('Príliš veľa refreshov. Obnovte stránku manuálne.');
      return;
    }

    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      lastKnownPath: expectedPath,
      refreshCount: currentRefreshCount
    }));

    // Try to recover state
    attemptRecovery(expectedPath);
  };

  const attemptRecovery = async (targetPath: string) => {
    try {
      log('Attempting recovery', { targetPath });

      // Get stabilizer data
      const stabilizer = getMobileStabilizer();
      let recoveredData: any = null;

      if (stabilizer) {
        const snapshots = stabilizer.getFormSnapshots();
        const relevantSnapshot = snapshots.find(snapshot => 
          snapshot.url.includes(targetPath) || 
          snapshot.formType === detectFormType(targetPath)
        );

        if (relevantSnapshot) {
          recoveredData = relevantSnapshot;
          log('Found relevant form snapshot', relevantSnapshot);
        }
      }

      // Get saved state from session storage
      const savedState = sessionStorage.getItem('mobileStabilizer_state');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.url.includes(targetPath)) {
            recoveredData = { ...recoveredData, ...state };
            log('Found relevant saved state', state);
          }
        } catch (error) {
          log('Error parsing saved state', error);
        }
      }

      // Set recovery timeout
      recoveryTimeoutRef.current = setTimeout(() => {
        log('Recovery timeout reached');
        setRecoveryState(prev => ({ ...prev, isRecovering: false }));
      }, config.recoveryTimeout);

      if (recoveredData) {
        setRecoveryState(prev => ({
          ...prev,
          recoveredData,
          isRecovering: false
        }));

        // Show recovery notification
        showRecoveryNotification(
          `Obnovené dáta z predchádzajúcej session. Pokračujte tam, kde ste skončili.`,
          () => {
            if (targetPath !== location.pathname) {
              navigate(targetPath);
            }
          }
        );
      } else {
        log('No recoverable data found');
        setRecoveryState(prev => ({ ...prev, isRecovering: false }));
        
        // Offer to return to last known location
        if (targetPath !== location.pathname) {
          showRecoveryNotification(
            `Chcete sa vrátiť na ${getPathDisplayName(targetPath)}?`,
            () => navigate(targetPath)
          );
        }
      }

    } catch (error) {
      log('Recovery attempt failed', error);
      setRecoveryState(prev => ({ ...prev, isRecovering: false }));
    } finally {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    }
  };

  const saveCurrentState = () => {
    const state = {
      timestamp: Date.now(),
      path: location.pathname,
      scrollPosition: {
        x: window.scrollX,
        y: window.scrollY
      }
    };

    sessionStorage.setItem('mobileRecovery_currentState', JSON.stringify(state));
    log('Current state saved', state);
  };

  const checkForRecoveryNeeded = () => {
    const currentState = sessionStorage.getItem('mobileRecovery_currentState');
    if (!currentState) return;

    try {
      const state = JSON.parse(currentState);
      const timeDiff = Date.now() - state.timestamp;
      
      // If state is recent (within 30 seconds) and path changed unexpectedly
      if (timeDiff < 30000 && state.path !== location.pathname) {
        const wasInForm = state.path.includes('/protocols/') || 
                         state.path.includes('/edit/') || 
                         state.path.includes('/create/');
        
        if (wasInForm) {
          log('Detected potential recovery scenario', {
            savedPath: state.path,
            currentPath: location.pathname,
            timeDiff
          });
          
          handleUnexpectedRefresh(state.path);
        }
      }
    } catch (error) {
      log('Error checking recovery state', error);
    }
  };

  const showRecoveryNotification = (message: string, action?: () => void) => {
    // Simple notification - in production you might want to use a toast library
    if (window.confirm(`🚑 Mobile Recovery: ${message}`)) {
      if (action) {
        action();
      }
    }
  };

  const detectFormType = (path: string): string => {
    if (path.includes('/protocols/')) return 'protocol';
    if (path.includes('/rentals/')) return 'rental';
    if (path.includes('/vehicles/')) return 'vehicle';
    if (path.includes('/customers/')) return 'customer';
    return 'unknown';
  };

  const getPathDisplayName = (path: string): string => {
    if (path.includes('/protocols/handover')) return 'odovzdávací protokol';
    if (path.includes('/protocols/return')) return 'preberací protokol';
    if (path.includes('/rentals/edit')) return 'úprava prenájmu';
    if (path.includes('/vehicles/edit')) return 'úprava vozidla';
    if (path.includes('/customers/edit')) return 'úprava zákazníka';
    return path;
  };

  const clearRecoveryData = () => {
    setRecoveryState({
      isRecovering: false,
      recoveredData: null,
      lastKnownPath: '',
      refreshCount: 0
    });
    
    refreshCountRef.current = 0;
    sessionStorage.removeItem('mobileRecovery_currentState');
    sessionStorage.removeItem('mobileRecovery_lastPath');
    
    log('Recovery data cleared');
  };

  const restoreFormData = (formData: any) => {
    if (!formData) return;
    
    try {
      const stabilizer = getMobileStabilizer();
      if (stabilizer && formData.formData) {
        stabilizer.restoreFormSnapshot(formData);
        log('Form data restored', formData);
      }
    } catch (error) {
      log('Error restoring form data', error);
    }
  };

  return {
    recoveryState,
    clearRecoveryData,
    restoreFormData,
    isRecovering: recoveryState.isRecovering,
    hasRecoveredData: !!recoveryState.recoveredData,
    recoveredData: recoveryState.recoveredData
  };
};

export default useMobileRecovery;
