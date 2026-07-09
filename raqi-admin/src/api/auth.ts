import type { Session } from '../types';
import { apiRequest } from './http';

export const SESSION_KEY = 'raqi_admin_session';

export function loadStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function storeSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function login(email: string, password: string) {
  return apiRequest<Session>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refresh(refreshToken: string) {
  return apiRequest<{ accessToken: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}
