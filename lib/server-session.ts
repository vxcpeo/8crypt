import { cookies } from 'next/headers';
import { readSessionToken, SESSION_COOKIE, type SessionPayload } from './token';

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    const error = new Error('Not authenticated') as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  return session;
}

export function getRequestDomain(headers: Headers): string {
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000';
  const proto = headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
