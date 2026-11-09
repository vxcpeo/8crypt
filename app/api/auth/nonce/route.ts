import { NextResponse } from 'next/server';
import { createLoginChallenge } from '@/lib/siws';
import { getRequestDomain } from '@/lib/server-session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = String(body?.address || '');
    const domain = getRequestDomain(request.headers);
    const challenge = createLoginChallenge(address, domain);
    return NextResponse.json(challenge, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create challenge' },
      { status: 400 }
    );
  }
}
