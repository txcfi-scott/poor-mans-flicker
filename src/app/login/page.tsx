'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('from') || '/admin';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        setError('Invalid token');
        setLoading(false);
        return;
      }

      router.push(redirectTo);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2 text-center text-foreground">
          Admin Login
        </h1>
        <p className="text-sm mb-6 text-center text-muted">
          Enter the admin token to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="sr-only">
              Admin Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              required
              autoFocus
              className="w-full rounded-lg bg-surface-hover border border-border px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2 text-danger bg-danger-muted">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-lg bg-accent hover:bg-accent-hover text-white px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
