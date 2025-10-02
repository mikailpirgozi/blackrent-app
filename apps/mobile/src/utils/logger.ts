// ============================================================================
// LOGGER UTILITY - CENTRALIZED LOGGING
// ============================================================================
// Production-safe logging utility that respects development/production modes
// Replaces all console.log calls throughout the application

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  enabledInProduction: boolean;
  minLevel: LogLevel;
  enableTimestamps: boolean;
  enableStackTrace: boolean;
}

/**
 * Default logger configuration
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

const defaultConfig: LoggerConfig = {
  enabledInProduction: false,
  minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR,
  enableTimestamps: isDevelopment,
  enableStackTrace: isDevelopment,
};

/**
 * Format timestamp for log messages
 */
const formatTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().substring(11, 23); // HH:mm:ss.SSS
};

/**
 * Format log message with metadata
 */
const formatMessage = (
  level: string,
  message: string,
  data?: any,
  config: LoggerConfig = defaultConfig
): string => {
  const parts: string[] = [];
  
  if (config.enableTimestamps) {
    parts.push(`[${formatTimestamp()}]`);
  }
  
  parts.push(`[${level}]`);
  parts.push(message);
  
  if (data !== undefined) {
    parts.push(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));
  }
  
  return parts.join(' ');
};

/**
 * Check if logging should be enabled for given level
 */
const shouldLog = (level: LogLevel, config: LoggerConfig = defaultConfig): boolean => {
  // In production, only log if explicitly enabled
  if (!isDevelopment && !config.enabledInProduction) {
    return level >= LogLevel.ERROR;
  }
  
  return level >= config.minLevel;
};

/**
 * Centralized logger utility
 */
export const _logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (message: string, data?: any) => {
    if (shouldLog(LogLevel.DEBUG)) {
      const _formatted = formatMessage('DEBUG', message, data);
          }
  },

  /**
   * Info level logging
   */
  info: (message: string, data?: any) => {
    if (shouldLog(LogLevel.INFO)) {
      const _formatted = formatMessage('INFO', message, data);
          }
  },

  /**
   * Warning level logging
   */
  warn: (message: string, data?: any) => {
    if (shouldLog(LogLevel.WARN)) {
      const _formatted = formatMessage('WARN', message, data);
          }
  },

  /**
   * Error level logging - always enabled
   */
  error: (message: string, error?: Error | any) => {
    if (shouldLog(LogLevel.ERROR)) {
      const _formatted = formatMessage('ERROR', message, error);
            
      // Log stack trace in development
      if (isDevelopment && error instanceof Error && error.stack) {
              }
    }
  },

  /**
   * Performance timing utility
   */
  time: (label: string) => {
    if (__DEV__) {
      console.time(`[PERF] ${label}`);
    }
  },

  /**
   * End performance timing
   */
  timeEnd: (label: string) => {
    if (__DEV__) {
      console.timeEnd(`[PERF] ${label}`);
    }
  },

  /**
   * Group related log messages
   */
  group: (label: string) => {
    if (__DEV__) {
      console.group(`[GROUP] ${label}`);
    }
  },

  /**
   * End log group
   */
  groupEnd: () => {
    if (__DEV__) {
      console.groupEnd();
    }
  },

  /**
   * Configure logger settings
   */
  configure: (config: Partial<LoggerConfig>) => {
    Object.assign(defaultConfig, config);
  },

  /**
   * Get current configuration
   */
  getConfig: () => ({ ...defaultConfig }),
};

/**
 * Legacy console.log replacement
 * Use this to replace existing console.log calls
 */
export const log = logger.info;

/**
 * Development-only logging
 * Automatically stripped in production builds
 */
export const devLog = (message: string, data?: any) => {
  if (__DEV__) {
    logger.debug(message, data);
  }
};

/**
 * Conditional logging based on condition
 */
export const conditionalLog = (condition: boolean, message: string, data?: any) => {
  if (condition) {
    logger.info(message, data);
  }
};

// Initialize logger
if (isDevelopment) {
  logger.info('Logger initialized in development mode');
} else {
  // In production, only log initialization if explicitly enabled
  if (defaultConfig.enabledInProduction) {
    logger.info('Logger initialized in production mode');
  }
}
