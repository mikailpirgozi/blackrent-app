import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { reportError } from '../../utils/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to Sentry
    reportError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={2}
          bgcolor="background.default"
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h4" color="error" gutterBottom>
              🚨 Niečo sa pokazilo
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Aplikácia narazila na neočakávanú chybu. Chyba bola automaticky nahlásená 
              a bude opravená čo najskôr.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Paper 
                sx={{ 
                  p: 2, 
                  mt: 2, 
                  bgcolor: 'grey.100', 
                  textAlign: 'left' 
                }}
              >
                <Typography variant="caption" color="error">
                  {this.state.error.toString()}
                </Typography>
              </Paper>
            )}
            
            <Box mt={3} display="flex" gap={2} justifyContent="center">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={this.handleReload}
              >
                Obnoviť stránku
              </Button>
              
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={this.handleGoHome}
              >
                Späť na úvod
              </Button>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Ak problém pretrváva, kontaktujte podporu.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 