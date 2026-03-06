'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-heading font-bold text-[#F0F0F2] mb-4">
          Admin Error
        </h1>
        <p className="text-[#9E9EA8] mb-8">
          Something went wrong in the admin panel. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-[#6B8AFF] hover:bg-[#8BA3FF] text-white font-medium transition-colors"
        >
          Try Again
        </button>
        <div className="mt-4">
          <a
            href="/admin"
            className="text-sm text-[#9E9EA8] hover:text-[#F0F0F2] transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
