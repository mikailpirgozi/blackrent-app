/**
 * Photo Uploader Wrapper - Feature Flag Switcher
 *
 * This wrapper allows switching between:
 * - OLD: EnterprisePhotoCapture (browser-side compression, batch upload)
 * - NEW: ProgressivePhotoUploader (server-side compression, progressive upload)
 *
 * Use environment variable to control which uploader to use:
 * VITE_USE_PROGRESSIVE_UPLOAD=true -> Use new progressive uploader
 * VITE_USE_PROGRESSIVE_UPLOAD=false -> Use old enterprise uploader (default)
 */

import React from 'react';
import { EnterprisePhotoCapture } from './EnterprisePhotoCapture';
import { ProgressivePhotoUploader } from './ProgressivePhotoUploader';
import type { ProtocolImage } from '../../types';

interface PhotoUploaderWrapperProps {
  protocolId: string;
  protocolType: 'handover' | 'return';
  mediaType: 'vehicle' | 'document' | 'damage' | 'fuel' | 'odometer';
  onPhotosUploaded: (
    results: Array<{ url: string; imageId: string; pdfUrl?: string | null }>
  ) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

// Feature flag - can be controlled via environment variable
const USE_PROGRESSIVE_UPLOAD =
  import.meta.env.VITE_USE_PROGRESSIVE_UPLOAD === 'true';

export const PhotoUploaderWrapper: React.FC<
  PhotoUploaderWrapperProps
> = props => {
  const {
    protocolId,
    protocolType,
    mediaType,
    onPhotosUploaded,
    maxPhotos = 50,
    disabled = false,
  } = props;

  // Handler for ProgressivePhotoUploader (new system)
  const handleProgressiveUploadComplete = (images: ProtocolImage[]) => {
    const results = images.map(img => ({
      url: img.url,
      imageId: img.id,
      pdfUrl: img.pdfUrl || null,
    }));
    onPhotosUploaded(results);
  };

  // Use new progressive uploader if feature flag is enabled
  if (USE_PROGRESSIVE_UPLOAD) {
    console.log(
      '✅ Using NEW ProgressivePhotoUploader (server-side compression)'
    );

    return (
      <ProgressivePhotoUploader
        protocolId={protocolId}
        protocolType={protocolType}
        mediaType={mediaType}
        onUploadComplete={handleProgressiveUploadComplete}
        maxPhotos={maxPhotos}
        disabled={disabled}
      />
    );
  }

  // Use old enterprise uploader by default
  console.log('✅ Using OLD EnterprisePhotoCapture (browser-side compression)');

  return (
    <EnterprisePhotoCapture
      protocolId={protocolId}
      protocolType={protocolType}
      mediaType={mediaType}
      onPhotosUploaded={onPhotosUploaded}
      maxPhotos={maxPhotos}
      disabled={disabled}
    />
  );
};
