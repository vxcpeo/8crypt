import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { CARD_BY_MINT } from '@/lib/cards';
import { addOffer, readOffers } from '@/lib/offers';
import { requireSession } from '@/lib/server-session';
import type { Offer } from '@/lib/types';
import { previewVault } from '@/lib/vault';

export const dynamic = 'force-dynamic';

const MAX_USDC = 1_000_000;

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const offers = await readOffers();
  return NextResponse.json(
    { offers },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return fail('Connect and sign in with your Solana wallet first', 401);
  }

  try {
    const body = await request.json();
    const wantedMint = String(body?.wantedMint || '');
    const offeredMint = String(body?.offeredMint || '');
    const usdcAdded = Math.max(0, Math.min(MAX_USDC, Number(body?.usdcAdded) || 0));
    const usdcRequested = Math.max(0, Math.min(MAX_USDC, Number(body?.usdcRequested) || 0));
    const expiresInDays = body?.expiresInDays ? Number(body.expiresInDays) : null;

    const wanted = CARD_BY_MINT.get(wantedMint);
    const offered = CARD_BY_MINT.get(offeredMint);
    if (!wanted || !offered) return fail('Unknown card');
    if (wantedMint === offeredMint) return fail('Pick two different cards');
    if (usdcAdded > 0 && usdcRequested > 0) {
      return fail('USDC can only flow in one direction');
    }

    const vault = previewVault(session.address);
    if (!vault.some((card) => card.mint === offeredMint)) {
      return fail('That card is not in this wallet', 403);
    }

    const expiresAt =
      expiresInDays && Number.isFinite(expiresInDays) && expiresInDays > 0
        ? new Date(Date.now() + Math.min(365, expiresInDays) * 86400_000).toISOString()
        : null;

    const offer: Offer = {
      id: randomUUID(),
      maker: session.address,
      wantedMint,
      offeredMint,
      usdcAdded: Math.round(usdcAdded * 100) / 100,
      usdcRequested: Math.round(usdcRequested * 100) / 100,
      fee: 1,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'open',
      txSignature: bs58.encode(nacl.randomBytes(64)),
    };

    await addOffer(offer);
    return NextResponse.json({ offer }, { status: 201 });
  } catch {
    return fail('Could not create offer');
  }
}
