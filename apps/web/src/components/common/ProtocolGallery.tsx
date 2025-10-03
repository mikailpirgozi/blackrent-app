import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Play,
  ZoomIn,
  Car,
  FileText,
  AlertTriangle,
  Gauge,
  Fuel,
} from 'lucide-react';

import type { ProtocolImage, ProtocolVideo } from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import logger from '../../utils/logger';

interface ProtocolGalleryProps {
  open: boolean;
  onClose: () => void;
  images: ProtocolImage[];
  videos: ProtocolVideo[];
  title?: string;
}

// Konfigurácia kategórií s ikonami a farbami
const getCategoryConfig = (category: string) => {
  const configs: Record<string, { icon: typeof Car; label: string; color: string }> = {
    vehicle: { icon: Car, label: 'Vozidlo', color: 'bg-blue-500' },
    document: { icon: FileText, label: 'Doklady', color: 'bg-green-500' },
    damage: { icon: AlertTriangle, label: 'Poškodenie', color: 'bg-red-500' },
    odometer: { icon: Gauge, label: 'Tachometer', color: 'bg-purple-500' },
    fuel: { icon: Fuel, label: 'Palivo', color: 'bg-orange-500' },
  };
  return configs[category] || { icon: ImageIcon, label: category, color: 'bg-gray-500' };
};

