// ⚡ Web Vitals Optimizations
// Advanced techniques to improve LCP, FID, CLS, and overall performance scores

// Largest Contentful Paint (LCP) optimizations
export const optimizeLCP = () => {
  // Preload critical resources
  const preloadCriticalResources = () => {
    // Preload critical fonts
    const fonts = [
      '/assets/fonts/aeonik-bold.woff2',
      '/assets/fonts/aeonik-regular.woff2',
    ];
    
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Preload critical images
    const criticalImages = document.querySelectorAll('img[data-critical="true"]');
    criticalImages.forEach((img: any) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.src || img.dataset.src;
      document.head.appendChild(link);
    });
  };

  // Optimize images with proper sizing
  const optimizeImages = () => {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      // Add loading="lazy" for non-critical images
      if (!img.hasAttribute('data-critical')) {
        img.loading = 'lazy';
      }

      // Add proper sizes attribute for responsive images
      if (img.hasAttribute('srcset') && !img.hasAttribute('sizes')) {
        img.setAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
      }

      // Decode images asynchronously
      if ('decoding' in img) {
        img.decoding = 'async';
      }
    });
  };

  // Remove unused CSS
  const removeUnusedCSS = () => {
    // This would typically be done at build time, but we can help at runtime
    const stylesheets = Array.from(document.styleSheets);
    stylesheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        let unusedRules = 0;
        
        rules.forEach((rule: any) => {
          if (rule.selectorText) {
            const elements = document.querySelectorAll(rule.selectorText);
            if (elements.length === 0) {
              unusedRules++;
            }
          }
        });
        
        if (process.env.NODE_ENV === 'development' && unusedRules > 0) {
          console.log(`📊 Stylesheet ${sheet.href} has ${unusedRules} potentially unused rules`);
        }
      } catch (e) {
        // CORS or other issues accessing stylesheet
      }
    });
  };

  return {
    preloadCriticalResources,
    optimizeImages,
    removeUnusedCSS,
  };
};

// First Input Delay (FID) optimizations
export const optimizeFID = () => {
  // Break up long tasks
  const breakUpLongTasks = () => {
    // Use scheduler.postTask if available, otherwise use setTimeout
    const scheduleWork = (callback: () => void, priority: 'user-blocking' | 'user-visible' | 'background' = 'user-visible') => {
      if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
        (window as any).scheduler.postTask(callback, { priority });
      } else {
        setTimeout(callback, 0);
      }
    };

    return { scheduleWork };
  };

  // Optimize event handlers
  const optimizeEventHandlers = () => {
    // Debounce scroll events
    const debouncedHandlers = new Map();
    
    const addDebouncedListener = (
      element: Element,
      event: string,
      handler: Function,
      delay: number = 16
    ) => {
      const key = `${element}_${event}`;
      
      if (debouncedHandlers.has(key)) {
        element.removeEventListener(event, debouncedHandlers.get(key));
      }
      
      let timeout: NodeJS.Timeout;
      const debouncedHandler = (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => handler.apply(null, args), delay);
      };
      
      debouncedHandlers.set(key, debouncedHandler);
      element.addEventListener(event, debouncedHandler, { passive: true });
    };

    // Use passive listeners for touch events
    const addPassiveListener = (element: Element, event: string, handler: Function) => {
      element.addEventListener(event, handler as EventListener, { passive: true });
    };

    return { addDebouncedListener, addPassiveListener };
  };

  // Preload JavaScript modules
  const preloadModules = () => {
    const tryPreloadFromManifest = async () => {
      try {
        const res = await fetch('/asset-manifest.json', { cache: 'no-store' });
        if (!res.ok) return;
        const manifest = await res.json();
        const modules: string[] = [];

        if (Array.isArray(manifest.entrypoints)) {
          manifest.entrypoints
            .filter((p: string) => p.endsWith('.js'))
            .forEach((p: string) => modules.push(p));
        } else if (manifest.files) {
          for (const key of Object.keys(manifest.files)) {
            if (key.endsWith('.js')) {
              modules.push(manifest.files[key]);
            }
          }
        }

        Array.from(new Set(modules)).forEach((module) => {
          const link = document.createElement('link');
          link.rel = 'modulepreload';
          link.href = module;
          document.head.appendChild(link);
        });
      } catch (_) {
        // nič – ak manifest nie je dostupný, nepreloadujeme
      }
    };

    // spusti asynchrónne, neblokovať
    void tryPreloadFromManifest();
  };

  return {
    breakUpLongTasks,
    optimizeEventHandlers,
    preloadModules,
  };
};

