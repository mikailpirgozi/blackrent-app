/**
 * SHA-256 Hash Calculator pre Protocol V2
 * Zabezpečuje integrity checking a deduplication
 */

import crypto from 'crypto';

export interface HashResult {
  sha256: string;
  md5: string;
  size: number;
  timestamp: Date;
}

export interface FileManifest {
  photoId: string;
  originalHash: string;
  derivativeHashes: {
    thumb: string;
    gallery: string;
    pdf: string;
  };
  sizes: {
    original: number;
    thumb: number;
    gallery: number;
    pdf: number;
  };
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export class HashCalculator {
  /**
   * Vypočíta SHA-256 hash pre buffer
   */
  static calculateSHA256(buffer: Buffer): string {
    return crypto.createHash('sha256')
      .update(buffer)
      .digest('hex');
  }
  
  /**
   * Vypočíta MD5 hash pre backward compatibility
   */
  static calculateMD5(buffer: Buffer): string {
    return crypto.createHash('md5')
      .update(buffer)
      .digest('hex');
  }
  
  /**
   * Vypočíta všetky hash hodnoty pre súbor
   */
  static calculateHashes(buffer: Buffer): HashResult {
    return {
      sha256: this.calculateSHA256(buffer),
      md5: this.calculateMD5(buffer),
      size: buffer.length,
      timestamp: new Date()
    };
  }
  
  /**
   * Vytvorí manifest pre photo a všetky jeho derivatívy
   */
  static createPhotoManifest(
    photoId: string,
    original: Buffer,
    derivatives: {
      thumb: Buffer;
      gallery: Buffer;
      pdf: Buffer;
    },
    metadata?: Record<string, unknown>
  ): FileManifest {
    const originalHash = this.calculateSHA256(original);
    
    return {
      photoId,
      originalHash,
      derivativeHashes: {
        thumb: this.calculateSHA256(derivatives.thumb),
        gallery: this.calculateSHA256(derivatives.gallery),
        pdf: this.calculateSHA256(derivatives.pdf)
      },
      sizes: {
        original: original.length,
        thumb: derivatives.thumb.length,
        gallery: derivatives.gallery.length,
        pdf: derivatives.pdf.length
      },
      createdAt: new Date(),
      metadata
    };
  }
  
  /**
   * Verifikuje integrity súboru pomocou hash
   */
  static verifyIntegrity(buffer: Buffer, expectedHash: string): boolean {
    const actualHash = this.calculateSHA256(buffer);
    return actualHash === expectedHash;
  }
  
  /**
   * Detekuje duplicitné súbory na základe hash
   */
  static isDuplicate(hash1: string, hash2: string): boolean {
    return hash1 === hash2;
  }
  
  /**
   * Generuje unique identifier na základe hash a timestamp
   */
  static generateUniqueId(buffer: Buffer): string {
    const hash = this.calculateSHA256(buffer);
    const timestamp = Date.now();
    return `${hash.substring(0, 16)}_${timestamp}`;
  }
}
