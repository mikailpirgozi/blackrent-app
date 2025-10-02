import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  CheckCircle,
  X,
  FlashlightOff,
  Flashlight,
  RotateCcw,
  Camera,
} from 'lucide-react';

import { isWebPSupported } from '../../utils/imageLint';
import { logger } from '../../utils/logger';

interface NativeCameraProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob) => void;
  title?: string;
  maxPhotos?: number;
  currentPhotoCount?: number;
  enableVideo?: boolean;
}

interface CameraState {
  stream: MediaStream | null;
  isInitializing: boolean;
  error: string | null;
  facingMode: 'environment' | 'user';
  flashSupported: boolean;
  flashEnabled: boolean;
}

export default function NativeCamera({
  open,
  onClose,
  onCapture,
  title = 'Natívna kamera',
  maxPhotos = 50,
  currentPhotoCount = 0,
}: NativeCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>({
    stream: null,
    isInitializing: false,
    error: null,
    facingMode: 'environment', // Zadná kamera
    flashSupported: false,
    flashEnabled: false,
  });

  const [capturing, setCapturing] = useState(false);
  const [photosInSession, setPhotosInSession] = useState(0);
  const [webPSupported, setWebPSupported] = useState<boolean | null>(null);

  // Inicializácia kamery
  const initCamera = useCallback(
    async (facingMode: 'environment' | 'user' = 'environment') => {
      logger.debug('🚀 Starting camera initialization...');
      setCameraState(prev => ({ ...prev, isInitializing: true, error: null }));

      // Kontrola podpory MediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg =
          'MediaDevices API nie je podporované v tomto prehliadači.';
        console.error('❌', errorMsg);
        setCameraState(prev => ({
          ...prev,
          isInitializing: false,
          error: errorMsg,
          stream: null,
        }));
        return;
      }

      try {
        // Zastavenie existujúceho streamu
        if (streamRef.current) {
          logger.debug('🛑 Stopping existing stream...');
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Nastavenie constraints pre kameru s vyšším rozlíšením
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920, max: 3840 }, // ✅ Zvýšené rozlíšenie
            height: { ideal: 1080, max: 2160 }, // ✅ Zvýšené rozlíšenie
          },
          audio: false,
        };

        logger.debug('📱 Requesting camera with constraints:', constraints);

        // Timeout pre loading state (5 sekúnd)
        const timeoutId = setTimeout(() => {
          console.error('⏰ Camera initialization timeout');
          setCameraState(prev => ({
            ...prev,
            isInitializing: false,
            error:
              'Časový limit pre spustenie kamery vypršal. Skúste to znovu.',
            stream: null,
          }));
        }, 5000);

        try {
          // Získanie stream z kamery
          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          // Zastaviť timeout ak sa stream podarilo získať
          clearTimeout(timeoutId);

          logger.debug('✅ Stream získaný:', stream);
          logger.debug('📹 Video tracks:', stream.getVideoTracks());

          // Počkaj na video element (môže trvať chvíľu kým sa vytvorí)
          let retries = 0;
          const maxRetries = 10;

          const setupVideo = () => {
            if (videoRef.current) {
              logger.debug('✅ Video ref found, setting up stream');
              videoRef.current.srcObject = stream;

              // Počkaj na loadedmetadata event
              videoRef.current.onloadedmetadata = () => {
                logger.debug('✅ Video metadata loaded');
                if (videoRef.current) {
                  videoRef.current.play().catch(err => {
                    console.error('❌ Video play error:', err);
                  });
                }
              };
            } else {
              retries++;
              if (retries < maxRetries) {
                logger.debug(
                  `🔄 Video ref not ready, retry ${retries}/${maxRetries}`
                );
                setTimeout(setupVideo, 100);
              } else {
                logger.error(
                  '❌ Video ref never became available after retries'
                );
                setCameraState(prev => ({
                  ...prev,
                  error:
                    'Nepodarilo sa pripojiť video element. Skúste obnoviť stránku.',
                  isInitializing: false,
                }));
                return;
              }
            }
          };

          // Malé oneskorenie pre lepšiu stabilitu
          setTimeout(setupVideo, 50);

          // Kontrola flash podpory
          const videoTrack = stream.getVideoTracks()[0];
          const capabilities = videoTrack?.getCapabilities?.();
          const flashSupported =
            capabilities &&
            'torch' in capabilities &&
            (capabilities as Record<string, unknown>).torch === true;

          logger.debug('🔦 Flash supported:', flashSupported);

          setCameraState(prev => ({
            ...prev,
            stream,
            isInitializing: false,
            facingMode,
            flashSupported: flashSupported ?? false,
            error: null,
          }));

          // Uložiť stream do ref pre cleanup
          streamRef.current = stream;
        } catch (error) {
          // Zastaviť timeout pri chybe
          clearTimeout(timeoutId);

          throw error; // Re-throw pre vonkajší catch
        }
      } catch (error) {
        console.error('❌ Chyba pri inicializácii kamery:', error);
        let errorMessage = 'Nepodarilo sa spustiť kameru';

        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);

          if (error.name === 'NotAllowedError') {
            errorMessage =
              'Prístup ku kamere bol zamietnutý.\n\nPovoľte prístup ku kamere:\n1. Kliknite na ikonu 🔒 v adresnom riadku\n2. Povoľte kameru pre túto stránku\n3. Obnovte stránku';
          } else if (error.name === 'NotFoundError') {
            errorMessage =
              'Kamera nebola nájdená na tomto zariadení.\n\nSkontrolujte či:\n• Máte kameru pripojenu\n• Kamera nie je používaná inou aplikáciou';
          } else if (error.name === 'NotSupportedError') {
            errorMessage =
              'Kamera nie je podporovaná v tomto prehliadači.\n\nSkúste:\n• Chrome, Safari alebo Firefox\n• HTTPS pripojenie';
          } else if (error.name === 'OverconstrainedError') {
            errorMessage =
              'Požadované nastavenia kamery nie sú podporované.\n\nSkúste reštartovať kameru.';
          }
        }

        setCameraState(prev => ({
          ...prev,
          isInitializing: false,
          error: errorMessage,
          stream: null,
        }));
      }
    },
    []
  ); // Prázdne dependencies!

  // 🔍 Detekcia WebP podpory pri načítaní
  useEffect(() => {
    isWebPSupported().then(setWebPSupported);
  }, []);

  // Spustenie kamery pri otvorení dialógu
  useEffect(() => {
    if (open) {
      logger.debug('🎬 NativeCamera opening, initializing...');
      setPhotosInSession(0);
      initCamera();
    } else {
      logger.debug('🚪 NativeCamera closing, cleaning up...');
      // Zastavenie kamery pri zatvorení
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          logger.debug('🛑 Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
        setCameraState(prev => ({ ...prev, stream: null }));
      }
    }

    return () => {
      if (streamRef.current) {
        logger.debug('🧹 Cleanup: stopping all tracks');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [open, initCamera]); // Pridané initCamera dependency

  // Prepnutie kamery (predná/zadná)
  const switchCamera = async () => {
    const newFacingMode =
      cameraState.facingMode === 'environment' ? 'user' : 'environment';
    await initCamera(newFacingMode);
  };

  // Zapnutie/vypnutie flash
  const toggleFlash = async () => {
    if (!streamRef.current || !cameraState.flashSupported) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;
      await videoTrack.applyConstraints({
        advanced: [
          { torch: !cameraState.flashEnabled } as Record<string, unknown>,
        ],
      });

      setCameraState(prev => ({
        ...prev,
        flashEnabled: !prev.flashEnabled,
      }));
    } catch (error) {
      console.error('Chyba pri prepínaní flash:', error);
    }
  };

  // Zachytenie fotky - KĽÚČOVÁ FUNKCIA!
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || capturing) return;

    if (currentPhotoCount + photosInSession >= maxPhotos) {
      alert(`Môžete pridať maximálne ${maxPhotos} fotiek.`);
      return;
    }

    setCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context nie je dostupný');
      }

      // Nastavenie veľkosti canvas podľa videa
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Vykreslenie aktuálneho frame z videa na canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 🌟 NOVÉ: Inteligentná WebP konverzia s fallback
      const captureWithFormat = () => {
        if (webPSupported) {
          // WebP capture s plnou kvalitou
          canvas.toBlob(
            blob => {
              if (blob) {
                logger.debug(
                  '✅ WebP capture successful, size:',
                  (blob.size / 1024).toFixed(1) + 'KB'
                );
                onCapture(blob);
                setPhotosInSession(prev => prev + 1);
                setTimeout(() => setCapturing(false), 200);
              } else {
                console.warn('⚠️ WebP failed, trying JPEG fallback');
                captureJPEG();
              }
            },
            'image/webp',
            0.95 // 95% kvalita pre WebP (lepšia kompresia)
          );
        } else {
          // Priamy JPEG capture
          captureJPEG();
        }
      };

      const captureJPEG = () => {
        canvas.toBlob(
          blob => {
            if (blob) {
              logger.debug(
                '✅ JPEG capture successful, size:',
                (blob.size / 1024).toFixed(1) + 'KB'
              );
              onCapture(blob);
              setPhotosInSession(prev => prev + 1);
              setTimeout(() => setCapturing(false), 200);
            } else {
              setCapturing(false);
              console.error('❌ JPEG capture failed');
            }
          },
          'image/jpeg',
          0.95 // 95% kvalita pre JPEG
        );
      };

      // Spusti capture s detekovaným formátom
      captureWithFormat();
    } catch (error) {
      console.error('Chyba pri zachytávaní fotky:', error);
      setCapturing(false);
      alert(
        'Chyba pri zachytávaní fotky: ' +
          (error instanceof Error ? error.message : 'Neznáma chyba')
      );
    }
  }, [
    capturing,
    currentPhotoCount,
    photosInSession,
    maxPhotos,
    onCapture,
    webPSupported,
  ]);

  // Keyboard shortcuts (medzerník = fotka!)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!open) return;

      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        capturePhoto();
      } else if (event.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, capturePhoto, onClose]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="bg-black text-white p-0 max-w-none w-screen h-screen">
        <DialogHeader className="flex flex-row items-center justify-between bg-black/80 text-white py-2 px-4 relative z-10">
          <DialogTitle className="text-lg font-semibold text-white">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {webPSupported !== null && (
              <Badge
                variant="outline"
                className={`text-white border-white ${
                  webPSupported
                    ? 'bg-green-500/30 text-green-100'
                    : 'bg-white/10 text-white'
                }`}
              >
                {webPSupported ? 'WebP ✅' : 'JPEG'}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-white border-white bg-blue-500/30"
            >
              {currentPhotoCount + photosInSession}/{maxPhotos}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white bg-white/10 hover:bg-white/20 ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-0 bg-black relative flex-1">
          {cameraState.error ? (
            <div className="p-6">
              <Alert className="mb-4">
                <AlertDescription>{cameraState.error}</AlertDescription>
              </Alert>
              <Button onClick={() => initCamera()}>
                Skúsiť znovu
              </Button>
            </div>
          ) : cameraState.isInitializing ? (
            <div className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
              <p className="text-white mb-4 text-center">
                Spúšťam kameru...
              </p>
              <Progress className="w-full max-w-[300px]" />
              <p className="text-white/70 mt-4 text-center text-sm">
                Povoľte prístup ku kamere v prehliadači
              </p>
            </div>
          ) : (
            <>
              {/* Video preview - LIVE CAMERA FEED */}
              <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onCanPlay={() => logger.debug('✅ Video can play')}
                  onError={e => console.error('❌ Video error:', e)}
                  className="w-full h-full object-cover"
                />

                {/* Canvas for capture (hidden) */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera controls overlay */}
                {cameraState.stream && (
                  <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-black/60 rounded-lg p-4">
                    {/* Flash toggle */}
                    {cameraState.flashSupported && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFlash}
                        className={`${
                          cameraState.flashEnabled
                            ? 'text-yellow-400 bg-yellow-400/20'
                            : 'text-white'
                        }`}
                      >
                        {cameraState.flashEnabled ? (
                          <Flashlight className="h-6 w-6" />
                        ) : (
                          <FlashlightOff className="h-6 w-6" />
                        )}
                      </Button>
                    )}

                    {/* 📸 CAPTURE BUTTON - KĽÚČOVÉ TLAČIDLO! */}
                    <Button
                      onClick={capturePhoto}
                      disabled={capturing}
                      className={`w-[70px] h-[70px] rounded-full border-3 border-white ${
                        capturing
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-black hover:bg-white/80'
                      }`}
                    >
                      {capturing ? (
                        <CheckCircle className="h-8 w-8" />
                      ) : (
                        <Camera className="h-8 w-8" />
                      )}
                    </Button>

                    {/* Camera switch */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={switchCamera}
                      className="text-white"
                    >
                      <RotateCcw className="h-6 w-6" />
                    </Button>
                  </div>
                )}

                {/* Instructions */}
                {cameraState.stream && photosInSession === 0 && (
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-center">
                    <p className="text-sm">
                      Kliknite na 📸 alebo stlačte medzerník na odfotenie
                    </p>
                  </div>
                )}

                {/* Success indicator */}
                {photosInSession > 0 && (
                  <div className="absolute top-5 right-5 bg-green-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm">
                      {photosInSession} fotiek zachytených
                    </p>
                  </div>
                )}

                {/* 💾 FLOATING SAVE BUTTON - Hlavné tlačidlo na uloženie */}
                {photosInSession > 0 && (
                  <div className="absolute top-20 right-5 z-[1000]">
                    <Button
                      onClick={onClose}
                      size="lg"
                      className="bg-green-500 text-white font-bold text-base px-6 py-3 rounded-xl shadow-lg shadow-green-500/40 hover:bg-green-600 hover:shadow-green-500/60 active:scale-95 transition-all duration-200 min-w-[160px]"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Uložiť fotky ({photosInSession})
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {photosInSession > 0 && (
          <div className="bg-black/80 text-white flex justify-center py-2">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white/70 text-sm"
            >
              ✓ Dokončiť ({photosInSession} fotiek)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
