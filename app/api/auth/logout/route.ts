import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/token';

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
