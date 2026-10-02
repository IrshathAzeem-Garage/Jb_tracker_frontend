import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-400">
                JB Tracker encountered an unexpected error. Your financial data is completely safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 active:scale-95 transition-all shadow-md touch-target-44"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all touch-target-44"
                title="Go to Home"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
