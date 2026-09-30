export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);

const TOKEN_KEY = 'resolveai.token';

export const tokenStorage = {
  get(): string | null {
    try {
      return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* armazenamento indisponível */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* armazenamento indisponível */
    }
  },
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Converte a resposta de erro do Nest (message string ou string[]) em texto legível. */
export function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message: unknown }).message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown };

export async function api<T>(path: string, { body, headers, ...init }: Options = {}): Promise<T> {
  const token = tokenStorage.get();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Tente novamente.');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStorage.clear();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    throw new ApiError(res.status, extractErrorMessage(data, `Erro ${res.status}`));
  }
  return data as T;
}

export function imageUrl(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export function toQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}
