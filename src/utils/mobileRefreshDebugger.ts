// 📱🔍 Mobile Refresh Debugger
// Diagnostický nástroj pre identifikáciu príčin automatického refreshovania na mobile

interface RefreshEvent {
  timestamp: number;
  trigger: string;
  location: string;
  userAgent: string;
  viewport: { width: number; height: number };
  memoryInfo?: any;
  networkInfo?: any;
  stackTrace?: string;
}

class MobileRefreshDebugger {
  private events: RefreshEvent[] = [];
  private isEnabled: boolean = false;
  private originalReload: () => void;
  private originalAssign: (url: string) => void;

  constructor() {
    this.originalReload = window.location.reload.bind(window.location);
    this.originalAssign = ((url: string) => { window.location.href = url; }).bind(window.location);
    
    // Aktivuj len na mobile alebo v development
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isMobile || isDev) {
      this.enable();
    }
  }

  enable() {
    if (this.isEnabled) return;
    this.isEnabled = true;

    console.log('🔍 Mobile Refresh Debugger ENABLED');

    // Intercept window.location.reload
    window.location.reload = () => {
      this.logRefreshEvent('window.location.reload()');
      
      // V development mode - pozastavíme refresh a zobrazíme alert
      if (process.env.NODE_ENV === 'development') {
        const shouldContinue = confirm(
          '🚨 REFRESH DETECTED!\n\n' +
          'Trigger: window.location.reload()\n' +
          'Location: ' + window.location.pathname + '\n\n' +
          'Chcete pokračovať v refreshi? (Cancel = zastaviť pre debugging)'
        );
        
        if (!shouldContinue) {
          console.log('🛑 Refresh cancelled for debugging');
          console.log('📊 Debug info:', this.getLastEvent());
          return;
        }
      }
      
      this.originalReload();
    };

    // Intercept window.location.href assignments
    Object.defineProperty(window.location, 'href', {
      set: (url: string) => {
        this.logRefreshEvent(`window.location.href = "${url}"`);
        
        // V development mode - pozastavíme redirect
        if (process.env.NODE_ENV === 'development' && url !== window.location.href) {
          const shouldContinue = confirm(
            '🚨 REDIRECT DETECTED!\n\n' +
            'Trigger: window.location.href assignment\n' +
            'From: ' + window.location.href + '\n' +
            'To: ' + url + '\n\n' +
            'Chcete pokračovať? (Cancel = zastaviť pre debugging)'
          );
          
          if (!shouldContinue) {
            console.log('🛑 Redirect cancelled for debugging');
            console.log('📊 Debug info:', this.getLastEvent());
            return;
          }
        }
        
        this.originalAssign(url);
      },
      configurable: true
    });

    // Monitor for unhandled errors that might trigger ErrorBoundary
    window.addEventListener('error', (event) => {
      console.log('🚨 Unhandled error detected:', event.error);
      this.logRefreshEvent('Unhandled Error: ' + event.error?.message, event.error?.stack);
    });

    // Monitor for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.log('🚨 Unhandled promise rejection:', event.reason);
      this.logRefreshEvent('Unhandled Promise Rejection: ' + event.reason);
    });

    // Monitor memory pressure (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        if (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit > 0.9) {
          console.warn('⚠️ High memory usage detected:', {
            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB',
            percentage: Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100) + '%'
          });
        }
      }, 10000); // Check every 10 seconds
    }

    // Monitor Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SKIP_WAITING') {
          this.logRefreshEvent('Service Worker Update: SKIP_WAITING message');
        }
      });
    }

    // Log initial state
    this.logRefreshEvent('Debugger Initialized');
  }

  private logRefreshEvent(trigger: string, stackTrace?: string) {
    const event: RefreshEvent = {
      timestamp: Date.now(),
      trigger,
      location: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      stackTrace: stackTrace || new Error().stack
    };

    // Add memory info if available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      event.memoryInfo = {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      };
    }

    // Add network info if available
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      event.networkInfo = {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }

    this.events.push(event);

    // Keep only last 50 events
    if (this.events.length > 50) {
      this.events = this.events.slice(-50);
    }

    // Log to console
    console.group('🔍 Mobile Refresh Event');
    console.log('Trigger:', trigger);
    console.log('Location:', event.location);
    console.log('Viewport:', event.viewport);
    console.log('Memory:', event.memoryInfo);
    console.log('Network:', event.networkInfo);
    if (stackTrace) {
      console.log('Stack Trace:', stackTrace);
    }
    console.groupEnd();

    // Save to localStorage for persistence
    try {
      localStorage.setItem('mobile_refresh_debug_events', JSON.stringify(this.events));
    } catch (e) {
      console.warn('Could not save debug events to localStorage:', e);
    }
  }

  getLastEvent(): RefreshEvent | null {
    return this.events[this.events.length - 1] || null;
  }

  getAllEvents(): RefreshEvent[] {
    return [...this.events];
  }

  getEventsReport(): string {
    if (this.events.length === 0) {
      return 'No refresh events recorded.';
    }

    let report = `📊 Mobile Refresh Debug Report (${this.events.length} events)\n\n`;
    
    // Group by trigger
    const triggerGroups: { [key: string]: RefreshEvent[] } = {};
    this.events.forEach(event => {
      const triggerKey = event.trigger.split(':')[0];
      if (!triggerGroups[triggerKey]) {
        triggerGroups[triggerKey] = [];
      }
      triggerGroups[triggerKey].push(event);
    });

    Object.entries(triggerGroups).forEach(([trigger, events]) => {
      report += `🔸 ${trigger}: ${events.length} times\n`;
      events.slice(-3).forEach(event => {
        const date = new Date(event.timestamp).toLocaleString();
        report += `  - ${date} at ${event.location}\n`;
      });
      report += '\n';
    });

    return report;
  }

  disable() {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    // Restore original functions
    window.location.reload = this.originalReload;
    
    console.log('🔍 Mobile Refresh Debugger DISABLED');
  }

  // Export debug data
  exportDebugData(): string {
    return JSON.stringify({
      events: this.events,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      timestamp: Date.now(),
      url: window.location.href
    }, null, 2);
  }
}

// Global instance
export const mobileRefreshDebugger = new MobileRefreshDebugger();

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).mobileRefreshDebugger = mobileRefreshDebugger;
}

// Utility function to check debug events from console
export const getRefreshDebugReport = () => {
  console.log(mobileRefreshDebugger.getEventsReport());
  return mobileRefreshDebugger.getAllEvents();
};

// Add to window
if (typeof window !== 'undefined') {
  (window as any).getRefreshDebugReport = getRefreshDebugReport;
}
