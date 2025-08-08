// 📱 Mobile Logger - Detailná diagnostika pre mobile problémy
// Zachytáva všetky eventy, errory a state changes

interface LogEntry {
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  viewport?: { width: number; height: number };
  memory?: any;
}

class MobileLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 200;
  private isMobile = false;
  private startTime = Date.now();

  constructor() {
    this.isMobile = this.detectMobile();
    this.initializeErrorHandlers();
    this.initializePerformanceMonitoring();
    this.initializeNavigationTracking();
    
    this.log('INFO', 'MobileLogger', 'Mobile Logger initialized', {
      isMobile: this.isMobile,
      userAgent: navigator.userAgent,
      viewport: this.getViewport(),
      memory: this.getMemoryInfo()
    });
  }

  private detectMobile(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isMobileViewport = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || isMobileViewport || isTouchDevice;
  }

  private getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }

  private getMemoryInfo() {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
        total: Math.round(mem.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  private initializeErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.log('ERROR', 'GlobalError', 'JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('ERROR', 'UnhandledPromise', 'Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.log('INFO', 'Visibility', `Page ${document.hidden ? 'hidden' : 'visible'}`, {
        hidden: document.hidden,
        visibilityState: document.visibilityState
      });
    });

    // Before unload
    window.addEventListener('beforeunload', (event) => {
      this.log('WARN', 'Navigation', 'Page unloading', {
        type: 'beforeunload',
        returnValue: event.returnValue
      });
      this.flushLogsToStorage();
    });

    // Page hide (better than beforeunload on mobile)
    window.addEventListener('pagehide', (event) => {
      this.log('WARN', 'Navigation', 'Page hide', {
        type: 'pagehide',
        persisted: event.persisted
      });
      this.flushLogsToStorage();
    });
  }

  private initializePerformanceMonitoring() {
    // Monitor memory usage every 10 seconds
    setInterval(() => {
      if (this.isMobile) {
        const memory = this.getMemoryInfo();
        if (memory && memory.used > 50) { // Log if over 50MB
          this.log('WARN', 'Memory', 'High memory usage detected', memory);
        }
      }
    }, 10000);

    // Monitor performance entries
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) { // Log slow operations
              this.log('WARN', 'Performance', `Slow operation: ${entry.name}`, {
                duration: entry.duration,
                startTime: entry.startTime,
                entryType: entry.entryType
              });
            }
          }
        });
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        this.log('WARN', 'Performance', 'PerformanceObserver not supported', { error: e });
      }
    }
  }

  private initializeNavigationTracking() {
    // Track hash changes
    window.addEventListener('hashchange', (event) => {
      this.log('INFO', 'Navigation', 'Hash change', {
        oldURL: event.oldURL,
        newURL: event.newURL
      });
    });

    // Track popstate (back/forward)
    window.addEventListener('popstate', (event) => {
      this.log('INFO', 'Navigation', 'Popstate', {
        state: event.state,
        url: window.location.href
      });
    });
  }

  public log(level: LogEntry['level'], category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: this.getViewport(),
      memory: this.getMemoryInfo()
    };

    // Add stack trace for errors
    if (level === 'ERROR' || level === 'CRITICAL') {
      entry.stackTrace = new Error().stack;
    }

    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with emoji for visibility
    const emoji = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      CRITICAL: '🚨'
    }[level];

    const timeFromStart = Date.now() - this.startTime;
    console.log(`${emoji} [${level}] [+${timeFromStart}ms] [${category}] ${message}`, data || '');

    // Store critical logs immediately
    if (level === 'ERROR' || level === 'CRITICAL') {
      this.flushLogsToStorage();
    }
  }

  public logModalEvent(modalName: string, action: string, data?: any) {
    this.log('INFO', 'Modal', `${modalName} - ${action}`, {
      modalName,
      action,
      ...data
    });
  }

  public logFormEvent(formName: string, action: string, data?: any) {
    this.log('INFO', 'Form', `${formName} - ${action}`, {
      formName,
      action,
      ...data
    });
  }

  public logApiCall(endpoint: string, method: string, status?: number, error?: any) {
    const level = error ? 'ERROR' : status && status >= 400 ? 'WARN' : 'INFO';
    this.log(level, 'API', `${method} ${endpoint}`, {
      endpoint,
      method,
      status,
      error: error?.message || error
    });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getLogsAsString(): string {
    return this.logs.map(log => {
      const time = new Date(log.timestamp).toISOString();
      const dataStr = log.data ? JSON.stringify(log.data, null, 2) : '';
      return `[${time}] [${log.level}] [${log.category}] ${log.message}\n${dataStr}\n`;
    }).join('\n');
  }

  public downloadLogs() {
    const logText = this.getLogsAsString();
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackrent-mobile-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public flushLogsToStorage() {
    try {
      const recentLogs = this.logs.slice(-50); // Keep last 50 logs
      localStorage.setItem('blackrent-mobile-logs', JSON.stringify(recentLogs));
      sessionStorage.setItem('blackrent-mobile-logs-session', JSON.stringify(recentLogs));
    } catch (e) {
      console.warn('Failed to store logs:', e);
    }
  }

  public loadLogsFromStorage() {
    try {
      const storedLogs = localStorage.getItem('blackrent-mobile-logs');
      if (storedLogs) {
        const logs = JSON.parse(storedLogs);
        this.log('INFO', 'Logger', 'Loaded logs from storage', { count: logs.length });
        return logs;
      }
    } catch (e) {
      this.log('WARN', 'Logger', 'Failed to load logs from storage', { error: e });
    }
    return [];
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem('blackrent-mobile-logs');
    sessionStorage.removeItem('blackrent-mobile-logs-session');
    this.log('INFO', 'Logger', 'Logs cleared');
  }

  public getStats() {
    const now = Date.now();
    const last5min = now - 5 * 60 * 1000;
    const recentLogs = this.logs.filter(log => log.timestamp > last5min);
    
    const stats = {
      totalLogs: this.logs.length,
      recentLogs: recentLogs.length,
      errorCount: this.logs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL').length,
      warningCount: this.logs.filter(log => log.level === 'WARN').length,
      categories: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      stats.categories[log.category] = (stats.categories[log.category] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
let mobileLogger: MobileLogger | null = null;

export const initializeMobileLogger = (): MobileLogger => {
  if (!mobileLogger) {
    mobileLogger = new MobileLogger();
  }
  return mobileLogger;
};

export const getMobileLogger = (): MobileLogger | null => {
  return mobileLogger;
};

export const logMobile = (level: LogEntry['level'], category: string, message: string, data?: any) => {
  if (mobileLogger) {
    mobileLogger.log(level, category, message, data);
  }
};

export type { LogEntry };
