import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Zoom,
  Fade
} from '@mui/material';
import {
  CameraAlt,
  PhotoCamera,
  Videocam,
  Close,
  Delete,
  Visibility,
  CloudUpload,
  PhotoLibrary,
  Camera,
  FlashOn,
  FlashOff,
  FlipCameraIos,
  CheckCircle
} from '@mui/icons-material';
import R2FileUpload from './R2FileUpload';

interface MobileFileUploadProps {
  type: 'vehicle' | 'protocol' | 'document';
  entityId: string;
  onUploadSuccess?: (fileData: { url: string; key: string; filename: string }) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
}

interface CapturedFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  timestamp: Date;
}

const MobileFileUpload: React.FC<MobileFileUploadProps> = ({
  type,
  entityId,
  onUploadSuccess,
  onUploadError,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize = 10,
  multiple = false,
  label = 'Mobilný upload',
  disabled = false
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedFiles, setCapturedFiles] = useState<CapturedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Kontrola či je mobilné zariadenie
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  /**
   * Spustenie kamery
   */
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('❌ Error starting camera:', error);
      setError('Nepodarilo sa spustiť kameru');
    }
  }, [facingMode]);

  /**
   * Zastavenie kamery
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  /**
   * Fotografovanie
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Nastavenie rozmerov canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Kreslenie videa na canvas
    ctx.drawImage(video, 0, 0);

    // Konverzia na blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const preview = URL.createObjectURL(blob);
        
        const capturedFile: CapturedFile = {
          id: Date.now().toString(),
          file,
          preview,
          type: 'image',
          timestamp: new Date()
        };

        setCapturedFiles(prev => multiple ? [...prev, capturedFile] : [capturedFile]);
      }
    }, 'image/jpeg', 0.8);
  }, [multiple]);

  /**
   * Nahrávanie videa
   */
  const startVideoRecording = useCallback(() => {
    if (!videoRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current!);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
      const preview = URL.createObjectURL(blob);
      
      const capturedFile: CapturedFile = {
        id: Date.now().toString(),
        file,
        preview,
        type: 'video',
        timestamp: new Date()
      };

      setCapturedFiles(prev => multiple ? [...prev, capturedFile] : [capturedFile]);
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // 5 sekúnd nahrávanie
  }, [multiple]);

  /**
   * Upload zachytených súborov
   */
  const uploadCapturedFiles = async () => {
    if (capturedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = capturedFiles.map(async (capturedFile) => {
        const formData = new FormData();
        formData.append('file', capturedFile.file);
        formData.append('type', type);
        formData.append('entityId', entityId);

        const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
        
        const response = await fetch('https://blackrent-app-production-4d6f.up.railway.app/api/files/upload', {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Upload zlyhal');
        }

        return data;
      });

      const results = await Promise.all(uploadPromises);
      
      // Callback pre rodiča
      results.forEach(fileData => {
        onUploadSuccess?.(fileData);
      });

      // Vyčistenie zachytených súborov
      setCapturedFiles([]);
      setShowCamera(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload zlyhal';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Zmazanie zachyteného súboru
   */
  const removeCapturedFile = (id: string) => {
    setCapturedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  /**
   * Zmena kamery (predná/zadná)
   */
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  /**
   * Spustenie kamery
   */
  const handleOpenCamera = () => {
    setShowCamera(true);
    setTimeout(startCamera, 100);
  };

  /**
   * Zatvorenie kamery
   */
  const handleCloseCamera = () => {
    stopCamera();
    setShowCamera(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hlavné tlačidlá */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          {hasCamera && isMobile && (
            <Grid item xs={6}>
              <Button
                variant="outlined"
                startIcon={<Camera />}
                onClick={handleOpenCamera}
                disabled={disabled}
                fullWidth
                sx={{ 
                  py: 2,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                Kamera
              </Button>
            </Grid>
          )}
          <Grid item xs={hasCamera && isMobile ? 6 : 12}>
            <Button
              variant="outlined"
              startIcon={<PhotoLibrary />}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              fullWidth
              sx={{ 
                py: 2,
                borderStyle: 'dashed',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Galéria
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Skrytý file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        capture="environment"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            Array.from(files).forEach(file => {
              const capturedFile: CapturedFile = {
                id: Date.now().toString() + Math.random(),
                file,
                preview: URL.createObjectURL(file),
                type: file.type.startsWith('image/') ? 'image' : 'video',
                timestamp: new Date()
              };
              setCapturedFiles(prev => multiple ? [...prev, capturedFile] : [capturedFile]);
            });
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Zachytené súbory */}
      {capturedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'white' }}>
            Zachytené súbory ({capturedFiles.length}):
          </Typography>
          <Grid container spacing={1}>
            {capturedFiles.map((capturedFile) => (
              <Grid item xs={6} sm={4} key={capturedFile.id}>
                <Card sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <CardContent sx={{ p: 1 }}>
                    {capturedFile.type === 'image' ? (
                      <img
                        src={capturedFile.preview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 4
                        }}
                      />
                    ) : (
                      <video
                        src={capturedFile.preview}
                        style={{
                          width: '100%',
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 4
                        }}
                        controls
                      />
                    )}
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={capturedFile.type === 'image' ? '📷' : '🎥'}
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeCapturedFile(capturedFile.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={uploadCapturedFiles}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
              fullWidth
            >
              {uploading ? 'Nahrávam...' : 'Nahrať súbory'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Kamera dialog */}
      <Dialog
        open={showCamera}
        onClose={handleCloseCamera}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'black'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'black', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Kamera</Typography>
          <IconButton onClick={handleCloseCamera} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ 
          backgroundColor: 'black',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0
        }}>
          {/* Video element */}
          <video
            ref={videoRef}
            style={{
              width: '100%',
              maxWidth: '100vw',
              height: 'auto',
              maxHeight: '70vh'
            }}
            autoPlay
            playsInline
            muted
          />
          
          {/* Canvas pre zachytenie */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </DialogContent>
        
        <DialogActions sx={{ 
          backgroundColor: 'black',
          justifyContent: 'center',
          gap: 2,
          pb: 3
        }}>
          {/* Kamera ovládanie */}
          <Fab
            color="primary"
            onClick={capturePhoto}
            sx={{ 
              backgroundColor: 'white',
              color: 'black',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
            }}
          >
            <PhotoCamera />
          </Fab>
          
          <Fab
            color="secondary"
            onClick={toggleCamera}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <FlipCameraIos />
          </Fab>
          
          <Fab
            color="secondary"
            onClick={() => setFlashEnabled(!flashEnabled)}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            {flashEnabled ? <FlashOn /> : <FlashOff />}
          </Fab>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MobileFileUpload; 