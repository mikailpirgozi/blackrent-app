/**
 * 🖼️ IMAGE GALLERY LAZY
 *
 * Optimalizovaná image gallery s lazy loading a virtualizáciou
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from 'lucide-react';

import { VehicleImageUtils } from '../../utils/imageOptimization';

import LazyImage from './LazyImage';

interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  vehicleId?: string;
}

interface ImageGalleryLazyProps {
  images: GalleryImage[];
  columns?: number;
  spacing?: number;
  aspectRatio?: number;
  showCaptions?: boolean;
  enableFullscreen?: boolean;
  maxVisibleImages?: number;
  onImageClick?: (image: GalleryImage, index: number) => void;
  className?: string;
}

const ImageGalleryLazy: React.FC<ImageGalleryLazyProps> = ({
  images,
  columns = 3,
  spacing = 2,
  aspectRatio = 4 / 3,
  showCaptions = false,
  enableFullscreen = true,
  maxVisibleImages = 50, // Virtual scrolling threshold
  onImageClick,
  className,
}) => {

  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Responsive columns
  const responsiveColumns = useMemo(() => {
    return columns;
  }, [columns]);

  // Virtual scrolling - show only subset of images initially
  const [visibleCount, setVisibleCount] = useState(
    Math.min(maxVisibleImages, images.length)
  );
  const visibleImages = useMemo(
    () => images.slice(0, visibleCount),
    [images, visibleCount]
  );

  // Load more images when needed
  const loadMoreImages = useCallback(() => {
    const remaining = images.length - visibleCount;
    const increment = Math.min(20, remaining);
    setVisibleCount(prev => prev + increment);
  }, [images.length, visibleCount]);

  // Handle image click
  const handleImageClick = useCallback(
    (image: GalleryImage, index: number) => {
      if (enableFullscreen) {
        setCurrentImageIndex(index);
        setFullscreenOpen(true);
      }
      onImageClick?.(image, index);
    },
    [enableFullscreen, onImageClick]
  );

  // Fullscreen navigation
  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenOpen(false);
  }, []);

  // Calculate image dimensions
  const imageHeight = useMemo(() => {
    return `${(1 / aspectRatio) * 100}%`;
  }, [aspectRatio]);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-base">🖼️ Žiadne obrázky na zobrazenie</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Gallery Grid */}
      <div className={`grid gap-${spacing}`} style={{
        gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`
      }}>
        {visibleImages.map((image, index) => (
          <Card
            key={image.id}
            className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
              enableFullscreen ? 'cursor-pointer hover:scale-105' : ''
            }`}
          >
            <div
              className="relative overflow-hidden"
              style={{ paddingBottom: imageHeight }}
            >
              <LazyImage
                src={image.url}
                {...(image.thumbnailUrl || image.vehicleId ? {
                  lowQualitySrc: image.thumbnailUrl ||
                    (image.vehicleId
                      ? VehicleImageUtils.getVehicleImageUrl(
                          image.vehicleId,
                          'thumbnail'
                        )
                      : '')
                } : {})}
                alt={image.alt || `Obrázok ${index + 1}`}
                width="100%"
                height="100%"
                objectFit="cover"
                placeholder="skeleton"
                onClick={() => handleImageClick(image, index)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              />

              {/* Zoom overlay */}
              {enableFullscreen && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Caption */}
            {showCaptions && image.caption && (
              <CardContent className="p-2">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {image.caption}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {visibleCount < images.length && (
        <div className="text-center mt-6">
          <Button
            onClick={loadMoreImages}
            className="px-6 py-3"
          >
            Načítať ďalšie ({images.length - visibleCount} zostáva)
          </Button>
        </div>
      )}

      {/* Fullscreen Dialog */}
      {enableFullscreen && (
        <Dialog
          open={fullscreenOpen}
          onOpenChange={setFullscreenOpen}
        >
          <DialogContent className="p-0 bg-black/90 max-w-none max-h-none w-screen h-screen rounded-none">
            {/* Close Button */}
            <Button
              onClick={handleCloseFullscreen}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                  size="icon"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70"
                  size="icon"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Fullscreen Image */}
            <div className="w-screen h-screen flex items-center justify-center p-4">
              {images[currentImageIndex] && (
                <img
                  src={images[currentImageIndex].url}
                  alt={
                    images[currentImageIndex].alt ||
                    `Obrázok ${currentImageIndex + 1}`
                  }
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default memo(ImageGalleryLazy);
