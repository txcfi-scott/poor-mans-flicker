'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 md:px-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-4">
          Something went wrong
        </h1>
        <p className="text-muted mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
