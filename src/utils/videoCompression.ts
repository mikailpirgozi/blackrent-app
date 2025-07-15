export interface VideoCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSize?: number; // max size in MB
  maxDuration?: number; // max duration in seconds
  frameRate?: number;
  bitRate?: number;
}

export interface VideoCompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  duration: number;
  thumbnailUrl?: string;
}

export const compressVideo = async (
  file: File,
  options: VideoCompressionOptions = {}
): Promise<VideoCompressionResult> => {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.7,
    maxSize = 10, // 10MB
    maxDuration = 30, // 30 seconds
    frameRate = 30,
    bitRate = 1000000 // 1Mbps
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate new dimensions
      let { videoWidth: width, videoHeight: height } = video;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Calculate duration (limit if needed)
      const duration = Math.min(video.duration, maxDuration);
      
      // Use MediaRecorder for compression
      const stream = canvas.captureStream(frameRate);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: bitRate
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        
        // Generate thumbnail
        video.currentTime = 0;
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, width, height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          resolve({
            compressedBlob,
            originalSize: file.size,
            compressedSize: compressedBlob.size,
            compressionRatio: ((file.size - compressedBlob.size) / file.size) * 100,
            width,
            height,
            duration,
            thumbnailUrl
          });
        };
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      // Start recording
      mediaRecorder.start();
      
      // Play video and draw frames
      let startTime = 0;
      video.currentTime = startTime;
      
      const drawFrame = () => {
        if (video.currentTime >= duration) {
          mediaRecorder.stop();
          return;
        }
        
        ctx.drawImage(video, 0, 0, width, height);
        
        video.currentTime += 1 / frameRate;
        requestAnimationFrame(drawFrame);
      };

      video.onseeked = () => {
        drawFrame();
      };
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
};

export const getVideoMetadata = (file: File): Promise<{
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
        size: file.size
      });
    };
    
    video.onerror = () => reject(new Error('Failed to load video metadata'));
    video.src = URL.createObjectURL(file);
  });
};

export const generateVideoThumbnail = (file: File, timePoint: number = 0): Promise<string> => {
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
  options: VideoCompressionOptions = {}
): Promise<VideoCompressionResult[]> => {
  const results: VideoCompressionResult[] = [];
  
  for (const file of files) {
    try {
      const result = await compressVideo(file, options);
      results.push(result);
    } catch (error) {
      console.error('Error compressing video:', error);
      // Continue with other videos even if one fails
    }
  }
  
  return results;
}; 