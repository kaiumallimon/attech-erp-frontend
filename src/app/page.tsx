import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Root page (/) acts as a server-side gateway:
 * - If authenticated -> redirects directly to /dashboard
 * - If unauthenticated -> redirects directly to /login
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('attech_access_token')?.value;
  const refreshToken = cookieStore.get('attech_refresh_token')?.value;

  if (accessToken || refreshToken) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
