import type { ApiEnvelope } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setSessionTokens(nextAccess: string | null, nextRefresh: string | null) {
  accessToken = nextAccess;
  refreshToken = nextRefresh;
}

export function getRefreshToken() {
  return refreshToken;
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const execute = async (token?: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response: Response;
  try {
    response = await execute(accessToken);
  } catch {
    throw new Error('Failed to fetch');
  }

  if (response.status === 401 && refreshHandler) {
    const nextAccess = await refreshHandler();
    if (nextAccess) {
      try {
        response = await execute(nextAccess);
      } catch {
        throw new Error('Failed to fetch');
      }
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? `Request failed (${response.status})`);
  }

  return (await response.json()) as ApiEnvelope<T>;
}
