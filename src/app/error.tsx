"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

/**
 * Error boundary page using Design System v2.0 tokens.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error("Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-app">
      <div className="max-w-2xl w-full card p-8 text-center space-y-6 animate-fade-in-up">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-error-subtle border border-error/20">
            <AlertCircle className="w-12 h-12 text-error" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-content-primary">Something went wrong</h1>
          <p className="text-content-secondary text-base max-w-md mx-auto">
            An unexpected error occurred while processing your request. Our technical team has been notified.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => reset()}
            variant="primary"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </Button>
          <Link href="/">
            <Button
              variant="secondary"
              icon={<Home className="w-4 h-4" />}
            >
              Go Back Home
            </Button>
          </Link>
        </div>

        {/* Developer Details Toggle */}
        <div className="pt-6 border-t border-border-subtle">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-ghost text-sm"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? "Hide technical details" : "Show more details for developers"}
          </button>

          {showDetails && (
            <div className="mt-6 p-6 rounded-lg bg-surface-nav border border-border-default text-left font-mono text-xs overflow-auto max-h-80 animate-fade-in">
              <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2 text-info">
                  <Terminal className="w-4 h-4" />
                  <span className="uppercase tracking-wide font-semibold text-xs">Developer Console</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-error-subtle border border-error/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning-subtle border border-warning/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success-subtle border border-success/40" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-error-text font-semibold mb-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                    Exception:
                  </p>
                  <p className="text-content-nav bg-surface-muted p-3 rounded-md border border-border-subtle leading-relaxed wrap-break-word">
                    {error.message || "No error message available"}
                  </p>
                </div>

                {error.stack && (
                  <div>
                    <p className="text-info-text font-semibold mb-1.5">Stack Trace:</p>
                    <pre className="text-content-nav-muted whitespace-pre-wrap p-3 bg-surface-muted rounded-md border border-border-subtle leading-relaxed text-[11px]">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {error.digest && (
                  <div className="pt-2 flex items-center gap-2 text-xs text-content-muted">
                    <span className="badge badge-neutral">Digest ID: {error.digest}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
