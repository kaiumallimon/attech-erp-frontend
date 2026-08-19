import { NextResponse, type NextRequest } from 'next/server';

/**
 * Public routes that must NOT be accessible when logged in.
 */
const PRE_AUTH_ROUTES = ['/login', '/forgot-password'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('attech_access_token')?.value;
  const refreshToken = request.cookies.get('attech_refresh_token')?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  // 1. Root route (/) is disabled and acts as an intelligent router:
  //    - Authenticated users -> redirected to /dashboard
  //    - Unauthenticated users -> redirected to /login
  if (pathname === '/') {
    const destination = isAuthenticated ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. If user is logged in and visits pre-auth pages (/login, /forgot-password) -> redirect to /dashboard
  if (isAuthenticated && PRE_AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. If user is NOT logged in and attempts to access any /dashboard route -> redirect to /login
  if (!isAuthenticated && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static, _next/image
     * - favicon.ico
     * - image/svg asset files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
