// 🎯 Critical Resources Management
// Advanced preloading, prefetching, and resource optimization

interface ResourcePriority {
  critical: string[];
  important: string[];
  normal: string[];
  low: string[];
}

interface PreloadOptions {
  as: string;
  type?: string;
  crossOrigin?: string;
  media?: string;
  priority?: 'high' | 'low' | 'auto';
}

class CriticalResourceManager {
  private preloadedResources = new Set<string>();
  private prefetchedResources = new Set<string>();
  private loadingResources = new Map<string, Promise<void>>();

  // Resource priorities configuration
  private resourcePriorities: ResourcePriority = {
    critical: [
      // Critical fonts for FOIT prevention
      '/assets/fonts/inter-regular.woff2',
      '/assets/fonts/inter-semibold.woff2',
      // Critical images above the fold
      '/logo192.png',
      '/favicon.ico',
    ],
    important: [
      // Above-the-fold icons
      '/assets/fonts/aeonik-bold.woff2',
      // Critical CSS chunks
      '/static/css/main.css',
    ],
    normal: [
      // Main JS chunks
      '/static/js/main.js',
      '/static/js/vendor.js',
    ],
    low: [
      // Non-critical icons and images
      '/logo512.png',
      // Analytics and tracking scripts
    ],
  };

  // Preload critical resources
  preloadResource(href: string, options: PreloadOptions): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve();
    }

    if (this.loadingResources.has(href)) {
      return this.loadingResources.get(href)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = options.as;

      if (options.type) link.type = options.type;
      if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
      if (options.media) link.media = options.media;

      // Modern browsers support fetchpriority
      if (options.priority && 'fetchPriority' in link) {
        (link as any).fetchPriority = options.priority;
      }

      link.onload = () => {
        this.preloadedResources.add(href);
        this.loadingResources.delete(href);
        resolve();
      };

      link.onerror = () => {
        this.loadingResources.delete(href);
        reject(new Error(`Failed to preload resource: ${href}`));
      };

      document.head.appendChild(link);
    });

    this.loadingResources.set(href, promise);
    return promise;
  }

  // Prefetch resources for future navigation
  prefetchResource(href: string): Promise<void> {
    if (this.prefetchedResources.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;

      link.onload = () => {
        this.prefetchedResources.add(href);
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to prefetch resource: ${href}`));
      };

      document.head.appendChild(link);
    });
  }

  // DNS prefetch for external domains
  dnsPrefetch(domain: string): void {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  }

  // Preconnect to critical origins
  preconnect(origin: string, crossOrigin: boolean = false): void {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  // Initialize critical resource loading
  async initializeCriticalResources(): Promise<void> {
    console.log('🚀 Initializing critical resource loading...');

    try {
      // 1. DNS prefetch for external domains
      const externalDomains = [
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'api.blackrent.sk',
      ];

      externalDomains.forEach(domain => this.dnsPrefetch(domain));

      // 2. Preconnect to critical origins
      const criticalOrigins = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ];

      criticalOrigins.forEach(origin => this.preconnect(origin, true));

      // 3. Load critical resources in priority order
      await this.loadResourcesByPriority();

      console.log('✅ Critical resources initialized');
    } catch (error) {
      console.error('❌ Failed to initialize critical resources:', error);
    }
  }

  // Load resources by priority
  private async loadResourcesByPriority(): Promise<void> {
    // Critical resources (load immediately, block rendering if necessary)
    const criticalPromises = this.resourcePriorities.critical.map(href => {
      const options = this.getPreloadOptions(href);
      return this.preloadResource(href, options);
    });

    await Promise.allSettled(criticalPromises);

    // Important resources (load with high priority but don't block)
    const importantPromises = this.resourcePriorities.important.map(href => {
      const options = this.getPreloadOptions(href);
      return this.preloadResource(href, { ...options, priority: 'high' });
    });

    // Normal resources (load after critical)
    setTimeout(() => {
      this.resourcePriorities.normal.forEach(href => {
        const options = this.getPreloadOptions(href);
        this.preloadResource(href, options);
      });
    }, 100);

    // Low priority resources (load when idle)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.resourcePriorities.low.forEach(href => {
          this.prefetchResource(href);
        });
      });
    } else {
      setTimeout(() => {
        this.resourcePriorities.low.forEach(href => {
          this.prefetchResource(href);
        });
      }, 2000);
    }

    await Promise.allSettled(importantPromises);
  }

  // Get preload options for different resource types
  private getPreloadOptions(href: string): PreloadOptions {
    const extension = href.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'woff2':
      case 'woff':
      case 'ttf':
        return {
          as: 'font',
          type: `font/${extension}`,
          crossOrigin: 'anonymous',
        };

      case 'css':
        return {
          as: 'style',
          type: 'text/css',
        };

      case 'js':
        return {
          as: 'script',
          type: 'text/javascript',
        };

      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'svg':
        return {
          as: 'image',
          type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        };

      default:
        return { as: 'fetch' };
    }
  }

  // Preload route chunks for SPA navigation
  preloadRouteChunk(routePath: string): Promise<void> {
    // Map route paths to chunk files
    const routeChunks: { [key: string]: string } = {
      '/vehicles': '/static/js/vehicles.chunk.js',
      '/rentals': '/static/js/rentals.chunk.js',
      '/customers': '/static/js/customers.chunk.js',
      '/availability': '/static/js/availability.chunk.js',
      '/statistics': '/static/js/statistics.chunk.js',
    };

    const chunkFile = routeChunks[routePath];
    if (chunkFile) {
      return this.preloadResource(chunkFile, { as: 'script' });
    }

    return Promise.resolve();
  }

  // Get loading statistics
  getLoadingStats() {
    return {
      preloaded: this.preloadedResources.size,
      prefetched: this.prefetchedResources.size,
      loading: this.loadingResources.size,
      preloadedList: Array.from(this.preloadedResources),
      prefetchedList: Array.from(this.prefetchedResources),
    };
  }

  // Clear all cached resources (for testing)
  clearCache(): void {
    this.preloadedResources.clear();
    this.prefetchedResources.clear();
    this.loadingResources.clear();
  }
}

// Critical CSS utilities
export class CriticalCSSManager {
  private inlinedCSS = new Set<string>();

  // Inline critical CSS for above-the-fold content
  inlineCriticalCSS(): void {
    const criticalCSS = this.generateCriticalCSS();
    
    if (criticalCSS && !this.inlinedCSS.has('critical')) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
      this.inlinedCSS.add('critical');
    }
  }

  // Generate critical CSS (above-the-fold styles)
  private generateCriticalCSS(): string {
    return `
      /* Critical path CSS - Above the fold styles */
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.6;
        color: #0f172a;
        background: #fafbfc;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* Header styles */
      .header, .MuiAppBar-root {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(102, 126, 234, 0.1);
        z-index: 1100;
      }
      
      /* Main content area */
      .main-content {
        margin-top: 64px;
        min-height: calc(100vh - 64px);
      }
      
      /* Loading states */
      .loading-spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 3px solid #f1f5f9;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Skeleton loading */
      .skeleton {
        background: linear-gradient(
          90deg,
          rgba(241, 245, 249, 0.8) 0px,
          rgba(102, 126, 234, 0.1) 40px,
          rgba(241, 245, 249, 0.8) 80px
        );
        background-size: 468px 104px;
        animation: shimmer 1.6s ease-in-out infinite;
      }
      
      @keyframes shimmer {
        0% { background-position: -468px 0; }
        100% { background-position: 468px 0; }
      }
      
      /* Critical card styles */
      .card, .MuiCard-root {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      }
      
      /* Critical button styles */
      .button, .MuiButton-root {
        border-radius: 12px;
        font-weight: 600;
        text-transform: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .button-contained, .MuiButton-contained {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }
      
      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        margin: 0;
        font-weight: 600;
        line-height: 1.2;
        color: #0f172a;
      }
      
      /* Prevent layout shift */
      img:not([width]):not([height]) {
        aspect-ratio: 16/9;
        width: 100%;
        height: auto;
      }
      
      /* Font loading optimization */
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        font-style: normal;
        font-weight: 400;
        src: url('/assets/fonts/inter-regular.woff2') format('woff2');
      }
      
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        font-style: normal;
        font-weight: 600;
        src: url('/assets/fonts/inter-semibold.woff2') format('woff2');
      }
    `;
  }

  // Load non-critical CSS asynchronously
  loadNonCriticalCSS(): void {
    const nonCriticalCSS = [
      '/static/css/components.css',
      '/static/css/utilities.css',
    ];

    nonCriticalCSS.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      link.onload = () => {
        (link as HTMLLinkElement).onload = null;
        (link as HTMLLinkElement).rel = 'stylesheet';
      };
      document.head.appendChild(link);
    });
  }
}

// Export singleton instances
export const criticalResourceManager = new CriticalResourceManager();
export const criticalCSSManager = new CriticalCSSManager();

// Initialize critical resources when DOM is ready
export const initializeCriticalResources = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      criticalCSSManager.inlineCriticalCSS();
      criticalResourceManager.initializeCriticalResources();
    });
  } else {
    criticalCSSManager.inlineCriticalCSS();
    criticalResourceManager.initializeCriticalResources();
  }

  // Load non-critical resources after page load
  window.addEventListener('load', () => {
    criticalCSSManager.loadNonCriticalCSS();
  });
};

export default {
  criticalResourceManager,
  criticalCSSManager,
  initializeCriticalResources,
};