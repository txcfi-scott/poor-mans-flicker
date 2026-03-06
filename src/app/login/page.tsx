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
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0B' }}>
      <div
        className="w-full max-w-sm rounded-xl p-8 shadow-xl"
        style={{ backgroundColor: '#141416', border: '1px solid #2A2A30' }}
      >
        <h1 className="text-2xl font-semibold mb-2 text-center" style={{ color: '#F0F0F2' }}>
          Admin Login
        </h1>
        <p className="text-sm mb-6 text-center" style={{ color: '#9E9EA8' }}>
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
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: '#1E1E22',
                border: '1px solid #2A2A30',
                color: '#F0F0F2',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6B8AFF')}
              onBlur={(e) => (e.target.style.borderColor = '#2A2A30')}
            />
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#F87171', backgroundColor: '#F871711A' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#6B8AFF',
              color: '#F0F0F2',
            }}
            onMouseOver={(e) => {
              if (!(e.target as HTMLButtonElement).disabled) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#8BA3FF';
              }
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = '#6B8AFF';
            }}
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
