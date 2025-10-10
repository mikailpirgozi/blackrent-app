/**
 * WebP Support Detection
 * 
 * Detekuje či prehliadač podporuje WebP formát
 * Cache result pre performance
 */

let webpSupported: boolean | null = null;

/**
 * Check if browser supports WebP images
 * 
 * @returns Promise that resolves to true if WebP is supported
 */
export async function isWebPSupported(): Promise<boolean> {
  // Return cached result if available
  if (webpSupported !== null) {
    return webpSupported;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      // Check if image dimensions are correct (1x1 pixel)
      webpSupported = img.width === 1 && img.height === 1;
      resolve(webpSupported);
    };

    img.onerror = () => {
      webpSupported = false;
      resolve(false);
    };

    // Small 1x1 WebP image in base64
    img.src =
      'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
}

/**
 * Get cached WebP support status
 * Returns null if not yet checked
 */
export function getWebPSupportSync(): boolean | null {
  return webpSupported;
}

/**
 * Reset cached value (useful for testing)
 */
export function resetWebPSupport(): void {
  webpSupported = null;
}

