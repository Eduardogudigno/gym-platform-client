import type { ExpiringSubscription, Member, PageMeta, Plan, Session, Subscription } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type Ok<T> = { success: true; data: T; meta?: PageMeta };
type FieldIssue = { path: string; message: string };
type Err = { success: false; error: { code: string; message: string; details?: unknown } };

export class ApiError extends Error {
  readonly status: number;
  readonly details: FieldIssue[];

  constructor(message: string, status: number, details: FieldIssue[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function readDetails(details: unknown): FieldIssue[] {
  if (!Array.isArray(details)) return [];
  return details.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const path = 'path' in item && typeof item.path === 'string' ? item.path : '';
    const message = 'message' in item && typeof item.message === 'string' ? item.message : '';
    return path && message ? [{ path, message }] : [];
  });
}

const storage = {
  access: 'desk.access',
  refresh: 'desk.refresh',
};

export function readTokens(): { access: string | null; refresh: string | null } {
  return {
    access: sessionStorage.getItem(storage.access),
    refresh: sessionStorage.getItem(storage.refresh),
  };
}

export function writeTokens(access: string, refresh: string): void {
  sessionStorage.setItem(storage.access, access);
  sessionStorage.setItem(storage.refresh, refresh);
}

export function clearTokens(): void {
  sessionStorage.removeItem(storage.access);
  sessionStorage.removeItem(storage.refresh);
}

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as Ok<T> | Err;
  if (!response.ok || !body.success) {
    const message = body.success ? response.statusText : body.error.message;
    const details = body.success ? [] : readDetails(body.error.details);
    throw new ApiError(message || 'Request failed', response.status, details);
  }
  return body.data;
}

async function refreshAccess(): Promise<string | null> {
  const refresh = readTokens().refresh;
  if (!refresh) return null;
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!response.ok) {
    clearTokens();
    return null;
  }
  const data = await parse<Session>(response);
  writeTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const access = readTokens().access;
  if (access) headers.set('Authorization', `Bearer ${access}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    const next = await refreshAccess();
    if (next) return api<T>(path, init, false);
  }
  return parse<T>(response);
}

export function me(): Promise<{ user: Session['user']; member: Session['member'] }> {
  return api('/api/v1/auth/me');
}

export function login(email: string, password: string): Promise<Session> {
  return api<Session>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<{ revoked: boolean }> {
  const refresh = readTokens().refresh ?? '';
  return api('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refresh }),
  });
}

export function listMembers(search: string): Promise<{ rows: Member[]; meta?: PageMeta }> {
  const params = new URLSearchParams({ page: '1', pageSize: '20', sort: 'createdAt:desc' });
  if (search.trim()) params.set('search', search.trim());
  return fetchPage<Member>(`/api/v1/members?${params.toString()}`);
}

export function expiringSubscriptions(): Promise<{ rows: ExpiringSubscription[]; meta?: PageMeta }> {
  return fetchPage<ExpiringSubscription>('/api/v1/reports/subscriptions/expiring?withinDays=7&pageSize=8');
}

export type NewMemberInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type DeskPayment = {
  method: 'cash';
  amount: string;
};

export function listPlans(): Promise<{ rows: Plan[]; meta?: PageMeta }> {
  return fetchPage<Plan>('/api/v1/plans?isActive=true&page=1&pageSize=100&sort=name:asc');
}

export function createMember(input: NewMemberInput): Promise<Member> {
  return api('/api/v1/members', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function enrollNewMember(
  planId: string,
  input: NewMemberInput & { payment?: DeskPayment },
): Promise<{ member: Member; subscription: Subscription }> {
  return api(`/api/v1/plans/${planId}/members`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function subscribeMember(
  memberId: string,
  planId: string,
  payment?: DeskPayment,
): Promise<Subscription> {
  return api('/api/v1/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ memberId, planId, ...(payment ? { payment } : {}) }),
  });
}

export function checkIn(memberId?: string): Promise<{ id: string }> {
  return api('/api/v1/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(memberId ? { memberId } : {}),
  });
}

async function fetchPage<T>(path: string): Promise<{ rows: T[]; meta?: PageMeta }> {
  const headers = new Headers();
  const access = readTokens().access;
  if (access) headers.set('Authorization', `Bearer ${access}`);
  const response = await fetch(`${API_URL}${path}`, { headers });
  if (response.status === 401) {
    const next = await refreshAccess();
    if (next) return fetchPage<T>(path);
  }
  const body = (await response.json()) as Ok<T[]> | Err;
  if (!response.ok || !body.success) {
    const message = body.success ? response.statusText : body.error.message;
    throw new ApiError(message || 'Request failed', response.status);
  }
  return { rows: body.data, meta: body.meta };
}
