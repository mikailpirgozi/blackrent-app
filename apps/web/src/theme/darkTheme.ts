// Dark theme gradient palette
export const darkGradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  error: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
};

// Dark theme shadows
export const darkShadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  colorful:
    '0 10px 25px -3px rgba(102, 126, 234, 0.4), 0 4px 6px -2px rgba(102, 126, 234, 0.3)',
  premium:
    '0 20px 40px -4px rgba(0, 0, 0, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.2)',
};

// Dark theme colors for shadcn/ui
export const darkTheme = {
  colors: {
    primary: {
      DEFAULT: '#667eea',
      foreground: '#ffffff',
    },
    secondary: {
      DEFAULT: '#764ba2',
      foreground: '#ffffff',
    },
    background: '#0a0f1c',
    foreground: '#ffffff',
    card: {
      DEFAULT: '#1a1f2e',
      foreground: '#ffffff',
    },
    popover: {
      DEFAULT: '#1a1f2e',
      foreground: '#ffffff',
    },
    muted: {
      DEFAULT: '#2d3748',
      foreground: '#e2e8f0',
    },
    accent: {
      DEFAULT: '#3e4c59',
      foreground: '#ffffff',
    },
    destructive: {
      DEFAULT: '#f87171',
      foreground: '#ffffff',
    },
    border: '#2d3748',
    input: '#3e4c59',
    ring: '#667eea',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#38bdf8',
  },
  gradients: darkGradients,
  shadows: darkShadows,
  borderRadius: '12px',
  fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
};

export default darkTheme;