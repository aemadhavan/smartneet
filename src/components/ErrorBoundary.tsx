'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our logging service
    logger.error('Error caught by ErrorBoundary', {
      error: error.message,
      data: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
      context: 'ErrorBoundary',
    });
  }

  handleReset = (): void => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: null });

    // Call the onReset prop if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided, otherwise render default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-6" role="alert">
          <div className="flex items-center mb-4">
            <AlertCircle className="text-red-500 dark:text-red-400 mr-3 h-6 w-6" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Something went wrong
            </h2>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md border border-red-100 dark:border-red-800 mb-4">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;