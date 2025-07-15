import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#f48fb1',
      light: '#f8bbd9',
      dark: '#ec407a',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
    success: {
      main: '#66bb6a',
    },
    warning: {
      main: '#ffa726',
    },
    error: {
      main: '#f44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 300,
      color: '#ffffff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
      color: '#ffffff',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
      color: '#ffffff',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 400,
      color: '#ffffff',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 400,
      color: '#ffffff',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#ffffff',
    },
    body1: {
      fontSize: '1rem',
      color: '#ffffff',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#b3b3b3',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          '& .MuiTableCell-head': {
            color: '#ffffff',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #404040',
          color: '#ffffff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
}); 