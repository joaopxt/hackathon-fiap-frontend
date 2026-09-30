import type { Category, Priority, Status } from './types';

export const STATUS_LABEL: Record<Status, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em análise',
  EM_ATENDIMENTO: 'Em atendimento',
  RESOLVIDA: 'Resolvida',
  CANCELADA: 'Cancelada',
};

export const STATUS_STYLE: Record<Status, string> = {
  ABERTA: 'bg-sky-100 text-sky-800 ring-sky-200',
  EM_ANALISE: 'bg-amber-100 text-amber-800 ring-amber-200',
  EM_ATENDIMENTO: 'bg-violet-100 text-violet-800 ring-violet-200',
  RESOLVIDA: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  CANCELADA: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const PRIORITY_STYLE: Record<Priority, string> = {
  BAIXA: 'bg-slate-100 text-slate-700 ring-slate-200',
  MEDIA: 'bg-blue-50 text-blue-700 ring-blue-200',
  ALTA: 'bg-orange-100 text-orange-800 ring-orange-200',
  URGENTE: 'bg-red-100 text-red-800 ring-red-200',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ILUMINACAO: 'Iluminação',
  EQUIPAMENTO_QUEBRADO: 'Equipamento quebrado',
  ACESSIBILIDADE: 'Acessibilidade',
  LIMPEZA: 'Limpeza',
  VAZAMENTO: 'Vazamento',
  SEGURANCA: 'Segurança',
  MANUTENCAO: 'Manutenção',
  OUTROS: 'Outros',
};

export const STATUSES = Object.keys(STATUS_LABEL) as Status[];
export const PRIORITIES = Object.keys(PRIORITY_LABEL) as Priority[];
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

/** Espelha as transições permitidas pelo backend (src/common/domain.ts). */
export const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  ABERTA: ['EM_ANALISE', 'CANCELADA'],
  EM_ANALISE: ['EM_ATENDIMENTO', 'CANCELADA'],
  EM_ATENDIMENTO: ['RESOLVIDA', 'CANCELADA'],
  RESOLVIDA: ['EM_ATENDIMENTO'],
  CANCELADA: [],
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours.toFixed(1).replace('.', ',')} h`;
  return `${(hours / 24).toFixed(1).replace('.', ',')} dias`;
}
