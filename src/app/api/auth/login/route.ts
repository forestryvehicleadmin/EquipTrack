import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user = String(body.user ?? '');
  const pass = String(body.pass ?? '');

  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASS;
  const SECRET = process.env.SUPABASE_JWT_SECRET || process.env.BASIC_AUTH_PASS || 'secret';

  if (!USER || !PASS) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
  }

  if (user !== USER || pass !== PASS) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // create token: payload = `${user}:${expires}`; sig = HMAC(payload)
  const expires = Date.now() + 1000 * 60 * 60 * 24; // 1 day
  const payload = `${user}:${expires}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64');

  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return res;
}
