import {
  Bug as BugReportIcon,
  ChevronDown as ExpandLessIcon,
  ChevronUp as ExpandMoreIcon,
  Home as HomeIcon,
  RefreshCw as RefreshIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
// 🔄 MOBILE CLEANUP: mobileLogger removed
// import { getMobileLogger } from '../../utils/mobileLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
  level?: 'page' | 'component' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: ReturnType<typeof setTimeout>[] = [];

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
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
    // 🔄 MOBILE CLEANUP: mobileLogger disabled
    const mobileLogger = null; // getMobileLogger();
    if (mobileLogger) {
      // mobileLogger.log('CRITICAL', 'ErrorBoundary', 'React Error Boundary caught error', {
      // error: error.message,
      // stack: error.stack,
      // componentStack: errorInfo.componentStack,
      // errorBoundary: true,
      // retryCount: this.state.retryCount,
      // level: this.props.level || 'component',
      // });
    }

    // Auto-retry for certain recoverable errors
    if (
      this.shouldAutoRetry(error) &&
      this.state.retryCount < (this.props.maxRetries || 2)
    ) {
      const timeout = setTimeout(
        () => {
          this.handleRetry();
        },
        1000 * (this.state.retryCount + 1)
      );

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

    return recoverableErrors.some(
      pattern => error.message.includes(pattern) || error.name.includes(pattern)
    );
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
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

  // private toggleDetails = () => {
  //   this.setState(prevState => ({
  //     showDetails: !prevState.showDetails,
  //   }));
  // };

  private getErrorMessage = (): string => {
    const { error } = this.state;

    if (!error) return 'Neznáma chyba';

    if (
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk')
    ) {
      // 🔍 IMPROVED: Lepšie logovanie pre mobile chunk errors
      const isMobile =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(max-width: 900px)').matches;
      const hasAutoReloaded =
        sessionStorage.getItem('autoReloadedAfterChunkError') === '1';

      console.group('🚨 ChunkLoadError detected');
      console.log('Is Mobile:', isMobile);
      console.log('Has Auto Reloaded:', hasAutoReloaded);
      console.log('Current URL:', window.location.href);
      console.log('User Agent:', navigator.userAgent);
      console.log(
        'Connection:',
        (navigator as Navigator & { connection?: unknown }).connection
      );
      console.groupEnd();

      // 🔍 CHANGE: Pridáme delay a user confirmation na mobile
      if (isMobile && !hasAutoReloaded) {
        sessionStorage.setItem('autoReloadedAfterChunkError', '1');

        // 🚫 TEMPORARILY DISABLED: Automatic reload on ChunkLoadError
        // This might be causing the mobile refresh issues

        console.log(
          '🚨 ChunkLoadError detected but auto-reload is DISABLED for debugging'
        );
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

    if (
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch')
    ) {
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
      const { error, retryCount, showDetails } = this.state;
      const canRetry = retryCount < maxRetries;

      // Different layouts based on error level
      if (level === 'page') {
        return (
          <div className="flex justify-center items-center min-h-screen p-4 bg-background">
            <Card className="p-8 max-w-2xl w-full">
              <Alert variant="destructive" className="mb-6">
                <BugReportIcon className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  <BugReportIcon className="h-4 w-4" />
                  Stránka sa nenačítala správne
                </AlertTitle>
                <AlertDescription>
                  {this.getErrorMessage()}
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshIcon className="h-4 w-4" />
                    Skúsiť znovu ({retryCount}/{maxRetries})
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="flex items-center gap-2"
                >
                  <RefreshIcon className="h-4 w-4" />
                  Obnoviť stránku
                </Button>

                <Button
                  variant="ghost"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <HomeIcon className="h-4 w-4" />
                  Domov
                </Button>
              </div>

              {/* Technical details for developers */}
              <div>
                <Collapsible open={showDetails} onOpenChange={(open) => this.setState({ showDetails: open })}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-2 flex items-center gap-2"
                    >
                      {showDetails ? <ExpandLessIcon className="h-4 w-4" /> : <ExpandMoreIcon className="h-4 w-4" />}
                      Technické detaily
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <Card className="p-4 bg-muted/50">
                      {process.env.NODE_ENV === 'development' && error && (
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-xs font-bold">
                            Chybová správa:
                          </Badge>
                          <pre className="text-sm font-mono mb-4 p-2 bg-muted rounded">
                            {error.toString()}
                          </pre>

                          {error.stack && (
                            <pre className="text-xs overflow-auto max-h-48 bg-muted p-2 rounded">
                              {error.stack}
                            </pre>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Chyba bola automaticky nahlásená a bude opravená čo
                        najskôr.
                      </p>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </Card>
          </div>
        );
      }

      // Component-level error (smaller, inline)
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Chyba v komponente</AlertTitle>
          <AlertDescription className="mb-2">
            {this.getErrorMessage()}
          </AlertDescription>

          {retryCount > 0 && (
            <Badge variant="secondary" className="text-xs opacity-70 mb-2">
              Počet pokusov: {retryCount}/{maxRetries}
            </Badge>
          )}

          <div className="flex gap-2 mt-2">
            {canRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={this.handleRetry}
                className="flex items-center gap-1"
              >
                <RefreshIcon className="h-3 w-3" />
                Skúsiť znovu
              </Button>
            )}
            
            <Collapsible open={showDetails} onOpenChange={(open) => this.setState({ showDetails: open })}>
              <CollapsibleTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex items-center gap-1"
                >
                  {showDetails ? <ExpandLessIcon className="h-3 w-3" /> : <ExpandMoreIcon className="h-3 w-3" />}
                  Detaily
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                  {process.env.NODE_ENV === 'development' && error?.message}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
