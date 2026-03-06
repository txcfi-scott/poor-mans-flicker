import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-extralight tracking-tighter text-foreground/20 mb-2">
          404
        </h1>
        <p className="text-xl text-muted mb-8">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
