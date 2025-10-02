import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
} from 'lucide-react';

import type { ProtocolImage, ProtocolVideo } from '../../types';

interface ImageGalleryModalProps {
  open: boolean;
  onClose: () => void;
  images: ProtocolImage[];
  videos: ProtocolVideo[];
  title?: string;
}

export default function ImageGalleryModal({
  open,
  onClose,
  images,
  videos,
  title = 'Galéria médií',
}: ImageGalleryModalProps) {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const allMedia = [...images, ...videos];
  const currentMedia = allMedia[currentIndex];

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Touch gestures pre mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0]?.clientX ?? null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
          break;
        case 'ArrowRight':
          if (currentIndex < allMedia.length - 1)
            setCurrentIndex(currentIndex + 1);
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
          setIsFullscreen(!isFullscreen);
          break;
        case '+':
        case '=':
          setZoom(Math.min(zoom + 0.2, 3));
          break;
        case '-':
          setZoom(Math.max(zoom - 0.2, 0.5));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, allMedia.length, onClose, isFullscreen, zoom]);

  // Reset zoom when changing media
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    if (!currentMedia) return;

    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentMedia.type}_${new Date(currentMedia.timestamp).toISOString().split('T')[0]}.${currentMedia.url.includes('video') ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba pri sťahovaní:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetZoom = () => {
    setZoom(1);
  };

  if (!currentMedia) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className={`bg-black/95 text-white p-0 max-w-none w-full ${
        isFullscreen ? 'h-screen' : 'min-h-[80vh]'
      }`}>
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-white/10 p-4">
          <DialogTitle className="text-lg font-semibold text-white">
            {title} ({currentIndex + 1} / {allMedia.length})
          </DialogTitle>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-white/10 text-white"
            >
              {currentMedia.type}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div
          className={`flex flex-col items-center justify-center relative overflow-hidden ${
            isFullscreen ? 'h-[calc(100vh-120px)]' : 'min-h-[60vh]'
          }`}
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation arrows */}
          <div className="hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === allMedia.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Media content */}
          <div
            className="flex flex-col items-center justify-center w-full h-full transition-transform duration-200 ease-in-out"
            style={{ transform: `scale(${zoom})` }}
          >
            {currentMedia.url.includes('video') ? (
              <video
                ref={videoRef}
                src={currentMedia.url}
                controls
                autoPlay
                loop
                muted
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                ref={imageRef}
                src={currentMedia.url}
                alt={`${currentMedia.type} - ${currentMedia.description}`}
                className="max-w-full max-h-full object-contain select-none"
              />
            )}
          </div>

          {/* Media info */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-4">
            <p className="text-white text-sm mb-2">
              {currentMedia.description ||
                `${currentMedia.type} - ${new Date(currentMedia.timestamp).toLocaleString('sk-SK')}`}
            </p>

            <div className="flex gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white"
              >
                {currentMedia.type}
              </Badge>
              {currentMedia.compressed && (
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-white"
                >
                  Komprimované
                </Badge>
              )}
              {currentMedia.originalSize && currentMedia.compressedSize && (
                <Badge
                  variant="secondary"
                  className="bg-green-500/20 text-white"
                >
                  {Math.round(((currentMedia.originalSize - currentMedia.compressedSize) / currentMedia.originalSize) * 100)}% úspora
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 p-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
            className="text-white border-white/30 hover:bg-white/10"
          >
            <ZoomOut className="h-4 w-4 mr-2" />
            Zmenšiť
          </Button>

          <Button
            variant="outline"
            onClick={resetZoom}
            className="text-white border-white/30 hover:bg-white/10"
          >
            {Math.round(zoom * 100)}%
          </Button>

          <Button
            variant="outline"
            onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
            className="text-white border-white/30 hover:bg-white/10"
          >
            <ZoomIn className="h-4 w-4 mr-2" />
            Zväčšiť
          </Button>

          <Button
            variant="secondary"
            onClick={handleDownload}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Stiahnuť
          </Button>
        </div>

        {/* Thumbnail navigation */}
        {allMedia.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto border-t border-white/10">
            {allMedia.map((media, index) => (
              <div
                key={media.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-15 h-15 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-opacity hover:opacity-100 ${
                  index === currentIndex
                    ? 'border-2 border-white opacity-100'
                    : 'border-2 border-transparent opacity-70'
                }`}
              >
                {media.url.includes('video') ? (
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
