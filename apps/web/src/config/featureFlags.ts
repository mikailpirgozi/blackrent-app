/**
 * Feature Flags Configuration pre Protocol V2
 * Centralizované riadenie feature flags
 */

import React from 'react';

export interface FeatureFlag {
  enabled: boolean;
  users: string[];
  percentage: number;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

export interface FeatureFlagResponse {
  flag: {
    name: string;
    enabled: boolean;
    reason: string;
    configuration: {
      enabled: boolean;
      percentage: number;
      allowedUsers: string[];
    };
  };
}

export class FeatureManager {
  private static instance: FeatureManager;
  private cache: Map<string, { flag: FeatureFlag; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minút

  // In-memory flags pre testy
  private flags: Record<string, FeatureFlag> = {
    PROTOCOL_V2: {
      enabled: false,
      users: [],
      percentage: 0,
    },
    // 🎯 V1 PERFECT MIGRATION FLAG
    USE_V1_PERFECT_PROTOCOLS: {
      enabled: true, // ✅ ENABLED by default for all users
      users: [],
      percentage: 100, // 100% rollout
      description:
        'Enable V1 Perfect protocol system with Web Worker processing and parallel uploads',
    },
  };

  static getInstance(): FeatureManager {
    if (!this.instance) {
      this.instance = new FeatureManager();
    }
    return this.instance;
  }

  /**
   * Update flag - pre testy
   */
  updateFlag(flagName: string, config: Partial<FeatureFlag>): void {
    this.flags[flagName] = {
      ...this.flags[flagName],
      ...config,
    } as FeatureFlag;
    // Clear cache
    this.cache.delete(flagName);
  }

  /**
   * Kontrola či je feature flag povolený
   * Má dve verzie - sync pre testy a async pre produkciu
   */
  isEnabled(flagName: string, userId?: string): boolean | Promise<boolean> {
    // Ak je to test environment, vráť sync verziu
    if (process.env.NODE_ENV === 'test') {
      const flag = this.flags[flagName];
      if (!flag || !flag.enabled) return false;

      // Check specific users
      if (userId && flag.users.includes(userId)) return true;

      // Check percentage rollout
      if (flag.percentage > 0) {
        const hash = this.hashUserId(userId || 'anonymous');
        return hash % 100 < flag.percentage;
      }

      return false;
    }

    // 🚀 V2 QUICK FIX: Použiť localStorage ako primary source
    // Keďže API endpoint pre feature flags neexistuje (405 error)
    if (flagName === 'PROTOCOL_V2_ENABLED') {
      const localValue = localStorage.getItem('PROTOCOL_V2_ENABLED');
      if (localValue !== null) {
        return localValue === 'true';
      }
    }

    // Async verzia pre produkciu
    return this.isEnabledAsync(flagName, userId);
  }

  /**
   * Async verzia pre produkciu
   */
  private async isEnabledAsync(
    flagName: string,
    userId?: string
  ): Promise<boolean> {
    // 🚀 V2 QUICK FIX: Check localStorage first
    if (flagName === 'PROTOCOL_V2_ENABLED') {
      const localValue = localStorage.getItem('PROTOCOL_V2_ENABLED');
      if (localValue !== null) {
        return localValue === 'true';
      }
    }

    try {
      const flagData = await this.getFlag(flagName, userId);
      return flagData?.flag.enabled || false;
    } catch (error) {
      console.error(`Feature flag check failed for ${flagName}:`, error);
      return false; // Fail-safe: ak sa nepodarí načítať, vráť false
    }
  }

  /**
   * Získanie detailných informácií o feature flag
   */
  async getFlag(
    flagName: string,
    userId?: string
  ): Promise<FeatureFlagResponse | null> {
    try {
      // Check cache first
      const cached = this.cache.get(flagName);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return this.evaluateFlag(flagName, cached.flag, userId);
      }

      // Fetch from API
      const response = await fetch(`/api/feature-flags/${flagName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Backend vracia formát: { success: true, flag: { name, enabled, percentage, users } }
      const flagData = data.flag;

      // Cache result
      this.cache.set(flagName, {
        flag: {
          enabled: flagData.enabled,
          users: flagData.users || [],
          percentage: flagData.percentage || 0,
        },
        timestamp: Date.now(),
      });

      // Transform to expected format
      return {
        flag: {
          name: flagData.name,
          enabled: flagData.enabled,
          reason: flagData.enabled ? 'enabled' : 'disabled',
          configuration: {
            enabled: flagData.enabled,
            percentage: flagData.percentage || 0,
            allowedUsers: flagData.users || [],
          },
        },
      };
    } catch (error) {
      console.error(`Failed to get feature flag ${flagName}:`, error);
      return null;
    }
  }

  /**
   * Evaluácia feature flag podľa pravidiel
   */
  private evaluateFlag(
    flagName: string,
    flag: FeatureFlag,
    userId?: string
  ): FeatureFlagResponse {
    let enabled = false;
    let reason = 'flag disabled';

    if (flag.enabled) {
      // Check specific users
      if (userId && flag.users.includes(userId)) {
        enabled = true;
        reason = 'user in allowlist';
      }
      // Check percentage rollout
      else if (flag.percentage > 0) {
        const userHash = this.hashUserId(userId || 'anonymous');
        enabled = userHash % 100 < flag.percentage;
        reason = enabled
          ? 'percentage rollout'
          : 'percentage rollout (not selected)';
      }
    }

    return {
      flag: {
        name: flagName,
        enabled,
        reason,
        configuration: {
          enabled: flag.enabled,
          percentage: flag.percentage,
          allowedUsers: flag.users,
        },
      },
    };
  }

  /**
   * Hash funkcia pre consistent percentage rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Vyčistenie cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload často používaných flags
   */
  async preloadFlags(flagNames: string[], userId?: string): Promise<void> {
    const promises = flagNames.map(name => this.getFlag(name, userId));
    await Promise.all(promises);
  }
}

// Export singleton instance
export const featureManager = FeatureManager.getInstance();

// Convenience hooks pre React komponenty
export const useFeatureFlag = (flagName: string, userId?: string) => {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        setLoading(true);
        setError(null);
        const isEnabled = await featureManager.isEnabled(flagName, userId);

        if (mounted) {
          setEnabled(isEnabled);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setEnabled(false); // Fail-safe
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flagName, userId]);

  return { enabled, loading, error };
};

// Predefinované feature flags pre Protocol V2
export const PROTOCOL_V2_FLAGS = {
  PHOTO_UPLOAD: 'PROTOCOL_V2_PHOTO_UPLOAD',
  PDF_GENERATION: 'PROTOCOL_V2_PDF_GENERATION',
  QUEUE_SYSTEM: 'PROTOCOL_V2_QUEUE_SYSTEM',
  MANIFEST_GENERATION: 'PROTOCOL_V2_MANIFEST_GENERATION',
  FULL_V2_SYSTEM: 'PROTOCOL_V2_FULL_SYSTEM',
} as const;

// 🎯 V1 PERFECT FLAGS
export const V1_PERFECT_FLAGS = {
  ENABLED: 'USE_V1_PERFECT_PROTOCOLS',
} as const;

// Helper funkcie pre konkrétne flags
export const protocolV2Flags = {
  async isPhotoUploadEnabled(userId?: string): Promise<boolean> {
    return featureManager.isEnabled(PROTOCOL_V2_FLAGS.PHOTO_UPLOAD, userId);
  },

  async isPdfGenerationEnabled(userId?: string): Promise<boolean> {
    return featureManager.isEnabled(PROTOCOL_V2_FLAGS.PDF_GENERATION, userId);
  },

  async isQueueSystemEnabled(userId?: string): Promise<boolean> {
    return featureManager.isEnabled(PROTOCOL_V2_FLAGS.QUEUE_SYSTEM, userId);
  },

  async isFullV2Enabled(userId?: string): Promise<boolean> {
    return featureManager.isEnabled(PROTOCOL_V2_FLAGS.FULL_V2_SYSTEM, userId);
  },
};
