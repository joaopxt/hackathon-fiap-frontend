export type Role = 'SOLICITANTE' | 'GESTOR';
export type Status = 'ABERTA' | 'EM_ANALISE' | 'EM_ATENDIMENTO' | 'RESOLVIDA' | 'CANCELADA';
export type Priority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type Category =
  | 'ILUMINACAO'
  | 'EQUIPAMENTO_QUEBRADO'
  | 'ACESSIBILIDADE'
  | 'LIMPEZA'
  | 'VAZAMENTO'
  | 'SEGURANCA'
  | 'MANUTENCAO'
  | 'OUTROS';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface User extends UserSummary {
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: UserSummary;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: Status | null;
  toStatus: Status;
  note: string;
  createdAt: string;
  changedBy: UserSummary;
}

export interface Occurrence {
  id: string;
  code: number;
  title: string;
  description: string;
  category: Category;
  location: string;
  latitude: number | null;
  longitude: number | null;
  imagePath: string | null;
  status: Status;
  priority: Priority;
  solution: string | null;
  resolvedAt: string | null;
  rating: number | null;
  ratingComment: string | null;
  createdAt: string;
  updatedAt: string;
  requester: UserSummary;
  assignee: UserSummary | null;
  _count?: { comments: number };
}

export interface OccurrenceDetail extends Occurrence {
  comments: Comment[];
  statusHistory: StatusHistoryEntry[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  total: number;
  open: number;
  unassigned: number;
  createdLast30d: number;
  resolutionRate: number;
  avgResolutionHours: number | null;
  avgRating: number | null;
  ratingCount: number;
  byStatus: Record<Status, number>;
  byCategory: Record<Category, number>;
  openByPriority: Record<Priority, number>;
  recent: Pick<Occurrence, 'id' | 'code' | 'title' | 'status' | 'priority' | 'createdAt'>[];
}
