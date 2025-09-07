/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Wrapper pre HandoverProtocolFormV2
 * Mapuje V1 props (onSave, rental) na V2 props (onSubmit, data)
 */

import { DirectionsCar } from '@mui/icons-material';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import React from 'react';
import { getApiBaseUrl } from '../../../utils/apiUrl';
import type { HandoverProtocolDataV2 } from './HandoverProtocolFormV2';
import { HandoverProtocolFormV2 } from './HandoverProtocolFormV2';

interface V1Props {
  open: boolean;
  rental: Record<string, unknown>;
  onSave: (protocol: Record<string, unknown>) => void;
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
        if (photo.urls?.original?.startsWith('blob:')) {
          // 📸 Uploading photo to R2

          // Convert blob URL to file if needed
          const response = await fetch(photo.urls.original);
          const blob = await response.blob();
          const file = new File([blob], `photo-${photo.photoId}.jpg`, {
            type: 'image/jpeg',
          });

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
              urls: {
                ...photo.urls,
                original: uploadedData.url || photo.urls?.original,
              },
              r2Key: uploadedData.key,
            });
          } else {
            console.error('Failed to upload photo:', photo.photoId);
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
        // @ts-expect-error - V2 protocol data structure
        km: (data as any).vehicleState?.mileage || 0,
        fuelLevel: data.fuelLevel,
        // @ts-expect-error - V2 protocol data structure
        damages: (data as any).vehicleState?.damages || [],
        // @ts-expect-error - V2 protocol data structure
        cleanliness: (data as any).vehicleState?.cleanliness || 'good',
      },

      // Photos - now with R2 URLs
      photos: uploadedPhotos,

      // Signatures
      signatures: data.signatures,

      // Documents
      // @ts-expect-error - V2 protocol data structure
      documents: (data as any).documents || [],

      // Notes
      notes: data.notes,

      // Location
      // @ts-expect-error - V2 protocol data structure
      location: (data as any).location || '',

      // V2 metadata
      metadata: {
        version: 'v2',
        queueEnabled: true,
        processedAt: new Date().toISOString(),
      },
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
      // @ts-expect-error - V1 to V2 mapping
      licensePlate: (rental?.vehicle as any)?.licensePlate || '',
      // @ts-expect-error - V1 to V2 mapping
      brand: (rental?.vehicle as any)?.brand || '',
      // @ts-expect-error - V1 to V2 mapping
      model: (rental?.vehicle as any)?.model || '',
      // @ts-expect-error - V1 to V2 mapping
      year: (rental?.vehicle as any)?.year || new Date().getFullYear(),
      // @ts-expect-error - V1 to V2 mapping
      vin: (rental?.vehicle as any)?.vin,
    },

    customer: {
      // @ts-expect-error - V1 to V2 mapping
      firstName: (rental?.customer as any)?.name?.split(' ')[0] || '',
      // @ts-expect-error - V1 to V2 mapping
      lastName: (rental?.customer as any)?.name?.split(' ')[1] || '',
      // @ts-expect-error - V1 to V2 mapping
      name: (rental?.customer as any)?.name || '',
      // @ts-expect-error - V1 to V2 mapping
      email: (rental?.customer as any)?.email || '',
      // @ts-expect-error - V1 to V2 mapping
      phone: (rental?.customer as any)?.phone,
    },

    rental: {
      startDate: rental?.startDate ? new Date(rental.startDate) : new Date(),
      endDate: rental?.endDate ? new Date(rental.endDate) : new Date(),
      startKm: (rental as any)?.startKm || 0,
      location: rental?.pickupLocation || '',
      pricePerDay: (rental as any)?.pricePerDay || 0,
      totalPrice: rental?.totalPrice || 0,
    },

    fuelLevel: 100,
    location: rental?.pickupLocation || 'Košice',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DirectionsCar color="primary" />
          <Typography variant="h6" component="span">
            Odovzdávací protokol
          </Typography>
          <Chip
            label="V2 Queue Enabled"
            color="success"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <HandoverProtocolFormV2
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          // @ts-expect-error - V1 to V2 mapping
          userId={(rental as any)?.userId}
        />
      </DialogContent>
    </Dialog>
  );
};

export default HandoverProtocolFormV2Wrapper;
