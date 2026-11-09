import { NextResponse } from 'next/server';
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
    if (offer.maker !== session.address) {
      conflict = 'Only the maker can cancel this offer';
      return offer;
    }
    if (offer.status !== 'open') {
      conflict = 'This offer is already closed';
      return offer;
    }
    result = { ...offer, status: 'cancelled', settledAt: new Date().toISOString() };
    return result;
  });

  if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });
  if (!result) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
  return NextResponse.json({ offer: result });
}
