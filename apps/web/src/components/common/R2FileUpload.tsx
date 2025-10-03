import { CloudUpload, Delete, Eye } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { getApiBaseUrl } from '../../utils/apiUrl';
import { logger } from '@/utils/smartLogger';

// Railway backend URL

interface R2FileUploadProps {
  type: 'vehicle' | 'protocol' | 'document' | 'company-document';
  entityId: string;
  mediaType?: string; // pre špecializované organizovanie súborov
  onUploadSuccess?: (
    fileData:
      | { url: string; key: string; filename: string }
      | { url: string; key: string; filename: string }[]
  ) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // v MB
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
}

interface FileData {
  url: string;
  key: string;
  filename: string;
  size: number;
  mimetype: string;
}

const R2FileUpload: React.FC<R2FileUploadProps> = ({
  type,
  entityId,
  mediaType,
  onUploadSuccess,
  onUploadError,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSize = 10, // 10MB default
  multiple = false,
  label = 'Nahrať súbor',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funkcia pre kompresiu obrázkov
  const compressImage = async (file: File): Promise<File> => {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Výpočet nových rozmerov (max 1920px šírka)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Kreslenie obrázka s novými rozmermi
        ctx?.drawImage(img, 0, 0, width, height);

        // Konverzia na blob s kompresiou
        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback na originál
            }
          },
          'image/jpeg',
          0.8
        ); // 80% kvalita
      };

      img.onerror = () => {
        resolve(file); // Fallback na originál pri chybe
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    logger.debug('🔍 R2 FILE SELECT - Files selected:', files.length);

    setError(null);
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async file => {
        logger.debug('🔍 R2 UPLOAD START', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        // Validácia typu súboru
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`Nepodporovaný typ súboru: ${file.type}`);
        }

        // Validácia veľkosti
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`Súbor je príliš veľký. Maximum: ${maxSize}MB`);
        }

        // Automatická kompresia obrázkov
        let processedFile = file;
        if (file.type.startsWith('image/')) {
          logger.debug('🔍 R2 COMPRESS - Compressing image...');
          processedFile = await compressImage(file);
          logger.debug('🔍 R2 COMPRESS - Compressed size:', processedFile.size);
        }

        // Upload do R2
        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('type', type);
        formData.append('entityId', entityId);
        if (mediaType) {
          formData.append('mediaType', mediaType);
        }

        logger.debug(
          '🔍 R2 UPLOAD - Sending to backend:',
          `${getApiBaseUrl()}/files/upload`
        );

        // Get auth token
        const token =
          localStorage.getItem('blackrent_token') ||
          sessionStorage.getItem('blackrent_token');

        const response = await fetch(`${getApiBaseUrl()}/files/upload`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        });

        logger.debug('🔍 R2 UPLOAD - Response status:', response.status);

        const data = await response.json();
        logger.debug('🔍 R2 UPLOAD - Response data:', data);

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Upload zlyhal');
        }

        return data;
      });

      const results = await Promise.all(uploadPromises);
      logger.debug('🔍 R2 UPLOAD - All uploads completed:', results);

      if (multiple) {
        setUploadedFiles(prev => [...prev, ...results]);
      } else {
        setUploadedFiles(results);
      }

      // Callback pre rodiča
      if (onUploadSuccess) {
        if (multiple) {
          // Pre multiple súbory vráť array
          logger.debug(
            '🔍 R2 CALLBACK - Calling onUploadSuccess with multiple files:',
            results
          );
          onUploadSuccess(results);
        } else {
          // Pre single súbor vráť jeden objekt
          logger.debug(
            '🔍 R2 CALLBACK - Calling onUploadSuccess with single file:',
            results[0]
          );
          onUploadSuccess(results[0]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload zlyhal';
      console.error('🔍 R2 UPLOAD ERROR:', errorMessage);
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileKey: string) => {
    try {
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      const response = await fetch(
        `${getApiBaseUrl()}/files/${encodeURIComponent(fileKey)}`,
        {
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error('Chyba pri mazaní súboru');
      }

      setUploadedFiles(prev => prev.filter(file => file.key !== fileKey));
    } catch (_err) {
      setError('Chyba pri mazaní súboru');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <div className="w-full">
      {/* Upload Button */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          variant="outline"
          className="w-full py-4 border-2 border-dashed hover:bg-blue-50 hover:border-blue-300 flex items-center gap-2"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : (
            <CloudUpload className="w-5 h-5" />
          )}
          {uploading ? 'Nahrávam...' : label}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2 text-white">
            Nahrané súbory:
          </h4>
          {uploadedFiles.map(file => (
            <div
              key={file.key}
              className="flex items-center justify-between p-2 mb-2 border border-white/20 rounded bg-white/5"
            >
              <div className="flex items-center gap-2">
                <span>{getFileIcon(file.mimetype)}</span>
                <div>
                  <div className="text-sm text-white">{file.filename}</div>
                  <div className="text-xs text-white/70">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(file.url, '_blank')}
                  className="text-white hover:bg-white/10 flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Zobraziť
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteFile(file.key)}
                  className="flex items-center gap-1"
                >
                  <Delete className="w-4 h-4" />
                  Zmazať
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Type Info */}
      <div className="mt-2">
        <div className="text-xs text-white/70">
          Podporované typy:{' '}
          {acceptedTypes
            .map(type => {
              if (type.startsWith('image/')) return 'Obrázky';
              if (type === 'application/pdf') return 'PDF';
              return type;
            })
            .join(', ')}
        </div>
        <div className="text-xs text-white/70 block">
          Max veľkosť: {maxSize}MB
        </div>
      </div>
    </div>
  );
};

export default R2FileUpload;
