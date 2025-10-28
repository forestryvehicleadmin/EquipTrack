import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple HTTP Basic Auth middleware.
// Configure the credentials with environment variables:
// BASIC_AUTH_USER and BASIC_AUTH_PASS

const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;

export function middleware(req: NextRequest) {
  // If no credentials configured, don't block (safe default for local dev)
  if (!USER || !PASS) return NextResponse.next();

  const auth = req.headers.get('authorization');

  if (auth && auth.startsWith('Basic ')) {
    try {
      const base64 = auth.split(' ')[1];
      // atob is available in the Edge runtime
      const decoded = atob(base64);
      const [user, pass] = decoded.split(':');
      if (user === USER && pass === PASS) {
        return NextResponse.next();
      }
    } catch (e) {
      // fallthrough to challenge
    }
  }

  // challenge the client for credentials
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
  });
}

// Match everything except next internals and static files
export const config = {
  matcher: ['/', '/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
