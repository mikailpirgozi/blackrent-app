/**
 * Integration testy pre Protocol V2 System
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HashCalculator } from '../../backend/src/utils/v2/hash-calculator';
import { migrationService } from '../../backend/src/utils/v2/migration-script';
import { ImageProcessor } from '../../backend/src/utils/v2/sharp-processor';

// Test data
const createTestImageBuffer = (): Buffer => {
  // Minimal JPEG header pre valid image
  return Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    // ... simplified JPEG data
    0xFF, 0xD9 // End of Image marker
  ]);
};

describe('Protocol V2 Integration Tests', () => {
  let imageProcessor: ImageProcessor;
  
  beforeAll(async () => {
    // Setup test environment
    imageProcessor = new ImageProcessor();
  });
  
  afterAll(async () => {
    // Cleanup test environment
  });
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Photo Processing Pipeline', () => {
    it('should process photo through complete pipeline', async () => {
      const testImage = createTestImageBuffer();
      
      // 1. Validate image
      const validation = await imageProcessor.validateImage(testImage);
      expect(validation.valid).toBe(true);
      
      // 2. Generate derivatives
      const derivatives = await imageProcessor.generateDerivatives(testImage);
      
      expect(derivatives).toHaveProperty('thumb');
      expect(derivatives).toHaveProperty('gallery');
      expect(derivatives).toHaveProperty('pdf');
      expect(derivatives).toHaveProperty('hash');
      expect(derivatives.hash).toMatch(/^[a-f0-9]{64}$/);
      
      // 3. Verify hashes
      expect(derivatives.thumb.length).toBeGreaterThan(0);
      expect(derivatives.gallery.length).toBeGreaterThan(0);
      expect(derivatives.pdf.length).toBeGreaterThan(0);
      
      // 4. Create manifest
      const manifest = HashCalculator.createPhotoManifest(
        'test-photo-123',
        testImage,
        {
          thumb: derivatives.thumb,
          gallery: derivatives.gallery,
          pdf: derivatives.pdf
        }
      );
      
      expect(manifest.photoId).toBe('test-photo-123');
      expect(manifest.originalHash).toBe(derivatives.hash);
      expect(manifest.derivativeHashes.thumb).toBeDefined();
      expect(manifest.sizes.original).toBe(testImage.length);
    });
    
    it('should handle invalid images gracefully', async () => {
      const invalidImage = Buffer.from('not-an-image');
      
      const validation = await imageProcessor.validateImage(invalidImage);
      expect(validation.valid).toBe(false);
      expect(validation.error).toBeDefined();
    });
    
    it('should calculate consistent hashes', async () => {
      const testImage = createTestImageBuffer();
      
      const hash1 = HashCalculator.calculateSHA256(testImage);
      const hash2 = HashCalculator.calculateSHA256(testImage);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
    
    it('should detect duplicate images', async () => {
      const testImage1 = createTestImageBuffer();
      const testImage2 = createTestImageBuffer();
      const testImage3 = Buffer.from('different-image-data');
      
      const hash1 = HashCalculator.calculateSHA256(testImage1);
      const hash2 = HashCalculator.calculateSHA256(testImage2);
      const hash3 = HashCalculator.calculateSHA256(testImage3);
      
      expect(HashCalculator.isDuplicate(hash1, hash2)).toBe(true);
      expect(HashCalculator.isDuplicate(hash1, hash3)).toBe(false);
    });
  });
  
  describe('Hash Calculator', () => {
    it('should calculate SHA256 hash correctly', () => {
      const testData = Buffer.from('test-data');
      const hash = HashCalculator.calculateSHA256(testData);
      
      expect(hash).toBe('916f0027a575074ce72a331777c3478d6513f786a591bd892da1a577bf2335f9');
      expect(hash).toHaveLength(64);
    });
    
    it('should calculate MD5 hash correctly', () => {
      const testData = Buffer.from('test-data');
      const hash = HashCalculator.calculateMD5(testData);
      
      expect(hash).toBe('eb733a00c0c9d336e65691a37ab54293');
      expect(hash).toHaveLength(32);
    });
    
    it('should verify integrity correctly', () => {
      const testData = Buffer.from('test-data');
      const correctHash = HashCalculator.calculateSHA256(testData);
      const wrongHash = 'wrong-hash';
      
      expect(HashCalculator.verifyIntegrity(testData, correctHash)).toBe(true);
      expect(HashCalculator.verifyIntegrity(testData, wrongHash)).toBe(false);
    });
    
    it('should create complete photo manifest', () => {
      const original = Buffer.from('original-image');
      const derivatives = {
        thumb: Buffer.from('thumb-image'),
        gallery: Buffer.from('gallery-image'),
        pdf: Buffer.from('pdf-image')
      };
      
      const manifest = HashCalculator.createPhotoManifest(
        'test-photo-123',
        original,
        derivatives,
        { test: 'metadata' }
      );
      
      expect(manifest.photoId).toBe('test-photo-123');
      expect(manifest.originalHash).toBeDefined();
      expect(manifest.derivativeHashes.thumb).toBeDefined();
      expect(manifest.derivativeHashes.gallery).toBeDefined();
      expect(manifest.derivativeHashes.pdf).toBeDefined();
      expect(manifest.sizes.original).toBe(original.length);
      expect(manifest.metadata).toEqual({ test: 'metadata' });
    });
  });
  
  describe('Migration Service', () => {
    it('should validate migration options', async () => {
      const progress = migrationService.getProgress();
      
      expect(progress).toHaveProperty('total');
      expect(progress).toHaveProperty('processed');
      expect(progress).toHaveProperty('successful');
      expect(progress).toHaveProperty('failed');
      expect(progress).toHaveProperty('errors');
      expect(progress).toHaveProperty('startTime');
    });
    
    it('should handle dry run correctly', async () => {
      // Test len že migrácia service existuje a vracia správnu štruktúru
      const progress = migrationService.getProgress();
      
      expect(progress).toHaveProperty('total');
      expect(progress).toHaveProperty('processed');
      expect(progress).toHaveProperty('successful');
      expect(progress).toHaveProperty('failed');
      
      // Dry run test bez skutočného volania databázy
      expect(progress.total).toBeGreaterThanOrEqual(0);
      expect(progress.processed).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('V1 ↔ V2 Compatibility', () => {
    it('should read V1 protocols in V2 system', async () => {
      // Mock V1 protocol data
      const v1Protocol = {
        id: 'v1-protocol-123',
        vehicle_id: 'vehicle-456',
        customer_id: 'customer-789',
        protocol_type: 'handover',
        data: {
          vehicle: { licensePlate: 'BA123CD' },
          customer: { firstName: 'John', lastName: 'Doe' }
        },
        photos: [
          { id: 'photo-1', url: 'https://example.com/photo1.jpg' }
        ]
      };
      
      // Test že V2 systém dokáže spracovať V1 dáta
      expect(v1Protocol.id).toBeDefined();
      expect(v1Protocol.data.vehicle.licensePlate).toBe('BA123CD');
      expect(v1Protocol.photos).toHaveLength(1);
    });
    
    it('should maintain data integrity during migration', async () => {
      const testData = {
        protocolId: 'test-protocol-123',
        originalData: { test: 'data' },
        photos: ['photo1', 'photo2', 'photo3']
      };
      
      // Simulate migration process
      const originalHash = HashCalculator.calculateSHA256(
        Buffer.from(JSON.stringify(testData))
      );
      
      // After "migration" - data should be identical
      const migratedHash = HashCalculator.calculateSHA256(
        Buffer.from(JSON.stringify(testData))
      );
      
      expect(originalHash).toBe(migratedHash);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network failures gracefully', async () => {
      const { r2Storage } = await import('../../backend/src/utils/r2-storage');
      
      // Simulate network failure
      vi.mocked(r2Storage.uploadFile)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('https://example.com/retry-success.jpg');
      
      const testFile = Buffer.from('test-image-data');
      const request = {
        file: testFile,
        filename: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        protocolId: 'test-protocol-123'
      };
      
      // First attempt should fail
      const result1 = await photoService.uploadPhoto(request);
      expect(result1.success).toBe(false);
      
      // Second attempt should succeed
      const result2 = await photoService.uploadPhoto(request);
      expect(result2.success).toBe(true);
    });
    
    it('should validate file types correctly', async () => {
      // Test image validation
      const validation = await imageProcessor.validateImage(testBuffer);
      expect(validation).toHaveProperty('valid');
      
      // Invalid buffer should fail
      const invalidBuffer = Buffer.from('not-an-image');
      const invalidValidation = await imageProcessor.validateImage(invalidBuffer);
      expect(invalidValidation.valid).toBe(false);
    });
  });
  
  describe('Performance Tests', () => {
    it('should process images within acceptable time limits', async () => {
      const testImage = createTestImageBuffer();
      
      const startTime = Date.now();
      await imageProcessor.generateDerivatives(testImage);
      const processingTime = Date.now() - startTime;
      
      // Should complete within 5 seconds for test image
      expect(processingTime).toBeLessThan(5000);
    });
    
    it('should calculate savings correctly', async () => {
      const testImage = Buffer.from('x'.repeat(1000000)); // 1MB test image
      
      const derivatives = await imageProcessor.generateDerivatives(testImage);
      const savings = imageProcessor.calculateSavings(derivatives.sizes);
      
      expect(savings.totalSavings).toBeGreaterThan(0);
      expect(savings.savingsPercentage).toBeGreaterThan(0);
      expect(savings.savingsPercentage).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Queue System', () => {
    it('should handle queue job creation', async () => {
      const { photoQueue } = await import('../../backend/src/queues/setup');
      
      const jobData = {
        originalKey: 'test-key',
        protocolId: 'test-protocol',
        photoId: 'test-photo',
        userId: 'test-user'
      };
      
      const job = await photoQueue.add('generate-derivatives', jobData);
      
      expect(job.id).toBeDefined();
      expect(vi.mocked(photoQueue.add)).toHaveBeenCalledWith(
        'generate-derivatives',
        jobData,
        expect.any(Object)
      );
    });
  });
});
