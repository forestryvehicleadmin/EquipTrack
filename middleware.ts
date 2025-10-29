import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware now supports two auth methods:
// - Basic Auth header (keeps existing behavior)
// - Session cookie created by /api/auth/login
// If unauthenticated, redirect to /login (so users see a login page)

const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;
const SECRET = process.env.SUPABASE_JWT_SECRET || process.env.BASIC_AUTH_PASS || 'secret';

async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  try {
    // token is base64(payload:sigHex)
    const raw = atob(token);
    const lastColon = raw.lastIndexOf(':');
    if (lastColon === -1) return false;
    const payload = raw.slice(0, lastColon);
    const sigHex = raw.slice(lastColon + 1);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computedHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (computedHex !== sigHex) return false;

    // payload is user:expires
    const parts = payload.split(':');
    const expires = Number(parts[parts.length - 1]);
    if (Number.isNaN(expires)) return false;
    if (Date.now() > expires) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  // Always enforce auth flow: require either Basic header or a valid session cookie
  // (we no longer short-circuit when USER/PASS are missing so the site defaults to the login page)

  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Allow next internals and auth routes through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Basic auth header (still supported)
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Basic ')) {
    try {
      const base64 = auth.split(' ')[1];
      const decoded = atob(base64);
      const [user, pass] = decoded.split(':');
      if (user === USER && pass === PASS) {
        return NextResponse.next();
      }
    } catch (e) {
      // continue to check session cookie
    }
  }

  // Check session cookie
  const cookieToken = req.cookies.get('session')?.value;
  if (await verifySessionToken(cookieToken)) {
    return NextResponse.next();
  }

  // Not authenticated: redirect to login page
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/', '/((?!_next/static|_next/image|favicon.ico|public|api/auth|login).*)'],
};
