'use client';

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#1E1E22] ${className}`}
    />
  );
}

export { Skeleton };