// Cumulative Layout Shift (CLS) optimizations
export const optimizeCLS = () => {
  // Reserve space for images
  const reserveImageSpace = () => {
    const images = document.querySelectorAll('img:not([width]):not([height])');
    
    images.forEach((img: any) => {
      // Set aspect ratio to prevent layout shift
      img.style.aspectRatio = '16 / 9'; // Default aspect ratio
      img.style.width = '100%';
      img.style.height = 'auto';
      
      // If we know the dimensions, use them
      if (img.naturalWidth && img.naturalHeight) {
        img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      }
    });
  };

  // Prevent font loading layout shifts
  const preventFontLayoutShifts = () => {
    // Use font-display: swap for web fonts
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Aeonik';
        font-display: swap;
      }
    `;
    document.head.appendChild(style);

    // Preload critical fonts
    const fonts = [
      { family: 'Inter', weight: '400', src: '/assets/fonts/inter-regular.woff2' },
      { family: 'Inter', weight: '600', src: '/assets/fonts/inter-semibold.woff2' },
      { family: 'Aeonik', weight: '700', src: '/assets/fonts/aeonik-bold.woff2' },
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.href = font.src;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // Reserve space for dynamic content
  const reserveDynamicContentSpace = () => {
    // Add skeleton placeholders for loading content
    const loadingContainers = document.querySelectorAll('[data-loading-placeholder]');
    
    loadingContainers.forEach((container: any) => {
      if (!container.style.minHeight) {
        const expectedHeight = container.dataset.loadingPlaceholder || '200px';
        container.style.minHeight = expectedHeight;
      }
    });
  };

  // Optimize animations
  const optimizeAnimations = () => {
    // Use transform instead of changing layout properties
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    animatedElements.forEach((element: any) => {
      // Promote to composite layer
      element.style.willChange = 'transform';
      element.style.transform = 'translateZ(0)';
      
      // Use CSS containment
      element.style.contain = 'layout style paint';
    });
  };

  return {
    reserveImageSpace,
    preventFontLayoutShifts,
    reserveDynamicContentSpace,
    optimizeAnimations,
  };
};

// Overall performance optimizations
export const optimizeOverallPerformance = () => {
  // Resource hints
  const addResourceHints = () => {
    // DNS prefetch for external domains
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdn.jsdelivr.net',
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect to critical origins
    const criticalOrigins = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    criticalOrigins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // Intersection Observer optimizations
  const optimizeIntersectionObserver = () => {
    // Use a single intersection observer for all lazy-loaded elements
    const lazyElements = document.querySelectorAll('[data-lazy]');
    
    if (lazyElements.length > 0) {
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as any;
              
              // Load image
              if (element.dataset.src) {
                element.src = element.dataset.src;
                element.removeAttribute('data-src');
              }
              
              // Load srcset
              if (element.dataset.srcset) {
                element.srcset = element.dataset.srcset;
                element.removeAttribute('data-srcset');
              }
              
              element.removeAttribute('data-lazy');
              imageObserver.unobserve(element);
            }
          });
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.01,
        }
      );

      lazyElements.forEach((element) => {
        imageObserver.observe(element);
      });
    }
  };

  // Critical CSS inlining
  const inlineCriticalCSS = () => {
    // This would typically be done at build time
    const criticalCSS = `
      /* Critical above-the-fold styles */
      body { margin: 0; font-family: Inter, sans-serif; }
      .header { position: fixed; top: 0; width: 100%; z-index: 1000; }
      .main-content { margin-top: 64px; }
      .loading-spinner { 
        display: inline-block; 
        width: 40px; 
        height: 40px; 
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  };

  return {
    addResourceHints,
    optimizeIntersectionObserver,
    inlineCriticalCSS,
  };
};

// Initialize all optimizations
export const initializeWebVitalsOptimizations = () => {
  const lcpOptimizations = optimizeLCP();
  const fidOptimizations = optimizeFID();
  const clsOptimizations = optimizeCLS();
  const overallOptimizations = optimizeOverallPerformance();

  // Execute optimizations in the correct order
  const executeOptimizations = () => {
    // Critical resource preloading (should happen first)
    overallOptimizations.addResourceHints();
    lcpOptimizations.preloadCriticalResources();
    
    // DOM ready optimizations
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        clsOptimizations.reserveImageSpace();
        clsOptimizations.preventFontLayoutShifts();
        overallOptimizations.inlineCriticalCSS();
      });
    } else {
      clsOptimizations.reserveImageSpace();
      clsOptimizations.preventFontLayoutShifts();
      overallOptimizations.inlineCriticalCSS();
    }

    // Window load optimizations
    window.addEventListener('load', () => {
      lcpOptimizations.optimizeImages();
      clsOptimizations.optimizeAnimations();
      overallOptimizations.optimizeIntersectionObserver();
      fidOptimizations.preloadModules();
      
      // Background optimizations (low priority)
      setTimeout(() => {
        lcpOptimizations.removeUnusedCSS();
      }, 2000);
    });
  };

  // Start optimizations
  executeOptimizations();

  return {
    lcpOptimizations,
    fidOptimizations,
    clsOptimizations,
    overallOptimizations,
  };
};

export default {
  optimizeLCP,
  optimizeFID,
  optimizeCLS,
  optimizeOverallPerformance,
  initializeWebVitalsOptimizations,
};