export default function ProtocolGallery({
  open,
  onClose,
  images,
  videos,
  title = 'Galéria protokolu',
}: ProtocolGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Debug len pri mount/unmount v development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && open) {
      logger.debug('🔍 ProtocolGallery opened:', {
        imagesCount: images?.length || 0,
        videosCount: videos?.length || 0,
      });
    }
  }, [open]); // Spustí sa len pri zmene open stavu

  const allMedia = [...(images || []), ...(videos || [])];
  const totalCount = allMedia.length;
  const currentMedia = allMedia[selectedIndex];

  // Reset zoom when changing media
  useEffect(() => {
    setZoom(1);
  }, [selectedIndex]);

  const handlePrevious = useCallback(() => {
    setSelectedIndex(prev => (prev === 0 ? totalCount - 1 : prev - 1));
  }, [totalCount]);

  const handleNext = useCallback(() => {
    setSelectedIndex(prev => (prev === totalCount - 1 ? 0 : prev + 1));
  }, [totalCount]);

  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (!open) return;

      // Ignore Meta/Cmd and Shift keys alone (system shortcuts)
      if (event.key === 'Meta' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.25, 3));
          break;
        case '-':
          setZoom(prev => Math.max(prev - 0.25, 0.5));
          break;
      }
    },
    [open, onClose, handlePrevious, handleNext, setZoom]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Helper function to convert R2 URL to proxy URL
  const getProxyUrl = (r2Url: string | undefined): string => {
    try {
      if (!r2Url) return '';

      // Ak je to R2 URL, konvertuj na proxy
      if (r2Url.includes('r2.dev') || r2Url.includes('cloudflare.com')) {
        const urlParts = r2Url.split('/');
        const key = urlParts.slice(3).join('/');
        const apiBaseUrl = getApiBaseUrl();
        return `${apiBaseUrl}/files/proxy/${encodeURIComponent(key)}`;
      }
      return r2Url;
    } catch (_error) {
      return r2Url || '';
    }
  };

  const handleDownload = async () => {
    if (!currentMedia || !currentMedia.url) {
      console.warn('⚠️ handleDownload: currentMedia or URL is missing');
      window.alert('Nepodarilo sa stiahnuť súbor - chýba URL');
      return;
    }

    try {
      // Použi proxy URL pre download - originalUrl len pre obrázky
      const downloadUrl = getProxyUrl(
        'originalUrl' in currentMedia && currentMedia.originalUrl
          ? currentMedia.originalUrl
          : currentMedia.url
      );
      if (!downloadUrl) {
        window.alert('Nepodarilo sa stiahnuť súbor - neplatné URL');
        return;
      }

      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `protocol-media-${selectedIndex + 1}.${currentMedia.url.includes('video') ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba pri sťahovaní:', error);
      window.alert('Nepodarilo sa stiahnuť súbor');
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
    setIsFullscreen(true);
  };

  if (!open) return null;

  return (
    <>
      {/* Grid Gallery Modal */}
      <Dialog
        open={open && !isFullscreen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose();
          }
        }}
      >
        <DialogContent className="bg-black/90 text-white min-h-[80vh] max-w-6xl w-full p-0">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-white/20 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <ImageIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-white mb-1">
                  {title}
                </DialogTitle>
                <p className="text-sm text-white/60">
                  {totalCount} {totalCount === 1 ? 'položka' : totalCount < 5 ? 'položky' : 'položiek'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Galéria protokolu s {totalCount} médiami. Kliknite na obrázok alebo video pre zobrazenie vo fullscreen móde.
          </DialogDescription>

          <div className="p-6">
            {totalCount === 0 ? (
              <div className="flex justify-center items-center h-48">
                <p className="text-white/70 text-lg">
                  Žiadne médiá na zobrazenie
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Images */}
                {images.map((image, index) => {
                  return (
                    <div
                      key={image.id || index}
                      className="relative rounded-lg overflow-hidden cursor-pointer border-2 border-transparent transition-all duration-200 hover:border-blue-500 hover:scale-105"
                      onClick={() => handleImageClick(index)}
                    >
                      {image.url ? (
                        <img
                          src={image.originalUrl || image.url}
                          alt={image.description || `Obrázok ${index + 1}`}
                          className="w-full h-48 object-cover block"
                          onError={e => {
                            // Skús proxy URL ako fallback
                            const img = e.target as globalThis.HTMLImageElement;
                            if (!img.src.includes('/api/files/proxy/')) {
                              img.src = getProxyUrl(
                                image.originalUrl || image.url
                              );
                            } else {
                              // Ak ani proxy URL nefunguje, skry obrázok
                              img.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-white/10 flex items-center justify-center border-2 border-dashed border-white/30">
                          <p className="text-white/50 text-sm">
                            Chýba URL
                          </p>
                        </div>
                      )}

                      {/* Overlay s informáciami */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3">
                        <p className="text-white text-sm font-medium mb-1">
                          {image.description || `Obrázok ${index + 1}`}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`${getCategoryConfig(image.type).color} text-white text-xs px-2 py-1 flex items-center gap-1 w-fit`}
                        >
                          {(() => {
                            const CategoryIcon = getCategoryConfig(image.type).icon;
                            return <CategoryIcon className="h-3 w-3" />;
                          })()}
                          {getCategoryConfig(image.type).label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}

                {/* Videos */}
                {videos.map((video, index) => (
                  <div
                    key={video.id || `video-${index}`}
                    className="relative rounded-lg overflow-hidden cursor-pointer border-2 border-transparent transition-all duration-200 hover:border-blue-500 hover:scale-105"
                    onClick={() => handleImageClick(images.length + index)}
                  >
                    {video.url ? (
                      <video
                        src={video.url}
                        className="w-full h-48 object-cover block"
                        onError={e => {
                          (e.target as globalThis.HTMLVideoElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-white/10 flex items-center justify-center border-2 border-dashed border-white/30">
                        <p className="text-white/50 text-sm">
                          Chýba URL
                        </p>
                      </div>
                    )}

                    {/* Play ikona */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 rounded-full w-12 h-12 flex items-center justify-center">
                      <Play className="text-white h-6 w-6" />
                    </div>

                    {/* Overlay s informáciami */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3">
                      <p className="text-white text-sm font-medium mb-1">
                        {video.description || `Video ${index + 1}`}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`${getCategoryConfig(video.type).color} text-white text-xs px-2 py-1 flex items-center gap-1 w-fit`}
                      >
                        {(() => {
                          const CategoryIcon = getCategoryConfig(video.type).icon;
                          return <CategoryIcon className="h-3 w-3" />;
                        })()}
                        {getCategoryConfig(video.type).label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Lightbox Modal */}
      <Dialog
        open={isFullscreen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsFullscreen(false);
          }
        }}
      >
        <DialogContent className="bg-black/95 text-white p-0 max-w-none w-screen h-screen">
          <DialogTitle className="sr-only">
            Fullscreen zobrazenie média {selectedIndex + 1} z {totalCount}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fullscreen zobrazenie média {selectedIndex + 1} z {totalCount}. Použite šípky pre navigáciu, Escape pre zatvorenie.
          </DialogDescription>
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/20">
            <h2 className="text-lg font-semibold">
              {currentMedia?.description || `Médium ${selectedIndex + 1}`}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="text-white hover:bg-white/10"
                disabled={zoom <= 0.5}
              >
                <ZoomIn className="h-5 w-5 scale-x-[-1]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                className="text-white hover:bg-white/10"
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/10"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Media Display */}
          <div className="flex justify-center items-center h-[calc(100vh-120px)] p-4 relative">
            {/* Navigation Buttons */}
            {totalCount > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Media Content */}
            <div className="flex justify-center items-center w-full h-full">
              {currentMedia && (
                <>
                  {selectedIndex < images.length ? (
                    // Image
                    currentMedia.url ? (
                      <img
                        src={
                          'originalUrl' in currentMedia &&
                          currentMedia.originalUrl
                            ? currentMedia.originalUrl
                            : currentMedia.url
                        }
                        alt={currentMedia.description || 'Obrázok'}
                        className="transition-transform duration-200"
                        style={{
                          maxWidth: `${100 * zoom}%`,
                          maxHeight: `${100 * zoom}%`,
                          objectFit: 'contain',
                        }}
                        onError={e => {
                          // Skús načítať priamo z R2 ako fallback
                          const img = e.target as globalThis.HTMLImageElement;
                          if (!img.src.includes('r2.dev')) {
                            img.src =
                              'originalUrl' in currentMedia &&
                              currentMedia.originalUrl
                                ? currentMedia.originalUrl
                                : currentMedia.url;
                          } else {
                            // Ak ani R2 URL nefunguje, skry obrázok
                            img.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center text-white/50">
                        <h3 className="text-lg">Chýba URL obrázka</h3>
                      </div>
                    )
                  ) : // Video
                  currentMedia.url ? (
                    <video
                      src={currentMedia.url}
                      controls
                      className="transition-transform duration-200"
                      style={{
                        maxWidth: `${100 * zoom}%`,
                        maxHeight: `${100 * zoom}%`,
                      }}
                      onError={e => {
                        (e.target as globalThis.HTMLVideoElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center text-white/50">
                      <h3 className="text-lg">Chýba URL videa</h3>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer with counter */}
          {totalCount > 1 && (
            <div className="p-4 text-center border-t border-white/20">
              <p className="text-white/70 text-sm">
                {selectedIndex + 1} z {totalCount}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
