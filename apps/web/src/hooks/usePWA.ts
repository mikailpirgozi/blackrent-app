// 📱 PWA Management Hook
// Provides install prompt, service worker management, and offline detection

import { useCallback, useEffect, useRef, useState } from 'react';

import { useError } from '../context/ErrorContext';
import { logger } from '@/utils/smartLogger';
import { shouldCheckSWUpdate, markSWCheckCompleted } from '@/utils/fastStartup';

// PWA specific types - browser APIs with proper typing
type PWAServiceWorkerRegistration = ServiceWorkerRegistration;
type PWAMessageEvent = MessageEvent;
type PWANavigator = Navigator & {
  standalone?: boolean;
};

export interface BeforeInstallPromptEvent {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  preventDefault(): void;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  swRegistration: PWAServiceWorkerRegistration | null;
}

interface PWAActions {
  promptInstall: () => Promise<boolean>;
  updateServiceWorker: () => Promise<void>;
  unregisterServiceWorker: () => Promise<void>;
  clearCache: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  getVersion: () => Promise<string>;
}

// Global singleton to prevent duplicate SW registrations
let isInitialized = false;
let globalSWRegistration: PWAServiceWorkerRegistration | null = null;

export const usePWA = (): PWAState & PWAActions => {
  const { showError } = useError();

  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !(typeof window !== 'undefined' && 'navigator' in window
      ? (window.navigator as PWANavigator).onLine
      : true),
    isUpdateAvailable: false,
    installPrompt: null,
    swRegistration: globalSWRegistration,
  });

  const refreshing = useRef(false);

  const registerServiceWorker =
    useCallback(async (): Promise<PWAServiceWorkerRegistration | null> => {
      if (
        typeof window === 'undefined' ||
        !('navigator' in window) ||
        !('serviceWorker' in (window.navigator as PWANavigator))
      ) {
        console.warn('Service Worker not supported');
        return null;
      }

      try {
        const registration = (await (
          window.navigator as PWANavigator
        ).serviceWorker.register('/sw.js', {
          scope: '/',
        })) as PWAServiceWorkerRegistration;

        logger.debug(
          '✅ Service Worker registered successfully:',
          registration.scope
        );

        // ✅ ENABLED: Service Worker update detection with smart handling
        logger.debug('🔄 PWA: Service Worker update detection ENABLED');
        logger.debug(
          '📱 Smart update handling prevents unwanted mobile refreshes'
        );

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              (window.navigator as PWANavigator).serviceWorker.controller
            ) {
              setState(prev => ({ ...prev, isUpdateAvailable: true }));
              logger.debug('🔄 PWA: Update available - user will be notified');

              // Smart update notification instead of automatic refresh
              if (typeof window !== 'undefined') {
                // Check if user is on a critical page where refresh would be disruptive
                const isCriticalPage =
                  window.location.pathname.includes('/availability') ||
                  window.location.pathname.includes('/protocols') ||
                  window.location.pathname.includes('/rentals');

                if (isCriticalPage) {
                  logger.debug(
                    '📱 Critical page detected - update notification only'
                  );
                } else {
                  logger.debug('🔄 Safe to show update prompt');
                }
              }
            }
          });
        });

        // Listen for messages from service worker
        (window.navigator as PWANavigator).serviceWorker.addEventListener(
          'message',
          handleServiceWorkerMessage
        );

        // Check Background Sync API availability (PWA Enterprise feature)
        if ('sync' in registration) {
          logger.debug('✅ Background Sync API available - PWA mode active');
          logger.debug('📤 Protocol photos will auto-upload when online');
        } else {
          logger.warn('⚠️ Background Sync API not available');
          logger.warn('📤 Uploads will use immediate retry only');
        }

        // PWA functions activated silently - no user notification needed

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);

        // Only show error for critical failures in production
        if (
          error instanceof Error &&
          !error.message.includes('Failed to fetch') &&
          !error.message.includes('NetworkError') &&
          !error.message.includes('Load failed') &&
          process.env.NODE_ENV === 'development'
        ) {
          showError({
            message: 'Service Worker registrácia zlyhala',
            category: 'client',
            severity: 'warning',
            details: error.message,
            context: { error: error.message },
          });
        } else {
          console.warn(
            'Service Worker registration failed silently:',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
        return null;
      }
    }, [showError]);

  const initializePWA = useCallback(async () => {
    try {
      // Check if app is already installed
      checkInstallationStatus();

      // ⚡ OPTIMIZED: Check SW update only once per 24h (not every page load!)
      if (shouldCheckSWUpdate()) {
        logger.debug('⏰ SW Update Check: 24h elapsed, checking version...');

        // Dynamic import to avoid circular dependencies
        const { checkServiceWorkerVersion, forceServiceWorkerUpdate } =
          await import('../utils/forceServiceWorkerUpdate');
        const versionCheck = await checkServiceWorkerVersion();

        if (versionCheck.needsUpdate) {
          logger.debug('🔄 Service Worker update needed - forcing update...');
          await forceServiceWorkerUpdate();
          logger.debug(
            '✅ Service Worker updated - will activate on next page load'
          );
        } else {
          logger.debug('✅ Service Worker is up to date');
        }

        // Mark as checked
        markSWCheckCompleted();
      } else {
        logger.debug('⏭️ SW Update Check: Skipped (checked within last 24h)');
      }

      // 🔧 ALLOW Service Worker on mobile but with disabled auto-updates
      const isMobileDevice = window.matchMedia('(max-width: 900px)').matches;

      if (isMobileDevice) {
        logger.debug(
          '📱 PWA: Service Worker enabled on mobile but auto-updates DISABLED'
        );
      }

      // Register service worker na všetkých zariadeniach
      if (
        typeof window !== 'undefined' &&
        'navigator' in window &&
        'serviceWorker' in (window.navigator as PWANavigator)
      ) {
        const registration = await registerServiceWorker();
        if (registration) {
          globalSWRegistration = registration; // Store globally
          setState(prev => ({ ...prev, swRegistration: registration }));
          logger.debug('✅ PWA: Service Worker successfully initialized');
        } else {
          console.warn('⚠️ PWA: Service Worker registration returned null');
        }
      } else {
        console.warn('⚠️ PWA: Service Worker not supported in this browser');
      }
    } catch (error) {
      console.error('PWA initialization failed:', error);
      // Don't show error for PWA initialization - it's not critical
      console.warn('PWA features will be limited without Service Worker');
    }
  }, [registerServiceWorker]);

  const setupEventListeners = useCallback(() => {
    // Install prompt event
    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener
    );

    // App installed event
    window.addEventListener('appinstalled', handleAppInstalled);

    // Online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }, []);

  const removeEventListeners = useCallback(() => {
    window.removeEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener
    );
    window.removeEventListener('appinstalled', handleAppInstalled);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }, []);

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    const promptEvent = event as BeforeInstallPromptEvent;

    setState(prev => ({
      ...prev,
      isInstallable: true,
      installPrompt: promptEvent,
    }));

    // logger.debug('📱 PWA: Install prompt available'); // VERBOSE: Disabled to reduce PWA spam
  };

  const handleAppInstalled = () => {
    setState(prev => ({
      ...prev,
      isInstalled: true,
      isInstallable: false,
      installPrompt: null,
    }));

    // App installed silently - no user notification needed
    logger.debug('✅ PWA: App installed successfully');
  };

  const handleOnline = () => {
    setState(prev => ({ ...prev, isOffline: false }));
    logger.debug('🌐 PWA: App is online');

    // Network restored silently - no user notification needed
  };

  const handleOffline = () => {
    setState(prev => ({ ...prev, isOffline: true }));
    logger.debug('📵 PWA: App is offline');

    // App offline silently - no user notification needed
  };

  const checkInstallationStatus = () => {
    // Check if running as installed PWA
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as PWANavigator).standalone === true;

    setState(prev => ({ ...prev, isInstalled }));
  };

  const handleServiceWorkerMessage = (event: PWAMessageEvent) => {
    const { type, message } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        // Sync completed silently - no user notification needed
        logger.debug('✅ PWA: Offline actions synchronized');
        break;

      case 'CACHE_UPDATED':
        logger.debug('📦 PWA: Cache updated');
        break;

      default:
        logger.debug('📨 PWA: Service Worker message:', { type, message });
    }
  };

  // Initialize PWA features - singleton pattern to prevent duplicates
  useEffect(() => {
    if (!isInitialized) {
      isInitialized = true;
      initializePWA();
      setupEventListeners();
    } else if (globalSWRegistration) {
      // If already initialized, just update state with existing registration
      setState(prev => ({ ...prev, swRegistration: globalSWRegistration }));
    }

    return () => {
      // Don't remove event listeners if other instances are still using them
      if (isInitialized) {
        removeEventListeners();
      }
    };
  }, [initializePWA, setupEventListeners, removeEventListeners]);

  // Actions
  const promptInstall = async (): Promise<boolean> => {
    if (!state.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await state.installPrompt.prompt();
      const choiceResult = await state.installPrompt.userChoice;

      // logger.debug('📱 PWA: Install prompt result:', choiceResult.outcome); // VERBOSE: Disabled

      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null,
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      showError({
        message: 'Inštalácia aplikácie zlyhala',
        category: 'client',
        severity: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
        context: { error },
      });
      return false;
    }
  };

  const updateServiceWorker = async (): Promise<void> => {
    if (!state.swRegistration) {
      console.warn('No service worker registration');
      return;
    }

    try {
      const waitingWorker = state.swRegistration.waiting;
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });

        // 🔍 IMPROVED: Lepšia mobile detekcia a logovanie
        const isAvailabilityPage =
          typeof window !== 'undefined' &&
          window.location.pathname.includes('/availability');
        const isVehiclePage =
          typeof window !== 'undefined' &&
          window.location.pathname.includes('/vehicles');
        const isMobileViewport =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(max-width: 900px)').matches;

        // Debounce reloady: minimálny odstup 10 minút
        const now = Date.now();
        const lastReloadAtStr = sessionStorage.getItem('lastReloadAt');
        const lastReloadAt = lastReloadAtStr ? Number(lastReloadAtStr) : 0;
        const tenMinutes = 10 * 60 * 1000;
        const recentlyReloaded =
          lastReloadAt && now - lastReloadAt < tenMinutes;

        console.group('🔄 Service Worker Update Decision');
        logger.debug('Is Availability Page:', isAvailabilityPage);
        logger.debug('Is Vehicle Page:', isVehiclePage);
        logger.debug('Is Mobile Viewport:', isMobileViewport);
        logger.debug('Recently Reloaded:', recentlyReloaded);
        logger.debug('Refreshing Flag:', refreshing.current);
        console.groupEnd();

        // ✅ ENABLED: Smart Service Worker update handling
        logger.debug(
          '🔄 Service Worker updated - Smart update handling enabled'
        );
        logger.debug('📱 Update will be applied with user consent');

        // Set update available flag
        setState(prev => ({ ...prev, isUpdateAvailable: true }));

        // Logujeme dôvod prečo nerobíme reload
        logger.debug(
          '🔄 SW update available but auto-reload is disabled to prevent mobile refresh issues'
        );
      }

      setState(prev => ({ ...prev, isUpdateAvailable: false }));

      // App updating silently - no user notification needed
    } catch (error) {
      console.error('Service Worker update failed:', error);
      showError({
        message: 'Aktualizácia aplikácie zlyhala',
        category: 'client',
        severity: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
        context: { error },
      });
    }
  };

  const unregisterServiceWorker = async (): Promise<void> => {
    if (!state.swRegistration) {
      console.warn('No service worker registration');
      return;
    }

    try {
      await state.swRegistration.unregister();
      setState(prev => ({ ...prev, swRegistration: null }));

      // Service Worker unregistered silently - no user notification needed

      logger.debug('🗑️ PWA: Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregister failed:', error);
      showError({
        message: 'Odstránenie Service Worker zlyhalo',
        category: 'client',
        severity: 'error',
        details: 'Nepodarilo sa odstrániť Service Worker z prehliadača.',
        context: { error },
      });
    }
  };

  const clearCache = async (): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName: string) => caches.delete(cacheName))
        );
      }

      // Also tell service worker to clear cache
      if (state.swRegistration?.active) {
        const channel = new MessageChannel();
        state.swRegistration.active.postMessage({ type: 'CLEAR_CACHE' }, [
          channel.port2,
        ]);
      }

      // Cache cleared silently - no user notification needed

      logger.debug('🗑️ PWA: Cache cleared');
    } catch (error) {
      console.error('Cache clear failed:', error);
      showError({
        message: 'Vymazanie cache zlyhalo',
        category: 'client',
        severity: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
        context: { error },
      });
    }
  };

  const checkForUpdates = async (): Promise<void> => {
    if (!state.swRegistration) {
      console.warn('No service worker registration');
      return;
    }

    try {
      await state.swRegistration.update();
      logger.debug('🔄 PWA: Checked for updates');
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const getVersion = async (): Promise<string> => {
    return new Promise(resolve => {
      if (!state.swRegistration?.active) {
        resolve('Unknown');
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = (event: MessageEvent) => {
        resolve((event.data as { version?: string }).version || 'Unknown');
      };

      state.swRegistration.active.postMessage({ type: 'GET_VERSION' }, [
        channel.port2,
      ]);
    });
  };

  return {
    ...state,
    promptInstall,
    updateServiceWorker,
    unregisterServiceWorker,
    clearCache,
    checkForUpdates,
    getVersion,
  };
};
