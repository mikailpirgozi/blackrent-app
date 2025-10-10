/**
 * Protocol Migration Utility
 * 
 * Migruje existujúce protokoly na nový formát:
 * - Odstráni deprecated compressedUrl field
 * - Zachová originalUrl pre galériu
 */

import { logger } from './logger';
import type { HandoverProtocol, ReturnProtocol } from '../types';

/**
 * Migrate single protocol to new format
 */
export function migrateProtocolImages<T extends HandoverProtocol | ReturnProtocol>(
  protocol: T
): T {
  return {
    ...protocol,
    vehicleImages: protocol.vehicleImages?.map((img) => ({
      ...img,
      compressedUrl: undefined, // Remove deprecated field
      pdfData: undefined, // Remove if exists (Variant 2)
      originalUrl: img.originalUrl || img.url, // Ensure originalUrl exists
    })),
    documentImages: protocol.documentImages?.map((img) => ({
      ...img,
      compressedUrl: undefined,
      pdfData: undefined,
      originalUrl: img.originalUrl || img.url,
    })),
    damageImages: protocol.damageImages?.map((img) => ({
      ...img,
      compressedUrl: undefined,
      pdfData: undefined,
      originalUrl: img.originalUrl || img.url,
    })),
  };
}

/**
 * Migrate all existing protocols
 * 
 * WARNING: This should be run once during deployment
 */
export async function migrateAllProtocols(): Promise<void> {
  try {
    logger.info('Starting protocol migration...');

    // Fetch all protocols (this would need a backend endpoint)
    // For now, this is a placeholder
    const protocols: (HandoverProtocol | ReturnProtocol)[] = [];

    let migrated = 0;

    for (const protocol of protocols) {
      try {
        migrateProtocolImages(protocol);

        // Update protocol via API (would need backend endpoint)
        // await apiService.updateProtocol(protocol.id, migratedProtocol);

        migrated++;
        logger.debug('Protocol migrated', { id: protocol.id });
      } catch (error) {
        logger.error('Failed to migrate protocol', {
          id: protocol.id,
          error,
        });
      }
    }

    logger.info('Protocol migration complete', {
      total: protocols.length,
      migrated,
      failed: protocols.length - migrated,
    });
  } catch (error) {
    logger.error('Protocol migration failed', { error });
    throw error;
  }
}

/**
 * Check if protocol needs migration
 */
export function needsMigration(protocol: HandoverProtocol | ReturnProtocol): boolean {
  const hasDeprecatedFields = (images: { compressedUrl?: string; pdfData?: string }[]) => {
    return images.some((img) => img.compressedUrl !== undefined || img.pdfData !== undefined);
  };

  return (
    hasDeprecatedFields(protocol.vehicleImages || []) ||
    hasDeprecatedFields(protocol.documentImages || []) ||
    hasDeprecatedFields(protocol.damageImages || [])
  );
}

