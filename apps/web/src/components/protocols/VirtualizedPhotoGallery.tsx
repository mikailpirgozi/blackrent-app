/**
 * Virtualized Photo Gallery
 *
 * Memory-efficient photo gallery that renders only visible items
 * Uses React Virtuoso for automatic virtualization
 *
 * Memory footprint: ~10 visible thumbnails vs 50+ in old system
 */

import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Loader2, Eye, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PhotoItem {
  id: string;
  preview: string; // blob URL or uploaded URL
  file?: File;
  uploaded: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  uploadUrl?: string;
  error?: string;
  size?: number;
  width?: number;
  height?: number;
}

interface VirtualizedPhotoGalleryProps {
  photos: PhotoItem[];
  onRemove: (id: string) => void;
  onPreview: (photo: PhotoItem) => void;
  height?: number; // Gallery height in pixels
  itemHeight?: number; // Single item height
  columns?: number; // Number of columns
  showStats?: boolean;
}

export const VirtualizedPhotoGallery: React.FC<
  VirtualizedPhotoGalleryProps
> = ({
  photos,
  onRemove,
  onPreview,
  height = 600,
  columns = 4,
  showStats = true,
}) => {
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);

  // Calculate rows from photos
  const rows: PhotoItem[][] = [];
  for (let i = 0; i < photos.length; i += columns) {
    rows.push(photos.slice(i, i + columns));
  }

  // Stats
  const uploadedCount = photos.filter(p => p.uploaded).length;
  const uploadingCount = photos.filter(p => p.uploading).length;
  const errorCount = photos.filter(p => p.error).length;
  const pendingCount =
    photos.length - uploadedCount - uploadingCount - errorCount;

  const handlePreview = (photo: PhotoItem) => {
    setPreviewPhoto(photo);
    onPreview(photo);
  };

  return (
    <>
      {/* Stats */}
      {showStats && photos.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="font-semibold">{photos.length}</span>
            <span className="text-muted-foreground">total</span>
          </Badge>

          {uploadedCount > 0 && (
            <Badge
              variant="default"
              className="flex items-center gap-1 bg-green-600"
            >
              <CheckCircle className="h-3 w-3" />
              <span>{uploadedCount} uploaded</span>
            </Badge>
          )}

          {uploadingCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{uploadingCount} uploading</span>
            </Badge>
          )}

          {pendingCount > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{pendingCount} pending</span>
            </Badge>
          )}

          {errorCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>{errorCount} failed</span>
            </Badge>
          )}
        </div>
      )}

      {/* Virtualized Gallery */}
      {photos.length > 0 ? (
        <Virtuoso
          style={{ height: `${height}px` }}
          totalCount={rows.length}
          itemContent={index => {
            const row = rows[index];
            if (!row) return null;
            
            return (
              <div
                className="grid gap-4 mb-4"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {row.map(photo => (
                  <PhotoThumbnail
                    key={photo.id}
                    photo={photo}
                    onRemove={() => onRemove(photo.id)}
                    onPreview={() => handlePreview(photo)}
                  />
                ))}
              </div>
            );
          }}
          overscan={2} // Pre-render 2 rows above/below viewport
        />
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No photos added yet</p>
        </div>
      )}

      {/* Preview Dialog */}
      {previewPhoto && (
        <Dialog
          open={!!previewPhoto}
          onOpenChange={() => setPreviewPhoto(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Photo Preview</DialogTitle>
              <DialogDescription>
                {previewPhoto.size && (
                  <span>Size: {(previewPhoto.size / 1024).toFixed(0)}KB</span>
                )}
                {previewPhoto.width && previewPhoto.height && (
                  <span className="ml-4">
                    Dimensions: {previewPhoto.width} × {previewPhoto.height}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center bg-black/5 rounded-lg p-4">
              <img
                src={previewPhoto.uploadUrl || previewPhoto.preview}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
                onError={e => {
                  // Fallback to preview URL if uploaded URL fails
                  const img = e.target as HTMLImageElement;
                  if (
                    previewPhoto.uploadUrl &&
                    img.src !== previewPhoto.preview
                  ) {
                    img.src = previewPhoto.preview;
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

/**
 * Single photo thumbnail component
 */
interface PhotoThumbnailProps {
  photo: PhotoItem;
  onRemove: () => void;
  onPreview: () => void;
}

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({
  photo,
  onRemove,
  onPreview,
}) => {
  return (
    <Card className="relative group overflow-hidden">
      {/* Image */}
      <div className="aspect-video relative">
        <img
          src={photo.preview}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy" // Lazy load for better performance
        />

        {/* Status Overlay */}
        <div className="absolute top-2 left-2 z-10">
          {photo.uploaded && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Uploaded
            </Badge>
          )}
          {photo.uploading && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {photo.uploadProgress !== undefined
                ? `${photo.uploadProgress}%`
                : 'Uploading...'}
            </Badge>
          )}
          {photo.error && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          )}
          {!photo.uploaded && !photo.uploading && !photo.error && (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>

        {/* Action Buttons - Show on hover */}
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={onPreview}
            className="h-8 w-8 p-0"
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onRemove}
            className="h-8 w-8 p-0"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Error Message */}
        {photo.error && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 text-center">
            {photo.error}
          </div>
        )}
      </div>
    </Card>
  );
};
