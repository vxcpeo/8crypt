import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const SESSION_COOKIE = 'gradix_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

let cachedSecret: string | null = null;

export type SessionPayload = {
  address: string;
  iat: number;
  exp: number;
};

/**
 * A single signing key shared by all route bundles. Prefer AUTH_SECRET; when it
 * is absent (preview/local runs) persist a random key under .data so sessions
 * and login challenges survive independent module instances and restarts.
 */
function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (cachedSecret) return cachedSecret;

  const dir = path.join(process.cwd(), '.data');
  const file = path.join(dir, '.auth-secret');
  try {
    cachedSecret = readFileSync(file, 'utf8').trim();
    if (cachedSecret) return cachedSecret;
  } catch {
    // generate below
  }

  const generated = randomBytes(32).toString('hex');
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, generated, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    cachedSecret = generated;
  } catch {
    try {
      cachedSecret = readFileSync(file, 'utf8').trim();
    } catch {
      cachedSecret = generated;
    }
  }
  return cachedSecret;
}

function hmac(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function encodeToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${hmac(body)}`;
}

export function decodeToken<T extends Record<string, unknown>>(token: string): T | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = hmac(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function createSessionToken(address: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    address,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  return encodeToken(payload);
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const payload = decodeToken<SessionPayload>(token);
  if (!payload?.address) return null;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}
