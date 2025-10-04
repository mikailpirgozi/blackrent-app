/**
 * 🚀 FAST STARTUP OPTIMIZATION
 *
 * Cieľ: Redukovať načítavací čas z 3-5s na < 1s
 *
 * Stratégia:
 * 1. Service Worker update LEN raz za deň (nie pri každom načítaní)
 * 2. Critical resources LAZY (až keď sú potrebné)
 * 3. Vehicle Documents LAZY (až keď otvoríš vozidlo)
 * 4. Parallel loading namiesto sequential
 */

import { logger } from './smartLogger';

// ========================================
// 1. SMART SERVICE WORKER UPDATE
// ========================================

const SW_UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hodín
const SW_LAST_CHECK_KEY = 'sw_last_update_check';

export const shouldCheckSWUpdate = (): boolean => {
  const lastCheck = localStorage.getItem(SW_LAST_CHECK_KEY);

  if (!lastCheck) {
    return true; // Prvý check
  }

  const lastCheckTime = parseInt(lastCheck, 10);
  const now = Date.now();

  // Check len ak prešlo viac ako 24 hodín
  const shouldCheck = now - lastCheckTime > SW_UPDATE_CHECK_INTERVAL;

  if (shouldCheck) {
    logger.debug('⏰ SW Update Check: 24h elapsed, checking...');
  } else {
    const hoursLeft = Math.round(
      (SW_UPDATE_CHECK_INTERVAL - (now - lastCheckTime)) / (60 * 60 * 1000)
    );
    logger.debug(`⏭️ SW Update Check: Skipped (next check in ${hoursLeft}h)`);
  }

  return shouldCheck;
};

export const markSWCheckCompleted = (): void => {
  localStorage.setItem(SW_LAST_CHECK_KEY, Date.now().toString());
  logger.debug('✅ SW Update Check: Marked as completed');
};

// ========================================
// 2. LAZY CRITICAL RESOURCES
// ========================================

let criticalResourcesLoaded = false;

export const initCriticalResourcesLazy = async (): Promise<void> => {
  if (criticalResourcesLoaded) {
    logger.debug('⏭️ Critical resources already loaded, skipping...');
    return;
  }

  try {
    logger.debug('⚡ Loading critical resources (lazy)...');

    // Len najdôležitejšie DNS prefetch
    const criticalDomains = ['fonts.googleapis.com', 'fonts.gstatic.com'];

    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    criticalResourcesLoaded = true;
    logger.debug('✅ Critical resources loaded (lazy)');
  } catch (error) {
    logger.error('❌ Failed to load critical resources', error);
  }
};

// ========================================
// 3. PARALLEL STARTUP TASKS
// ========================================

export const runParallelStartupTasks = async (): Promise<void> => {
  logger.debug('🚀 Running parallel startup tasks...');

  const startTime = Date.now();

  // Všetko paralelne!
  await Promise.allSettled([
    // Task 1: Lazy critical resources (50-100ms)
    initCriticalResourcesLazy(),

    // Task 2: SW update check (ak je potrebný) (2-3s)
    (async () => {
      if (shouldCheckSWUpdate()) {
        // Import PWA hook len ak je potrebný
        const { usePWA } = await import('../hooks/usePWA');
        // Update check sa spustí automaticky v hooku
      }
    })(),
  ]);

  const elapsed = Date.now() - startTime;
  logger.debug(`✅ Parallel startup completed in ${elapsed}ms`);
};

// ========================================
// 4. VEHICLE DOCUMENTS - ON DEMAND ONLY
// ========================================

let vehicleDocumentsCacheWarmed = false;

export const warmVehicleDocumentsCache = async (): Promise<void> => {
  if (vehicleDocumentsCacheWarmed) {
    return;
  }

  try {
    // ✅ Check if user is authenticated before warming cache
    const authData = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authData) {
      logger.debug('⏭️ Skipping vehicle documents cache warming - user not authenticated');
      return;
    }

    // Cache warming v pozadí - neklepaj loading state
    logger.debug('🔥 Warming vehicle documents cache...');

    // Dynamic import aby sme neblokovali startup
    const { apiService } = await import('../services/api');
    await apiService.getVehicleDocuments();

    vehicleDocumentsCacheWarmed = true;
    logger.debug('✅ Vehicle documents cache warmed');
  } catch (error) {
    // Don't log error if it's just an auth issue
    if (error instanceof Error && error.message.includes('token')) {
      logger.debug('⏭️ Cache warming skipped - authentication required');
    } else {
      logger.error('❌ Failed to warm vehicle documents cache', error);
    }
  }
};

// ========================================
// 5. STARTUP ORCHESTRATION
// ========================================

export const optimizedStartup = async (): Promise<void> => {
  const startTime = Date.now();

  logger.info('🚀 FAST STARTUP: Starting...', undefined, 'performance');

  try {
    // FÁZA 1: Parallel tasks (non-blocking)
    await runParallelStartupTasks();

    // FÁZA 2: Lazy loading v pozadí (after 1s idle)
    setTimeout(() => {
      warmVehicleDocumentsCache();
    }, 1000);

    const elapsed = Date.now() - startTime;
    logger.info(
      `✅ FAST STARTUP: Completed in ${elapsed}ms`,
      undefined,
      'performance'
    );
  } catch (error) {
    logger.error('❌ FAST STARTUP: Failed', error);
  }
};

// ========================================
// 6. EXPORT UTILITIES
// ========================================

export default {
  optimizedStartup,
  shouldCheckSWUpdate,
  markSWCheckCompleted,
  initCriticalResourcesLazy,
  warmVehicleDocumentsCache,
};
