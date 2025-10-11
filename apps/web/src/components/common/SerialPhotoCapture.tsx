import {
  Trash2 as Delete,
  Camera as PhotoCamera,
  Eye as Preview,
  Save,
  Video as VideoCall,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Typography } from '@/components/ui/typography';
import { Textarea } from '@/components/ui/textarea';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getApiBaseUrl } from '../../utils/apiUrl';

import { useUploadFile } from '../../lib/react-query/hooks/useFileUpload';
import type { ProtocolImage, ProtocolVideo } from '../../types';
import { isWebPSupported } from '../../utils/imageCompression';
import {
  compressForPDF,
  preserveQualityForGallery,
} from '../../utils/imageLint';

import { logger } from '../../utils/logger';
import { compressVideo } from '../../utils/videoCompression';
import { Card } from '@/components/ui/card';

import NativeCamera from './NativeCamera';

interface SerialPhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onSave: (images: ProtocolImage[], videos: ProtocolVideo[]) => void;
  title: string;
  allowedTypes: ('vehicle' | 'damage' | 'document' | 'fuel' | 'odometer')[];
  maxImages?: number;
  maxVideos?: number;

  compressVideos?: boolean;
  entityId?: string;
  autoUploadToR2?: boolean;
  // ✅ NOVÉ PROPS pre nový systém
  protocolType?: 'handover' | 'return';
  mediaType?: 'vehicle' | 'document' | 'damage' | 'fuel' | 'odometer';
  category?:
    | 'vehicle_photos'
    | 'documents'
    | 'damages'
    | 'signatures'
    | 'pdf'
    | 'videos'
    | 'other';
  // 🎯 NOVÉ: Možnosť výberu kvality
  qualityPreset?: 'mobile' | 'protocol' | 'highQuality' | 'archive';
  // 🌟 NOVÉ: WebP podpora
  preferWebP?: boolean;
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
  // 🌟 NOVÉ: URL pre rôzne kvality
  originalUrl?: string; // Vysoká kvalita pre galériu
  compressedUrl?: string; // Nízka kvalita pre PDF
}

