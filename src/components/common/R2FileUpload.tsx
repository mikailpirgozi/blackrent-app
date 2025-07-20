import React, { useState, useRef } from 'react';
import { Button, Typography, Box, CircularProgress, Alert, Chip } from '@mui/material';
import { CloudUpload, Delete, Visibility } from '@mui/icons-material';

// Railway backend URL
const API_BASE_URL = 'https://blackrent-app-production-4d6f.up.railway.app/api';

interface R2FileUploadProps {
  type: 'vehicle' | 'protocol' | 'document';
  entityId: string;
  onUploadSuccess?: (fileData: { url: string; key: string; filename: string }) => void;
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
  onUploadSuccess,
  onUploadError,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSize = 10, // 10MB default
  multiple = false,
  label = 'Nahrať súbor',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funkcia pre kompresiu obrázkov
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
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
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback na originál
          }
        }, 'image/jpeg', 0.8); // 80% kvalita
      };
      
      img.onerror = () => {
        resolve(file); // Fallback na originál pri chybe
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
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
          processedFile = await compressImage(file);
        }

        // Upload do R2
        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('type', type);
        formData.append('entityId', entityId);

        // Get auth token
        const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');

        const response = await fetch(`${API_BASE_URL}/files/upload`, {
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
      
      if (multiple) {
        setUploadedFiles(prev => [...prev, ...results]);
      } else {
        setUploadedFiles(results);
      }

      // Callback pre rodiča
      results.forEach((fileData: FileData) => {
        onUploadSuccess?.(fileData);
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload zlyhal';
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
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      const response = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Chyba pri mazaní súboru');
      }

      setUploadedFiles(prev => prev.filter(file => file.key !== fileKey));
    } catch (err) {
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
    <Box sx={{ width: '100%' }}>
      {/* Upload Button */}
      <Box sx={{ mb: 2 }}>
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
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
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
          {uploading ? 'Nahrávam...' : label}
        </Button>
      </Box>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'white' }}>
            Nahrané súbory:
          </Typography>
          {uploadedFiles.map((file, index) => (
            <Box
              key={file.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                mb: 1,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{getFileIcon(file.mimetype)}</span>
                <Box>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    {file.filename}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => window.open(file.url, '_blank')}
                  sx={{ color: 'white' }}
                >
                  Zobraziť
                </Button>
                <Button
                  size="small"
                  startIcon={<Delete />}
                  onClick={() => handleDeleteFile(file.key)}
                  sx={{ color: 'error.main' }}
                >
                  Zmazať
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* File Type Info */}
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Podporované typy: {acceptedTypes.map(type => {
            if (type.startsWith('image/')) return 'Obrázky';
            if (type === 'application/pdf') return 'PDF';
            return type;
          }).join(', ')}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)' }}>
          Max veľkosť: {maxSize}MB
        </Typography>
      </Box>
    </Box>
  );
};

export default R2FileUpload; 