'use client';
// Simple auth helper — stores JWT in localStorage (this is a real deployed
// Next.js app, not a Claude artifact, so localStorage is fine here) and
// provides fetch helpers that attach the Authorization header automatically.

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tradepulse-backend-l79z.onrender.com';
const TOKEN_KEY = 'tradepulse_token';
const USER_KEY = 'tradepulse_user';

export type AuthUser = { id: string; email: string };

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function signup(email: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Signup failed');
  setAuth(data.token, data.user);
  return data.user;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Login failed');
  setAuth(data.token, data.user);
  return data.user;
}

export function logout() {
  clearAuth();
  window.location.href = '/login';
}

// Authenticated fetch — attaches Bearer token automatically.
export async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(`${BACKEND_URL}${path}`, { ...options, headers });
}
