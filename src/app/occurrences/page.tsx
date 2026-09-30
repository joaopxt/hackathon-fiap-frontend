'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert, PriorityBadge, Spinner, StatusBadge } from '@/components/ui';
import { api, toQuery } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  formatDateTime,
} from '@/lib/labels';
import type { Occurrence, Paginated, UserSummary } from '@/lib/types';

const PAGE_SIZE = 10;
const EMPTY_FILTERS = { status: '', category: '', priority: '', assigneeId: '', search: '' };

function OccurrencesList() {
  const { user } = useAuth();
  const isGestor = user?.role === 'GESTOR';
  const params = useSearchParams();
  // Filtros iniciais podem vir da URL (links do dashboard).
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    status: params.get('status') ?? '',
    category: params.get('category') ?? '',
    priority: params.get('priority') ?? '',
  }));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Occurrence> | null>(null);
  const [gestores, setGestores] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debounce da busca textual
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === search ? f : { ...f, search }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setError(null);
    api<Paginated<Occurrence>>(`/occurrences${toQuery({ ...filters, page, pageSize: PAGE_SIZE })}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [filters, page]);

  useEffect(load, [load]);

  useEffect(() => {
    if (isGestor) api<UserSummary[]>('/users?role=GESTOR').then(setGestores).catch(() => {});
  }, [isGestor]);

  const setFilter = (k: keyof typeof EMPTY_FILTERS) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isGestor ? 'Todas as ocorrências' : 'Minhas ocorrências'}
          </h1>
          <p className="text-sm text-slate-500">
            {data ? `${data.total} ocorrência(s) encontrada(s)` : 'Carregando...'}
          </p>
        </div>
        <Link href="/occurrences/new" className="btn-primary">
          + Nova ocorrência
        </Link>
      </div>

      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          type="search"
          placeholder="Buscar por título, descrição ou local"
          aria-label="Buscar"
          className="input sm:col-span-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Status" className="input" value={filters.status} onChange={setFilter('status')}>
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <select aria-label="Categoria" className="input" value={filters.category} onChange={setFilter('category')}>
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
        <select aria-label="Prioridade" className="input" value={filters.priority} onChange={setFilter('priority')}>
          <option value="">Todas as prioridades</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
          ))}
        </select>
        {isGestor ? (
          <select aria-label="Responsável" className="input" value={filters.assigneeId} onChange={setFilter('assigneeId')}>
            <option value="">Qualquer responsável</option>
            <option value="none">Sem responsável</option>
            {gestores.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        ) : (
          <div className="hidden lg:block" />
        )}
        {hasFilters && (
          <button
            className="text-left text-sm font-medium text-brand-600 hover:underline sm:col-span-2 lg:col-span-6"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setSearch('');
              setPage(1);
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
      {!data && !error && <Spinner />}

      {data && data.items.length === 0 && (
        <div className="card p-10 text-center text-slate-500">
          {hasFilters ? 'Nenhuma ocorrência corresponde aos filtros.' : 'Nenhuma ocorrência registrada ainda.'}
        </div>
      )}

      {data && data.items.length > 0 && (
        <ul className="space-y-3">
          {data.items.map((o) => (
            <li key={o.id}>
              <Link
                href={`/occurrences/${o.id}`}
                className="card block p-4 transition hover:border-brand-500 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-400">
                      #{o.code} · {CATEGORY_LABEL[o.category]}
                    </div>
                    <div className="truncate font-semibold">{o.title}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <PriorityBadge priority={o.priority} />
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>📍 {o.location}</span>
                  <span>🕒 {formatDateTime(o.createdAt)}</span>
                  {isGestor && <span>👤 {o.requester.name}</span>}
                  <span>🛠 {o.assignee ? o.assignee.name : 'Sem responsável'}</span>
                  <span>💬 {o._count?.comments ?? 0}</span>
                  {o.imagePath && <span>🖼 Imagem</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span className="text-slate-600">
            Página {page} de {totalPages}
          </span>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </button>
        </div>
      )}
    </>
  );
}

export default function OccurrencesPage() {
  return (
    <AppShell>
      <Suspense>
        <OccurrencesList />
      </Suspense>
    </AppShell>
  );
}
