/**
 * 🔥 FORCE SERVICE WORKER UPDATE - Enterprise Solution
 *
 * Používajú ho: Google, Facebook, Netflix, Vercel, Airbnb
 *
 * Okamžite invaliduje Service Worker a všetky caches,
 * a re-registruje nový Service Worker.
 */

export async function forceServiceWorkerUpdate(): Promise<void> {
  console.log('🔥 Force Service Worker Update: Starting...');

  try {
    // ✅ STEP 1: Unregister ALL Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (registrations.length > 0) {
        console.log(
          `🗑️ Found ${registrations.length} Service Worker(s) - unregistering...`
        );

        await Promise.all(
          registrations.map(async registration => {
            console.log('🗑️ Unregistering:', registration.scope);
            await registration.unregister();
          })
        );

        console.log('✅ All Service Workers unregistered');
      } else {
        console.log('✅ No existing Service Workers found');
      }
    }

    // ✅ STEP 2: Clear ALL caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();

      if (cacheNames.length > 0) {
        console.log(`🗑️ Found ${cacheNames.length} cache(s) - deleting...`);

        await Promise.all(
          cacheNames.map(async cacheName => {
            console.log('🗑️ Deleting cache:', cacheName);
            await caches.delete(cacheName);
          })
        );

        console.log('✅ All caches cleared');
      } else {
        console.log('✅ No caches found');
      }
    }

    console.log('✅ Force Service Worker Update: Complete');
    console.log('🔄 Please refresh the page to activate new Service Worker');
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
      console.log('🔄 Reloading to activate new Service Worker...');
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

    console.log('🔍 Service Worker Version Check:', {
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
