'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { Alert } from '@/components/ui';
import { useAuth } from '@/lib/auth';

function LoginForm() {
  const { login, user } = useAuth();
  const router = useRouter();
  const expired = useSearchParams().get('expired');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesse para registrar e acompanhar ocorrências.">
      <form onSubmit={onSubmit} className="space-y-4">
        {expired && !error && <Alert kind="info">Sua sessão expirou. Entre novamente.</Alert>}
        {error && <Alert>{error}</Alert>}
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="label">Senha</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        Ainda não tem conta?{' '}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
