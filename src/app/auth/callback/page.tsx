'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { setStoredTokens } from '../../../lib/api';
import { useAuth } from '../../../context/auth-context';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      setStoredTokens({
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn: '15m',
        tokenType: 'Bearer',
      });

      refreshProfile()
        .then(() => {
          router.replace('/dashboard');
        })
        .catch(() => {
          router.replace('/login?error=oauth_failed');
        });
    } else {
      router.replace('/login?error=no_token');
    }
  }, [searchParams, router, refreshProfile]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070a12] text-white">
      <Spinner size="lg" color="accent" />
      <p className="mt-4 text-sm text-slate-400">Authenticating with AtTech SSO...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#070a12] text-white">
          <Spinner size="lg" color="accent" />
          <p className="mt-4 text-sm text-slate-400">Processing authentication...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
