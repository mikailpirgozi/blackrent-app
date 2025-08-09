/**
 * Smart Logger - Conditional logging system
 * Replaces console.log spam with intelligent logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enabledInProduction: boolean;
  enabledCategories: string[];
}

class SmartLogger {
  private config: LogConfig;

  constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
      enabledInProduction: false,
      enabledCategories: process.env.NODE_ENV === 'development' 
        ? ['error', 'warn', 'performance'] 
        : ['error']
    };
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    // Always log errors
    if (level === 'error') return true;
    
    // In production, only log enabled categories
    if (process.env.NODE_ENV === 'production') {
      return this.config.enabledInProduction && 
             Boolean(category) && 
             this.config.enabledCategories.includes(category || '');
    }
    
    // In development, respect log level
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  debug(message: string, data?: any, category?: string): void {
    if (this.shouldLog('debug', category)) {
      console.log(`🔍 ${message}`, data || '');
    }
  }

  info(message: string, data?: any, category?: string): void {
    if (this.shouldLog('info', category)) {
      console.info(`ℹ️ ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, category?: string): void {
    if (this.shouldLog('warn', category)) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  }

  error(message: string, error?: any, category?: string): void {
    if (this.shouldLog('error', category)) {
      console.error(`❌ ${message}`, error || '');
    }
  }

  // Performance logging - always important
  performance(message: string, data?: any): void {
    if (this.shouldLog('info', 'performance')) {
      console.log(`⚡ PERFORMANCE: ${message}`, data || '');
    }
  }

  // Component render tracking - only in development
  render(componentName: string, props?: any): void {
    if (process.env.NODE_ENV === 'development' && this.shouldLog('debug')) {
      console.log(`🔄 ${componentName} render`, props ? { props } : '');
    }
  }

  // API call tracking
  api(message: string, data?: any): void {
    if (this.shouldLog('debug', 'api')) {
      console.log(`🌐 API: ${message}`, data || '');
    }
  }

  // Cache operations
  cache(message: string, data?: any): void {
    if (this.shouldLog('debug', 'cache')) {
      console.log(`🗄️ CACHE: ${message}`, data || '');
    }
  }
}

// Export singleton instance
export const logger = new SmartLogger();

// Backward compatibility helpers
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logPerformance = (message: string, data?: any) => logger.performance(message, data);

export default logger;
