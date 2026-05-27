import { API_URL } from './env';

/**
 * API-клієнт зі стратегією:
 *  - усі запити йдуть з credentials: 'include' (refresh cookie)
 *  - access token додається в Authorization автоматично
 *  - при 401 робиться одна спроба /auth/refresh, після чого запит повторюється
 *  - якщо refresh не вдався — викликається onUnauthorized (логаут на фронті)
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
  }
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
};

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path, API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildUrl('/api/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { accessToken?: string };
      if (data.accessToken) {
        accessToken = data.accessToken;
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function performRequest<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  if (!options.skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const init: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  if (options.body !== undefined) {
    init.body =
      options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options.query), init);

  if (response.status === 401 && !options.skipAuth && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return performRequest<T>(path, options, true);
    }
    onUnauthorized?.();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorPayload = payload as { error?: string; code?: string } | null;
    throw new ApiError(
      response.status,
      errorPayload?.code,
      errorPayload?.error ?? `Request failed: ${response.status}`,
      payload,
    );
  }

  return payload as T;
}

export const api = {
  get:  <T>(path: string, opts?: RequestOptions) => performRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => performRequest<T>(path, { ...opts, method: 'POST', body }),
  put:  <T>(path: string, body?: unknown, opts?: RequestOptions) => performRequest<T>(path, { ...opts, method: 'PUT', body }),
  patch:<T>(path: string, body?: unknown, opts?: RequestOptions) => performRequest<T>(path, { ...opts, method: 'PATCH', body }),
  delete:<T>(path: string, opts?: RequestOptions) => performRequest<T>(path, { ...opts, method: 'DELETE' }),
};
