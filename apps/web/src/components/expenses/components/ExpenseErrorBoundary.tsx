// ✅ FÁZA 3.3: Error Boundary pre Expense sekciu
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ExpenseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error pre debugging/monitoring
    console.error('💥 Expense Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Tu môžeš pridať logging do Sentry alebo inej monitoring služby
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                    Nastala chyba pri načítaní nákladov
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Niečo sa pokazilo. Skúste obnoviť stránku.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Details (len pre development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-red-800 dark:text-red-200 mb-2">
                    Technické detaily (iba v dev mode)
                  </summary>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md overflow-auto">
                    <pre className="text-xs text-red-900 dark:text-red-100 whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  Obnoviť stránku
                </Button>
                <Button onClick={() => window.history.back()} variant="outline">
                  Späť
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
