/**
 * 🎨 IMAGE OPTIMIZATION UTILITIES
 *
 * Utilities pre optimalizáciu a transformáciu obrázkov
 */

/**
 * Generuje rôzne kvalitné verzie URL obrázka
 */
export const generateImageSizes = (
  baseUrl: string,
  sizes: { width: number; height: number; quality?: number }[]
) => {
  const urlParts = baseUrl.split('.');
  const extension = urlParts.pop() || 'jpg';
  const basePath = urlParts.join('.');

  return sizes.map(({ width, height, quality = 80 }) => ({
    url: `${basePath}_${width}x${height}_q${quality}.${extension}`,
    width,
    height,
    quality,
    descriptor: `${width}w`,
  }));
};

/**
 * Vytvorí low-quality placeholder URL
 */
export const createLowQualityUrl = (url: string, quality = 10): string => {
  const urlParts = url.split('.');
  const extension = urlParts.pop();
  const basePath = urlParts.join('.');

  return `${basePath}_lq${quality}.${extension}`;
};

/**
 * Detekuje či je obrázok webp podporovaný
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Konvertuje URL na optimalizované formáty
 */
export const optimizeImageUrl = async (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png' | 'auto';
  } = {}
): Promise<string> => {
  const { width, height, quality = 80, format = 'auto' } = options;

  // Ak je format auto, detekuj najlepší podporovaný formát
  let targetFormat = format;
  if (format === 'auto') {
    const webpSupported = await supportsWebP();
    targetFormat = webpSupported ? 'webp' : 'jpg';
  }

  const urlParts = url.split('.');
  // const extension = urlParts.pop();
  const basePath = urlParts.join('.');

  let optimizedUrl = basePath;

  if (width && height) {
    optimizedUrl += `_${width}x${height}`;
  }

  if (quality !== 80) {
    optimizedUrl += `_q${quality}`;
  }

  optimizedUrl += `.${targetFormat}`;

  return optimizedUrl;
};

/**
 * Responsive image srcset generator
 */
export const createResponsiveSrcSet = (
  baseUrl: string,
  breakpoints: { width: number; quality?: number }[] = [
    { width: 320, quality: 70 },
    { width: 768, quality: 80 },
    { width: 1024, quality: 85 },
    { width: 1440, quality: 90 },
  ]
): string => {
  return breakpoints
    .map(({ width, quality = 80 }) => {
      const urlParts = baseUrl.split('.');
      const extension = urlParts.pop();
      const basePath = urlParts.join('.');

      const optimizedUrl = `${basePath}_${width}_q${quality}.${extension}`;
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
};

/**
 * Preload critical images
 */
export const preloadCriticalImages = (imageUrls: string[]): void => {
  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Image intersection observer pre bulk lazy loading
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver | null = null;
  // private imageQueue: Set<HTMLImageElement> = new Set();
  private loadedImages: Set<string> = new Set();

  constructor(
    options: {
      threshold?: number;
      rootMargin?: string;
      concurrent?: number;
    } = {}
  ) {
    const { threshold = 0.1, rootMargin = '50px' } = options;

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        { threshold, rootMargin }
      );
    }
  }

  private async handleIntersection(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;

        if (src && !this.loadedImages.has(src)) {
          this.loadedImages.add(src);
          await this.loadImage(img, src);
          this.observer?.unobserve(img);
        }
      }
    }
  }

  private loadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();

      tempImg.onload = () => {
        img.src = src;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
        resolve();
      };

      tempImg.onerror = () => {
        img.classList.add('lazy-error');
        reject(new Error(`Failed to load: ${src}`));
      };

      tempImg.src = src;
    });
  }

  observe(img: HTMLImageElement): void {
    if (this.observer && img.dataset.src) {
      img.classList.add('lazy-loading');
      this.observer.observe(img);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Vehicle image utility functions
 */
export const VehicleImageUtils = {
  /**
   * Generuje URL pre vehicle obrázok v rôznych veľkostiach
   */
  getVehicleImageUrl: (
    vehicleId: string,
    size: 'thumbnail' | 'card' | 'detail' | 'fullsize' = 'card'
  ): string => {
    const sizeConfigs = {
      thumbnail: { width: 100, height: 75, quality: 70 },
      card: { width: 300, height: 200, quality: 80 },
      detail: { width: 600, height: 400, quality: 85 },
      fullsize: { width: 1200, height: 800, quality: 90 },
    };

    const config = sizeConfigs[size];
    return `/api/vehicles/${vehicleId}/image?w=${config.width}&h=${config.height}&q=${config.quality}`;
  },

  /**
   * Generuje placeholder pre vehicle obrázok
   */
  getVehiclePlaceholder: (vehicleType?: string, color?: string): string => {
    const defaultColor = color || '#E0E0E0';
    const vehicleIcon = vehicleType === 'truck' ? '🚛' : '🚗';

    // SVG placeholder
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${defaultColor}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
              font-size="48" fill="#999">${vehicleIcon}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  },

  /**
   * Vytvorí responsive srcset pre vehicle obrázok
   */
  createVehicleSrcSet: (vehicleId: string): string => {
    return createResponsiveSrcSet(`/api/vehicles/${vehicleId}/image`, [
      { width: 300, quality: 75 },
      { width: 600, quality: 80 },
      { width: 900, quality: 85 },
    ]);
  },
};

/**
 * Performance monitoring pre image loading
 */
export const ImagePerformanceMonitor = {
  startTime: performance.now(),
  loadedImages: 0,
  failedImages: 0,

  onImageLoad: (url: string, loadTime: number) => {
    ImagePerformanceMonitor.loadedImages++;
    console.log(`🖼️ Image loaded: ${url} (${loadTime.toFixed(2)}ms)`);
  },

  onImageError: (url: string, error: unknown) => {
    ImagePerformanceMonitor.failedImages++;
    console.error(`❌ Image failed: ${url}`, error);
  },

  getStats: () => {
    const totalTime = performance.now() - ImagePerformanceMonitor.startTime;
    return {
      totalImages:
        ImagePerformanceMonitor.loadedImages +
        ImagePerformanceMonitor.failedImages,
      loadedImages: ImagePerformanceMonitor.loadedImages,
      failedImages: ImagePerformanceMonitor.failedImages,
      successRate:
        (
          (ImagePerformanceMonitor.loadedImages /
            (ImagePerformanceMonitor.loadedImages +
              ImagePerformanceMonitor.failedImages)) *
          100
        ).toFixed(2) + '%',
      totalTime: totalTime.toFixed(2) + 'ms',
    };
  },
};
