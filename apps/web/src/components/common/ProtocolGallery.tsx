/**
 * Protocol Gallery - Full-screen Lightbox s zoom/pan/swipe
 *
 * Features:
 * - Full-screen modal
 * - Zoom (pinch to zoom, buttons)
 * - Pan (drag)
 * - Keyboard navigation (←/→/Esc)
 * - Thumbnail strip
 * - Download option
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { ProtocolImage } from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { logger } from '../../utils/logger';

interface ProtocolGalleryProps {
  images: ProtocolImage[];
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

// Helper to convert R2 URL to proxy URL
const getProxyUrl = (url: string | undefined): string => {
  if (!url) return '';

  try {
    // Ak je to R2 URL, konvertuj na proxy
    if (url.includes('r2.dev') || url.includes('cloudflare.com')) {
      const urlParts = url.split('/');
      const key = urlParts.slice(3).join('/');
      const apiBaseUrl = getApiBaseUrl();
      return `${apiBaseUrl}/files/proxy/${encodeURIComponent(key)}`;
    }
    return url;
  } catch (error) {
    logger.error('Error converting to proxy URL', { error, url });
    return url;
  }
};

export const ProtocolGallery: React.FC<ProtocolGalleryProps> = ({
  images,
  open,
  onClose,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 🚀 ULTRA MODERN: Intelligent preloading cache
  const preloadedImagesRef = useRef<Set<number>>(new Set());
  const imageElementsRef = useRef<Map<number, HTMLImageElement>>(new Map());

  const currentImage = images[currentIndex];

  // 🚀 Intelligent preloader - preloads current + adjacent images
  useEffect(() => {
    if (!open || !currentImage) return;

    const preloadImage = (index: number) => {
      // Skip if already preloaded
      if (preloadedImagesRef.current.has(index)) return;

      const image = images[index];
      if (!image?.url && !image?.originalUrl) return;

      // Create new Image element for preloading
      // Use WebP version (url) for faster loading, fallback to originalUrl
      const img = new Image();
      const url = getProxyUrl(image.url || image.originalUrl);

      img.onload = () => {
        preloadedImagesRef.current.add(index);
        imageElementsRef.current.set(index, img);
        logger.info('🚀 Image preloaded', { index, url });
      };

      img.onerror = () => {
        logger.error('❌ Image preload failed', { index, url });
      };

      img.src = url;
    };

    // Preload strategy:
    // 1. Current image (priority 1)
    // 2. Next image (priority 2)
    // 3. Previous image (priority 3)
    // 4. Next+1 image (priority 4)
    // 5. Previous-1 image (priority 5)

    preloadImage(currentIndex); // Current

    if (currentIndex < images.length - 1) {
      preloadImage(currentIndex + 1); // Next
    }

    if (currentIndex > 0) {
      preloadImage(currentIndex - 1); // Previous
    }

    if (currentIndex < images.length - 2) {
      setTimeout(() => preloadImage(currentIndex + 2), 100); // Next+1 (delayed)
    }

    if (currentIndex > 1) {
      setTimeout(() => preloadImage(currentIndex - 2), 200); // Previous-1 (delayed)
    }
  }, [currentIndex, open, images]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, images.length, onClose]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    setIsLoading(true);
    setImageError(false);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    setIsLoading(true);
    setImageError(false);
  }, [images.length]);

  const handleDownload = async () => {
    if (!currentImage?.originalUrl) return;

    try {
      const response = await fetch(getProxyUrl(currentImage.originalUrl));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image_${currentIndex + 1}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      logger.info('Image downloaded', { index: currentIndex });
    } catch (error) {
      logger.error('Download failed', { error });
      alert('Nepodarilo sa stiahnuť obrázok. Skúste to znova.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div className="text-white">
          <span className="text-lg font-semibold">
            {currentIndex + 1} / {images.length}
          </span>
          {currentImage?.description && (
            <p className="text-sm text-gray-300 mt-1">
              {currentImage.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Download"
          >
            <Download className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                <button
                  onClick={() => zoomIn()}
                  className="p-3 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="p-3 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="p-3 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors text-xs text-white"
                  title="Reset"
                >
                  1:1
                </button>
              </div>

              {/* Image */}
              <TransformComponent
                wrapperClass="w-full h-full"
                contentClass="w-full h-full flex items-center justify-center"
              >
                {isLoading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {imageError ? (
                  <div className="text-white text-center">
                    <p className="text-lg mb-2">
                      Nepodarilo sa načítať obrázok
                    </p>
                    <button
                      onClick={() => {
                        setImageError(false);
                        setIsLoading(true);
                      }}
                      className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Skúsiť znova
                    </button>
                  </div>
                ) : (
                  <img
                    src={getProxyUrl(
                      currentImage?.url || currentImage?.originalUrl
                    )}
                    alt={
                      currentImage?.description || `Image ${currentIndex + 1}`
                    }
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setImageError(true);
                      logger.error('Image load error', { index: currentIndex });
                    }}
                  />
                )}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
              title="Previous (←)"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors"
              title="Next (→)"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip - Smart Lazy Loading */}
      <div className="bg-black/50 backdrop-blur-sm p-4 overflow-x-auto">
        <div className="flex gap-2 justify-center">
          {images.map((image, index) => {
            // 🚀 Load only visible or near-current thumbnails
            const isNearCurrent = Math.abs(index - currentIndex) <= 5;
            const shouldLoad = isNearCurrent || index === currentIndex;

            return (
              <button
                key={`${image.id || index}-thumb`}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsLoading(true);
                  setImageError(false);
                }}
                className={`
                  relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden
                  transition-all duration-200
                  ${
                    index === currentIndex
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-50 hover:opacity-100'
                  }
                `}
              >
                {shouldLoad ? (
                  <img
                    src={getProxyUrl(image.url || image.originalUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  // Placeholder for thumbnails that are far away
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-xs">{index + 1}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs text-center py-1">
                  {index + 1}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
