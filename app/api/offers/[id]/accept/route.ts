import { NextResponse } from 'next/server';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { requireSession } from '@/lib/server-session';
import { updateOffer } from '@/lib/offers';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  }

  const { id } = await params;
  let result: Awaited<ReturnType<typeof updateOffer>> = null;
  let conflict = '';

  await updateOffer(id, (offer) => {
    if (offer.status !== 'open') {
      conflict = 'This offer is no longer open';
      return offer;
    }
    if (offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now()) {
      conflict = 'This offer has expired';
      return offer;
    }
    if (offer.maker === session.address) {
      conflict = 'You cannot accept your own offer';
      return offer;
    }
    result = {
      ...offer,
      status: 'accepted',
      acceptedBy: session.address,
      settledAt: new Date().toISOString(),
      txSignature: bs58.encode(nacl.randomBytes(64)),
    };
    return result;
  });

  if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });
  if (!result) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  return NextResponse.json({ offer: result });
}
