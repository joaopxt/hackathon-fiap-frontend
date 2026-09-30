import { PRIORITY_LABEL, PRIORITY_STYLE, STATUS_LABEL, STATUS_STYLE } from '@/lib/labels';
import type { Priority, Status } from '@/lib/types';

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${PRIORITY_STYLE[priority]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function Alert({
  kind = 'error',
  children,
}: {
  kind?: 'error' | 'success' | 'info';
  children: React.ReactNode;
}) {
  const style = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${style}`}>
      {children}
    </div>
  );
}

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      {label}
    </div>
  );
}

export function Stars({ value, size = 'text-lg' }: { value: number; size?: string }) {
  return (
    <span className={`${size} leading-none`} aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'text-amber-400' : 'text-slate-300'}>
          ★
        </span>
      ))}
    </span>
  );
}
