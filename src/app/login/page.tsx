"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || 'Login failed');
        setLoading(false);
        return;
      }
      // success -> redirect to home
      router.replace('/');
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <form onSubmit={handleSubmit} className="p-6 bg-card rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Sign in</h1>
        {error && <div className="text-destructive mb-2">{error}</div>}
        <label className="block mb-2">Username
          <Input value={user} onChange={e => setUser(e.target.value)} />
        </label>
        <label className="block mb-4">Password
          <Input type="password" value={pass} onChange={e => setPass(e.target.value)} />
        </label>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
        </div>
      </form>
    </div>
  );
}