export default function SerialPhotoCapture({
  open,
  onClose,
  onSave,
  title,
  allowedTypes,
  maxImages = 50,
  maxVideos = 5,

  compressVideos = true,
  entityId,
  autoUploadToR2 = true,
  protocolType = 'handover',
  mediaType = 'vehicle',
  category,
  qualityPreset = 'protocol',
  preferWebP = true,
}: SerialPhotoCaptureProps) {
  // React Query hooks
  // DOČASNE: Použiť priamy upload namiesto presigned upload kvôli CORS problémom
  // const presignedUploadMutation = usePresignedUpload();
  const uploadFileMutation = useUploadFile();

  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // React Query loading stavy
  const uploadingToR2 = uploadFileMutation.isPending;
  const [nativeCameraOpen, setNativeCameraOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<
    'mobile' | 'protocol' | 'highQuality' | 'archive'
  >(qualityPreset);
  const [webPEnabled, setWebPEnabled] = useState(preferWebP);
  const [webPSupported, setWebPSupported] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Helper function to convert R2 URL to proxy URL
  const getProxyUrl = (r2Url: string | undefined): string => {
    try {
      // Kontrola či URL existuje
      if (!r2Url) {
        console.warn('⚠️ getProxyUrl: URL is undefined or null');
        return ''; // Vráť prázdny string pre undefined URL
      }

      // Ak je to R2 URL, konvertuj na proxy
      if (r2Url.includes('r2.dev') || r2Url.includes('cloudflare.com')) {
        const urlParts = r2Url.split('/');
        // Zober všetky časti po doméne ako key (preskoč https:// a doménu)
        const key = urlParts.slice(3).join('/');
        const apiBaseUrl = getApiBaseUrl();
        const proxyUrl = `${apiBaseUrl}/files/proxy/${encodeURIComponent(key)}`;
        logger.debug('🔄 Converting R2 URL to proxy:', { r2Url, proxyUrl });
        return proxyUrl;
      }
      return r2Url; // Ak nie je R2 URL, vráť pôvodné
    } catch (error) {
      console.error('❌ Error converting to proxy URL:', error);
      return r2Url || ''; // Fallback na pôvodné URL alebo prázdny string
    }
  };

  // 🔍 Detekcia WebP podpory pri načítaní
  useEffect(() => {
    isWebPSupported().then(setWebPSupported);
  }, []);

  // 🌟 NOVÉ: Vytvorenie komprimovanej verzie pre PDF
  const createCompressedVersion = useCallback(
    async (file: File): Promise<File> => {
      try {
        // ✅ POUŽITIE NOVEJ FUNKCIE: compressForPDF
        const compressedFile = await compressForPDF(file);

        logger.debug('✅ Image compressed for PDF:', {
          original: (file.size / 1024).toFixed(1) + 'KB',
          compressed: (compressedFile.size / 1024).toFixed(1) + 'KB',
          ratio:
            (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) +
            '%',
        });

        return compressedFile;
      } catch (error) {
        logger.debug('⚠️ Compression failed, using original:', { error });
        return file; // Fallback na originál
      }
    },
    []
  );

  // ⚡ NOVÉ: Keyboard shortcuts pre rýchle fotenie
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!open) return;

      // Cmd/Ctrl + K = Kvalitné fotky (natívna galéria)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        fileInputRef.current?.click();
      }

      // Cmd/Ctrl + R = Rýchle fotky (prehliadač)
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        setNativeCameraOpen(true);
      }

      // Space = Rýchle fotky (najčastejšie)
      if (event.code === 'Space' && !nativeCameraOpen) {
        event.preventDefault();
        setNativeCameraOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, nativeCameraOpen]);

  // Funkcia pre upload na R2
  // ✅ NOVÁ FUNKCIA: Direct upload (fallback)
  const directUpload = useCallback(
    async (file: File): Promise<string> => {
      if (!entityId) {
        throw new Error('Entity ID is required for upload');
      }

      const uploadData = {
        file,
        protocolId: entityId,
        protocolType: protocolType || 'return', // ✅ PRIDANÉ: Backend vyžaduje protocolType
        category: category || 'vehicle_photos',
        mediaType: mediaType || 'vehicle', // ✅ PRIDANÉ: Fallback pre mediaType
        metadata: {
          protocolType,
          label: file.name,
          timestamp: new Date().toISOString(),
        },
      };

      try {
        const result = await uploadFileMutation.mutateAsync(uploadData);
        return (result.url || result.fileUrl || '') as string;
      } catch (error) {
        console.error('Direct upload failed:', error);
        throw error;
      }
    },
    [entityId, protocolType, mediaType, category, uploadFileMutation]
  );

  const uploadToR2 = useCallback(
    async (file: File, suffix = ''): Promise<string> => {
      // ✅ ANTI-CRASH: Use objectURL instead of base64
      if (!autoUploadToR2) {
        // Create objectURL for preview (memory safe)
        const objectUrl = URL.createObjectURL(file);
        // Store for cleanup later
        return objectUrl;
      }

      // Kontrola entityId
      if (!entityId) {
        throw new Error('EntityId is required for R2 upload');
      }

      try {
        // 🚀 NOVÝ SYSTÉM: Presigned URL upload pomocou React Query
        const finalFilename = suffix
          ? file.name.replace(/(\.[^.]+)$/, `${suffix}$1`)
          : file.name;

        logger.debug('🔄 Getting presigned URL for:', {
          protocolId: entityId,
          filename: finalFilename,
          size: file.size,
          contentType: file.type,
          suffix: suffix,
        });

        // DOČASNE: Použiť priamy upload namiesto presigned upload
        const directUploadData = {
          file,
          protocolId: entityId,
          protocolType: protocolType || 'return', // ✅ PRIDANÉ: Backend vyžaduje protocolType
          category: category || 'vehicle_photos',
          mediaType: mediaType || 'vehicle', // ✅ PRIDANÉ: Fallback pre mediaType
          metadata: {
            protocolType,
            filename: finalFilename,
            contentType: file.type,
            suffix,
            timestamp: new Date().toISOString(),
          },
        };

        const result = await uploadFileMutation.mutateAsync(directUploadData);
        logger.debug('✅ File uploaded via direct upload:', result);

        return (result.url || result.publicUrl || '') as string;
      } catch (error) {
        console.error('❌ Direct upload failed:', error);

        // Detailnejšie error handling
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            logger.error('⏰ R2 upload timeout - connection too slow');
          } else if (error.message.includes('Failed to fetch')) {
            logger.error(
              '🌐 Network error during R2 upload - checking connection'
            );
          } else {
            logger.error('🔧 R2 upload error:', error.message);
          }
        }

        // Fallback na direct upload ak presigned URL zlyhá
        logger.debug('🔄 Falling back to direct upload...');
        return await directUpload(file);
      }
    },
    [
      autoUploadToR2,
      category,
      directUpload,
      entityId,
      mediaType,
      protocolType,
      uploadFileMutation,
    ]
  );

  // Cloudflare Worker upload (nepoužíva sa)
  // const workerUpload = async (file: File): Promise<string> => { /* intentionally disabled */ throw new Error('unused'); };

  // directUpload definované vyššie

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // Kontrola limitov
      const currentImages = capturedMedia.filter(
        m => m.type === 'image'
      ).length;
      const currentVideos = capturedMedia.filter(
        m => m.type === 'video'
      ).length;

      const newImages = files.filter(f => !f.type.startsWith('video/')).length;
      const newVideos = files.filter(f => f.type.startsWith('video/')).length;

      if (currentImages + newImages > maxImages) {
        alert(
          `Môžete nahrať maximálne ${maxImages} obrázkov. Aktuálne máte ${currentImages} a pokúšate sa pridať ${newImages}.`
        );
        return;
      }

      if (currentVideos + newVideos > maxVideos) {
        alert(
          `Môžete nahrať maximálne ${maxVideos} videí. Aktuálne máte ${currentVideos} a pokúšate sa pridať ${newVideos}.`
        );
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

          // Spracovanie súborov s validáciou a optimalizáciou
          let processedFile = file;
          let compressed = false;
          const originalSize = file.size;
          let compressedSize = file.size;

          if (isVideo && compressVideos) {
            setProgress((processedCount / files.length) * 50);
            const compressionResult = await compressVideo(file);
            processedFile = compressionResult.compressedFile;
            compressed = true;
            compressedSize = compressionResult.compressedFile.size;
          } else if (!isVideo) {
            setProgress((processedCount / files.length) * 50);

            try {
              // ✅ NOVÉ: Použitie preserveQualityForGallery pre zachovanie kvality
              processedFile = await preserveQualityForGallery(file);
              compressed = true;
              compressedSize = processedFile.size;

              logger.debug('✅ Image processed with quality preservation:', {
                originalName: file.name,
                originalSize: originalSize,
                originalType: file.type,
                processedName: processedFile.name,
                processedSize: compressedSize,
                processedType: processedFile.type,
                compressionRatio:
                  (
                    ((originalSize - compressedSize) / originalSize) *
                    100
                  ).toFixed(1) + '%',
              });
            } catch (error) {
              // Ak imageLint zlyhá, ukáž chybu používateľovi
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Neznáma chyba pri spracovaní obrázka';
              alert(errorMessage);
              continue; // Preskočiť tento súbor a pokračovať s ďalšími
            }
          }

          // Okamžitý upload na R2 ak je povolený
          logger.debug('🔍 R2 UPLOAD CHECK:', {
            autoUploadToR2,
            entityId,
            hasEntityId: !!entityId,
            willUseR2: autoUploadToR2 && entityId,
            filename: processedFile.name,
          });

          // 🌟 NOVÉ: Dual-quality upload aj pre file upload
          let url: string;
          let originalUrl: string | undefined;
          let compressedUrl: string | undefined;

          if (autoUploadToR2 && entityId) {
            logger.debug('✅ STARTING DUAL R2 UPLOAD:', processedFile.name);
            // setUploadingToR2(true); // React Query handles this
            setUploadProgress((processedCount / files.length) * 100);
            try {
              // 1. Upload originál (už optimalizovaný cez imageLint)
              originalUrl = await uploadToR2(processedFile);
              logger.debug('✅ ORIGINAL R2 UPLOAD SUCCESS:', originalUrl);

              // 2. Vytvor a upload komprimovanú verziu pre PDF
              const compressedFile =
                await createCompressedVersion(processedFile);
              compressedUrl = await uploadToR2(compressedFile, '_compressed');
              logger.debug('✅ COMPRESSED R2 UPLOAD SUCCESS:', compressedUrl);

              // Pre galériu používaj originál (metadata sa uložia pri save protokolu)
              url = originalUrl;
            } catch (error) {
              console.error(
                '❌ DUAL R2 UPLOAD FAILED, using objectURL fallback:',
                error
              );
              // ✅ ANTI-CRASH: Use objectURL instead of base64
              url = URL.createObjectURL(processedFile);
            }
            // setUploadingToR2(false); // React Query handles this
          } else {
            logger.debug('⚠️ USING OBJECTURL FALLBACK - R2 conditions not met');
            // ✅ ANTI-CRASH: Use objectURL instead of base64
            url = URL.createObjectURL(processedFile);
          }

          const media: CapturedMedia = {
            id: uuidv4(),
            file: processedFile,
            type: isVideo ? 'video' : 'image',
            mediaType: mediaType || 'vehicle',
            description: '',
            preview: originalUrl ? getProxyUrl(originalUrl) : url, // Použij proxy URL pre R2 obrázky
            timestamp: new Date(),
            compressed: compressed || false,
            originalSize: originalSize ?? 0,
            compressedSize,
            compressionRatio:
              originalSize > 0
                ? ((originalSize - compressedSize) / originalSize) * 100
                : 0,
            // 🌟 NOVÉ: URL pre rôzne kvality
            originalUrl: originalUrl ?? '',
            compressedUrl: compressedUrl ?? '',
          };

          newMedia.push(media);
          processedCount++;
          setProgress((processedCount / files.length) * 100);
        }

        setCapturedMedia(prev => [...prev, ...newMedia]);
        logger.debug(
          `✅ Pridané ${newMedia.length} médií s ${autoUploadToR2 ? 'R2 upload' : 'base64'}`
        );
      } catch (error) {
        console.error('❌ Chyba pri spracovaní súborov:', error);
        alert(
          'Chyba pri spracovaní súborov: ' +
            (error instanceof Error ? error.message : 'Neznáma chyba')
        );
      } finally {
        setProcessing(false);
        setProgress(0);
        // setUploadingToR2(false); // React Query handles this
        setUploadProgress(0);
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [
      capturedMedia,
      maxImages,
      maxVideos,
      allowedTypes,
      compressVideos,
      autoUploadToR2,
      entityId,
      uploadToR2,
      createCompressedVersion,
    ]
  );

  // Handler pre natívnu kameru
  const handleNativeCapture = useCallback(
    async (imageBlob: Blob) => {
      // ✅ NOVÉ: Konvertuj Blob na WebP File ak je podporovaný
      const webPSupported = await isWebPSupported();
      const fileExtension = webPSupported ? 'webp' : 'jpg';
      const mimeType = webPSupported ? 'image/webp' : 'image/jpeg';

      const file = new File(
        [imageBlob],
        `photo_${Date.now()}.${fileExtension}`,
        {
          type: mimeType,
        }
      );

      // Vytvor dočasný preview URL
      const preview = URL.createObjectURL(imageBlob);

      logger.debug('📸 Native camera capture - R2 upload check:', {
        autoUploadToR2,
        entityId,
        hasEntityId: !!entityId,
        willUploadToR2: autoUploadToR2 && entityId,
        filename: file.name,
        size: file.size,
      });

      // Premenné pre URL
      let originalUrl: string | undefined;
      let compressedUrl: string | undefined;

      // Okamžitý upload na R2 ak je povolený - DVE VERZIE
      if (autoUploadToR2 && entityId) {
        logger.debug(
          '🚀 NATIVE CAMERA: Starting dual R2 upload for:',
          file.name
        );
        // setUploadingToR2(true); // React Query handles this

        try {
          // 1. ORIGINÁL - vysoká kvalita pre galériu
          originalUrl = await uploadToR2(file);
          logger.debug(
            '✅ NATIVE CAMERA: Original R2 upload success:',
            originalUrl
          );

          // 2. KOMPRIMOVANÁ VERZIA - nízka kvalita pre PDF
          const compressedFile = await createCompressedVersion(file);
          compressedUrl = await uploadToR2(compressedFile, '_compressed');
          logger.debug(
            '✅ NATIVE CAMERA: Compressed R2 upload success:',
            compressedUrl
          );

          // Zachovaj blob URL pre preview, R2 URL sa použije pre galériu
          // URL.revokeObjectURL(preview); // NERUŠI blob URL - potrebný pre preview
          // Po úspešnom R2 upload uvoľni blob URL (už máme R2 URL)
          if (originalUrl) {
            URL.revokeObjectURL(preview); // Uvoľni blob URL keď máme R2 URL
          }
        } catch (error) {
          console.error(
            '❌ NATIVE CAMERA: R2 upload failed, using blob URL:',
            error
          );
          // Ponechaj blob URL ako fallback
        }

        // setUploadingToR2(false); // React Query handles this
      } else {
        logger.debug(
          '⚠️ NATIVE CAMERA: Using blob URL (R2 conditions not met)'
        );
      }

      // Vytvor media objekt
      const media: CapturedMedia = {
        id: uuidv4(),
        file: file,
        type: 'image',
        mediaType: allowedTypes[0] || 'vehicle', // Default type
        description: '',
        preview: originalUrl ? getProxyUrl(originalUrl) : preview, // Použij proxy URL pre R2 obrázky
        timestamp: new Date(),
        compressed: false,
        originalSize: imageBlob.size,
        compressedSize: imageBlob.size,
        compressionRatio: 0,
        // 🌟 NOVÉ: URL pre rôzne kvality
        originalUrl: originalUrl ?? '',
        compressedUrl: compressedUrl ?? '',
      };

      // URL sa už nastavili počas uploadu vyššie

      // Pridaj do capturedMedia
      setCapturedMedia(prev => [...prev, media]);
      logger.debug('✅ Fotka z natívnej kamery pridaná', media);
    },
    [
      allowedTypes,
      autoUploadToR2,
      entityId,
      uploadToR2,
      createCompressedVersion,
    ]
  );

  const handleMediaTypeChange = (
    id: string,
    type: 'vehicle' | 'damage' | 'document' | 'fuel' | 'odometer'
  ) => {
    setCapturedMedia(prev =>
      prev.map(media =>
        media.id === id ? { ...media, mediaType: type } : media
      )
    );
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setCapturedMedia(prev =>
      prev.map(media => (media.id === id ? { ...media, description } : media))
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

  const handleSave = async () => {
    const images: ProtocolImage[] = [];
    const videos: ProtocolVideo[] = [];

    for (const media of capturedMedia) {
      // 🌟 NOVÉ: Používaj originálnu verziu ako hlavné URL (pre galériu)
      let url = media.originalUrl || media.preview;

      // Ak je to už R2 URL, použij ho priamo
      if (
        url.startsWith('https://') &&
        (url.includes('r2.dev') || url.includes('cloudflare.com'))
      ) {
        logger.debug('✅ Using original R2 URL for gallery:', url);
      } else {
        // 🎯 KOMPRESOVAŤ obrázky pre PDF (max 800x600, qualita 0.7)
        logger.debug(
          '⚠️ Converting to base64 for PDF - compressing:',
          media.file.name
        );

        let processedFile = media.file;

        // Ak je obrázok veľký, kompresuj ho
        if (media.type === 'image' && media.file.size > 100000) {
          // > 100KB
          logger.debug(
            `🗜️ Komprimujem veľký obrázok: ${(media.file.size / 1024).toFixed(1)}KB`
          );

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
                canvas.toBlob(
                  blob => {
                    if (blob) {
                      const compressedFile = new File([blob], media.file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                      });
                      logger.debug(
                        `✅ Komprimované: ${(blob.size / 1024).toFixed(1)}KB`
                      );
                      resolve(compressedFile);
                    } else {
                      reject(new Error('Canvas toBlob failed'));
                    }
                  },
                  'image/jpeg',
                  0.7
                ); // 70% kvalita
              };
              img.onerror = reject;
              img.src = URL.createObjectURL(media.file);
            });
          } catch (compressionError) {
            console.error(
              '⚠️ Compression failed, using original:',
              compressionError
            );
          }
        }

        // ✅ ANTI-CRASH: Use objectURL instead of base64
        url = URL.createObjectURL(processedFile);
      }

      if (media.type === 'image') {
        // 🔍 DEBUG: Skontroluj čo má media objekt
        logger.debug('🔍 SAVE DEBUG - Media object:', {
          id: media.id,
          hasOriginalUrl: !!media.originalUrl,
          hasCompressedUrl: !!media.compressedUrl,
          originalUrl: media.originalUrl?.substring(0, 80) + '...',
          compressedUrl: media.compressedUrl?.substring(0, 80) + '...',
          url: url?.substring(0, 80) + '...',
        });

        const protocolImage: ProtocolImage = {
          id: media.id,
          url: url, // Originálne URL pre galériu (WebP, vysoká kvalita)
          originalUrl: media.originalUrl || url, // Vysoká kvalita pre galériu (required)
          compressedUrl: media.compressedUrl, // DEPRECATED - Nízka kvalita pre PDF
          type: media.mediaType,
          description: media.description || '',
          timestamp: media.timestamp,
          compressed: media.compressed,
          originalSize: media.originalSize,
          compressedSize: media.compressedSize,
        };

        // 🔍 DEBUG: Skontroluj finálny objekt
        logger.debug('🔍 SAVE DEBUG - Final ProtocolImage:', {
          id: protocolImage.id,
          hasOriginalUrl: !!protocolImage.originalUrl,
          hasCompressedUrl: !!protocolImage.compressedUrl,
          originalUrl: protocolImage.originalUrl?.substring(0, 80) + '...',
          compressedUrl: protocolImage.compressedUrl?.substring(0, 80) + '...',
        });

        images.push(protocolImage);
      } else {
        videos.push({
          id: media.id,
          url: url,
          type: media.mediaType,
          description: media.description,
          timestamp: media.timestamp,
          compressed: media.compressed ?? false,
          originalSize: media.originalSize ?? 0,
          compressedSize: media.compressedSize ?? 0,
        });
      }
    }

    logger.debug(
      `✅ Ukladám ${images.length} obrázkov a ${videos.length} videí`
    );
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

  const totalSize = capturedMedia.reduce(
    (sum, media) => sum + media.file.size,
    0
  );
  const compressedSize = capturedMedia.reduce(
    (sum, media) => sum + (media.compressedSize || media.file.size),
    0
  );
  const compressionRatio =
    totalSize > 0 ? ((totalSize - compressedSize) / totalSize) * 100 : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={open => !open && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Zachyťte fotografie pre {title.toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          {/* Sticky Save/Cancel Buttons - Always visible */}
          <div className="sticky top-0 z-50 bg-background border-b pb-3 mb-4 -mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={processing}
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleSave}
              disabled={capturedMedia.length === 0 || processing}
            >
              <Save className="mr-2 h-4 w-4" />
              Uložiť ({capturedMedia.length})
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 mb-6 flex-wrap items-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="text-lg py-3 px-6 hover:scale-105 transition-transform"
            >
              <PhotoCamera className="h-5 w-5 mr-2" />
              📸 Kvalitné fotky
            </Button>

            <Button
              onClick={() => videoInputRef.current?.click()}
              disabled={processing}
              className="text-lg py-3 px-6 hover:scale-105 transition-transform"
            >
              <VideoCall className="h-5 w-5 mr-2" />
              🎥 Pridať video
            </Button>

            <Button
              variant="outline"
              onClick={() => setNativeCameraOpen(true)}
              disabled={processing}
              className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:border-orange-600"
            >
              <PhotoCamera className="h-5 w-5 mr-2" />⚡ Rýchle fotky
            </Button>

            {/* 🎯 NOVÉ: Výber kvality */}
            <div className="min-w-[140px]">
              <Label htmlFor="quality-select">Kvalita</Label>
              <Select
                value={selectedQuality}
                onValueChange={value =>
                  setSelectedQuality(value as typeof selectedQuality)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte kvalitu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">
                    📱 Mobilná ({webPEnabled ? '500KB' : '800KB'})
                  </SelectItem>
                  <SelectItem value="protocol">
                    🏢 Protokol ({webPEnabled ? '1MB' : '1.5MB'})
                  </SelectItem>
                  <SelectItem value="highQuality">
                    🔍 Vysoká ({webPEnabled ? '2MB' : '3MB'})
                  </SelectItem>
                  <SelectItem value="archive">
                    💾 Archív ({webPEnabled ? '3.5MB' : '5MB'})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 🌟 NOVÉ: WebP toggle */}
            {webPSupported !== null && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={webPEnabled && webPSupported}
                  onCheckedChange={checked => setWebPEnabled(checked)}
                  disabled={!webPSupported}
                />
                <Label
                  htmlFor="webp-toggle"
                  className="flex items-center gap-2"
                >
                  <Typography variant="body2">
                    WebP {webPSupported ? '✅' : '❌'}
                  </Typography>
                  {webPEnabled && webPSupported && (
                    <Badge variant="default" className="h-5">
                      30% MENŠIE
                    </Badge>
                  )}
                </Label>
              </div>
            )}
          </div>

          {/* 💡 NOVÉ: Smart Tips pre rýchle fotenie */}
          <Alert className="mb-4">
            <AlertDescription>
              <Typography variant="body2" className="mb-2">
                <strong>⚡ Rýchle fotenie:</strong>
              </Typography>
              <ul className="m-0 pl-4 space-y-1">
                <li>
                  <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> alebo{' '}
                  <kbd className="px-2 py-1 bg-muted rounded">⌘R</kbd> = Rýchle
                  fotky cez prehliadač
                </li>
                <li>
                  <kbd className="px-2 py-1 bg-muted rounded">⌘K</kbd> =
                  Kvalitné fotky z galérie/fotoaparátu
                </li>
                <li>
                  <strong>Tip:</strong> Pre škody použiť kvalitné, pre celkové
                  zábery rýchle
                </li>
              </ul>
            </AlertDescription>
          </Alert>

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
            <div className="mb-2">
              <Typography
                variant="body2"
                className="text-muted-foreground mb-2"
              >
                {uploadingToR2
                  ? 'Uploadujem na R2...'
                  : 'Spracovávam súbory...'}
              </Typography>
              <Progress
                value={uploadingToR2 ? uploadProgress : progress}
                className="h-2 rounded"
              />
              <Typography
                variant="caption"
                className="text-muted-foreground mt-1 block"
              >
                {uploadingToR2
                  ? uploadProgress.toFixed(0)
                  : progress.toFixed(0)}
                %
              </Typography>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-1 mb-2 flex-wrap items-center">
            <Typography variant="body2" className="text-muted-foreground">
              Limity: {maxImages} fotiek, {maxVideos} videí
            </Typography>
            {capturedMedia.length > 0 && (
              <>
                <Badge
                  variant={
                    capturedMedia.filter(m => m.type === 'image').length >=
                    maxImages
                      ? 'destructive'
                      : 'default'
                  }
                  className="text-xs"
                >
                  {capturedMedia.filter(m => m.type === 'image').length}/
                  {maxImages} fotiek
                </Badge>
                <Badge
                  variant={
                    capturedMedia.filter(m => m.type === 'video').length >=
                    maxVideos
                      ? 'destructive'
                      : 'default'
                  }
                  className="text-xs"
                >
                  {capturedMedia.filter(m => m.type === 'video').length}/
                  {maxVideos} videí
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {(totalSize / 1024 / 1024).toFixed(1)} MB
                </Badge>
                {compressionRatio > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {compressionRatio.toFixed(1)}% komprimované
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Media grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {capturedMedia.map(media => (
              <Card key={media.id}>
                <div className="relative mb-2">
                  {media.type === 'image' ? (
                    <img
                      src={media.preview || media.originalUrl}
                      alt={media.description}
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
                      onError={e => {
                        console.error(
                          '❌ Preview image failed to load:',
                          media.preview
                        );
                        // Fallback na proxy URL ak preview zlyhá
                        const img = e.target as HTMLImageElement;
                        if (img.src === media.preview && media.originalUrl) {
                          logger.debug(
                            '🔄 Falling back to proxy URL for preview'
                          );
                          img.src = getProxyUrl(media.originalUrl);
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-[150px] bg-cover bg-center flex items-center justify-center"
                      style={{
                        backgroundImage: `url(${media.preview || media.originalUrl})`,
                      }}
                    >
                      <VideoCall className="text-4xl text-foreground" />
                    </div>
                  )}

                  <div className="absolute top-1 right-1 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewMedia(media)}
                      className="bg-black/50 text-foreground hover:bg-black/70"
                    >
                      <Preview className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMedia(media.id)}
                      className="bg-red-500/50 text-foreground hover:bg-red-500/70"
                    >
                      <Delete className="h-4 w-4" />
                    </Button>
                  </div>

                  {media.compressed && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-1 left-1 text-xs"
                    >
                      Komprimované
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 mb-2">
                  <Label htmlFor={`media-type-${media.id}`}>Typ</Label>
                  <Select
                    value={media.mediaType}
                    onValueChange={value =>
                      handleMediaTypeChange(
                        media.id,
                        value as
                          | 'vehicle'
                          | 'damage'
                          | 'document'
                          | 'fuel'
                          | 'odometer'
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte typ" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type === 'vehicle' && 'Vozidlo'}
                          {type === 'damage' && 'Poškodenie'}
                          {type === 'document' && 'Doklady'}
                          {type === 'fuel' && 'Palivo'}
                          {type === 'odometer' && 'Tachometer'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${media.id}`}>Popis</Label>
                  <Textarea
                    id={`description-${media.id}`}
                    value={media.description}
                    onChange={e =>
                      handleDescriptionChange(media.id, e.target.value)
                    }
                    rows={2}
                    placeholder="Zadajte popis..."
                  />
                </div>

                <Typography
                  variant="caption"
                  className="text-muted-foreground mt-1 block"
                >
                  {media.compressed ? (
                    <>
                      {(media.compressedSize! / 1024 / 1024).toFixed(2)} MB
                      <span className="text-green-600">
                        ({media.compressionRatio!.toFixed(1)}% komprimované)
                      </span>
                    </>
                  ) : (
                    `${(media.file.size / 1024 / 1024).toFixed(2)} MB`
                  )}
                </Typography>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Náhľad</DialogTitle>
            <DialogDescription>Náhľad vybranej fotografie</DialogDescription>
          </DialogHeader>
          {previewMedia && (
            <div className="text-center">
              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.preview || previewMedia.originalUrl}
                  alt={previewMedia.description}
                  className="max-w-full max-h-[70vh]"
                  onError={e => {
                    console.error(
                      '❌ Preview modal image failed to load:',
                      previewMedia.preview
                    );
                    // Fallback na R2 URL ak blob URL zlyhá
                    const img = e.target as HTMLImageElement;
                    if (
                      img.src === previewMedia.preview &&
                      previewMedia.originalUrl
                    ) {
                      logger.debug(
                        '🔄 Falling back to R2 URL for preview modal'
                      );
                      img.src = previewMedia.originalUrl;
                    }
                  }}
                />
              ) : (
                <video
                  src={previewMedia.originalUrl || previewMedia.preview}
                  controls
                  className="max-w-full max-h-[70vh]"
                />
              )}

              <Typography variant="body2" className="text-foreground mt-2">
                {previewMedia.description || 'Bez popisu'}
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPreviewMedia(null)}>
            Zatvoriť
          </Button>
        </DialogFooter>
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
