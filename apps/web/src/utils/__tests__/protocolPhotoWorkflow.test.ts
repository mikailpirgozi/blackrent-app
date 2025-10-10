/**
 * Protocol Photo Workflow Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processAndUploadPhotos, generateProtocolPDFQuick } from '../protocolPhotoWorkflow';
import { SessionStorageManager } from '../sessionStorageManager';
import type { HandoverProtocol } from '../../types';

// Mock dependencies
vi.mock('../imageProcessing');
vi.mock('../../services/uploadManager');
vi.mock('../logger');

describe('protocolPhotoWorkflow', () => {
  beforeEach(() => {
    // Clear SessionStorage before each test
    SessionStorageManager.clearPDFImages();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processAndUploadPhotos', () => {
    it('should process and upload photos successfully', async () => {
      // Create mock files
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const files = [mockFile];

      const result = await processAndUploadPhotos(files, {
        protocolId: 'test-protocol-id',
        mediaType: 'vehicle',
      });

      expect(result.images).toHaveLength(1);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.uploadTime).toBeGreaterThan(0);
      expect(result.totalTime).toBeGreaterThan(0);
    });

    it('should call progress callback', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const files = [mockFile];
      const onProgress = vi.fn();

      await processAndUploadPhotos(files, {
        protocolId: 'test-protocol-id',
        mediaType: 'vehicle',
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
    });

    it('should save PDF data to SessionStorage', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const files = [mockFile];

      await processAndUploadPhotos(files, {
        protocolId: 'test-protocol-id',
        mediaType: 'vehicle',
      });

      const stats = SessionStorageManager.getStats();
      expect(stats.imageCount).toBeGreaterThan(0);
    });
  });

  describe('generateProtocolPDFQuick', () => {
    it('should generate PDF using SessionStorage data', async () => {
      // Create mock protocol
      const mockProtocol: HandoverProtocol = {
        id: 'test-id',
        type: 'handover',
        rentalId: 'rental-id',
        location: 'Test Location',
        vehicleCondition: {
          odometer: 10000,
          fuelLevel: 100,
          fuelType: 'gasoline',
          exteriorCondition: 'Good',
          interiorCondition: 'Good',
        },
        vehicleImages: [
          {
            id: 'img-1',
            url: 'https://example.com/img1.webp',
            originalUrl: 'https://example.com/img1.webp',
            type: 'vehicle',
            timestamp: new Date(),
          },
        ],
        documentImages: [],
        damageImages: [],
        vehicleVideos: [],
        documentVideos: [],
        damageVideos: [],
        damages: [],
        signatures: [],
        rentalData: {
          orderNumber: 'TEST-001',
          vehicle: {} as any,
          customer: {} as any,
          startDate: new Date(),
          endDate: new Date(),
          totalPrice: 100,
          deposit: 50,
          currency: 'EUR',
        },
        createdAt: new Date(),
        status: 'completed',
        createdBy: 'test-user',
      } as HandoverProtocol;

      // Save mock PDF data to SessionStorage
      SessionStorageManager.savePDFImage(
        'img-1',
        'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      );

      const result = await generateProtocolPDFQuick(mockProtocol);

      expect(result.pdfBlob).toBeInstanceOf(Blob);
      expect(result.pdfUrl).toBeTruthy();
      expect(result.generationTime).toBeGreaterThan(0);
    });

    it('should clear SessionStorage after PDF generation', async () => {
      const mockProtocol = {
        id: 'test-id',
        type: 'handover',
        vehicleImages: [],
        documentImages: [],
        damageImages: [],
      } as HandoverProtocol;

      // Save data
      SessionStorageManager.savePDFImage('test-img', 'data:image/jpeg;base64,test');

      await generateProtocolPDFQuick(mockProtocol);

      // Should be cleared
      const stats = SessionStorageManager.getStats();
      expect(stats.imageCount).toBe(0);
    });
  });
});

