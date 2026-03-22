import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Button } from './UI';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try refreshing the page.";
      
      try {
        const parsedError = JSON.parse(this.state.error?.message || "");
        if (parsedError.error?.includes("insufficient permissions")) {
          errorMessage = "You don't have permission to access this data. Please check your account settings.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <Card className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Oops!</h2>
            <p className="text-stone-600">{errorMessage}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh App
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
