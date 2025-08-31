/**
 * Wrapper pre HandoverProtocolFormV2 
 * Mapuje V1 props (onSave, rental) na V2 props (onSubmit, data)
 */

import React from 'react';
import { HandoverProtocolFormV2, HandoverProtocolDataV2 } from './HandoverProtocolFormV2';
import { getApiBaseUrl } from '../../../utils/apiUrl';

interface V1Props {
  open: boolean;
  rental: any;
  onSave: (protocol: any) => void;
  onClose: () => void;
}

const HandoverProtocolFormV2Wrapper: React.FC<V1Props> = ({
  open,
  rental,
  onSave,
  onClose,
}) => {
  if (!open) return null;

  // Map V1 rental data to V2 format
  const handleSubmit = async (data: HandoverProtocolDataV2) => {
    // 🚀 UPLOAD PHOTOS TO R2 FIRST
    const uploadedPhotos = [];
    
    for (const photo of data.photos) {
      try {
        // If photo has blob URL, we need to upload it
        if (photo.url.startsWith('blob:')) {
          console.log('📸 Uploading photo to R2...', photo.id);
          
          // Convert blob URL to file if needed
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const file = new File([blob], `photo-${photo.id}.jpg`, { type: 'image/jpeg' });
          
          // Upload to R2 via V1 API (which works)
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'protocol_photo');
          formData.append('entityId', rental?.id?.toString() || '');
          
          const apiBaseUrl = getApiBaseUrl();
          const uploadResponse = await fetch(`${apiBaseUrl}/files/upload`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
            },
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadedData = await uploadResponse.json();
            uploadedPhotos.push({
              ...photo,
              url: uploadedData.url || photo.url,
              r2Key: uploadedData.key,
            });
          } else {
            console.error('Failed to upload photo:', photo.id);
            uploadedPhotos.push(photo);
          }
        } else {
          // Photo already uploaded
          uploadedPhotos.push(photo);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        uploadedPhotos.push(photo);
      }
    }
    
    // Transform V2 data back to V1 format
    const v1Protocol = {
      rentalId: rental?.id,
      vehicleId: rental?.vehicleId,
      customerId: rental?.customerId,
      date: new Date().toISOString(),
      type: 'handover',
      
      // V2 specific data
      vehicleState: {
        km: data.vehicleState.mileage,
        fuelLevel: data.fuelLevel,
        damages: data.vehicleState.damages,
        cleanliness: data.vehicleState.cleanliness,
      },
      
      // Photos - now with R2 URLs
      photos: uploadedPhotos,
      
      // Signatures
      signatures: data.signatures,
      
      // Documents
      documents: data.documents,
      
      // Notes
      notes: data.notes,
      
      // Location
      location: data.location,
      
      // V2 metadata
      metadata: {
        version: 'v2',
        queueEnabled: true,
        processedAt: new Date().toISOString(),
      }
    };

    // Call original V1 save handler
    await onSave(v1Protocol);
    onClose();
  };

  // Map V1 rental to V2 initialData
  const initialData: Partial<HandoverProtocolDataV2> = {
    rentalId: rental?.id?.toString(),
    vehicleId: rental?.vehicleId?.toString(),
    customerId: rental?.customerId?.toString(),
    
    vehicle: {
      licensePlate: rental?.vehicle?.licensePlate || '',
      brand: rental?.vehicle?.brand || '',
      model: rental?.vehicle?.model || '',
      year: rental?.vehicle?.year || new Date().getFullYear(),
      vin: rental?.vehicle?.vin,
    },
    
    customer: {
      firstName: rental?.customer?.firstName || '',
      lastName: rental?.customer?.lastName || '',
      email: rental?.customer?.email || '',
      phone: rental?.customer?.phone,
      documentNumber: rental?.customer?.documentNumber,
    },
    
    rental: {
      startDate: rental?.startDate ? new Date(rental.startDate) : new Date(),
      endDate: rental?.endDate ? new Date(rental.endDate) : new Date(),
      startKm: rental?.startKm || 0,
      location: rental?.pickupLocation || '',
      pricePerDay: rental?.pricePerDay || 0,
      totalPrice: rental?.totalPrice || 0,
    },
    
    fuelLevel: 100,
    location: rental?.pickupLocation || 'Košice',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Odovzdávací protokol V2
            <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
              Queue Enabled
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <HandoverProtocolFormV2
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          userId={rental?.userId}
        />
      </div>
    </div>
  );
};

export default HandoverProtocolFormV2Wrapper;
