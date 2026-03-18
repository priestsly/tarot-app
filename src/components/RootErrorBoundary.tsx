"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Attempt to stringify for display
    try {
        const errorMsg = `Error: ${error.message}\nStack: ${error.stack}\nComponent Stack: ${errorInfo.componentStack}`;
        // Also log to window so we might see it in screenshots if possible
        (window as any)._lastError = errorMsg;
    } catch(e) {}
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] bg-[#0a0510] text-red-400 p-6 flex flex-col font-mono text-xs overflow-auto select-text">
          <h1 className="text-xl font-bold mb-4 border-b border-red-900 pb-2 text-white">Critical App Error</h1>
          <p className="mb-2 font-bold underline">Message:</p>
          <pre className="bg-red-950/30 p-4 rounded border border-red-900/50 mb-4 whitespace-pre-wrap break-all uppercase">
            {this.state.error?.message}
          </pre>
          <p className="mb-2 font-bold underline">Stack Trace:</p>
          <pre className="bg-black/50 p-4 rounded border border-white/5 whitespace-pre-wrap break-all text-[9px] opacity-70">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
