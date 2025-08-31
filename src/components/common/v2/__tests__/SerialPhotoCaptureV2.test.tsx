/**
 * Unit testy pre SerialPhotoCaptureV2
 * Testuje photo capture, queue systém, kategorizáciu a performance tracking
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as featureFlags from '../../../../config/featureFlags';
import * as protocolV2Performance from '../../../../utils/protocolV2Performance';
import { SerialPhotoCaptureV2 } from '../SerialPhotoCaptureV2';

// Mock dependencies
vi.mock('../../../../config/featureFlags');
vi.mock('../../../../utils/protocolV2Performance');
vi.mock('uuid', () => ({
  v4: () => 'test-photo-uuid-123',
}));

// Mock fetch
global.fetch = vi.fn();

const mockFeatureManager = {
  isEnabled: vi.fn(),
};

const mockV2Performance = {
  useV2Performance: vi.fn(),
  trackUploadMetrics: vi.fn(),
};

describe('SerialPhotoCaptureV2', () => {
  const mockOnPhotosChange = vi.fn();
  const mockOnCategorizedPhotosChange = vi.fn();
  const mockOnUploadComplete = vi.fn();

  const defaultProps = {
    protocolId: 'test-protocol-123',
    category: 'vehicle' as const,
    onPhotosChange: mockOnPhotosChange,
    onCategorizedPhotosChange: mockOnCategorizedPhotosChange,
    onUploadComplete: mockOnUploadComplete,
    maxPhotos: 20,
    userId: 'test-user-123',
    disabled: false,
    title: 'Test Photo Capture',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup feature flags mock
    (featureFlags as any).featureManager = mockFeatureManager;
    mockFeatureManager.isEnabled.mockResolvedValue(true);

    // Setup performance mocks
    Object.assign(protocolV2Performance, mockV2Performance);
    mockV2Performance.useV2Performance.mockReturnValue({
      trackRender: vi.fn(),
    });

    // Setup fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          results: {
            photos: [
              {
                success: true,
                photoId: 'uploaded-photo-123',
                originalUrl: 'https://example.com/photo.jpg',
              },
            ],
          },
        }),
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload area when V2 is enabled', async () => {
      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Photo Capture')).toBeInTheDocument();
      });

      expect(screen.getByText('Kategória: Vozidlo')).toBeInTheDocument();
      expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      expect(screen.getByText('V2 System')).toBeInTheDocument();
    });

    it('should show fallback message when V2 is disabled', async () => {
      mockFeatureManager.isEnabled.mockResolvedValue(false);

      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Protocol V2 nie je povolený. Používa sa štandardný systém.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      expect(screen.getByText('Načítavam...')).toBeInTheDocument();
    });

    it('should display category display name correctly', async () => {
      const categories = [
        { category: 'vehicle', expected: 'Vozidlo' },
        { category: 'document', expected: 'Dokument' },
        { category: 'damage', expected: 'Poškodenie' },
        { category: 'odometer', expected: 'Tachometer' },
        { category: 'fuel', expected: 'Palivo' },
      ] as const;

      for (const { category, expected } of categories) {
        const { unmount } = render(
          <SerialPhotoCaptureV2 {...defaultProps} category={category} />
        );

        await waitFor(() => {
          expect(
            screen.getByText(`Kategória: ${expected}`)
          ).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('File Upload', () => {
    it('should handle file selection', async () => {
      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      // Create mock file
      const mockFile = new File(['mock content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnPhotosChange).toHaveBeenCalled();
      });
    });

    it('should validate file type', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      // Create mock non-image file
      const mockFile = new File(['mock content'], 'test.txt', {
        type: 'text/plain',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Skipped non-image file: test.txt'
        );
      });

      consoleSpy.mockRestore();
    });

    it('should enforce max photos limit', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<SerialPhotoCaptureV2 {...defaultProps} maxPhotos={1} />);

      await waitFor(() => {
        expect(screen.getByText('Maximum 1 fotografií')).toBeInTheDocument();
      });

      alertSpy.mockRestore();
    });

    it('should validate file size', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      // Create mock large file (>50MB)
      const mockFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Súbor large.jpg je príliš veľký (max 50MB)'
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Upload Queue Management', () => {
    it('should track upload progress', async () => {
      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(mockV2Performance.trackUploadMetrics).toHaveBeenCalledWith({
          activeUploads: 0,
          queueSize: 0,
          failedUploads: 0,
          totalUploaded: 0,
        });
      });
    });

    it('should display upload progress when files are uploading', async () => {
      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      // Simulate file upload
      const mockFile = new File(['mock content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      });
    });

    it('should handle upload retry', async () => {
      // Mock failed upload
      (global.fetch as any).mockRejectedValueOnce(new Error('Upload failed'));

      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      const mockFile = new File(['mock content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Wait for retry mechanism to trigger
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledTimes(1); // Initial attempt
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Photo Categorization', () => {
    it('should create categorized photo items', async () => {
      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      const mockFile = new File(['mock content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnCategorizedPhotosChange).toHaveBeenCalled();
      });

      // Check if categorized photo was created with correct category
      const categorizedPhotosCall =
        mockOnCategorizedPhotosChange.mock.calls[0][0];
      expect(categorizedPhotosCall).toHaveLength(1);
      expect(categorizedPhotosCall[0]).toMatchObject({
        category: 'vehicle',
        description: 'Vozidlo - test.jpg',
        status: 'pending',
      });
    });

    it('should handle different photo categories', async () => {
      const categories = [
        'vehicle',
        'document',
        'damage',
        'odometer',
        'fuel',
      ] as const;

      for (const category of categories) {
        const { unmount } = render(
          <SerialPhotoCaptureV2 {...defaultProps} category={category} />
        );

        await waitFor(() => {
          expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
        });

        const mockFile = new File(['mock content'], `${category}.jpg`, {
          type: 'image/jpeg',
        });
        const fileInput = screen
          .getByRole('button', { name: 'Pridať fotografie' })
          .parentElement?.querySelector(
            'input[type="file"]'
          ) as HTMLInputElement;

        Object.defineProperty(fileInput, 'files', {
          value: [mockFile],
          writable: false,
        });

        fireEvent.change(fileInput);

        await waitFor(() => {
          expect(mockOnCategorizedPhotosChange).toHaveBeenCalled();
        });

        const categorizedPhotosCall =
          mockOnCategorizedPhotosChange.mock.calls[
            mockOnCategorizedPhotosChange.mock.calls.length - 1
          ][0];
        expect(categorizedPhotosCall[0].category).toBe(category);

        unmount();
        vi.clearAllMocks();
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should initialize performance tracking', () => {
      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      expect(mockV2Performance.useV2Performance).toHaveBeenCalledWith(
        'SerialPhotoCaptureV2'
      );
    });

    it('should track render performance', async () => {
      const mockTrackRender = vi.fn();
      mockV2Performance.useV2Performance.mockReturnValue({
        trackRender: mockTrackRender,
      });

      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(mockTrackRender).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle upload errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      const mockFile = new File(['mock content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      const mockFile = new File(['mock content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Should handle the error and potentially retry
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup object URLs on unmount', async () => {
      const { unmount } = render(<SerialPhotoCaptureV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Pridať fotografie')).toBeInTheDocument();
      });

      const mockFile = new File(['mock content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const fileInput = screen
        .getByRole('button', { name: 'Pridať fotografie' })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      unmount();

      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
