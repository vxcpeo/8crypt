import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server-session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json(
    {
      authenticated: true,
      address: session.address,
      issuedAt: session.iat,
      expiresAt: session.exp,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
