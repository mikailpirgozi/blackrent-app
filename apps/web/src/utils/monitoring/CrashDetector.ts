/**
 * Crash Detector
 * 
 * Detects app crashes and enables recovery on next load
 * Uses heartbeat mechanism and localStorage flags
 */

import { logger } from '../logger';
import { indexedDBManager } from '../storage/IndexedDBManager';

export interface CrashReport {
  timestamp: number;
  url: string;
  userAgent: string;
  protocolId?: string;
  operation?: string;
  memoryUsage?: number;
}

export class CrashDetector {
  private heartbeatInterval: number | null = null;
  private readonly HEARTBEAT_KEY = 'blackrent_heartbeat';
  private readonly CRASH_KEY = 'blackrent_last_crash';
  private readonly HEARTBEAT_INTERVAL_MS = 5000; // 5 seconds

  /**
   * Initialize crash detection
   * Call this on app mount
   */
  initialize(): void {
    // Check for previous crash
    const crashed = this.detectPreviousCrash();
    
    if (crashed) {
      logger.error('Previous session crashed', crashed);
      this.handleCrashRecovery(crashed);
    }

    // Start heartbeat
    this.startHeartbeat();

    logger.info('Crash detector initialized');
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    // Set initial heartbeat
    this.updateHeartbeat();

    // Update every 5 seconds
    this.heartbeatInterval = window.setInterval(() => {
      this.updateHeartbeat();
    }, this.HEARTBEAT_INTERVAL_MS);

    // Clear heartbeat on normal page unload
    window.addEventListener('beforeunload', () => {
      this.clearHeartbeat();
    });
  }

  /**
   * Update heartbeat timestamp
   */
  private updateHeartbeat(): void {
    try {
      const heartbeat = {
        timestamp: Date.now(),
        url: window.location.href,
        protocolId: this.getCurrentProtocolId(),
      };
      
      localStorage.setItem(this.HEARTBEAT_KEY, JSON.stringify(heartbeat));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Clear heartbeat (normal exit)
   */
  private clearHeartbeat(): void {
    try {
      localStorage.removeItem(this.HEARTBEAT_KEY);
    } catch (error) {
      // Ignore localStorage errors
    }

    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Detect if previous session crashed
   */
  private detectPreviousCrash(): CrashReport | null {
    try {
      const heartbeatStr = localStorage.getItem(this.HEARTBEAT_KEY);
      
      if (!heartbeatStr) {
        return null; // No heartbeat = normal close
      }

      const heartbeat = JSON.parse(heartbeatStr);
      const timeSinceHeartbeat = Date.now() - heartbeat.timestamp;

      // If heartbeat is stale (>30s), consider it a crash
      if (timeSinceHeartbeat > 30000) {
        const crashReport: CrashReport = {
          timestamp: heartbeat.timestamp,
          url: heartbeat.url,
          userAgent: navigator.userAgent,
          protocolId: heartbeat.protocolId,
        };

        // Save crash report
        localStorage.setItem(this.CRASH_KEY, JSON.stringify(crashReport));

        return crashReport;
      }

      return null;
    } catch (error) {
      logger.error('Crash detection failed', { error });
      return null;
    }
  }

  /**
   * Handle crash recovery
   */
  private async handleCrashRecovery(crash: CrashReport): Promise<void> {
    logger.info('Initiating crash recovery', crash);

    // Check for incomplete protocols
    if (crash.protocolId) {
      try {
        const draft = await indexedDBManager.getDraft(crash.protocolId);
        
        if (draft && draft.uploadedCount < draft.totalCount) {
          logger.info('Incomplete protocol found after crash', {
            protocolId: crash.protocolId,
            uploaded: draft.uploadedCount,
            total: draft.totalCount,
          });

          // Show recovery dialog (handled by EnterprisePhotoCapture)
          // The component will detect the draft on mount
        }
      } catch (error) {
        logger.error('Crash recovery check failed', { error });
      }
    }

    // Check for queued uploads
    try {
      const queuedTasks = await indexedDBManager.getQueuedTasks();
      
      if (queuedTasks.length > 0) {
        logger.info('Queued uploads found after crash', {
          count: queuedTasks.length,
        });

        // Background Sync will handle these automatically
      }
    } catch (error) {
      logger.error('Queue check failed', { error });
    }
  }

  /**
   * Get current protocol ID from URL
   */
  private getCurrentProtocolId(): string | undefined {
    // Try to extract protocol ID from URL
    const match = window.location.href.match(/protocol[/=]([a-f0-9-]+)/i);
    return match ? match[1] : undefined;
  }

  /**
   * Get last crash report
   */
  getLastCrash(): CrashReport | null {
    try {
      const crashStr = localStorage.getItem(this.CRASH_KEY);
      if (!crashStr) return null;
      
      return JSON.parse(crashStr);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear crash history
   */
  clearCrashHistory(): void {
    try {
      localStorage.removeItem(this.CRASH_KEY);
      localStorage.removeItem(this.HEARTBEAT_KEY);
      logger.debug('Crash history cleared');
    } catch (error) {
      // Ignore
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearHeartbeat();
  }
}

// Singleton instance
export const crashDetector = new CrashDetector();

