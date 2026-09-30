'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Alert, PriorityBadge, Spinner, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  formatDateTime,
  formatDuration,
} from '@/lib/labels';
import type { DashboardSummary } from '@/lib/types';

const STATUS_BAR: Record<string, string> = {
  ABERTA: 'bg-sky-500',
  EM_ANALISE: 'bg-amber-500',
  EM_ATENDIMENTO: 'bg-violet-500',
  RESOLVIDA: 'bg-emerald-500',
  CANCELADA: 'bg-slate-400',
};
const PRIORITY_BAR: Record<string, string> = {
  BAIXA: 'bg-slate-400',
  MEDIA: 'bg-blue-500',
  ALTA: 'bg-orange-500',
  URGENTE: 'bg-red-500',
};

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function Bars({
  title,
  data,
  labels,
  colors,
  filterKey,
}: {
  title: string;
  data: Record<string, number>;
  labels: Record<string, string>;
  colors?: Record<string, string>;
  filterKey?: string;
}) {
  const max = Math.max(1, ...Object.values(data));
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-slate-500">{total} no total</span>
      </div>
      <ul className="space-y-2.5">
        {Object.entries(data).map(([key, count]) => {
          const row = (
            <>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-700">{labels[key] ?? key}</span>
                <span className="font-semibold tabular-nums">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${colors?.[key] ?? 'bg-brand-500'}`}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </>
          );
          return (
            <li key={key}>
              {filterKey ? (
                <Link href={`/occurrences?${filterKey}=${key}`} className="block rounded hover:opacity-80">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardSummary>('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner />;

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">Indicadores gerais das ocorrências</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total" value={data.total} hint={`${data.createdLast30d} nos últimos 30 dias`} />
        <Kpi label="Em aberto" value={data.open} hint="aberta, em análise ou atendimento" />
        <Kpi label="Sem responsável" value={data.unassigned} hint="entre as em aberto" />
        <Kpi label="Taxa de resolução" value={`${Math.round(data.resolutionRate * 100)}%`} />
        <Kpi label="Tempo médio" value={formatDuration(data.avgResolutionHours)} hint="até a resolução" />
        <Kpi
          label="Avaliação média"
          value={data.avgRating !== null ? `${data.avgRating.toFixed(1).replace('.', ',')} ★` : '—'}
          hint={`${data.ratingCount} avaliação(ões)`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Bars title="Por status" data={data.byStatus} labels={STATUS_LABEL} colors={STATUS_BAR} filterKey="status" />
        <Bars title="Por categoria" data={data.byCategory} labels={CATEGORY_LABEL} filterKey="category" />
        <Bars
          title="Em aberto por prioridade"
          data={data.openByPriority}
          labels={PRIORITY_LABEL}
          colors={PRIORITY_BAR}
          filterKey="priority"
        />
      </div>

      <section className="card mt-5 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Ocorrências recentes</h2>
          <Link href="/occurrences" className="text-sm font-medium text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma ocorrência registrada.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/occurrences/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:text-brand-700"
                >
                  <span className="min-w-0 truncate text-sm">
                    <span className="text-slate-400">#{o.code}</span> {o.title}
                    <span className="ml-2 text-xs text-slate-400">{formatDateTime(o.createdAt)}</span>
                  </span>
                  <span className="flex gap-2">
                    <PriorityBadge priority={o.priority} />
                    <StatusBadge status={o.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AppShell roles={['GESTOR']}>
      <Dashboard />
    </AppShell>
  );
}
