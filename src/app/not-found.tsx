import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-heading font-bold text-[#F0F0F2] mb-2">
          404
        </h1>
        <p className="text-xl text-[#9E9EA8] mb-8">
          Page not found
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-[#6B8AFF] hover:bg-[#8BA3FF] text-white font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
