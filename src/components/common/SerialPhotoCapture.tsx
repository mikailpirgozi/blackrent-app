import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  LinearProgress,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  PhotoCamera,
  Delete,
  Save,
  Close,
  Preview,
  VideoCall,
  Compress,
} from '@mui/icons-material';
import { compressImage, compressMultipleImages, CompressionResult } from '../../utils/imageCompression';
import { compressVideo, generateVideoThumbnail, VideoCompressionResult } from '../../utils/videoCompression';
import { ProtocolImage, ProtocolVideo } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import Alert from '@mui/material/Alert';
import NativeCamera from './NativeCamera';

interface SerialPhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onSave: (images: ProtocolImage[], videos: ProtocolVideo[]) => void;
  title: string;
  allowedTypes: ('vehicle' | 'damage' | 'document' | 'fuel' | 'odometer')[];
  maxImages?: number;
  maxVideos?: number;
  compressImages?: boolean;
  compressVideos?: boolean;
  entityId?: string;
  autoUploadToR2?: boolean;
  // ✅ NOVÉ PROPS pre nový systém
  protocolType?: 'handover' | 'return';
  mediaType?: 'vehicle' | 'document' | 'damage' | 'fuel' | 'odometer';
  category?: 'vehicle_photos' | 'documents' | 'damages' | 'signatures' | 'pdf' | 'videos' | 'other';
}

