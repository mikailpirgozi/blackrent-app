/**
 * Unit testy pre PhotoServiceV2
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PhotoServiceV2 } from '../../backend/src/services/photo-service-v2';

// Mock dependencies
vi.mock('../../backend/src/utils/r2-storage', () => ({
  r2Storage: {
    uploadFile: vi.fn().mockResolvedValue('https://example.com/test-file.jpg'),
    getFile: vi.fn().mockResolvedValue(Buffer.from('test-image-data')),
    deleteFile: vi.fn().mockResolvedValue(true),
    fileExists: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../../backend/src/queues/setup', () => ({
  photoQueue: {
    add: vi.fn().mockImplementation(() => Promise.resolve({ 
      id: 'test-job-123',
      toString: () => 'test-job-123'
    })),
    isReady: vi.fn().mockResolvedValue(true)
  }
}));

describe('PhotoServiceV2', () => {
  let photoService: PhotoServiceV2;
  
  beforeEach(() => {
    photoService = new PhotoServiceV2();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('uploadPhoto', () => {
    it('should upload photo successfully', async () => {
      const testFile = Buffer.from('test-image-data');
      const request = {
        file: testFile,
        filename: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        protocolId: 'test-protocol-123',
        userId: 'test-user-456'
      };
      
      const result = await photoService.uploadPhoto(request);
      
      expect(result.success).toBe(true);
      expect(result.photoId).toBeDefined();
      expect(result.originalUrl).toBe('https://example.com/test-file.jpg');
      expect(result.jobId).toBeDefined();
    });
    
    it('should handle upload failure gracefully', async () => {
      const { r2Storage } = await import('../../backend/src/utils/r2-storage');
      vi.mocked(r2Storage.uploadFile).mockRejectedValueOnce(new Error('Upload failed'));
      
      const testFile = Buffer.from('test-image-data');
      const request = {
        file: testFile,
        filename: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        protocolId: 'test-protocol-123'
      };
      
      const result = await photoService.uploadPhoto(request);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
    });
    
    it('should generate correct file paths', async () => {
      const { r2Storage } = await import('../../backend/src/utils/r2-storage');
      const uploadSpy = vi.mocked(r2Storage.uploadFile);
      
      const testFile = Buffer.from('test-image-data');
      const request = {
        file: testFile,
        filename: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        protocolId: 'test-protocol-123'
      };
      
      await photoService.uploadPhoto(request);
      
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^protocols\/test-protocol-123\/photos\/original\/.*\.jpg$/),
        testFile,
        'image/jpeg'
      );
    });
  });
  
  describe('uploadMultiplePhotos', () => {
    it('should upload multiple photos in batches', async () => {
      const testFiles = Array.from({ length: 12 }, (_, i) => ({
        file: Buffer.from(`test-image-data-${i}`),
        filename: `test-photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        protocolId: 'test-protocol-123'
      }));
      
      const results = await photoService.uploadMultiplePhotos(testFiles);
      
      expect(results).toHaveLength(12);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    it('should handle partial failures in batch upload', async () => {
      const { r2Storage } = await import('../../backend/src/utils/r2-storage');
      
      // Mock jeden upload failure
      vi.mocked(r2Storage.uploadFile)
        .mockResolvedValueOnce('https://example.com/test-1.jpg')
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce('https://example.com/test-3.jpg');
      
      const testFiles = Array.from({ length: 3 }, (_, i) => ({
        file: Buffer.from(`test-image-data-${i}`),
        filename: `test-photo-${i}.jpg`,
        mimeType: 'image/jpeg',
        protocolId: 'test-protocol-123'
      }));
      
      const results = await photoService.uploadMultiplePhotos(testFiles);
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });
  
  describe('getProcessingStatus', () => {
    it('should return processing status', async () => {
      const status = await photoService.getProcessingStatus();
      
      expect(status).toHaveProperty('status');
      expect(status.status).toBe('uploaded');
    });
  });
});
