/**
 * Short-lived, single-use nonce registry for Sign-In With Solana.
 *
 * This module is intentionally process-local: the preview app runs as one
 * Next.js process. A multi-instance deployment should swap this for Redis or
 * a database with a TTL index; the security property is the same — a nonce can
 * only be presented to /api/auth/verify once.
 */
const used = new Map<string, number>();

function prune(now: number) {
  if (used.size < 512) return;
  for (const [nonce, expiresAt] of used) {
    if (expiresAt < now) used.delete(nonce);
  }
}

export function consumeNonce(nonce: string, expiresAtSeconds: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  prune(now);
  if (used.has(nonce)) return false;
  used.set(nonce, expiresAtSeconds);
  return true;
}
