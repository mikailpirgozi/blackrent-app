/**
 * Feature Flags System for Protocol V2 Migration
 * Umožňuje postupné nasadenie V2 funkcionalít s kontrolovaným rolloutom
 */

export interface FeatureFlag {
  enabled: boolean;
  users: string[];
  percentage: number;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

export interface FeatureFlagConfig {
  PROTOCOL_V2: FeatureFlag;
  PROTOCOL_V2_PHOTO_PROCESSING: FeatureFlag;
  PROTOCOL_V2_PDF_GENERATION: FeatureFlag;
  PROTOCOL_V2_QUEUE_SYSTEM: FeatureFlag;
}

export class FeatureManager {
  private static instance: FeatureManager;

  private flags: FeatureFlagConfig = {
    PROTOCOL_V2: {
      enabled: false,
      users: [], // Špecifickí užívatelia pre testing
      percentage: 0, // 0-100% rollout
      description: 'Hlavný V2 protokol systém',
    },
    PROTOCOL_V2_PHOTO_PROCESSING: {
      enabled: false,
      users: [],
      percentage: 0,
      description: 'V2 photo processing s derivatívami',
    },
    PROTOCOL_V2_PDF_GENERATION: {
      enabled: false,
      users: [],
      percentage: 0,
      description: 'V2 PDF generovanie s queue',
    },
    PROTOCOL_V2_QUEUE_SYSTEM: {
      enabled: false,
      users: [],
      percentage: 0,
      description: 'Background queue processing',
    },
  };

  static getInstance(): FeatureManager {
    if (!this.instance) {
      this.instance = new FeatureManager();
    }
    return this.instance;
  }

  /**
   * Skontroluje či je feature zapnutý pre daného užívateľa
   */
  isEnabled(feature: keyof FeatureFlagConfig, userId?: string): boolean {
    const flag = this.flags[feature];
    if (!flag || !flag.enabled) return false;

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) return false;
    if (flag.endDate && now > flag.endDate) return false;

    // Check specific users (pre testing)
    if (userId && flag.users.includes(userId)) return true;

    // Check percentage rollout
    if (flag.percentage > 0) {
      const hash = this.hashUserId(userId || 'anonymous');
      return hash % 100 < flag.percentage;
    }

    return false;
  }

  /**
   * Aktualizuje feature flag (pre admin interface)
   */
  updateFlag(
    feature: keyof FeatureFlagConfig,
    updates: Partial<FeatureFlag>
  ): void {
    this.flags[feature] = {
      ...this.flags[feature],
      ...updates,
    };
  }

  /**
   * Získa všetky flags (pre debugging)
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.flags };
  }

  /**
   * Hash funkcia pre konzistentný percentage rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Hook pre použitie v React komponentoch
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useFeatureFlag(feature: keyof FeatureFlagConfig): boolean {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const manager = FeatureManager.getInstance();
    const enabled = manager.isEnabled(feature, user?.id);
    setIsEnabled(enabled);
  }, [feature, user?.id]);

  return isEnabled;
}

/**
 * Utility funkcie pre backend
 */
export const featureFlags = {
  isProtocolV2Enabled: (userId?: string): boolean => {
    return FeatureManager.getInstance().isEnabled('PROTOCOL_V2', userId);
  },

  isPhotoProcessingV2Enabled: (userId?: string): boolean => {
    return FeatureManager.getInstance().isEnabled(
      'PROTOCOL_V2_PHOTO_PROCESSING',
      userId
    );
  },

  isPdfGenerationV2Enabled: (userId?: string): boolean => {
    return FeatureManager.getInstance().isEnabled(
      'PROTOCOL_V2_PDF_GENERATION',
      userId
    );
  },

  isQueueSystemEnabled: (userId?: string): boolean => {
    return FeatureManager.getInstance().isEnabled(
      'PROTOCOL_V2_QUEUE_SYSTEM',
      userId
    );
  },
};
