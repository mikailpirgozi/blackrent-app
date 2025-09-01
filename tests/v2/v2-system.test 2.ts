/**
 * Základné testy pre V2 System
 */

import { describe, it, expect } from 'vitest';
import { HashCalculator } from '../../backend/src/utils/v2/hash-calculator';

describe('V2 System Tests', () => {
  describe('Hash Calculator', () => {
    it('should calculate SHA256 hash', () => {
      const testData = Buffer.from('test-data');
      const hash = HashCalculator.calculateSHA256(testData);
      
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should calculate MD5 hash', () => {
      const testData = Buffer.from('test-data');
      const hash = HashCalculator.calculateMD5(testData);
      
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });
    
    it('should verify integrity correctly', () => {
      const testData = Buffer.from('test-data');
      const correctHash = HashCalculator.calculateSHA256(testData);
      const wrongHash = 'wrong-hash';
      
      expect(HashCalculator.verifyIntegrity(testData, correctHash)).toBe(true);
      expect(HashCalculator.verifyIntegrity(testData, wrongHash)).toBe(false);
    });
    
    it('should detect duplicate files', () => {
      const testData1 = Buffer.from('same-data');
      const testData2 = Buffer.from('same-data');
      const testData3 = Buffer.from('different-data');
      
      const hash1 = HashCalculator.calculateSHA256(testData1);
      const hash2 = HashCalculator.calculateSHA256(testData2);
      const hash3 = HashCalculator.calculateSHA256(testData3);
      
      expect(HashCalculator.isDuplicate(hash1, hash2)).toBe(true);
      expect(HashCalculator.isDuplicate(hash1, hash3)).toBe(false);
    });
  });
  
  describe('System Configuration', () => {
    it('should have V2 system ready', () => {
      // Basic system checks
      expect(HashCalculator).toBeDefined();
      expect(HashCalculator.calculateSHA256).toBeDefined();
      expect(HashCalculator.calculateMD5).toBeDefined();
      expect(HashCalculator.verifyIntegrity).toBeDefined();
    });
  });
});