interface CapturedMedia {
  id: string;
  file: File;
  type: 'image' | 'video';
  mediaType: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer';
  description: string;
  preview: string;
  timestamp: Date;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export default function SerialPhotoCapture({
  open,
  onClose,
  onSave,
  title,
  allowedTypes,
  maxImages = 50,
  maxVideos = 5,
  compressImages = true,
  compressVideos = true,
  entityId,
  autoUploadToR2 = true,
  protocolType = 'handover',
  mediaType = 'vehicle',
  category,
}: SerialPhotoCaptureProps) {
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const [uploadingToR2, setUploadingToR2] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rapidMode, setRapidMode] = useState(false);
  const [nativeCameraOpen, setNativeCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Funkcia pre upload na R2
  const uploadToR2 = async (file: File, type: 'image' | 'video'): Promise<string> => {
    // Fallback na base64 ak R2 nie je povolené
    if (!autoUploadToR2) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // Kontrola entityId
    if (!entityId) {
      throw new Error('EntityId is required for R2 upload');
    }

    // ✅ NOVÝ SYSTÉM: Signed URL upload
    try {
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://blackrent-app-production-4d6f.up.railway.app/api'
        : 'http://localhost:3001/api';
      
      // 🚀 NOVÝ SYSTÉM: Signed URL upload
      console.log('🔄 Getting presigned URL for:', {
        protocolId: entityId,
        filename: file.name,
        size: file.size,
        contentType: file.type
      });

      // 1. Získanie presigned URL
      const presignedResponse = await fetch(`${apiBaseUrl}/files/presigned-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('blackrent_token') && { 
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}` 
          })
        },
        body: JSON.stringify({
          protocolId: entityId,
          protocolType: protocolType,
          mediaType: mediaType,
          filename: file.name,
          contentType: file.type,
          category: category
        })
      });

      if (!presignedResponse.ok) {
        throw new Error(`Failed to get presigned URL: ${presignedResponse.status}`);
      }

      const presignedData = await presignedResponse.json();
      console.log('✅ Presigned URL received:', presignedData);

      // 2. Upload priamo do R2 cez presigned URL
      const uploadResponse = await fetch(presignedData.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to R2: ${uploadResponse.status}`);
      }

      console.log('✅ File uploaded directly to R2');

      // 3. Uloženie metadát do databázy
      const metadataResponse = await fetch(`${apiBaseUrl}/protocols/${entityId}/save-uploaded-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('blackrent_token') && { 
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}` 
          })
        },
        body: JSON.stringify({
          fileUrl: presignedData.publicUrl,
          label: file.name,
          type: mediaType,
          protocolType: protocolType,
          filename: file.name,
          size: file.size
        })
      });

      if (metadataResponse.ok) {
        console.log('✅ Photo metadata saved to database');
      } else {
        console.warn('⚠️ Photo uploaded to R2 but failed to save metadata');
      }

      return presignedData.publicUrl;

    } catch (error) {
      console.error('❌ Signed URL upload failed:', error);
      
      // Fallback na direct upload ak signed URL zlyhá
      console.log('🔄 Falling back to direct upload...');
      return await directUpload(file);
    }
  };

  // ✅ NOVÁ FUNKCIA: Cloudflare Worker upload
  const workerUpload = async (file: File): Promise<string> => {
    const workerUrl = process.env.REACT_APP_WORKER_URL || 'https://blackrent-upload-worker.r2workerblackrentapp.workers.dev';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('protocolId', entityId!);
    formData.append('protocolType', protocolType);
    formData.append('mediaType', mediaType);
    formData.append('label', file.name);

    const response = await fetch(workerUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Worker upload failed: ${result.error}`);
    }

    console.log('✅ File uploaded via Cloudflare Worker');
    return result.url;
  };

  // ✅ NOVÁ FUNKCIA: Direct upload (fallback)
  const directUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('protocolId', entityId!);
    formData.append('protocolType', protocolType);
    formData.append('mediaType', mediaType);
    formData.append('label', file.name);

    const apiBaseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://blackrent-app-production-4d6f.up.railway.app/api'
      : 'http://localhost:3001/api';
    
    const response = await fetch(`${apiBaseUrl}/files/protocol-photo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.url;
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // V rapid mode resetuj input hneď pre okamžité ďalšie fotenie
    if (rapidMode && event.target) {
      setTimeout(() => {
        event.target.value = '';
      }, 100); // Krátky delay pre správne fungovanie
    }

    // Kontrola limitov
    const currentImages = capturedMedia.filter(m => m.type === 'image').length;
    const currentVideos = capturedMedia.filter(m => m.type === 'video').length;
    
    const newImages = files.filter(f => !f.type.startsWith('video/')).length;
    const newVideos = files.filter(f => f.type.startsWith('video/')).length;
    
    if (currentImages + newImages > maxImages) {
      alert(`Môžete nahrať maximálne ${maxImages} obrázkov. Aktuálne máte ${currentImages} a pokúšate sa pridať ${newImages}.`);
      return;
    }
    
    if (currentVideos + newVideos > maxVideos) {
      alert(`Môžete nahrať maximálne ${maxVideos} videí. Aktuálne máte ${currentVideos} a pokúšate sa pridať ${newVideos}.`);
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const newMedia: CapturedMedia[] = [];
      let processedCount = 0;

      for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const mediaType = allowedTypes[0]; // Default type

        // Automatická kompresia ak je povolená
        let processedFile = file;
        let compressed = false;
        let originalSize = file.size;
        let compressedSize = file.size;

        if (isVideo && compressVideos) {
          setProgress((processedCount / files.length) * 50);
          const compressionResult = await compressVideo(file);
          processedFile = compressionResult.compressedFile;
          compressed = true;
          compressedSize = compressionResult.compressedFile.size;
        } else if (!isVideo && compressImages) {
          setProgress((processedCount / files.length) * 50);
          const compressionResult = await compressImage(file);
          processedFile = new File([compressionResult.compressedBlob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          compressed = true;
          compressedSize = compressionResult.compressedBlob.size;
        }

        // Okamžitý upload na R2 ak je povolený
        console.log('🔍 R2 UPLOAD CHECK:', {
          autoUploadToR2,
          entityId,
          hasEntityId: !!entityId,
          willUseR2: autoUploadToR2 && entityId,
          filename: processedFile.name
        });
        
        let url: string;
        if (autoUploadToR2 && entityId) {
          console.log('✅ STARTING R2 UPLOAD:', processedFile.name);
          setUploadingToR2(true);
          setUploadProgress((processedCount / files.length) * 100);
          try {
            url = await uploadToR2(processedFile, isVideo ? 'video' : 'image');
            console.log('✅ R2 UPLOAD SUCCESS:', url);
          } catch (error) {
            console.error('❌ R2 UPLOAD FAILED, falling back to base64:', error);
            url = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(processedFile);
            });
          }
          setUploadingToR2(false);
        } else {
          console.log('⚠️ USING BASE64 FALLBACK - R2 conditions not met');
          // Fallback na base64
          url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(processedFile);
          });
        }

        const media: CapturedMedia = {
          id: uuidv4(),
          file: processedFile,
          type: isVideo ? 'video' : 'image',
          mediaType,
          description: '',
          preview: url,
          timestamp: new Date(),
          compressed,
          originalSize,
          compressedSize,
          compressionRatio: originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0,
        };

        newMedia.push(media);
        processedCount++;
        setProgress((processedCount / files.length) * 100);
      }

      setCapturedMedia(prev => [...prev, ...newMedia]);
      console.log(`✅ Pridané ${newMedia.length} médií s ${autoUploadToR2 ? 'R2 upload' : 'base64'}`);

    } catch (error) {
      console.error('❌ Chyba pri spracovaní súborov:', error);
      alert('Chyba pri spracovaní súborov: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    } finally {
      setProcessing(false);
      setProgress(0);
      setUploadingToR2(false);
      setUploadProgress(0);
      // Reset file input iba ak nie je rapid mode (v rapid mode už resetovaný)
      if (!rapidMode && event.target) {
        event.target.value = '';
      }
    }
  }, [capturedMedia, maxImages, maxVideos, allowedTypes, compressImages, compressVideos, autoUploadToR2, entityId, rapidMode]);

  // Handler pre natívnu kameru
  const handleNativeCapture = useCallback(async (imageBlob: Blob) => {
    // Konvertuj Blob na File
    const file = new File([imageBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // Vytvor dočasný preview URL
    let preview = URL.createObjectURL(imageBlob);
    
    console.log('📸 Native camera capture - R2 upload check:', {
      autoUploadToR2,
      entityId,
      hasEntityId: !!entityId,
      willUploadToR2: autoUploadToR2 && entityId,
      filename: file.name,
      size: file.size
    });
    
    // Okamžitý upload na R2 ak je povolený
    if (autoUploadToR2 && entityId) {
      console.log('🚀 NATIVE CAMERA: Starting R2 upload for:', file.name);
      setUploadingToR2(true);
      
      try {
        const r2Url = await uploadToR2(file, 'image');
        console.log('✅ NATIVE CAMERA: R2 upload success:', r2Url);
        
        // Zruš dočasný blob URL a použij R2 URL
        URL.revokeObjectURL(preview);
        preview = r2Url;
      } catch (error) {
        console.error('❌ NATIVE CAMERA: R2 upload failed, using blob URL:', error);
        // Ponechaj blob URL ako fallback
      }
      
      setUploadingToR2(false);
    } else {
      console.log('⚠️ NATIVE CAMERA: Using blob URL (R2 conditions not met)');
    }
    
    // Vytvor media objekt
    const media: CapturedMedia = {
      id: uuidv4(),
      file: file,
      type: 'image',
      mediaType: allowedTypes[0], // Default type
      description: '',
      preview: preview, // Buď R2 URL alebo blob URL
      timestamp: new Date(),
      compressed: false,
      originalSize: imageBlob.size,
      compressedSize: imageBlob.size,
      compressionRatio: 0,
    };
    
    // Pridaj do capturedMedia
    setCapturedMedia(prev => [...prev, media]);
    console.log('✅ Fotka z natívnej kamery pridaná', media);
  }, [allowedTypes, autoUploadToR2, entityId, uploadToR2]);

  const handleMediaTypeChange = (id: string, type: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer') => {
    setCapturedMedia(prev => 
      prev.map(media => 
        media.id === id ? { ...media, mediaType: type } : media
      )
    );
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setCapturedMedia(prev => 
      prev.map(media => 
        media.id === id ? { ...media, description } : media
      )
    );
  };

  const handleDeleteMedia = (id: string) => {
    setCapturedMedia(prev => {
      const media = prev.find(m => m.id === id);
      if (media) {
        URL.revokeObjectURL(media.preview);
      }
      return prev.filter(m => m.id !== id);
    });
  };

  const handleCompress = async () => {
    if (!compressImages && !compressVideos) return;

    setProcessing(true);
    setProgress(0);

    const updatedMedia = [...capturedMedia];
    let processedCount = 0;

    for (let i = 0; i < updatedMedia.length; i++) {
      const media = updatedMedia[i];
      
      if (media.compressed) {
        processedCount++;
        setProgress((processedCount / updatedMedia.length) * 100);
        continue;
      }

      try {
        if (media.type === 'image' && compressImages) {
          const result = await compressImage(media.file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSize: 500,
          });
          
          const compressedFile = new File([result.compressedBlob], media.file.name, {
            type: result.compressedBlob.type,
          });
          
          updatedMedia[i] = {
            ...media,
            file: compressedFile,
            compressed: true,
            compressedSize: result.compressedSize,
            compressionRatio: result.compressionRatio,
          };
        } else if (media.type === 'video' && compressVideos) {
          const result = await compressVideo(media.file, {
            maxWidth: 1280,
            maxHeight: 720,
            quality: 0.7,
            maxSizeInMB: 10,
          });
          
          const compressedFile = result.compressedFile;
          
          updatedMedia[i] = {
            ...media,
            file: compressedFile,
            compressed: true,
            compressedSize: result.compressedSizeInMB,
            compressionRatio: result.compressionRatio,
          };
        }
      } catch (error) {
        console.error('Error compressing media:', error);
      }
      
      processedCount++;
      setProgress((processedCount / updatedMedia.length) * 100);
    }

    setCapturedMedia(updatedMedia);
    setProcessing(false);
    setProgress(0);
  };

  const handleSave = async () => {
    const images: ProtocolImage[] = [];
    const videos: ProtocolVideo[] = [];

    for (const media of capturedMedia) {
      // ✅ PRIAMO R2 URL - žiadne base64 konverzie
      let url = media.preview;
      
      // Ak je to už R2 URL, použij ho priamo
      if (url.startsWith('https://') && (url.includes('r2.dev') || url.includes('cloudflare.com'))) {
        console.log('✅ Using existing R2 URL:', url);
      } else {
        // 🎯 KOMPRESOVAŤ obrázky pre PDF (max 800x600, qualita 0.7)
        console.log('⚠️ Converting to base64 for PDF - compressing:', media.file.name);
        
        let processedFile = media.file;
        
        // Ak je obrázok veľký, kompresuj ho
        if (media.type === 'image' && media.file.size > 100000) { // > 100KB
          console.log(`🗜️ Komprimujem veľký obrázok: ${(media.file.size / 1024).toFixed(1)}KB`);
          
          try {
            // Vytvoriť canvas pre resize
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            processedFile = await new Promise<File>((resolve, reject) => {
              img.onload = () => {
                // Resize na max 800x600 pre PDF
                const maxWidth = 800;
                const maxHeight = 600;
                
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                  const ratio = Math.min(maxWidth / width, maxHeight / height);
                  width *= ratio;
                  height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw resized image
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Convert to blob with compression
                canvas.toBlob((blob) => {
                  if (blob) {
                    const compressedFile = new File([blob], media.file.name, { 
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    console.log(`✅ Komprimované: ${(blob.size / 1024).toFixed(1)}KB`);
                    resolve(compressedFile);
                  } else {
                    reject(new Error('Canvas toBlob failed'));
                  }
                }, 'image/jpeg', 0.7); // 70% kvalita
              };
              img.onerror = reject;
              img.src = URL.createObjectURL(media.file);
            });
          } catch (compressionError) {
            console.error('⚠️ Compression failed, using original:', compressionError);
          }
        }
        
        // Convert to base64
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(processedFile);
        });
      }

      if (media.type === 'image') {
        images.push({
          id: media.id,
          url: url,
          type: media.mediaType,
          description: media.description,
          timestamp: media.timestamp,
          compressed: media.compressed,
          originalSize: media.originalSize,
          compressedSize: media.compressedSize,
        });
      } else {
        videos.push({
          id: media.id,
          url: url,
          type: media.mediaType,
          description: media.description,
          timestamp: media.timestamp,
          compressed: media.compressed,
          originalSize: media.originalSize,
          compressedSize: media.compressedSize,
        });
      }
    }

    console.log(`✅ Ukladám ${images.length} obrázkov a ${videos.length} videí`);
    onSave(images, videos);
    handleClose();
  };

  const handleClose = () => {
    // Clean up object URLs
    capturedMedia.forEach(media => {
      URL.revokeObjectURL(media.preview);
    });
    setCapturedMedia([]);
    setPreviewMedia(null);
    onClose();
  };

  const totalSize = capturedMedia.reduce((sum, media) => sum + media.file.size, 0);
  const compressedSize = capturedMedia.reduce((sum, media) => sum + (media.compressedSize || media.file.size), 0);
  const compressionRatio = totalSize > 0 ? ((totalSize - compressedSize) / totalSize) * 100 : 0;



  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
          <IconButton onClick={handleClose} color="inherit">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
            >
              Pridať fotky
            </Button>
            
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={() => videoInputRef.current?.click()}
              disabled={processing}
            >
              Pridať video
            </Button>
            
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={() => setNativeCameraOpen(true)}
              disabled={processing}
              color="secondary"
            >
              📱 Natívna kamera
            </Button>
            
            {(compressImages || compressVideos) && (
              <Button
                variant="outlined"
                startIcon={<Compress />}
                onClick={handleCompress}
                disabled={processing || capturedMedia.length === 0}
              >
                Komprimovať
              </Button>
            )}

            {/* Rapid Mode Toggle */}
            <FormControlLabel
              control={
                <Switch 
                  checked={rapidMode} 
                  onChange={(e) => setRapidMode(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    Rapid Mode
                  </Typography>
                  {rapidMode && (
                    <Chip 
                      label="AKTIVNY" 
                      size="small" 
                      color="success" 
                      variant="filled"
                    />
                  )}
                </Box>
              }
              sx={{ ml: 2 }}
            />
          </Box>

          {/* Rapid Mode Info */}
          {rapidMode && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                🚀 <strong>Rapid Mode aktívny!</strong> Po výbere fotky sa môžete okamžite odfotiť ďalšiu. 
                Ideálne pre sériové fotografovanie vozidla.
              </Typography>
            </Alert>
          )}

          {/* File inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {/* Progress indicators */}
          {(processing || uploadingToR2) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {uploadingToR2 ? 'Uploadujem na R2...' : 'Spracovávam súbory...'}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadingToR2 ? uploadProgress : progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {uploadingToR2 ? uploadProgress.toFixed(0) : progress.toFixed(0)}%
              </Typography>
            </Box>
          )}

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Limity: {maxImages} fotiek, {maxVideos} videí
            </Typography>
            {capturedMedia.length > 0 && (
              <>
                <Chip 
                  label={`${capturedMedia.filter(m => m.type === 'image').length}/${maxImages} fotiek`} 
                  size="small" 
                  color={capturedMedia.filter(m => m.type === 'image').length >= maxImages ? 'error' : 'default'}
                />
                <Chip 
                  label={`${capturedMedia.filter(m => m.type === 'video').length}/${maxVideos} videí`} 
                  size="small" 
                  color={capturedMedia.filter(m => m.type === 'video').length >= maxVideos ? 'error' : 'default'}
                />
                <Chip 
                  label={`${(totalSize / 1024 / 1024).toFixed(1)} MB`} 
                  size="small" 
                />
                {compressionRatio > 0 && (
                  <Chip 
                    label={`${compressionRatio.toFixed(1)}% komprimované`} 
                    size="small" 
                    color="success" 
                  />
                )}
              </>
            )}
          </Box>

          {/* Media grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 2 
          }}>
            {capturedMedia.map((media) => (
              <Card key={media.id}>
                <CardContent>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    {media.type === 'image' ? (
                      <img 
                        src={media.preview} 
                        alt={media.description} 
                        style={{ width: '100%', height: 150, objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ 
                        width: '100%', 
                        height: 150, 
                        backgroundImage: `url(${media.preview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <VideoCall sx={{ fontSize: 40, color: 'text.primary' }} />
                      </Box>
                    )}
                    
                    <Box sx={{ position: 'absolute', top: 5, right: 5, display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => setPreviewMedia(media)}
                        sx={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'text.primary' }}
                      >
                        <Preview />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMedia(media.id)}
                        sx={{ backgroundColor: 'rgba(255,0,0,0.5)', color: 'text.primary' }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                    
                    {media.compressed && (
                      <Chip 
                        label="Komprimované" 
                        size="small" 
                        color="success" 
                        sx={{ position: 'absolute', bottom: 5, left: 5 }}
                      />
                    )}
                  </Box>
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Typ</InputLabel>
                    <Select
                      value={media.mediaType}
                      label="Typ"
                      onChange={(e) => handleMediaTypeChange(media.id, e.target.value as any)}
                    >
                      {allowedTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          {type === 'vehicle' && 'Vozidlo'}
                          {type === 'damage' && 'Poškodenie'}
                          {type === 'document' && 'Doklady'}
                          {type === 'fuel' && 'Palivo'}
                          {type === 'odometer' && 'Tachometer'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    size="small"
                    label="Popis"
                    value={media.description}
                    onChange={(e) => handleDescriptionChange(media.id, e.target.value)}
                    multiline
                    rows={2}
                  />
                  
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                    {media.compressed ? (
                      <>
                        {(media.compressedSize! / 1024 / 1024).toFixed(2)} MB 
                        <span style={{ color: 'success.main' }}>
                          ({media.compressionRatio!.toFixed(1)}% komprimované)
                        </span>
                      </>
                    ) : (
                      `${(media.file.size / 1024 / 1024).toFixed(2)} MB`
                    )}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Zrušiť
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<Save />}
            disabled={capturedMedia.length === 0 || processing}
          >
            Uložiť ({capturedMedia.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onClose={() => setPreviewMedia(null)} maxWidth="md" fullWidth>
        <DialogTitle>Náhľad</DialogTitle>
        <DialogContent>
          {previewMedia && (
            <Box sx={{ textAlign: 'center' }}>
              {previewMedia.type === 'image' ? (
                <img 
                  src={previewMedia.preview} 
                  alt={previewMedia.description} 
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              ) : (
                <video 
                  src={previewMedia.preview} 
                  controls 
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              )}
              
              <Typography variant="body2" color="text.primary" sx={{ mt: 2 }}>
                {previewMedia.description || 'Bez popisu'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewMedia(null)}>Zatvoriť</Button>
        </DialogActions>
      </Dialog>

      {/* Native Camera Component */}
      <NativeCamera
        open={nativeCameraOpen}
        onClose={() => setNativeCameraOpen(false)}
        onCapture={handleNativeCapture}
        title="📸 Rapid fotografovanie"
        maxPhotos={maxImages}
        currentPhotoCount={capturedMedia.filter(m => m.type === 'image').length}
      />
    </>
  );
} 