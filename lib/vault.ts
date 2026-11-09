import { PublicKey } from '@solana/web3.js';
import { DEMO_VAULT_MINTS, CARDS } from './cards';

/**
 * In this preview build, the connected wallet is assigned a deterministic
 * "vault" of catalog cards. On mainnet the same list is produced by reading
 * the wallet's Token Metadata / Collector Crypt assets through the RPC.
 */
export function previewVault(address: string) {
  if (!address) return [];
  let seed = 0;
  try {
    const bytes = new PublicKey(address).toBytes();
    for (const byte of bytes) seed = (seed * 31 + byte) >>> 0;
  } catch {
    for (const char of address) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }
  const mints = [...DEMO_VAULT_MINTS];
  const chosen: string[] = [];
  while (chosen.length < 6) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const candidate = mints[seed % mints.length];
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen
    .map((mint) => CARDS.find((card) => card.mint === mint))
    .filter((card): card is NonNullable<typeof card> => Boolean(card));
}
