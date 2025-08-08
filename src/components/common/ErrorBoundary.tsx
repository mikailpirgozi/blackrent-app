import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { getMobileLogger } from '../../utils/mobileLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
  level?: 'page' | 'component' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo;
  retryCount: number;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: undefined,
    retryCount: 0,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    console.group('🚨 ErrorBoundary caught an error');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
    
    // Report to MobileLogger with enhanced context
    const mobileLogger = getMobileLogger();
    if (mobileLogger) {
      mobileLogger.log('CRITICAL', 'ErrorBoundary', 'React Error Boundary caught error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount,
        level: this.props.level || 'component',
      });
    }

    // Auto-retry for certain recoverable errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < (this.props.maxRetries || 2)) {
      const timeout = setTimeout(() => {
        this.handleRetry();
      }, 1000 * (this.state.retryCount + 1));
      
      this.retryTimeouts.push(timeout);
    }
  }

  componentWillUnmount() {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private shouldAutoRetry = (error: Error): boolean => {
    const recoverableErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Network Error',
      'Failed to fetch',
    ];
    
    return recoverableErrors.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  };

  private handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null, 
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      showDetails: false,
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prevState => ({ 
      showDetails: !prevState.showDetails 
    }));
  };

  private getErrorMessage = (): string => {
    const { error } = this.state;
    
    if (!error) return 'Neznáma chyba';

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      // 🔍 IMPROVED: Lepšie logovanie pre mobile chunk errors
      const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
      const hasAutoReloaded = sessionStorage.getItem('autoReloadedAfterChunkError') === '1';
      
      console.group('🚨 ChunkLoadError detected');
      console.log('Is Mobile:', isMobile);
      console.log('Has Auto Reloaded:', hasAutoReloaded);
      console.log('Current URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
      console.log('Connection:', (navigator as any).connection);
      console.groupEnd();
      
      // 🔍 CHANGE: Pridáme delay a user confirmation na mobile
      if (isMobile && !hasAutoReloaded) {
        sessionStorage.setItem('autoReloadedAfterChunkError', '1');
        
        // 🚫 TEMPORARILY DISABLED: Automatic reload on ChunkLoadError
        // This might be causing the mobile refresh issues
        
        console.log('🚨 ChunkLoadError detected but auto-reload is DISABLED for debugging');
        console.log('📱 Mobile users should manually refresh if needed');
        
        // PÔVODNÝ KÓD (ZAKÁZANÝ):
        // if (process.env.NODE_ENV === 'development') {
        //   const shouldReload = window.confirm('🚨 ChunkLoadError na mobile!\n\nChcete automaticky obnoviť stránku?\n(Cancel = ponechať pre debugging)');
        //   if (shouldReload) {
        //     setTimeout(() => window.location.reload(), 100);
        //   }
        // } else {
        //   setTimeout(() => window.location.reload(), 1000);
        // }
      }
      return 'Načítavanie stránky bolo prerušené. Skúste obnoviť stránku.';
    }
    
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return 'Problém s pripojením. Skontrolujte internetové pripojenie.';
    }

    if (error.name === 'TypeError') {
      return 'Nastala technická chyba. Skúste obnoviť stránku.';
    }

    return 'Nastala neočakávaná chyba. Skúste to znovu.';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', maxRetries = 2 } = this.props;
      const { error, errorInfo, retryCount, showDetails } = this.state;
      const canRetry = retryCount < maxRetries;

      // Different layouts based on error level
      if (level === 'page') {
        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            p={2}
            bgcolor="background.default"
          >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 700 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BugReportIcon />
                  Stránka sa nenačítala správne
                </AlertTitle>
                <Typography variant="body2">
                  {this.getErrorMessage()}
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'center' }}>
                {canRetry && (
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleRetry}
                  >
                    Skúsiť znovu ({retryCount}/{maxRetries})
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                >
                  Obnoviť stránku
                </Button>
                
                <Button
                  variant="text"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                >
                  Domov
                </Button>
              </Stack>

              {/* Technical details for developers */}
              <Box>
                <Button
                  size="small"
                  onClick={this.toggleDetails}
                  startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ mb: 1 }}
                >
                  Technické detaily
                </Button>
                
                <Collapse in={showDetails}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {process.env.NODE_ENV === 'development' && error && (
                      <>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                          Chybová správa:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                          {error.toString()}
                        </Typography>

                        {error.stack && (
                          <Box component="pre" sx={{ 
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: 200,
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                          }}>
                            {error.stack}
                          </Box>
                        )}
                      </>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Chyba bola automaticky nahlásená a bude opravená čo najskôr.
                    </Typography>
                  </Paper>
                </Collapse>
              </Box>
            </Paper>
          </Box>
        );
      }

      // Component-level error (smaller, inline)
      return (
        <Alert 
          severity="error" 
          sx={{ m: 2 }}
          action={
            <Stack direction="row" spacing={1}>
              {canRetry && (
                <IconButton size="small" onClick={this.handleRetry}>
                  <RefreshIcon />
                </IconButton>
              )}
              {showDetails && (
                <IconButton size="small" onClick={this.toggleDetails}>
                  {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
            </Stack>
          }
        >
          <AlertTitle>Chyba v komponente</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {this.getErrorMessage()}
          </Typography>
          
          {retryCount > 0 && (
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
              Počet pokusov: {retryCount}/{maxRetries}
            </Typography>
          )}

          <Collapse in={showDetails}>
            <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
              <Typography variant="caption">
                {process.env.NODE_ENV === 'development' && error?.message}
              </Typography>
            </Box>
          </Collapse>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 