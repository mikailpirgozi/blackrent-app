import { createTheme } from '@mui/material/styles';

// Dark theme gradient palette
const darkGradients = {
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
const darkShadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  colorful: '0 10px 25px -3px rgba(102, 126, 234, 0.4), 0 4px 6px -2px rgba(102, 126, 234, 0.3)',
  premium: '0 20px 40px -4px rgba(0, 0, 0, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.2)',
};

declare module '@mui/material/styles' {
  interface Theme {
    gradients: typeof darkGradients;
    customShadows: typeof darkShadows;
  }
  interface ThemeOptions {
    gradients?: typeof darkGradients;
    customShadows?: typeof darkShadows;
  }
}

export const darkTheme = createTheme({
  gradients: darkGradients,
  customShadows: darkShadows,
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea', // Premium gradient start color
      light: '#8b9bfc',
      dark: '#5a6fd8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2', // Premium gradient end color
      light: '#9b7cb5',
      dark: '#634190',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0f1c', // Deeper dark
      paper: '#1a1f2e',   // Rich dark paper
    },
    text: {
      primary: '#ffffff',    // Pure white for contrast
      secondary: '#e2e8f0',  // Light gray
    },
    success: {
      main: '#34d399', // Emerald
      light: '#6ee7b7',
      dark: '#10b981',
    },
    warning: {
      main: '#fbbf24', // Amber
      light: '#fcd34d',
      dark: '#f59e0b',
    },
    error: {
      main: '#f87171', // Red
      light: '#fca5a5',
      dark: '#ef4444',
    },
    info: {
      main: '#38bdf8', // Cyan
      light: '#7dd3fc',
      dark: '#0ea5e9',
    },
    divider: '#2d3748',
    action: {
      hover: '#2d3748',
      selected: '#3e4c59',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#ffffff', // White headings
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#ffffff',
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#ffffff',
      letterSpacing: '-0.025em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#ffffff',
      letterSpacing: '-0.025em',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#ffffff',
      letterSpacing: '-0.025em',
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#ffffff',
      letterSpacing: '-0.025em',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      color: '#e2e8f0', // Light gray for body text
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      color: '#cbd5e1', // Medium gray for secondary text
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#ffffff',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#e2e8f0',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      color: '#94a3b8',
      lineHeight: 1.4,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.025em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: #0f172a;
          color: #ffffff;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 28px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            transition: 'left 0.5s',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            '&::before': {
              left: '100%',
            },
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #634190 100%)',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: '#3e4c59',
          color: '#e2e8f0',
          background: 'rgba(26, 31, 46, 0.8)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            borderColor: '#667eea',
            background: 'rgba(102, 126, 234, 0.2)',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
          },
        },
        text: {
          color: '#e2e8f0',
          '&:hover': {
            background: 'rgba(102, 126, 234, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(26, 31, 46, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            '&::before': {
              opacity: 1,
            },
          },
          '&:active': {
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(26, 31, 46, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(26, 31, 46, 0.9)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: '#3e4c59',
              borderWidth: '1px',
            },
            '&:hover': {
              backgroundColor: 'rgba(26, 31, 46, 0.95)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              '& fieldset': {
                borderColor: '#4a5568',
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(26, 31, 46, 1)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              '& fieldset': {
                borderColor: '#667eea',
                borderWidth: '2px',
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: '#e2e8f0',
            '&.Mui-focused': {
              color: '#667eea',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
          fontSize: '0.75rem',
          background: 'rgba(102, 126, 234, 0.2)',
          color: '#8b9bfc',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'rgba(102, 126, 234, 0.3)',
            transform: 'scale(1.05)',
          },
          '&.MuiChip-colorPrimary': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
          },
          '&.MuiChip-colorSecondary': {
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#ffffff',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 31, 46, 0.9)',
          backdropFilter: 'blur(20px)',
          color: '#ffffff',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(26, 31, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(102, 126, 234, 0.2)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 12px',
          color: '#e2e8f0',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
            color: '#8b9bfc',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0 2px 2px 0',
            },
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            transform: 'translateX(4px)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(45, 55, 72, 0.5)',
          padding: '16px',
          color: '#e2e8f0',
          transition: 'all 0.2s ease',
        },
        head: {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          fontWeight: 600,
          color: '#ffffff',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.05)',
            transform: 'scale(1.002)',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 31, 46, 0.95)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: 16,
        },
      },
    },
  },
});

export default darkTheme; 