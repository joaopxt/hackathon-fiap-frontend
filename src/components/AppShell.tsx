'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';
import { Spinner } from './ui';

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['GESTOR'] },
  { href: '/occurrences', label: 'Ocorrências', roles: ['GESTOR'] },
  { href: '/occurrences', label: 'Minhas ocorrências', roles: ['SOLICITANTE'] },
  { href: '/occurrences/new', label: 'Nova ocorrência', roles: ['SOLICITANTE', 'GESTOR'] },
  { href: '/users', label: 'Usuários', roles: ['GESTOR'] },
];

/** Layout das áreas autenticadas. Redireciona para o login e restringe por perfil. */
export function AppShell({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const forbidden = !!user && !!roles && !roles.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (forbidden) router.replace('/occurrences');
  }, [loading, user, forbidden, router]);

  if (loading || !user || forbidden) return <Spinner />;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">R</span>
            Resolve Aí
          </Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto">
            {NAV.filter((n) => n.roles.includes(user.role)).map((n) => {
              const active =
                n.href === '/occurrences'
                  ? pathname === '/occurrences' ||
                    (pathname.startsWith('/occurrences/') && pathname !== '/occurrences/new')
                  : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.label}
                  href={n.href}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <div className="text-right leading-tight">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs text-slate-500">
                {user.role === 'GESTOR' ? 'Gestor' : 'Solicitante'}
              </div>
            </div>
            <button onClick={logout} className="btn-secondary px-3 py-1.5">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
