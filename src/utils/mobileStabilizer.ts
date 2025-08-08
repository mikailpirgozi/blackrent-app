// 📱 Mobile Stabilizer - Prevents unexpected page refreshes on mobile devices
// Comprehensive solution for mobile browser lifecycle management

interface MobileStabilizerConfig {
  enablePreventUnload: boolean;
  enableMemoryMonitoring: boolean;
  enableVisibilityHandling: boolean;
  enableFormDataPersistence: boolean;
  debugMode: boolean;
}

interface FormDataSnapshot {
  timestamp: number;
  url: string;
  formData: Record<string, any>;
  formType: string;
}

class MobileStabilizer {
  private config: MobileStabilizerConfig;
  private isActive: boolean = false;
  private isMobile: boolean = false;
  private formDataSnapshots: Map<string, FormDataSnapshot> = new Map();
  private lastActivity: number = Date.now();
  private memoryCheckInterval?: NodeJS.Timeout;
  private visibilityChangeHandler?: () => void;
  private beforeUnloadHandler?: (event: BeforeUnloadEvent) => void;
  private pageHideHandler?: (event: PageTransitionEvent) => void;
  private pageShowHandler?: (event: PageTransitionEvent) => void;

  constructor(config: Partial<MobileStabilizerConfig> = {}) {
    this.config = {
      enablePreventUnload: true,
      enableMemoryMonitoring: true,
      enableVisibilityHandling: true,
      enableFormDataPersistence: true,
      debugMode: false,
      ...config
    };

    this.isMobile = this.detectMobileDevice();
    this.log('🔧 MobileStabilizer initialized', { isMobile: this.isMobile, config: this.config });
  }

