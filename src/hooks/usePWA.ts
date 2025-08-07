// 📱 PWA Management Hook
// Provides install prompt, service worker management, and offline detection

import { useState, useEffect, useRef } from 'react';
import { useError } from '../context/ErrorContext';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  swRegistration: ServiceWorkerRegistration | null;
}

interface PWAActions {
  promptInstall: () => Promise<boolean>;
  updateServiceWorker: () => Promise<void>;
  unregisterServiceWorker: () => Promise<void>;
  clearCache: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  getVersion: () => Promise<string>;
}

export const usePWA = (): PWAState & PWAActions => {
  const { showError } = useError();
  
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    isUpdateAvailable: false,
    installPrompt: null,
    swRegistration: null,
  });

  const refreshing = useRef(false);

  // Initialize PWA features
  useEffect(() => {
    initializePWA();
    setupEventListeners();
    
    return () => {
      removeEventListeners();
    };
  }, []);

  const initializePWA = async () => {
    try {
      // Check if app is already installed
      checkInstallationStatus();
      
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await registerServiceWorker();
        if (registration) {
          setState(prev => ({ ...prev, swRegistration: registration }));
          console.log('✅ PWA: Service Worker successfully initialized');
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
  };

  const setupEventListeners = () => {
    // Install prompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // App installed event
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  };

  const removeEventListeners = () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    const promptEvent = event as BeforeInstallPromptEvent;
    
    setState(prev => ({
      ...prev,
      isInstallable: true,
      installPrompt: promptEvent,
    }));
    
    console.log('📱 PWA: Install prompt available');
  };

  const handleAppInstalled = () => {
    setState(prev => ({
      ...prev,
      isInstalled: true,
      isInstallable: false,
      installPrompt: null,
    }));
    
    // App installed silently - no user notification needed
    console.log('✅ PWA: App installed successfully');
  };

  const handleOnline = () => {
    setState(prev => ({ ...prev, isOffline: false }));
    console.log('🌐 PWA: App is online');
    
    // Network restored silently - no user notification needed
  };

  const handleOffline = () => {
    setState(prev => ({ ...prev, isOffline: true }));
    console.log('📵 PWA: App is offline');
    
    // App offline silently - no user notification needed
  };

  const checkInstallationStatus = () => {
    // Check if running as installed PWA
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    
    setState(prev => ({ ...prev, isInstalled }));
  };

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered successfully:', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setState(prev => ({ ...prev, isUpdateAvailable: true }));
            console.log('🔄 PWA: Update available');
            
            // Update available silently - no user notification needed
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // PWA functions activated silently - no user notification needed

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      
      // Only show error if it's a real error, not just network issues
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        showError({
          message: 'Service Worker registrácia zlyhala',
          category: 'client',
          severity: 'warning',
          context: { error: error.message },
        });
      } else {
        console.warn('Service Worker registration skipped due to network issues');
      }
      return null;
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, message } = event.data;
    
    switch (type) {
      case 'SYNC_COMPLETE':
        // Sync completed silently - no user notification needed
        console.log('✅ PWA: Offline actions synchronized');
        break;
        
      case 'CACHE_UPDATED':
        console.log('📦 PWA: Cache updated');
        break;
        
      default:
        console.log('📨 PWA: Service Worker message:', type, message);
    }
  };

  // Actions
  const promptInstall = async (): Promise<boolean> => {
    if (!state.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await state.installPrompt.prompt();
      const choiceResult = await state.installPrompt.userChoice;
      
      console.log('📱 PWA: Install prompt result:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstallable: false, 
          installPrompt: null 
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
        
        // Refresh the page after update
        if (!refreshing.current) {
          refreshing.current = true;
          window.location.reload();
        }
      }

      setState(prev => ({ ...prev, isUpdateAvailable: false }));
      
      // App updating silently - no user notification needed
    } catch (error) {
      console.error('Service Worker update failed:', error);
      showError({
        message: 'Aktualizácia aplikácie zlyhala',
        category: 'client',
        severity: 'error',
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
      
      console.log('🗑️ PWA: Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregister failed:', error);
      showError({
        message: 'Odstránenie Service Worker zlyhalo',
        category: 'client',
        severity: 'error',
        context: { error },
      });
    }
  };

  const clearCache = async (): Promise<void> => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Also tell service worker to clear cache
      if (state.swRegistration?.active) {
        const channel = new MessageChannel();
        state.swRegistration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        );
      }

      // Cache cleared silently - no user notification needed

      console.log('🗑️ PWA: Cache cleared');
    } catch (error) {
      console.error('Cache clear failed:', error);
      showError({
        message: 'Vymazanie cache zlyhalo',
        category: 'client',
        severity: 'error',
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
      console.log('🔄 PWA: Checked for updates');
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const getVersion = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (!state.swRegistration?.active) {
        resolve('Unknown');
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.version || 'Unknown');
      };

      state.swRegistration.active.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
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