import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Server-Side Route Handler for Magic Link Verification.
 * Executed 100% on the server.
 * Exchanges the single-use token with the NestJS backend, sets cookies on the redirect response,
 * and seamlessly routes the authenticated user to /dashboard.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'missing_token');
    return NextResponse.redirect(loginUrl);
  }

  const backendUrl =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000/api/v1';

  try {
    const res = await fetch(`${backendUrl}/auth/magic-link/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data?.data?.tokens) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set(
        'error',
        data?.message || 'Magic sign-in link is invalid or expired',
      );
      return NextResponse.redirect(loginUrl);
    }

    const { accessToken, refreshToken } = data.data.tokens;

    // Build the redirect response to /dashboard with secure cookies attached
    const dashboardUrl = new URL('/dashboard', request.url);
    const response = NextResponse.redirect(dashboardUrl);

    response.cookies.set('attech_access_token', accessToken, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
    });

    response.cookies.set('attech_refresh_token', refreshToken, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set(
      'error',
      'Unable to connect to authentication server',
    );
    return NextResponse.redirect(loginUrl);
  }
}
