/**
 * 🔥 FORCE SERVICE WORKER UPDATE - Enterprise Solution
 *
 * Používajú ho: Google, Facebook, Netflix, Vercel, Airbnb
 *
 * Okamžite invaliduje Service Worker a všetky caches,
 * a re-registruje nový Service Worker.
 */

import { logger } from './smartLogger';

export async function forceServiceWorkerUpdate(): Promise<void> {
  logger.debug('🔥 Force Service Worker Update: Starting...');

  try {
    // ✅ STEP 1: Unregister ALL Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (registrations.length > 0) {
        logger.debug(
          `🗑️ Found ${registrations.length} Service Worker(s) - unregistering...`
        );

        await Promise.all(
          registrations.map(async registration => {
            logger.debug('🗑️ Unregistering:', registration.scope);
            await registration.unregister();
          })
        );

        logger.debug('✅ All Service Workers unregistered');
      } else {
        logger.debug('✅ No existing Service Workers found');
      }
    }

    // ✅ STEP 2: Clear ALL caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();

      if (cacheNames.length > 0) {
        logger.debug(`🗑️ Found ${cacheNames.length} cache(s) - deleting...`);

        await Promise.all(
          cacheNames.map(async cacheName => {
            logger.debug('🗑️ Deleting cache:', cacheName);
            await caches.delete(cacheName);
          })
        );

        logger.debug('✅ All caches cleared');
      } else {
        logger.debug('✅ No caches found');
      }
    }

    logger.debug('✅ Force Service Worker Update: Complete');
    logger.debug('🔄 Please refresh the page to activate new Service Worker');
  } catch (error) {
    console.error('❌ Force Service Worker Update failed:', error);
    throw error;
  }
}

/**
 * Force update a automaticky refresh stránky
 */
export async function forceServiceWorkerUpdateAndReload(): Promise<void> {
  try {
    await forceServiceWorkerUpdate();

    // Wait a bit for cleanup to complete
    setTimeout(() => {
      logger.debug('🔄 Reloading to activate new Service Worker...');
      // Hard reload to bypass cache
      window.location.reload();
    }, 500);
  } catch (error) {
    console.error('❌ Force update and reload failed:', error);
    // Fallback: reload anyway
    window.location.reload();
  }
}

/**
 * Check či je potrebný Service Worker update
 */
export async function checkServiceWorkerVersion(): Promise<{
  needsUpdate: boolean;
  currentVersion: string | null;
  latestVersion: string;
}> {
  const LATEST_VERSION = '2.2.0'; // Must match sw.js CACHE_VERSION

  try {
    if (!('serviceWorker' in navigator)) {
      return {
        needsUpdate: false,
        currentVersion: null,
        latestVersion: LATEST_VERSION,
      };
    }

    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration || !registration.active) {
      return {
        needsUpdate: true,
        currentVersion: null,
        latestVersion: LATEST_VERSION,
      };
    }

    // Get version from Service Worker
    const currentVersion = await new Promise<string>(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = event => {
        resolve(event.data.version || 'unknown');
      };

      registration.active?.postMessage({ type: 'GET_VERSION' }, [
        channel.port2,
      ]);

      // Timeout after 2 seconds
      setTimeout(() => resolve('unknown'), 2000);
    });

    const needsUpdate = currentVersion !== `blackrent-v${LATEST_VERSION}`;

    logger.debug('🔍 Service Worker Version Check:', {
      current: currentVersion,
      latest: `blackrent-v${LATEST_VERSION}`,
      needsUpdate,
    });

    return { needsUpdate, currentVersion, latestVersion: LATEST_VERSION };
  } catch (error) {
    console.error('❌ Version check failed:', error);
    return {
      needsUpdate: false,
      currentVersion: null,
      latestVersion: LATEST_VERSION,
    };
  }
}
