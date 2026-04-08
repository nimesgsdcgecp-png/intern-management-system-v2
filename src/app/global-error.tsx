"use client";

import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Global error boundary using Design System v2.0 tokens.
 * Fallback error UI for errors that occur in the root layout.
 * This replaces the entire page structure, including html and body.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-surface-nav font-sans antialiased">
        <div className="max-w-md w-full card p-8 text-center animate-scale-in">
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-xl bg-warning-subtle border border-warning/20">
              <AlertTriangle className="w-10 h-10 text-warning" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-xl font-bold text-content-primary mb-3">
            System Initialization Error
          </h1>
          <p className="text-content-secondary mb-6 text-sm">
            A critical error occurred while starting the application core.
            This usually indicates a problem with the main layout or providers.
          </p>

          {/* Recovery Button */}
          <Button
            onClick={() => reset()}
            variant="primary"
            className="w-full mb-6"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Recover Application
          </Button>

          {/* Error Details */}
          <div className="p-4 rounded-lg bg-surface-muted border border-border-default text-left font-mono text-xs">
            <div className="flex items-center gap-2 mb-3 text-content-secondary border-b border-border-subtle pb-2">
              <Terminal className="w-3 h-3 text-info" />
              <span className="uppercase tracking-wide font-semibold text-xs">Error Output</span>
            </div>
            <div className="max-h-32 overflow-auto">
              <p className="text-error-text font-semibold mb-1">
                {error.name || "Error"}: {error.message || "Unknown error occurred"}
              </p>
              {error.stack && (
                <pre className="text-xs text-content-muted whitespace-pre-wrap mt-2">
                  {error.stack}
                </pre>
              )}
              {error.digest && (
                <div className="mt-3 pt-2 border-t border-border-subtle">
                  <span className="badge badge-neutral text-xs">Digest: {error.digest}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
