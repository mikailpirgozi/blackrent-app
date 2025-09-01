import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatFileSize, isSupportedImageType, lintImage } from './imageLint';

// Mock browser APIs
const mockCreateImageBitmap = vi.fn();
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
  })),
  toBlob: vi.fn(),
};

// Mock document.createElement
const mockCreateElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return null;
});

// Setup global mocks
Object.assign(global, {
  createImageBitmap: mockCreateImageBitmap,
  document: {
    createElement: mockCreateElement,
  },
});

describe('imageLint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas.width = 0;
    mockCanvas.height = 0;
  });

  describe('lintImage', () => {
    it('should reject files larger than 10 MB', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      await expect(lintImage(largeFile)).rejects.toThrow(
        'Súbor je príliš veľký. Maximálna veľkosť je 10 MB'
      );
    });

    it('should reject unsupported file types', async () => {
      const pdfFile = new File(['fake pdf content'], 'document.pdf', {
        type: 'application/pdf',
      });

      await expect(lintImage(pdfFile)).rejects.toThrow(
        'Nepodporovaný typ súboru: application/pdf'
      );
    });

    it('should process small PNG file and return WebP', async () => {
      // Create a small PNG file (under 10MB)
      const smallPngData = 'fake png data';
      const smallFile = new File([smallPngData], 'test.png', {
        type: 'image/png',
      });

      // Mock ImageBitmap
      const mockImageBitmap = {
        width: 800,
        height: 600,
        close: vi.fn(),
      };

      // Mock createImageBitmap
      mockCreateImageBitmap.mockResolvedValue(mockImageBitmap);

      // Mock canvas toBlob
      const mockWebPBlob = new Blob(['webp data'], { type: 'image/webp' });
      mockCanvas.toBlob.mockImplementation(callback => {
        callback(mockWebPBlob);
      });

      const result = await lintImage(smallFile);

      expect(result).toBeInstanceOf(File);
      expect(result.type).toBe('image/webp');
      expect(result.name).toBe('test.webp');
      expect(mockCreateImageBitmap).toHaveBeenCalledWith(smallFile, {
        imageOrientation: 'from-image',
      });
      expect(mockImageBitmap.close).toHaveBeenCalled();
    });

    it('should resize large images to max width 1920px', async () => {
      const largeFile = new File(['large image data'], 'large.jpg', {
        type: 'image/jpeg',
      });

      // Mock large ImageBitmap (3840x2160 - 4K)
      const mockImageBitmap = {
        width: 3840,
        height: 2160,
        close: vi.fn(),
      };

      mockCreateImageBitmap.mockResolvedValue(mockImageBitmap);

      const mockWebPBlob = new Blob(['resized webp data'], {
        type: 'image/webp',
      });
      mockCanvas.toBlob.mockImplementation(callback => {
        callback(mockWebPBlob);
      });

      const mockCtx = {
        drawImage: vi.fn(),
      };
      mockCanvas.getContext.mockReturnValue(mockCtx);

      await lintImage(largeFile);

      // Should set canvas to resized dimensions (1920x1080 - maintaining 16:9 ratio)
      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);

      // Should draw resized image
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        mockImageBitmap,
        0,
        0,
        1920,
        1080
      );

      // Should convert to WebP with correct quality
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.85
      );
    });

    it('should handle createImageBitmap errors gracefully', async () => {
      const corruptFile = new File(['corrupt data'], 'corrupt.jpg', {
        type: 'image/jpeg',
      });

      mockCreateImageBitmap.mockRejectedValue(new Error('Invalid image data'));

      await expect(lintImage(corruptFile)).rejects.toThrow(
        'Chyba pri spracovaní obrázka: Nepodarilo sa načítať obrázok: Invalid image data'
      );
    });

    it('should handle canvas toBlob failures', async () => {
      const validFile = new File(['valid data'], 'valid.jpg', {
        type: 'image/jpeg',
      });

      const mockImageBitmap = {
        width: 800,
        height: 600,
        close: vi.fn(),
      };

      mockCreateImageBitmap.mockResolvedValue(mockImageBitmap);

      // Mock toBlob to return null (failure case)
      mockCanvas.toBlob.mockImplementation(callback => {
        callback(null);
      });

      await expect(lintImage(validFile)).rejects.toThrow(
        'Nepodarilo sa vytvoriť WebP blob'
      );
    });
  });

  describe('isSupportedImageType', () => {
    it('should return true for supported types', () => {
      expect(isSupportedImageType('image/jpeg')).toBe(true);
      expect(isSupportedImageType('image/png')).toBe(true);
      expect(isSupportedImageType('image/webp')).toBe(true);
      expect(isSupportedImageType('image/heic')).toBe(true);
    });

    it('should return false for unsupported types', () => {
      expect(isSupportedImageType('application/pdf')).toBe(false);
      expect(isSupportedImageType('text/plain')).toBe(false);
      expect(isSupportedImageType('image/gif')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes to MB correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.50 MB');
      expect(formatFileSize(512 * 1024)).toBe('0.50 MB');
    });
  });
});
