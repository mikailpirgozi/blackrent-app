/**
 * HandoverProtocolFormV2 - Vylepšená verzia odovzdávacieho protokolu
 * Používa V2 photo capture a queue systém
 */

import React, { useCallback, useEffect, useState } from 'react';
import * as uuid from 'uuid';
import {
  PROTOCOL_V2_FLAGS,
  featureManager,
} from '../../../config/featureFlags';
import SignaturePad from '../../common/SignaturePad';
import {
  SerialPhotoCaptureV2,
  type QueueItem,
} from '../../common/v2/SerialPhotoCaptureV2';

export interface HandoverProtocolDataV2 {
  protocolId: string;
  vehicleId: string;
  customerId: string;
  rentalId: string;

  // Vehicle info
  vehicle: {
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    vin?: string;
  };

  // Customer info
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  // Rental details
  rental: {
    startDate: Date;
    endDate: Date;
    startKm: number;
    location: string;
    pricePerDay: number;
    totalPrice: number;
  };

  // Protocol specific
  fuelLevel: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  damages: Array<{
    id: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major';
    location: string;
  }>;
  notes?: string;
  signature?: string;

  // Photos
  photos: Array<{
    photoId: string;
    description: string;
    category: 'exterior' | 'interior' | 'damage' | 'fuel' | 'other';
    urls?: {
      original?: string;
      thumb?: string;
      gallery?: string;
      pdf?: string;
    };
  }>;
}

interface Props {
  initialData?: Partial<HandoverProtocolDataV2>;
  onSubmit: (data: HandoverProtocolDataV2) => Promise<void>;
  onCancel?: () => void;
  userId?: string;
  disabled?: boolean;
}

