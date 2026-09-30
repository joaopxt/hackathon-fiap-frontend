'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { Alert } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('As senhas não conferem');
      return;
    }
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Criar conta" subtitle="Cadastre-se para registrar suas ocorrências.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div>
          <label htmlFor="name" className="label">Nome completo</label>
          <input id="name" required maxLength={120} className="input" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            value={form.email}
            onChange={set('email')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="input"
              value={form.password}
              onChange={set('password')}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirmar senha</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="input"
              value={form.confirm}
              onChange={set('confirm')}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
