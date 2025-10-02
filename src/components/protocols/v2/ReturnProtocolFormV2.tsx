/**
 * ReturnProtocolFormV2 - Vylepšená verzia preberacieho protokolu
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

export interface ReturnProtocolDataV2 {
  protocolId: string;
  vehicleId: string;
  customerId: string;
  rentalId: string;

  // Vehicle info (readonly from handover)
  vehicle: {
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    vin?: string;
  };

  // Customer info (readonly from handover)
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
    endKm: number;
    location: string;
    returnLocation: string;
    pricePerDay: number;
    totalPrice: number;
    extraKmPrice?: number;
    lateFee?: number;
    damageFee?: number;
  };

  // Return specific data
  returnDate: Date;
  fuelLevel: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';

  // Damages comparison
  newDamages: Array<{
    id: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major';
    location: string;
    estimatedCost?: number;
  }>;

  // Additional charges
  additionalCharges: Array<{
    id: string;
    type: 'extra_km' | 'late_return' | 'damage' | 'cleaning' | 'fuel' | 'other';
    description: string;
    amount: number;
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
  handoverProtocolId: string;
  initialData?: Partial<ReturnProtocolDataV2>;
  onSubmit: (data: ReturnProtocolDataV2) => Promise<void>;
  onCancel?: () => void;
  userId?: string;
  disabled?: boolean;
}

export const ReturnProtocolFormV2: React.FC<Props> = ({
  handoverProtocolId,
  initialData,
  onSubmit,
  onCancel,
  userId,
  disabled = false,
}) => {
  const [protocolData, setProtocolData] = useState<ReturnProtocolDataV2>(
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
        endKm: 0,
        location: '',
        returnLocation: '',
        pricePerDay: 0,
        totalPrice: 0,
      },
      returnDate: new Date(),
      fuelLevel: initialData?.fuelLevel || 100,
      condition: initialData?.condition || 'excellent',
      newDamages: initialData?.newDamages || [],
      additionalCharges: initialData?.additionalCharges || [],
      notes: initialData?.notes || '',
      signature: initialData?.signature || '',
      photos: initialData?.photos || [],
    })
  );

  const [isV2Enabled, setIsV2Enabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<QueueItem[]>([]);
  const [handoverData, setHandoverData] = useState<{
    allowedKm?: number;
    pricePerKm?: number;
    data?: {
      vehicleId?: string;
      customerId?: string;
      rentalId?: string;
      vehicle?: ReturnProtocolDataV2['vehicle'];
      customer?: ReturnProtocolDataV2['customer'];
      rental?: Partial<ReturnProtocolDataV2['rental']>;
    };
  } | null>(null);
  const [isLoadingHandover, setIsLoadingHandover] = useState(true);

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

  // Load handover protocol data
  useEffect(() => {
    const loadHandoverData = async () => {
      try {
        setIsLoadingHandover(true);

        // Načítanie handover protokolu
        const response = await fetch(`/api/protocols/${handoverProtocolId}`);
        if (!response.ok) {
          throw new Error('Failed to load handover protocol');
        }

        const handover = await response.json();
        setHandoverData(handover);

        // Pre-fill data z handover protokolu
        if (handover.data) {
          setProtocolData(prev => ({
            ...prev,
            vehicleId: handover.data.vehicleId || prev.vehicleId,
            customerId: handover.data.customerId || prev.customerId,
            rentalId: handover.data.rentalId || prev.rentalId,
            vehicle: handover.data.vehicle || prev.vehicle,
            customer: handover.data.customer || prev.customer,
            rental: {
              ...prev.rental,
              ...handover.data.rental,
              endKm: prev.rental.endKm || handover.data.rental?.startKm || 0,
            },
          }));
        }
      } catch (error) {
        console.error('Failed to load handover protocol:', error);
        setSubmitError('Nepodarilo sa načítať odovzdávací protokol');
      } finally {
        setIsLoadingHandover(false);
      }
    };

    if (handoverProtocolId) {
      loadHandoverData();
    }
  }, [handoverProtocolId]);

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
   * Add new damage
   */
  const addNewDamage = useCallback(() => {
    const newDamage = {
      id: uuid.v4(),
      description: '',
      severity: 'minor' as const,
      location: '',
      estimatedCost: 0,
    };

    setProtocolData(prev => ({
      ...prev,
      newDamages: [...prev.newDamages, newDamage],
    }));
  }, []);

  /**
   * Remove new damage
   */
  const removeNewDamage = useCallback((damageId: string) => {
    setProtocolData(prev => ({
      ...prev,
      newDamages: prev.newDamages.filter(d => d.id !== damageId),
    }));
  }, []);

  /**
   * Update new damage
   */
  const updateNewDamage = useCallback(
    (
      damageId: string,
      updates: Partial<ReturnProtocolDataV2['newDamages'][0]>
    ) => {
      setProtocolData(prev => ({
        ...prev,
        newDamages: prev.newDamages.map(damage =>
          damage.id === damageId ? { ...damage, ...updates } : damage
        ),
      }));
    },
    []
  );

  /**
   * Add additional charge
   */
  const addAdditionalCharge = useCallback(() => {
    const newCharge = {
      id: uuid.v4(),
      type: 'other' as const,
      description: '',
      amount: 0,
    };

    setProtocolData(prev => ({
      ...prev,
      additionalCharges: [...prev.additionalCharges, newCharge],
    }));
  }, []);

  /**
   * Remove additional charge
   */
  const removeAdditionalCharge = useCallback((chargeId: string) => {
    setProtocolData(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.filter(c => c.id !== chargeId),
    }));
  }, []);

  /**
   * Update additional charge
   */
  const updateAdditionalCharge = useCallback(
    (
      chargeId: string,
      updates: Partial<ReturnProtocolDataV2['additionalCharges'][0]>
    ) => {
      setProtocolData(prev => ({
        ...prev,
        additionalCharges: prev.additionalCharges.map(charge =>
          charge.id === chargeId ? { ...charge, ...updates } : charge
        ),
      }));
    },
    []
  );

  /**
   * Calculate total additional charges
   */
  const totalAdditionalCharges = protocolData.additionalCharges.reduce(
    (sum, charge) => sum + charge.amount,
    0
  );

  /**
   * Calculate extra kilometers
   */
  const extraKm = Math.max(
    0,
    protocolData.rental.endKm -
      protocolData.rental.startKm -
      (handoverData?.allowedKm || 0)
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
        !protocolData.rental.endKm ||
        protocolData.rental.endKm < protocolData.rental.startKm
      ) {
        throw new Error('Koncový stav km musí byť vyšší ako počiatočný');
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

      // Calculate final totals
      const finalData: ReturnProtocolDataV2 = {
        ...protocolData,
        rental: {
          ...protocolData.rental,
          extraKmPrice: extraKm * (handoverData?.pricePerKm || 0),
          lateFee: 0, // TODO: Calculate based on return time
          damageFee: protocolData.newDamages.reduce(
            (sum, d) => sum + (d.estimatedCost || 0),
            0
          ),
        },
      };

      // Submit protocol
      await onSubmit(finalData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Neznáma chyba';
      setSubmitError(errorMessage);
      console.error('Return protocol submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingHandover) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Načítavam údaje o prenájme...</p>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-gray-900">Preberací Protokol</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            V2 System
          </span>
          <span className="text-sm text-gray-600">
            ID: {protocolData.protocolId}
          </span>
          <span className="text-sm text-gray-600">
            Handover: {handoverProtocolId}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vehicle Information (readonly) */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Informácie o vozidle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ŠPZ
              </label>
              <input
                type="text"
                value={protocolData.vehicle.licensePlate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vozidlo
              </label>
              <input
                type="text"
                value={`${protocolData.vehicle.brand} ${protocolData.vehicle.model} (${protocolData.vehicle.year})`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                readOnly
              />
            </div>
          </div>
        </section>

        {/* Customer Information (readonly) */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Informácie o zákazníkovi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zákazník
              </label>
              <input
                type="text"
                value={`${protocolData.customer.firstName} ${protocolData.customer.lastName}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={protocolData.customer.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                readOnly
              />
            </div>
          </div>
        </section>

        {/* Return Details */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Detaily vrátenia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dátum vrátenia *
              </label>
              <input
                type="datetime-local"
                value={protocolData.returnDate.toISOString().slice(0, 16)}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    returnDate: new Date(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokácia vrátenia *
              </label>
              <input
                type="text"
                value={protocolData.rental.returnLocation}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    rental: { ...prev.rental, returnLocation: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Počiatočný stav km
              </label>
              <input
                type="number"
                value={protocolData.rental.startKm}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Koncový stav km *
              </label>
              <input
                type="number"
                value={protocolData.rental.endKm}
                onChange={e =>
                  setProtocolData(prev => ({
                    ...prev,
                    rental: {
                      ...prev.rental,
                      endKm: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min={protocolData.rental.startKm}
                required
                disabled={disabled}
              />
            </div>
          </div>

          {/* KM Summary */}
          {protocolData.rental.endKm > protocolData.rental.startKm && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Najazdené km:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {(
                      protocolData.rental.endKm - protocolData.rental.startKm
                    ).toLocaleString('sk-SK')}
                  </div>
                </div>
                {extraKm > 0 && (
                  <>
                    <div>
                      <span className="font-medium">Extra km:</span>
                      <div className="text-lg font-bold text-orange-600">
                        {extraKm.toLocaleString('sk-SK')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Poplatok za extra km:</span>
                      <div className="text-lg font-bold text-red-600">
                        {(
                          extraKm * (handoverData?.pricePerKm || 0)
                        ).toLocaleString('sk-SK')}{' '}
                        €
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Vehicle Condition */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Stav vozidla pri vrátení
          </h3>

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
                      .value as ReturnProtocolDataV2['condition'],
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

          {/* New Damages */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Nové poškodenia</h4>
              <button
                type="button"
                onClick={addNewDamage}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                disabled={disabled}
              >
                Pridať poškodenie
              </button>
            </div>

            {protocolData.newDamages.map(damage => (
              <div
                key={damage.id}
                className="bg-white p-4 rounded border mb-3 border-red-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Popis
                    </label>
                    <input
                      type="text"
                      value={damage.description}
                      onChange={e =>
                        updateNewDamage(damage.id, {
                          description: e.target.value,
                        })
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
                        updateNewDamage(damage.id, {
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
                      Odhadovaná cena (€)
                    </label>
                    <input
                      type="number"
                      value={damage.estimatedCost || 0}
                      onChange={e =>
                        updateNewDamage(damage.id, {
                          estimatedCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Akcia
                    </label>
                    <button
                      type="button"
                      onClick={() => removeNewDamage(damage.id)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                      disabled={disabled}
                    >
                      Odstrániť
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {protocolData.newDamages.length === 0 && (
              <div className="text-center py-4 text-gray-500 bg-white rounded border">
                Žiadne nové poškodenia nezaznamenané
              </div>
            )}
          </div>
        </section>

        {/* Additional Charges */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Dodatočné poplatky</h3>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Poplatky</h4>
              <button
                type="button"
                onClick={addAdditionalCharge}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                disabled={disabled}
              >
                Pridať poplatok
              </button>
            </div>

            {protocolData.additionalCharges.map(charge => (
              <div key={charge.id} className="bg-white p-4 rounded border mb-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Typ
                    </label>
                    <select
                      value={charge.type}
                      onChange={e =>
                        updateAdditionalCharge(charge.id, {
                          type: e.target.value as typeof charge.type,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={disabled}
                    >
                      <option value="extra_km">Extra km</option>
                      <option value="late_return">Neskoré vrátenie</option>
                      <option value="damage">Poškodenie</option>
                      <option value="cleaning">Čistenie</option>
                      <option value="fuel">Palivo</option>
                      <option value="other">Iné</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Popis
                    </label>
                    <input
                      type="text"
                      value={charge.description}
                      onChange={e =>
                        updateAdditionalCharge(charge.id, {
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suma (€)
                    </label>
                    <input
                      type="number"
                      value={charge.amount}
                      onChange={e =>
                        updateAdditionalCharge(charge.id, {
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Akcia
                    </label>
                    <button
                      type="button"
                      onClick={() => removeAdditionalCharge(charge.id)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                      disabled={disabled}
                    >
                      Odstrániť
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          {totalAdditionalCharges > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-lg font-bold text-yellow-800">
                Celkom dodatočné poplatky:{' '}
                {totalAdditionalCharges.toLocaleString('sk-SK')} €
              </div>
            </div>
          )}
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
            placeholder="Dodatočné poznámky k vráteniu..."
            disabled={disabled}
          />
        </section>

        {/* Signature */}
        <section className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Podpis zákazníka</h3>
          <SignaturePad
            onSave={signature =>
              setProtocolData(prev => ({
                ...prev,
                signature: signature.signature,
              }))
            }
            onCancel={() => {}}
            signerName="Customer"
            signerRole="customer"
            location="Office"
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
            {isSubmitting ? 'Ukladám...' : 'Dokončiť vrátenie'}
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
