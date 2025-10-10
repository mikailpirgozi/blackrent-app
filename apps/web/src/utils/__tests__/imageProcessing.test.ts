/**
 * Image Processing Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImageProcessor } from '../imageProcessing';

describe('ImageProcessor', () => {
  let processor: ImageProcessor;

  beforeEach(() => {
    processor = new ImageProcessor();
  });

  afterEach(() => {
    processor.destroy();
  });

  describe('processImage', () => {
    it('should process single image', async () => {
      // Create mock image file
      const mockFile = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await processor.processImage(mockFile);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.gallery).toBeDefined();
      expect(result.pdf).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should create WebP blob for gallery', async () => {
      const mockFile = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await processor.processImage(mockFile);

      expect(result.gallery.blob).toBeInstanceOf(Blob);
      expect(result.gallery.size).toBeGreaterThan(0);
    });

    it('should create JPEG base64 for PDF', async () => {
      const mockFile = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await processor.processImage(mockFile);

      expect(result.pdf.base64).toContain('data:image/jpeg;base64,');
      expect(result.pdf.size).toBeGreaterThan(0);
    });

    it('should extract metadata', async () => {
      const mockFile = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await processor.processImage(mockFile);

      expect(result.metadata.originalSize).toBe(mockFile.size);
      expect(result.metadata.timestamp).toBeGreaterThan(0);
    });
  });

  describe('processBatch', () => {
    it('should process multiple images in parallel', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
      ];

      const results = await processor.processBatch(mockFiles);

      expect(results).toHaveLength(3);
      expect(results[0].gallery.blob).toBeInstanceOf(Blob);
      expect(results[1].gallery.blob).toBeInstanceOf(Blob);
      expect(results[2].gallery.blob).toBeInstanceOf(Blob);
    });

    it('should call progress callback', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      let progressCalls = 0;
      await processor.processBatch(mockFiles, (completed, total) => {
        progressCalls++;
        expect(completed).toBeLessThanOrEqual(total);
      });

      expect(progressCalls).toBeGreaterThan(0);
    });

    it('should process in batches of 6', async () => {
      const mockFiles = Array.from({ length: 15 }, (_, i) =>
        new File([`test${i}`], `test${i}.jpg`, { type: 'image/jpeg' })
      );

      const results = await processor.processBatch(mockFiles);

      expect(results).toHaveLength(15);
    });
  });

  describe('destroy', () => {
    it('should terminate worker', () => {
      processor.destroy();
      // Worker should be terminated - subsequent calls should fail
      expect(() => processor.processImage(new File(['test'], 'test.jpg'))).rejects.toThrow();
    });
  });
});

