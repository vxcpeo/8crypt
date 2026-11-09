import { NextResponse } from 'next/server';
import { verifyLogin } from '@/lib/siws';
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/token';
import { getRequestDomain } from '@/lib/server-session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = String(body?.address || '');
    const message = String(body?.message || '');
    const signature = String(body?.signature || '');
    const nonceToken = String(body?.nonceToken || '');
    const domain = getRequestDomain(request.headers);

    const result = verifyLogin({ address, message, signature, nonceToken, domain });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const token = createSessionToken(address);
    const response = NextResponse.json({ address, authenticated: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Could not verify signature' }, { status: 400 });
  }
}
