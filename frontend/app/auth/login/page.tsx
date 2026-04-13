'use client';

import { signIn } from 'next-auth/react';
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/30">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-5 bg-primary/50" />
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary/60">
              Access
            </span>
          </div>
          <h1 className="text-2xl font-black text-foreground">Sign in</h1>
          <p className="mt-1 text-[14px] text-muted-foreground/60">
            Use your contributor credentials to access the admin tools.
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60" htmlFor="email">
              Email
            </label>
            <Input id="email" type="email" value={email} onChange={handleEmailChange} required disabled={loading} />
          </div>
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60" htmlFor="password">
              Password
            </label>
            <Input id="password" type="password" value={password} onChange={handlePasswordChange} required disabled={loading} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full font-bold" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
