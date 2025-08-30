export interface VideoCompressionOptions {
  maxSizeInMB: number;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface VideoCompressionResult {
  compressedFile: File;
  originalSizeInMB: number;
  compressedSizeInMB: number;
  compressionRatio: number;
}

export async function compressVideo(
  file: File,
  options: VideoCompressionOptions = {
    maxSizeInMB: 10,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
  }
): Promise<VideoCompressionResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.onloadedmetadata = () => {
      // Nastavenie rozmerov canvas
      const { width, height } = calculateDimensions(
        video.videoWidth,
        video.videoHeight,
        options.maxWidth || 1920,
        options.maxHeight || 1080
      );

      canvas.width = width;
      canvas.height = height;

      // Vykreslenie prvého snímku
      ctx.drawImage(video, 0, 0, width, height);

      // Konverzia na blob
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('Failed to compress video'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: 'video/mp4',
            lastModified: Date.now(),
          });

          const originalSizeInMB = file.size / (1024 * 1024);
          const compressedSizeInMB = compressedFile.size / (1024 * 1024);

          resolve({
            compressedFile,
            originalSizeInMB,
            compressedSizeInMB,
            compressionRatio: originalSizeInMB / compressedSizeInMB,
          });
        },
        'video/mp4',
        options.quality
      );
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
}

function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width, height };
}

export const getVideoMetadata = (
  file: File
): Promise<{
  width: number;
  height: number;
  duration: number;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        size: file.size,
      });
    };

    video.onerror = () => reject(new Error('Failed to load video metadata'));
    video.src = URL.createObjectURL(file);
  });
};

export const generateVideoThumbnail = (
  file: File,
  timePoint: number = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = timePoint;
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(thumbnailUrl);
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
};

export const compressMultipleVideos = async (
  files: File[],
  options: VideoCompressionOptions = {
    maxSizeInMB: 10,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
  }
): Promise<VideoCompressionResult[]> => {
  const results: VideoCompressionResult[] = [];

  for (const file of files) {
    try {
      const result = await compressVideo(file, options);
      results.push(result);
    } catch (error) {
      console.error('Error compressing video:', error);
      // Continue with next file
    }
  }

  return results;
};
