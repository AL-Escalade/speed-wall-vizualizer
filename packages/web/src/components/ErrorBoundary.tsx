/**
 * Error Boundary component to catch and handle React rendering errors gracefully
 */

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-screen bg-base-300">
          <div className="alert alert-error max-w-md shadow-lg">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Une erreur est survenue</span>
              <span className="text-sm opacity-80">
                {this.state.error?.message || 'Erreur inconnue'}
              </span>
              <button
                className="btn btn-sm btn-outline mt-2"
                onClick={() => window.location.reload()}
              >
                Rafraichir la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
