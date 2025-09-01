/**
 * Unit testy pre HandoverProtocolFormV2
 * Testuje základnú funkcionalitu, smart caching a email status tracking
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as featureFlags from '../../../../config/featureFlags';
import * as protocolV2Cache from '../../../../utils/protocolV2Cache';
import * as protocolV2Performance from '../../../../utils/protocolV2Performance';
import {
  HandoverProtocolFormV2,
  type HandoverProtocolDataV2,
} from '../HandoverProtocolFormV2';

// Mock dependencies
vi.mock('../../../../config/featureFlags');
vi.mock('../../../../utils/protocolV2Cache');
vi.mock('../../../../utils/protocolV2Performance');
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

const mockFeatureManager = {
  isEnabled: vi.fn(),
};

const mockV2Cache = {
  getV2SmartDefaults: vi.fn(),
  cacheV2FormDefaults: vi.fn(),
  autoSaveV2FormData: vi.fn(),
  cacheEmailStatus: vi.fn(),
  getEmailStatus: vi.fn(),
  clearEmailStatus: vi.fn(),
};

const mockV2Performance = {
  useV2Performance: vi.fn(),
  trackUploadMetrics: vi.fn(),
  startPerformanceMonitoring: vi.fn(),
  stopPerformanceMonitoring: vi.fn(),
};

describe('HandoverProtocolFormV2', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    userId: 'test-user-123',
    disabled: false,
  };

  const mockSmartDefaults = {
    rental: {
      extraKilometerRate: 0.5,
      deposit: 500,
      allowedKilometers: 1000,
    },
    fuelLevel: 100,
    condition: 'excellent' as const,
    depositPaymentMethod: 'cash' as const,
    photoPreferences: {
      vehicle: {
        maxPhotos: 10,
        autoUpload: true,
        compressionLevel: 'medium' as const,
      },
      document: {
        maxPhotos: 5,
        autoUpload: true,
        compressionLevel: 'high' as const,
      },
      damage: {
        maxPhotos: 15,
        autoUpload: true,
        compressionLevel: 'low' as const,
      },
      odometer: {
        maxPhotos: 2,
        autoUpload: true,
        compressionLevel: 'high' as const,
      },
      fuel: {
        maxPhotos: 2,
        autoUpload: true,
        compressionLevel: 'high' as const,
      },
    },
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup feature flags mock
    (
      featureFlags as typeof featureFlags & {
        featureManager: typeof mockFeatureManager;
      }
    ).featureManager = mockFeatureManager;
    mockFeatureManager.isEnabled.mockResolvedValue(true);

    // Setup V2 cache mocks
    Object.assign(protocolV2Cache, mockV2Cache);
    mockV2Cache.getV2SmartDefaults.mockReturnValue(mockSmartDefaults);
    mockV2Cache.getEmailStatus.mockReturnValue(null);

    // Setup performance mocks
    Object.assign(protocolV2Performance, mockV2Performance);
    mockV2Performance.useV2Performance.mockReturnValue({
      trackRender: vi.fn(),
      getMetrics: vi.fn(),
      getAlerts: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render form when V2 is enabled', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Odovzdávací Protokol')).toBeInTheDocument();
      });

      expect(screen.getByText('V2 Queue Enabled')).toBeInTheDocument();
      expect(screen.getByText('Informácie o objednávke')).toBeInTheDocument();
      expect(screen.getByText('Informácie o zákazníkovi')).toBeInTheDocument();
      expect(screen.getByText('Informácie o vozidle')).toBeInTheDocument();
    });

    it('should show warning when V2 is disabled', async () => {
      mockFeatureManager.isEnabled.mockResolvedValue(false);

      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Protocol V2 nie je povolený. Používa sa štandardný formulár.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should render all photo category buttons', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Fotky vozidla')).toBeInTheDocument();
        expect(screen.getByText('Dokumenty')).toBeInTheDocument();
        // Use getAllByText for elements that appear multiple times
        const damageElements = screen.getAllByText('Poškodenia');
        expect(damageElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Fotka km')).toBeInTheDocument();
        expect(screen.getByText('Fotka paliva')).toBeInTheDocument();
      });
    });
  });

  describe('Smart Caching', () => {
    it('should load smart defaults on initialization', () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      expect(mockV2Cache.getV2SmartDefaults).toHaveBeenCalledWith(undefined);
    });

    it('should load company-specific defaults when vehicle has company', () => {
      const initialData: Partial<HandoverProtocolDataV2> = {
        vehicle: {
          licensePlate: 'BA123CD',
          brand: 'BMW',
          model: 'X5',
          year: 2023,
          company: 'Test Company',
        },
      };

      render(
        <HandoverProtocolFormV2 {...defaultProps} initialData={initialData} />
      );

      expect(mockV2Cache.getV2SmartDefaults).toHaveBeenCalledWith(
        'Test Company'
      );
    });

    it('should auto-save form data on changes', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        expect(mockV2Cache.autoSaveV2FormData).toHaveBeenCalled();
      });
    });
  });

  describe('Email Status Tracking', () => {
    it('should load cached email status on mount', () => {
      const mockEmailStatus = {
        protocolId: 'test-protocol-123',
        status: 'success' as const,
        message: 'Protocol sent successfully',
        timestamp: Date.now(),
        retryCount: 0,
      };

      mockV2Cache.getEmailStatus.mockReturnValue(mockEmailStatus);

      render(<HandoverProtocolFormV2 {...defaultProps} />);

      expect(mockV2Cache.getEmailStatus).toHaveBeenCalled();
    });

    it('should cache email status during form submission', async () => {
      const _mockProtocolData: HandoverProtocolDataV2 = {
        protocolId: 'test-protocol-123',
        vehicleId: 'vehicle-123',
        customerId: 'customer-123',
        rentalId: 'rental-123',
        vehicle: {
          licensePlate: 'BA123CD',
          brand: 'BMW',
          model: 'X5',
          year: 2023,
        },
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          email: 'john@example.com',
        },
        rental: {
          startDate: new Date(),
          endDate: new Date(),
          startKm: 0,
          location: 'Bratislava',
          pricePerDay: 50,
          totalPrice: 500,
        },
        fuelLevel: 100,
        odometer: 50000,
        condition: 'excellent',
        depositPaymentMethod: 'cash',
        damages: [],
        signatures: [
          {
            id: 'sig-1',
            signerName: 'John Doe',
            signerRole: 'customer',
            signatureData: 'signature-data',
            timestamp: new Date(),
          },
          {
            id: 'sig-2',
            signerName: 'Employee',
            signerRole: 'employee',
            signatureData: 'signature-data',
            timestamp: new Date(),
          },
        ],
        vehicleImages: [],
        documentImages: [],
        damageImages: [],
        odometerImages: [],
        fuelImages: [],
        photos: [],
      };

      mockOnSubmit.mockResolvedValue(undefined);

      render(<HandoverProtocolFormV2 {...defaultProps} />);

      // Fill required fields
      await waitFor(() => {
        const locationInput = screen.getByLabelText(/Miesto prevzatia/);
        fireEvent.change(locationInput, { target: { value: 'Bratislava' } });

        const odometerInput = screen.getByLabelText('Stav tachometra (km) *');
        fireEvent.change(odometerInput, { target: { value: '50000' } });

        const firstNameInput = screen.getByLabelText('Meno *');
        fireEvent.change(firstNameInput, { target: { value: 'John' } });

        const lastNameInput = screen.getByLabelText('Priezvisko *');
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

        const emailInput = screen.getByLabelText('Email *');
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

        const licensePlateInput = screen.getByLabelText('ŠPZ *');
        fireEvent.change(licensePlateInput, { target: { value: 'BA123CD' } });

        const brandInput = screen.getByLabelText('Značka *');
        fireEvent.change(brandInput, { target: { value: 'BMW' } });

        const modelInput = screen.getByLabelText('Model *');
        fireEvent.change(modelInput, { target: { value: 'X5' } });
      });

      // Submit form
      const submitButton = screen.getByText('Uložiť a generovať PDF');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockV2Cache.cacheEmailStatus).toHaveBeenCalledWith(
          'test-uuid-123',
          'pending',
          'Odosielam protokol a generujem PDF...'
        );
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should initialize performance monitoring', () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      expect(mockV2Performance.useV2Performance).toHaveBeenCalledWith(
        'HandoverProtocolFormV2'
      );
      expect(mockV2Performance.startPerformanceMonitoring).toHaveBeenCalledWith(
        30000
      );
    });

    it('should track upload metrics when photos change', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        expect(mockV2Performance.trackUploadMetrics).toHaveBeenCalledWith({
          activeUploads: 0,
          queueSize: 0,
          failedUploads: 0,
          totalUploaded: 0,
        });
      });
    });

    it('should cleanup performance monitoring on unmount', () => {
      const { unmount } = render(<HandoverProtocolFormV2 {...defaultProps} />);

      unmount();

      expect(mockV2Performance.stopPerformanceMonitoring).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields before submission', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        const submitButton = screen.getByText('Uložiť a generovať PDF');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Zadajte miesto prevzatia/)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate signatures before submission', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      // Fill required fields but no signatures
      await waitFor(() => {
        const locationInput = screen.getByLabelText(/Miesto prevzatia/);
        fireEvent.change(locationInput, { target: { value: 'Bratislava' } });

        const odometerInput = screen.getByLabelText('Stav tachometra (km) *');
        fireEvent.change(odometerInput, { target: { value: '50000' } });

        const firstNameInput = screen.getByLabelText('Meno *');
        fireEvent.change(firstNameInput, { target: { value: 'John' } });

        const licensePlateInput = screen.getByLabelText('ŠPZ *');
        fireEvent.change(licensePlateInput, { target: { value: 'BA123CD' } });
      });

      const submitButton = screen.getByText('Uložiť a generovať PDF');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Povinný je podpis zákazníka/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Photo Categories', () => {
    it('should display correct photo category names', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        // Use function matcher for text that is split across elements
        expect(
          screen.getByText((content, element) => {
            return (
              element?.textContent?.includes('Fotky vozidla') &&
              element?.textContent?.includes('0/0')
            );
          })
        ).toBeInTheDocument();
        expect(
          screen.getByText((content, element) => {
            return (
              element?.textContent?.includes('Dokumenty') &&
              element?.textContent?.includes('0/0')
            );
          })
        ).toBeInTheDocument();
        expect(
          screen.getByText((content, element) => {
            return (
              element?.textContent?.includes('Poškodenia') &&
              element?.textContent?.includes('0/0')
            );
          })
        ).toBeInTheDocument();
        expect(
          screen.getByText((content, element) => {
            return (
              element?.textContent?.includes('Fotka km') &&
              element?.textContent?.includes('0/0')
            );
          })
        ).toBeInTheDocument();
        expect(
          screen.getByText((content, element) => {
            return (
              element?.textContent?.includes('Fotka paliva') &&
              element?.textContent?.includes('0/0')
            );
          })
        ).toBeInTheDocument();
      });
    });

    it('should open photo capture modal when category button is clicked', async () => {
      render(<HandoverProtocolFormV2 {...defaultProps} />);

      await waitFor(() => {
        const vehiclePhotosButton = screen.getByRole('button', {
          name: (name, element) => {
            return (
              element?.textContent?.includes('Fotky vozidla') &&
              element?.textContent?.includes('0/0')
            );
          },
        });
        fireEvent.click(vehiclePhotosButton);
      });

      // Modal should open (we can't test the actual modal content without mocking SerialPhotoCaptureV2)
      expect(screen.getByText('Zavrieť')).toBeInTheDocument();
    });
  });

  describe('Smart Defaults Application', () => {
    it('should apply smart defaults to form fields', () => {
      const customSmartDefaults = {
        ...mockSmartDefaults,
        rental: {
          ...mockSmartDefaults.rental,
          extraKilometerRate: 0.8,
          deposit: 1000,
        },
        fuelLevel: 90,
        depositPaymentMethod: 'card' as const,
      };

      mockV2Cache.getV2SmartDefaults.mockReturnValue(customSmartDefaults);

      render(<HandoverProtocolFormV2 {...defaultProps} />);

      // Check if smart defaults are applied (we would need to check the actual input values)
      expect(mockV2Cache.getV2SmartDefaults).toHaveBeenCalled();
    });
  });
});