export const HandoverProtocolFormV2: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  userId,
  disabled = false,
}) => {
  const [protocolData, setProtocolData] = useState<HandoverProtocolDataV2>(
    () => ({
      protocolId: initialData?.protocolId || uuid.v4(),
      vehicleId: initialData?.vehicleId || '',
      customerId: initialData?.customerId || '',
      rentalId: initialData?.rentalId || '',
      vehicle: initialData?.vehicle || {
        licensePlate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
      },
      customer: initialData?.customer || {
        firstName: '',
        lastName: '',
        email: '',
      },
      rental: initialData?.rental || {
        startDate: new Date(),
        endDate: new Date(),
        startKm: 0,
        location: '',
        pricePerDay: 0,
        totalPrice: 0,
      },
      fuelLevel: initialData?.fuelLevel || 100,
      condition: initialData?.condition || 'excellent',
      damages: initialData?.damages || [],
      notes: initialData?.notes || '',
      signature: initialData?.signature || '',
      photos: initialData?.photos || [],
    })
  );

  const [isV2Enabled, setIsV2Enabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<QueueItem[]>([]);

  // Check feature flag
  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        const enabled = await featureManager.isEnabled(
          PROTOCOL_V2_FLAGS.FULL_V2_SYSTEM,
          userId
        );
        setIsV2Enabled(enabled);
      } catch (error) {
        console.error('Failed to check V2 feature flag:', error);
        setIsV2Enabled(false);
      }
    };

    checkFeatureFlag();
  }, [userId]);

  /**
   * Handle photo upload completion
   */
  const handlePhotoUploadComplete = useCallback(
    (photoId: string, urls: QueueItem['urls']) => {
      setProtocolData(prev => ({
        ...prev,
        photos: prev.photos.map(photo =>
          photo.photoId === photoId ? { ...photo, urls } : photo
        ),
      }));
    },
    []
  );

  /**
   * Handle photos change from capture component
   */
  const handlePhotosChange = useCallback((photos: QueueItem[]) => {
    setUploadedPhotos(photos);

    // Sync with protocol data
    const photoEntries = photos
      .filter(p => p.photoId)
      .map(p => ({
        photoId: p.photoId!,
        description: `Fotografia ${p.file.name}`,
        category: 'other' as const,
        urls: p.urls,
      }));

    setProtocolData(prev => ({
      ...prev,
      photos: photoEntries,
    }));
  }, []);

  /**
   * Add damage record
   */
  const addDamage = useCallback(() => {
    const newDamage = {
      id: uuid.v4(),
      description: '',
      severity: 'minor' as const,
      location: '',
    };

    setProtocolData(prev => ({
      ...prev,
      damages: [...prev.damages, newDamage],
    }));
  }, []);

  /**
   * Remove damage record
   */
  const removeDamage = useCallback((damageId: string) => {
    setProtocolData(prev => ({
      ...prev,
      damages: prev.damages.filter(d => d.id !== damageId),
    }));
  }, []);

  /**
   * Update damage record
   */
  const updateDamage = useCallback(
    (
      damageId: string,
      updates: Partial<HandoverProtocolDataV2['damages'][0]>
    ) => {
      setProtocolData(prev => ({
        ...prev,
        damages: prev.damages.map(damage =>
          damage.id === damageId ? { ...damage, ...updates } : damage
        ),
      }));
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validácia
      if (
        !protocolData.vehicle.licensePlate ||
        !protocolData.customer.firstName
      ) {
        throw new Error('Vyplňte všetky povinné polia');
      }

      // Check že všetky fotografie sú spracované
      const pendingPhotos = uploadedPhotos.filter(
        p =>
          p.status === 'pending' ||
          p.status === 'uploading' ||
          p.status === 'processing'
      );

      if (pendingPhotos.length > 0) {
        throw new Error(
          `Čaká sa na spracovanie ${pendingPhotos.length} fotografií`
        );
      }

      // Submit protocol
      await onSubmit(protocolData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Neznáma chyba';
      setSubmitError(errorMessage);
      console.error('Protocol submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isV2Enabled) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Protocol V2 nie je povolený. Používa sa štandardný formulár.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Odovzdávací Protokol
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            V2 System
          </span>
          <span className="text-sm text-gray-600">
            ID: {protocolData.protocolId}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vehicle Information */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Informácie o vozidle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ŠPZ *
              </label>
              <input
                type="text"
                value={protocolData.vehicle.licensePlate}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    vehicle: { ...prev.vehicle, licensePlate: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Značka *
              </label>
              <input
                type="text"
                value={protocolData.vehicle.brand}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    vehicle: { ...prev.vehicle, brand: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={protocolData.vehicle.model}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    vehicle: { ...prev.vehicle, model: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rok výroby
              </label>
              <input
                type="number"
                value={protocolData.vehicle.year}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    vehicle: {
                      ...prev.vehicle,
                      year:
                        parseInt(e.target.value) || new Date().getFullYear(),
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1900"
                max={new Date().getFullYear() + 1}
                disabled={disabled}
              />
            </div>
          </div>
        </section>

        {/* Customer Information */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Informácie o zákazníkovi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meno *
              </label>
              <input
                type="text"
                value={protocolData.customer.firstName}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, firstName: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priezvisko *
              </label>
              <input
                type="text"
                value={protocolData.customer.lastName}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, lastName: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={protocolData.customer.email}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefón
              </label>
              <input
                type="tel"
                value={protocolData.customer.phone || ''}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, phone: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              />
            </div>
          </div>
        </section>

        {/* Rental Details */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Detaily prenájmu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Začiatok prenájmu *
              </label>
              <input
                type="datetime-local"
                value={protocolData.rental.startDate.toISOString().slice(0, 16)}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    rental: {
                      ...prev.rental,
                      startDate: new Date(e.target.value),
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Koniec prenájmu *
              </label>
              <input
                type="datetime-local"
                value={protocolData.rental.endDate.toISOString().slice(0, 16)}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    rental: {
                      ...prev.rental,
                      endDate: new Date(e.target.value),
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Počiatočný stav km *
              </label>
              <input
                type="number"
                value={protocolData.rental.startKm}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    rental: {
                      ...prev.rental,
                      startKm: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokácia *
              </label>
              <input
                type="text"
                value={protocolData.rental.location}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    rental: { ...prev.rental, location: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>
          </div>
        </section>

        {/* Vehicle Condition */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Stav vozidla</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Úroveň paliva (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={protocolData.fuelLevel}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    fuelLevel: parseInt(e.target.value),
                  }))
                }
                className="w-full"
                disabled={disabled}
              />
              <div className="text-center text-sm text-gray-600 mt-1">
                {protocolData.fuelLevel}%
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Celkový stav
              </label>
              <select
                value={protocolData.condition}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    condition: e.target
                      .value as HandoverProtocolDataV2['condition'],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              >
                <option value="excellent">Výborný</option>
                <option value="good">Dobrý</option>
                <option value="fair">Priemerný</option>
                <option value="poor">Zlý</option>
              </select>
            </div>
          </div>

          {/* Damages */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Poškodenia</h4>
              <button
                type="button"
                onClick={addDamage}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                disabled={disabled}
              >
                Pridať poškodenie
              </button>
            </div>

            {protocolData.damages.map(damage => (
              <div key={damage.id} className="bg-white p-4 rounded border mb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Popis
                    </label>
                    <input
                      type="text"
                      value={damage.description}
                      onChange={e =>
                        updateDamage(damage.id, { description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Závažnosť
                    </label>
                    <select
                      value={damage.severity}
                      onChange={e =>
                        updateDamage(damage.id, {
                          severity: e.target.value as typeof damage.severity,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={disabled}
                    >
                      <option value="minor">Malé</option>
                      <option value="moderate">Stredné</option>
                      <option value="major">Veľké</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lokácia
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={damage.location}
                        onChange={e =>
                          updateDamage(damage.id, { location: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        disabled={disabled}
                      />
                      <button
                        type="button"
                        onClick={() => removeDamage(damage.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                        disabled={disabled}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {protocolData.damages.length === 0 && (
              <div className="text-center py-4 text-gray-500 bg-white rounded border">
                Žiadne poškodenia nezaznamenané
              </div>
            )}
          </div>
        </section>

        {/* Photos */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Dokumentačné fotografie
          </h3>
          <SerialPhotoCaptureV2
            protocolId={protocolData.protocolId}
            onPhotosChange={handlePhotosChange}
            onUploadComplete={handlePhotoUploadComplete}
            maxPhotos={20}
            userId={userId}
            disabled={disabled}
          />
        </section>

        {/* Notes */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Poznámky</h3>
          <textarea
            value={protocolData.notes}
            onChange={e =>
              setProtocolData(prev => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Dodatočné poznámky k protokolu..."
            disabled={disabled}
          />
        </section>

        {/* Signature */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Podpis zákazníka</h3>
          <SignaturePad
            onSignatureChange={signature =>
              setProtocolData(prev => ({
                ...prev,
                signature,
              }))
            }
            disabled={disabled}
          />
        </section>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Chyba pri ukladaní protokolu
                </h4>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Zrušiť
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || disabled}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            {isSubmitting ? 'Ukladám...' : 'Uložiť protokol'}
          </button>
        </div>

        {/* Upload Progress Info */}
        {uploadedPhotos.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            <div className="flex justify-center items-center gap-4">
              <span>
                Fotografie:{' '}
                {uploadedPhotos.filter(p => p.status === 'completed').length}/
                {uploadedPhotos.length}
              </span>
              {uploadedPhotos.some(p => p.status === 'processing') && (
                <span className="text-blue-600">⏳ Spracovávam...</span>
              )}
              {uploadedPhotos.some(p => p.status === 'failed') && (
                <span className="text-red-600">
                  ❌ {uploadedPhotos.filter(p => p.status === 'failed').length}{' '}
                  chýb
                </span>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
