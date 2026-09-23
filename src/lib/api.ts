/**
 * Central API client.
 * - VITE_API_URL points to the backend (e.g. https://cognitest-api.onrender.com). Empty = same origin.
 * - Adds the login token to every request.
 */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'cognitest_token';

let token: string | null = null;
try {
  token = localStorage.getItem(TOKEN_KEY);
} catch {
  /* storage unavailable */
}

export function getToken() {
  return token;
}

export function setToken(t: string | null) {
  token = t;
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler) {
  onUnauthorized = fn;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401 && token && !path.startsWith('/api/auth/login')) {
    setToken(null);
    onUnauthorized?.();
  }
  return res;
}

/** WebSocket URL for live proctoring, authenticated with the same token. */
export function wsUrl(): string {
  const base = API_BASE || window.location.origin;
  const url = new URL('/ws/proctor', base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  if (token) url.searchParams.set('token', token);
  return url.toString();
}
