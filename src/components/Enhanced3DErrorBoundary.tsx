import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  enableDiagnostics?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
  lastErrorTime: number;
}

export class Enhanced3DErrorBoundary extends Component<Props, State> {
  private performanceObserver?: PerformanceObserver;
  private errorLog: Array<{ error: Error; timestamp: number; userAgent: string }> = [];

  public state: State = {
    hasError: false,
    retryCount: 0,
    lastErrorTime: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      lastErrorTime: Date.now()
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error with context
    this.logError(error, errorInfo);
    
    // Call external error handler
    this.props.onError?.(error, errorInfo);
    
    // Start performance monitoring
    if (this.props.enableDiagnostics) {
      this.startDiagnostics();
    }
  }

  private logError = (error: Error, errorInfo?: React.ErrorInfo) => {
    const errorEntry = {
      error,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorInfo: errorInfo?.componentStack,
    };

    this.errorLog.push(errorEntry);
    
    // Keep only last 10 errors
    if (this.errorLog.length > 10) {
      this.errorLog = this.errorLog.slice(-10);
    }

    // Log to console with enhanced info
    console.group('🚨 3D Error Boundary - Enhanced Error Report');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('Error Stack:', error.stack);
    console.error('User Agent:', navigator.userAgent);
    console.error('Memory Usage:', this.getMemoryInfo());
    console.error('WebGL Support:', this.getWebGLInfo());
    console.groupEnd();

    // Save to localStorage for debugging
    try {
      localStorage.setItem('last-3d-error', JSON.stringify(errorEntry));
    } catch (e) {
      console.warn('Failed to save error to localStorage:', e);
    }
  };

  private getMemoryInfo = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      };
    }
    return 'Memory info not available';
  };

  private getWebGLInfo = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      
      if (!gl) {
        return 'WebGL not supported';
      }

      return {
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      };
    } catch (e) {
      return 'WebGL info unavailable';
    }
  };

  private startDiagnostics = () => {
    // Monitor performance
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'measure' && entry.duration > 16.67) {
            console.warn('Slow 3D operation detected:', entry.name, `${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        console.warn('Performance monitoring not available:', e);
      }
    }
  };

  private handleRetry = () => {
    const timeSinceLastError = Date.now() - this.state.lastErrorTime;
    const canRetry = timeSinceLastError > 5000; // 5 second cooldown
    
    if (canRetry && this.state.retryCount < 3) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
      });
    } else {
      // Force page reload as last resort
      window.location.reload();
    }
  };

  private downloadErrorLog = () => {
    const errorData = {
      errors: this.errorLog,
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        memory: this.getMemoryInfo(),
        webgl: this.getWebGLInfo(),
      },
    };

    const blob = new Blob([JSON.stringify(errorData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `3d-error-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  private renderDiagnostics = () => {
    if (!this.props.enableDiagnostics) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Diagnostic Information</CardTitle>
          <CardDescription>Technical details for debugging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div><strong>Error:</strong> {this.state.error?.message}</div>
          <div><strong>Type:</strong> {this.state.error?.name}</div>
          <div><strong>Time:</strong> {new Date(this.state.lastErrorTime).toLocaleString()}</div>
          <div><strong>Retry Count:</strong> {this.state.retryCount}/3</div>
          <div><strong>Memory:</strong> {JSON.stringify(this.getMemoryInfo())}</div>
          <div><strong>WebGL:</strong> {typeof this.getWebGLInfo() === 'string' ? this.getWebGLInfo() as string : 'Available'}</div>
          {this.state.errorInfo && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Component Stack</summary>
              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    );
  };

  public componentWillUnmount() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-full w-full flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>3D Rendering Error</AlertTitle>
              <AlertDescription>
                The 3D scene encountered an error and couldn't render properly.
                This may be due to WebGL limitations or insufficient memory.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry} 
                disabled={this.state.retryCount >= 3}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {this.state.retryCount >= 3 ? 'Max Retries' : `Retry (${this.state.retryCount}/3)`}
              </Button>
              
              {this.props.enableDiagnostics && (
                <Button 
                  onClick={this.downloadErrorLog}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>

            {this.renderDiagnostics()}

            <div className="text-center text-sm text-muted-foreground">
              If the issue persists, try refreshing the page or updating your browser.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
