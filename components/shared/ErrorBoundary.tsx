"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture("error_boundary_triggered", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
  };

  copyErrorDetails = (): void => {
    const { error, errorInfo } = this.state;
    const errorDetails = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
URL: ${typeof window !== "undefined" ? window.location.href : "N/A"}
User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}
Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
          onCopy={this.copyErrorDetails}
          copied={this.state.copied}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// Fallback component
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onCopy: () => void;
  copied: boolean;
  showDetails?: boolean;
}

function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onCopy,
  copied,
  showDetails = process.env.NODE_ENV === "development",
}: ErrorFallbackProps) {
  const [showStack, setShowStack] = React.useState(false);

  return (
    <motion.div
      className="min-h-[400px] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-lg w-full">
        <motion.div
          className="text-center"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Error Icon */}
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </motion.div>

          {/* Error Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Button onClick={onReset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>

          {/* Error Details (Development) */}
          {showDetails && error && (
            <motion.div
              className="mt-6 text-left"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <button
                onClick={() => setShowStack(!showStack)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-3"
              >
                <Bug className="w-4 h-4" />
                {showStack ? "Hide" : "Show"} Error Details
              </button>

              {showStack && (
                <motion.div
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm font-mono overflow-auto max-h-64"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-500 font-semibold">{error.name}:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCopy}
                      className="h-8 gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {error.message}
                  </p>
                  <pre className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                  {errorInfo?.componentStack && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-3" />
                      <p className="text-xs text-gray-400 mb-2">Component Stack:</p>
                      <pre className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// useErrorHandler hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// withErrorBoundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}

// Async error boundary for suspense
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  loadingFallback?: ReactNode;
}

export function AsyncErrorBoundary({
  children,
  fallback,
  loadingFallback,
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      <React.Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Compact inline error display
interface InlineErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ error, onRetry, className }: InlineErrorProps) {
  if (!error) return null;

  const message = typeof error === "string" ? error : error.message;

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-7 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </motion.div>
  );
}

export default ErrorBoundary;