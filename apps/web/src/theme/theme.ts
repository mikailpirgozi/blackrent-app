// Modern gradient palette
export const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  error: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  dark: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
};

// Enhanced shadows system
export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  colorful:
    '0 10px 25px -3px rgba(102, 126, 234, 0.3), 0 4px 6px -2px rgba(102, 126, 234, 0.2)',
  premium:
    '0 20px 40px -4px rgba(0, 0, 0, 0.1), 0 8px 16px -4px rgba(0, 0, 0, 0.06)',
};

// Light theme colors for shadcn/ui
export const lightTheme = {
  colors: {
    primary: {
      DEFAULT: '#667eea',
      foreground: '#ffffff',
    },
    secondary: {
      DEFAULT: '#764ba2',
      foreground: '#ffffff',
    },
    background: '#fafbfc',
    foreground: '#0f172a',
    card: {
      DEFAULT: '#ffffff',
      foreground: '#0f172a',
    },
    popover: {
      DEFAULT: '#ffffff',
      foreground: '#0f172a',
    },
    muted: {
      DEFAULT: '#f1f5f9',
      foreground: '#64748b',
    },
    accent: {
      DEFAULT: '#f1f5f9',
      foreground: '#0f172a',
    },
    destructive: {
      DEFAULT: '#ef4444',
      foreground: '#ffffff',
    },
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#667eea',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  gradients,
  shadows,
  borderRadius: '12px',
  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
};

export default lightTheme;