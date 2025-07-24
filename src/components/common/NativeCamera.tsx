import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  PhotoCamera,
  Close,
  FlipCameraIos,
  FlashOn,
  FlashOff,
  CheckCircle,
} from '@mui/icons-material';

interface NativeCameraProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob) => void;
  title?: string;
  maxPhotos?: number;
  currentPhotoCount?: number;
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
  title = "Natívna kamera",
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

  // Inicializácia kamery
  const initCamera = useCallback(async (facingMode: 'environment' | 'user' = 'environment') => {
    console.log('🚀 Starting camera initialization...');
    setCameraState(prev => ({ ...prev, isInitializing: true, error: null }));

    // Kontrola podpory MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'MediaDevices API nie je podporované v tomto prehliadači.';
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
        console.log('🛑 Stopping existing stream...');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Nastavenie constraints pre kameru
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      };

      console.log('📱 Requesting camera with constraints:', constraints);

      // Timeout pre loading state (5 sekúnd)
      const timeoutId = setTimeout(() => {
        console.error('⏰ Camera initialization timeout');
        setCameraState(prev => ({
          ...prev,
          isInitializing: false,
          error: 'Časový limit pre spustenie kamery vypršal. Skúste to znovu.',
          stream: null,
        }));
      }, 5000);

      try {
        // Získanie stream z kamery
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Zastaviť timeout ak sa stream podarilo získať
        clearTimeout(timeoutId);

        console.log('✅ Stream získaný:', stream);
        console.log('📹 Video tracks:', stream.getVideoTracks());
        
        // Počkaj na video element (môže trvať chvíľu kým sa vytvorí)
        let retries = 0;
        const maxRetries = 10;
        
        const setupVideo = () => {
          if (videoRef.current) {
            console.log('✅ Video ref found, setting up stream');
            videoRef.current.srcObject = stream;
            
            // Počkaj na loadedmetadata event
            videoRef.current.onloadedmetadata = () => {
              console.log('✅ Video metadata loaded');
              if (videoRef.current) {
                videoRef.current.play().catch(err => {
                  console.error('❌ Video play error:', err);
                });
              }
            };
          } else {
            console.warn(`⚠️ Video ref is null, retry ${retries + 1}/${maxRetries}`);
            retries++;
            if (retries < maxRetries) {
              setTimeout(setupVideo, 100);
            } else {
              console.error('❌ Video ref never became available');
              setCameraState(prev => ({
                ...prev,
                error: 'Nepodarilo sa pripojiť video element. Skúste obnoviť stránku.',
                isInitializing: false,
              }));
              return;
            }
          }
        };
        
        setupVideo();

        // Kontrola flash podpory
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.();
        const flashSupported = capabilities && (capabilities as any).torch === true;

        console.log('🔦 Flash supported:', flashSupported);

        setCameraState(prev => ({
          ...prev,
          stream,
          isInitializing: false,
          facingMode,
          flashSupported,
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
          errorMessage = 'Prístup ku kamere bol zamietnutý.\n\nPovoľte prístup ku kamere:\n1. Kliknite na ikonu 🔒 v adresnom riadku\n2. Povoľte kameru pre túto stránku\n3. Obnovte stránku';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Kamera nebola nájdená na tomto zariadení.\n\nSkontrolujte či:\n• Máte kameru pripojenu\n• Kamera nie je používaná inou aplikáciou';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Kamera nie je podporovaná v tomto prehliadači.\n\nSkúste:\n• Chrome, Safari alebo Firefox\n• HTTPS pripojenie';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Požadované nastavenia kamery nie sú podporované.\n\nSkúste reštartovať kameru.';
        }
      }

      setCameraState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage,
        stream: null,
      }));
    }
  }, []); // Prázdne dependencies!

  // Spustenie kamery pri otvorení dialógu
  useEffect(() => {
    if (open) {
      console.log('🎬 NativeCamera opening, initializing...');
      setPhotosInSession(0);
      initCamera();
    } else {
      console.log('🚪 NativeCamera closing, cleaning up...');
      // Zastavenie kamery pri zatvorení
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('🛑 Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
        setCameraState(prev => ({ ...prev, stream: null }));
      }
    }

    return () => {
      if (streamRef.current) {
        console.log('🧹 Cleanup: stopping all tracks');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [open]); // Len open dependency!

  // Prepnutie kamery (predná/zadná)
  const switchCamera = async () => {
    const newFacingMode = cameraState.facingMode === 'environment' ? 'user' : 'environment';
    await initCamera(newFacingMode);
  };

  // Zapnutie/vypnutie flash
  const toggleFlash = async () => {
    if (!streamRef.current || !cameraState.flashSupported) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: !cameraState.flashEnabled } as any],
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

      // Konverzia na Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCapture(blob); // Okamžité pridanie fotky!
            setPhotosInSession(prev => prev + 1);
            
            // Krátka vizuálna spätná väzba
            setTimeout(() => setCapturing(false), 200);
          } else {
            setCapturing(false);
            console.error('Nepodarilo sa vytvoriť blob z canvas');
          }
        },
        'image/jpeg',
        0.9
      );

    } catch (error) {
      console.error('Chyba pri zachytávaní fotky:', error);
      setCapturing(false);
      alert('Chyba pri zachytávaní fotky: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  }, [capturing, currentPhotoCount, photosInSession, maxPhotos, onCapture]);

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
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen // Pre mobilné zariadenia
      PaperProps={{
        sx: {
          bgcolor: 'black',
          color: 'white',
          height: '100vh',
          margin: 0,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: 'rgba(0,0,0,0.8)',
        color: 'white',
        py: 1,
        position: 'relative',
        zIndex: 10,
      }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={`${currentPhotoCount + photosInSession}/${maxPhotos}`} 
            size="small" 
            color="primary"
            sx={{ color: 'white', borderColor: 'white' }}
            variant="outlined"
          />
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
              ml: 1,
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: 'black', position: 'relative', flex: 1 }}>
        {cameraState.error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {cameraState.error}
            </Alert>
            <Button variant="contained" onClick={() => initCamera()}>
              Skúsiť znovu
            </Button>
          </Box>
        ) : cameraState.isInitializing ? (
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            minHeight: '300px'
          }}>
            <Typography variant="body1" sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
              Spúšťam kameru...
            </Typography>
            <LinearProgress sx={{ width: '100%', maxWidth: '300px' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, textAlign: 'center' }}>
              Povoľte prístup ku kamere v prehliadači
            </Typography>
          </Box>
        ) : (
          <>
            {/* Video preview - LIVE CAMERA FEED */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onCanPlay={() => console.log('✅ Video can play')}
                onError={(e) => console.error('❌ Video error:', e)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Canvas for capture (hidden) */}
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />

              {/* Camera controls overlay */}
              {cameraState.stream && (
                <Box sx={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  borderRadius: 6,
                  p: 2,
                }}>
                  {/* Flash toggle */}
                  {cameraState.flashSupported && (
                    <IconButton
                      onClick={toggleFlash}
                      sx={{ 
                        color: cameraState.flashEnabled ? 'yellow' : 'white',
                        bgcolor: cameraState.flashEnabled ? 'rgba(255,255,0,0.2)' : 'transparent',
                      }}
                    >
                      {cameraState.flashEnabled ? <FlashOn /> : <FlashOff />}
                    </IconButton>
                  )}

                  {/* 📸 CAPTURE BUTTON - KĽÚČOVÉ TLAČIDLO! */}
                  <IconButton
                    onClick={capturePhoto}
                    disabled={capturing}
                    sx={{
                      bgcolor: capturing ? 'green' : 'white',
                      color: capturing ? 'white' : 'black',
                      width: 70,
                      height: 70,
                      '&:hover': {
                        bgcolor: capturing ? 'green' : 'rgba(255,255,255,0.8)',
                      },
                      border: '3px solid white',
                    }}
                  >
                    {capturing ? <CheckCircle /> : <PhotoCamera sx={{ fontSize: 30 }} />}
                  </IconButton>

                  {/* Camera switch */}
                  <IconButton
                    onClick={switchCamera}
                    sx={{ color: 'white' }}
                  >
                    <FlipCameraIos />
                  </IconButton>
                </Box>
              )}

              {/* Instructions */}
              {cameraState.stream && photosInSession === 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textAlign: 'center',
                }}>
                  <Typography variant="body2">
                    Kliknite na 📸 alebo stlačte medzerník na odfotenie
                  </Typography>
                </Box>
              )}

              {/* Success indicator */}
              {photosInSession > 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  bgcolor: 'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}>
                  <CheckCircle sx={{ fontSize: 20 }} />
                  <Typography variant="body2">
                    {photosInSession} fotiek zachytených
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        bgcolor: 'rgba(0,0,0,0.8)', 
        color: 'white',
        justifyContent: 'center',
        py: 1,
        display: photosInSession > 0 ? 'flex' : 'none', // Skryť ak nie sú žiadne fotky
      }}>
        <Button onClick={onClose} sx={{ color: 'white' }}>
          Hotovo ({photosInSession} fotiek)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
