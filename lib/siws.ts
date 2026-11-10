import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { consumeNonce } from './nonce-store';
import { decodeToken, encodeToken } from './token';

const CHAIN_ID = 'solana:mainnet';
const NONCE_TTL_SECONDS = 5 * 60;

export type WalletLogin = {
  message: string;
  nonce: string;
  nonceToken: string;
  domain: string;
};

type NoncePayload = {
  kind: 'siws-nonce';
  address: string;
  nonce: string;
  domain: string;
  message: string;
  exp: number;
};

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function normalizeDomain(host: string, proto = 'https'): string {
  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return `${proto === 'https' ? 'http' : proto}://${host}`;
  }
  return `${proto}://${host}`;
}

export function buildLoginMessage(address: string, domain: string, nonce: string): string {
  const issuedAt = new Date();
  const expiration = new Date(issuedAt.getTime() + NONCE_TTL_SECONDS * 1000);
  return [
    `${new URL(domain).host} wants you to sign in with your Solana account:`,
    address,
    '',
    'Sign in to Gemmora with your Solana wallet. This proves you control the wallet and does not create a transaction or cost any fees.',
    '',
    `URI: ${domain}`,
    'Version: 1',
    `Chain ID: ${CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expiration.toISOString()}`,
  ].join('\n');
}

export function createLoginChallenge(address: string, domain: string): WalletLogin {
  if (!isValidAddress(address)) throw new Error('Invalid Solana address');
  const nonce = randomNonce();
  const message = buildLoginMessage(address, domain, nonce);
  const payload: NoncePayload = {
    kind: 'siws-nonce',
    address,
    nonce,
    domain,
    message,
    exp: Math.floor(Date.now() / 1000) + NONCE_TTL_SECONDS,
  };
  return {
    message,
    nonce,
    nonceToken: encodeToken(payload),
    domain,
  };
}

export function isValidAddress(address: string): boolean {
  try {
    const key = new PublicKey(address);
    return key.toBase58() === address;
  } catch {
    return false;
  }
}

export type VerifyLoginInput = {
  address: string;
  message: string;
  signature: string;
  nonceToken: string;
  domain: string;
};

export function verifyLogin({
  address,
  message,
  signature,
  nonceToken,
  domain,
}: VerifyLoginInput): { ok: true } | { ok: false; error: string } {
  if (!isValidAddress(address)) return { ok: false, error: 'Invalid wallet address' };

  const nonce = decodeToken<NoncePayload>(nonceToken);
  if (!nonce || nonce.kind !== 'siws-nonce') {
    return { ok: false, error: 'Login challenge expired or invalid' };
  }
  if (nonce.address !== address) return { ok: false, error: 'Challenge wallet mismatch' };
  if (nonce.domain !== domain) return { ok: false, error: 'Challenge domain mismatch' };
  if (nonce.exp * 1000 < Date.now()) return { ok: false, error: 'Login challenge expired' };

  const expected = nonce.message;
  if (message.trim() !== expected.trim()) {
    return { ok: false, error: 'Signed message does not match the challenge' };
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
  } catch {
    return { ok: false, error: 'Signature is not valid base64' };
  }
  if (signatureBytes.length !== 64) {
    return { ok: false, error: 'Signature must be 64 bytes' };
  }

  try {
    const publicKey = new PublicKey(address).toBytes();
    const messageBytes = new TextEncoder().encode(message);
    const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
    if (!valid) return { ok: false, error: 'Wallet signature is invalid' };
  } catch {
    return { ok: false, error: 'Could not verify wallet signature' };
  }

  if (!consumeNonce(nonce.nonce, nonce.exp)) {
    return { ok: false, error: 'This login challenge was already used' };
  }

  return { ok: true };
}

export function encodeSignature(signature: Uint8Array): string {
  return Buffer.from(signature).toString('base64');
}