  private detectMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isMobileViewport = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUserAgent || (isMobileViewport && isTouchDevice);
  }

  private log(message: string, data?: any) {
    if (this.config.debugMode) {
      console.log(`📱 MobileStabilizer: ${message}`, data || '');
    }
  }

  public initialize(): void {
    if (!this.isMobile || this.isActive) return;

    this.log('🚀 Initializing mobile stabilization...');
    this.isActive = true;

    if (this.config.enablePreventUnload) {
      this.setupUnloadPrevention();
    }

    if (this.config.enableMemoryMonitoring) {
      this.setupMemoryMonitoring();
    }

    if (this.config.enableVisibilityHandling) {
      this.setupVisibilityHandling();
    }

    if (this.config.enableFormDataPersistence) {
      this.setupFormDataPersistence();
    }

    this.log('✅ Mobile stabilization active');
  }

  public destroy(): void {
    if (!this.isActive) return;

    this.log('🛑 Destroying mobile stabilization...');
    this.isActive = false;

    // Remove all event listeners
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
    if (this.pageHideHandler) {
      window.removeEventListener('pagehide', this.pageHideHandler);
    }
    if (this.pageShowHandler) {
      window.removeEventListener('pageshow', this.pageShowHandler);
    }
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    // Clear intervals
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    this.log('✅ Mobile stabilization destroyed');
  }

  private setupUnloadPrevention(): void {
    this.log('🛡️ Setting up unload prevention...');

    // Prevent accidental page unloads during critical operations
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      const isInCriticalOperation = this.isInCriticalOperation();
      
      if (isInCriticalOperation) {
        this.log('🚨 Preventing unload during critical operation');
        
        // Modern browsers
        event.preventDefault();
        event.returnValue = '';
        
        // Older browsers
        return '';
      }
    };

    this.pageHideHandler = (event: PageTransitionEvent) => {
      this.log('📱 Page hide event', { persisted: event.persisted });
      
      // Save current state before page hides
      this.saveCurrentState();
    };

    this.pageShowHandler = (event: PageTransitionEvent) => {
      this.log('📱 Page show event', { persisted: event.persisted });
      
      // Restore state when page shows
      if (event.persisted) {
        this.restoreState();
      }
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    window.addEventListener('pagehide', this.pageHideHandler);
    window.addEventListener('pageshow', this.pageShowHandler);
  }

  private setupMemoryMonitoring(): void {
    this.log('💾 Setting up memory monitoring...');

    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  private setupVisibilityHandling(): void {
    this.log('👁️ Setting up visibility handling...');

    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.log('📱 Page became hidden - saving state');
        this.saveCurrentState();
      } else {
        this.log('📱 Page became visible - checking state');
        this.restoreStateIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private setupFormDataPersistence(): void {
    this.log('📝 Setting up form data persistence...');

    // Auto-save form data periodically
    setInterval(() => {
      this.autoSaveFormData();
    }, 10000); // Save every 10 seconds
  }

  private isInCriticalOperation(): boolean {
    // Check if user is in the middle of important operations
    const criticalPaths = ['/protocols/', '/rentals/edit/', '/vehicles/edit/'];
    const currentPath = window.location.pathname;
    
    const isInCriticalPath = criticalPaths.some(path => currentPath.includes(path));
    
    // Check for unsaved form data
    const hasUnsavedData = this.hasUnsavedFormData();
    
    // Check for active uploads
    const hasActiveUploads = this.hasActiveUploads();

    this.log('🔍 Critical operation check', {
      isInCriticalPath,
      hasUnsavedData,
      hasActiveUploads,
      currentPath
    });

    return isInCriticalPath || hasUnsavedData || hasActiveUploads;
  }

  private hasUnsavedFormData(): boolean {
    // Check for forms with unsaved data
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      const formData = new FormData(form as HTMLFormElement);
      const hasData = Array.from(formData.entries()).some(([key, value]) => {
        return value && value.toString().trim() !== '';
      });
      
      if (hasData) {
        this.log('📝 Found unsaved form data');
        return true;
      }
    }

    // Check for React controlled inputs with data
    const inputs = document.querySelectorAll('input[value], textarea[value], select[value]');
    for (const input of inputs) {
      const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (element.value && element.value.trim() !== '') {
        this.log('📝 Found unsaved input data');
        return true;
      }
    }

    return false;
  }

  private hasActiveUploads(): boolean {
    // Check for active file uploads or API requests
    const progressElements = document.querySelectorAll('[role="progressbar"], .MuiLinearProgress-root');
    return progressElements.length > 0;
  }

  private saveCurrentState(): void {
    try {
      const state = {
        timestamp: Date.now(),
        url: window.location.href,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        },
        formData: this.extractFormData(),
        localStorage: this.getRelevantLocalStorage(),
      };

      sessionStorage.setItem('mobileStabilizer_state', JSON.stringify(state));
      this.log('💾 State saved', state);
    } catch (error) {
      this.log('❌ Error saving state', error);
    }
  }

  private restoreState(): void {
    try {
      const savedState = sessionStorage.getItem('mobileStabilizer_state');
      if (!savedState) return;

      const state = JSON.parse(savedState);
      
      // Only restore if the state is recent (within 5 minutes)
      const isRecent = (Date.now() - state.timestamp) < 5 * 60 * 1000;
      
      if (!isRecent) {
        this.log('⏰ Saved state is too old, skipping restore');
        return;
      }

      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
      }, 100);

      // Restore form data
      this.restoreFormData(state.formData);

      this.log('🔄 State restored', state);
    } catch (error) {
      this.log('❌ Error restoring state', error);
    }
  }

  private restoreStateIfNeeded(): void {
    // Check if we need to restore state after unexpected refresh
    const wasUnexpectedRefresh = sessionStorage.getItem('mobileStabilizer_unexpectedRefresh');
    
    if (wasUnexpectedRefresh) {
      this.log('🔄 Detected unexpected refresh, restoring state...');
      this.restoreState();
      sessionStorage.removeItem('mobileStabilizer_unexpectedRefresh');
    }
  }

  private extractFormData(): Record<string, any> {
    const formData: Record<string, any> = {};

    // Extract from forms
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const data = new FormData(form as HTMLFormElement);
      const formObj: Record<string, any> = {};
      
      data.forEach((value, key) => {
        formObj[key] = value;
      });
      
      if (Object.keys(formObj).length > 0) {
        formData[`form_${index}`] = formObj;
      }
    });

    // Extract from controlled inputs
    const inputs = document.querySelectorAll('input[value], textarea[value], select[value]');
    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (element.value && element.name) {
        formData[`input_${element.name || index}`] = element.value;
      }
    });

    return formData;
  }

  private restoreFormData(formData: Record<string, any>): void {
    // This is a simplified version - in production you'd want more sophisticated restoration
    Object.entries(formData).forEach(([key, value]) => {
      if (key.startsWith('input_')) {
        const inputName = key.replace('input_', '');
        const input = document.querySelector(`[name="${inputName}"]`) as HTMLInputElement;
        if (input && !input.value) {
          input.value = value as string;
        }
      }
    });
  }

  private getRelevantLocalStorage(): Record<string, string> {
    const relevant: Record<string, string> = {};
    const keys = ['blackrent_token', 'blackrent_user', 'blackrent_remember_me'];
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        relevant[key] = value;
      }
    });

    return relevant;
  }

  private autoSaveFormData(): void {
    if (!this.isInCriticalOperation()) return;

    const formData = this.extractFormData();
    if (Object.keys(formData).length === 0) return;

    const snapshot: FormDataSnapshot = {
      timestamp: Date.now(),
      url: window.location.href,
      formData,
      formType: this.detectFormType()
    };

    const key = `autoSave_${Date.now()}`;
    this.formDataSnapshots.set(key, snapshot);

    // Keep only last 5 snapshots
    if (this.formDataSnapshots.size > 5) {
      const oldestKey = Array.from(this.formDataSnapshots.keys())[0];
      this.formDataSnapshots.delete(oldestKey);
    }

    this.log('💾 Auto-saved form data', snapshot);
  }

  private detectFormType(): string {
    const path = window.location.pathname;
    if (path.includes('protocols')) return 'protocol';
    if (path.includes('rentals')) return 'rental';
    if (path.includes('vehicles')) return 'vehicle';
    if (path.includes('customers')) return 'customer';
    return 'unknown';
  }

  private checkMemoryUsage(): void {
    if (!('memory' in performance)) return;

    const memInfo = (performance as any).memory;
    const usedMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memInfo.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024);

    const usagePercent = (usedMB / limitMB) * 100;

    this.log('💾 Memory usage', {
      used: `${usedMB}MB`,
      total: `${totalMB}MB`,
      limit: `${limitMB}MB`,
      usage: `${usagePercent.toFixed(1)}%`
    });

    // If memory usage is high, trigger cleanup
    if (usagePercent > 80) {
      this.log('⚠️ High memory usage detected, triggering cleanup');
      this.triggerMemoryCleanup();
    }
  }

  private triggerMemoryCleanup(): void {
    // Clear old form snapshots
    this.formDataSnapshots.clear();

    // Clear old session storage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('mobileStabilizer_') && !key.includes('state')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    // Trigger garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    this.log('🧹 Memory cleanup completed');
  }

  public markUnexpectedRefresh(): void {
    sessionStorage.setItem('mobileStabilizer_unexpectedRefresh', 'true');
    this.log('🚨 Marked unexpected refresh');
  }

  public getFormSnapshots(): FormDataSnapshot[] {
    return Array.from(this.formDataSnapshots.values());
  }

  public restoreFormSnapshot(snapshot: FormDataSnapshot): void {
    this.restoreFormData(snapshot.formData);
    this.log('🔄 Restored form snapshot', snapshot);
  }
}

// Singleton instance
let mobileStabilizer: MobileStabilizer | null = null;

export const initializeMobileStabilizer = (config?: Partial<MobileStabilizerConfig>): MobileStabilizer => {
  if (!mobileStabilizer) {
    mobileStabilizer = new MobileStabilizer(config);
    mobileStabilizer.initialize();
  }
  return mobileStabilizer;
};

export const getMobileStabilizer = (): MobileStabilizer | null => {
  return mobileStabilizer;
};

export const destroyMobileStabilizer = (): void => {
  if (mobileStabilizer) {
    mobileStabilizer.destroy();
    mobileStabilizer = null;
  }
};

export type { MobileStabilizerConfig, FormDataSnapshot };
