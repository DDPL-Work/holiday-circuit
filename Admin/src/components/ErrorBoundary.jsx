import React from "react";
import { useRouteError } from "react-router-dom";
import { AlertTriangle, RotateCcw, Home, ArrowLeft, Copy, Check } from "lucide-react";

export function RouteErrorFallback() {
  const error = useRouteError();
  const [copied, setCopied] = React.useState(false);

  const errorMessage =
    error?.statusText || error?.message || (typeof error === "string" ? error : "An unexpected error occurred");
  const errorStack = error?.stack || null;

  const handleCopyStack = () => {
    const textToCopy = `${errorMessage}\n${errorStack || ""}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 select-none">
      <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Something Went Wrong</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              The application encountered an unexpected error.
            </p>
          </div>
        </div>

        {/* Error Detail Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2 pb-2 border-b border-slate-800/80">
            <span className="font-semibold text-rose-400">{errorMessage}</span>
            <button
              onClick={handleCopyStack}
              className="flex items-center gap-1 text-[11px] hover:text-slate-200 transition-colors cursor-pointer"
              title="Copy error details"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Log"}
            </button>
          </div>
          {errorStack && (
            <pre className="text-slate-400 text-[11px] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap break-all pr-1">
              {errorStack}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-xl transition cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition cursor-pointer border border-slate-600/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl transition cursor-pointer border border-slate-600/60"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback />
      );
    }
    return this.props.children;
  }
}
