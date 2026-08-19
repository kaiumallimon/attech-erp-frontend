'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@heroui/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Send,
  CheckCircle2,
  KeyRound,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import ButtonWithIcon from '../../components/ui/button-with-icon';
import AtTechLogo from '../../components/ui/attech-logo';

function LoginContent() {
  const { login, requestMagicLink, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<'magic-link' | 'password'>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // If already authenticated, redirect immediately away from login
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      if (urlError === 'missing_token') {
        setError('No magic token provided in verification link.');
      } else {
        setError(decodeURIComponent(urlError));
      }
    }
  }, [searchParams]);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handlePasswordlessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your corporate email address');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await requestMagicLink(email);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate magic sign-in link. Please check your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  if (!isLoading && isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FAFAF9]">
      {/* Subtle Background Radial Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#AEFF48]/20 via-[#0B251A]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header with Large Prominent AtTech Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link href="/" className="inline-flex items-center justify-center mb-3 group py-1">
            <AtTechLogo className="h-10 sm:h-12 w-auto transition-transform group-hover:scale-105" variant="dark" />
          </Link>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Enterprise Operations & SDLC Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white border border-[#E5E7EB] shadow-xl shadow-black/5 rounded-3xl p-4 text-[#0B251A]">
          <CardHeader className="flex flex-col gap-2 items-start px-4 pt-4 pb-2">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-bold text-[#111111] tracking-tight">Sign In</h2>
              {/* Tab Switcher */}
              <div className="flex items-center bg-[#F3F4F6] p-1 rounded-full text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('magic-link');
                    setMagicLinkSent(false);
                    setError(null);
                  }}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    authMode === 'magic-link'
                      ? 'bg-[#0B2E23] text-white shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Passwordless
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setMagicLinkSent(false);
                    setError(null);
                  }}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    authMode === 'password'
                      ? 'bg-[#0B2E23] text-white shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Password
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {authMode === 'magic-link'
                ? 'Sign in securely without passwords via your corporate email'
                : 'Enter your credentials to access your agency workstation'}
            </p>
          </CardHeader>

          <CardContent className="px-4 py-4">
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
                <span className="font-bold">Notice:</span> {error}
              </div>
            )}

            {authMode === 'magic-link' ? (
              magicLinkSent ? (
                /* Secure Dispatched Confirmation Screen */
                <div className="py-4 text-center flex flex-col items-center gap-3 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111111]">Check Your Corporate Inbox</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      We’ve dispatched a secure one-click sign-in link to:
                    </p>
                    <p className="text-xs font-bold text-[#0B2E23] mt-1 bg-[#F9FAFB] py-1.5 px-4 rounded-full border border-[#E5E7EB] inline-block">
                      {email}
                    </p>
                  </div>

                  <div className="p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-left w-full text-xs text-slate-600 space-y-1.5 mt-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0B251A]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Security Verification Steps:</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-5.5">
                      1. Open the email from <strong>AtTech Operations</strong>.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-5.5">
                      2. Click <strong>&quot;Sign In to Workstation&quot;</strong> (valid for 15 minutes).
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-5.5">
                      3. Your session will authenticate automatically via Server-Side Rendering.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMagicLinkSent(false);
                    }}
                    className="text-xs text-slate-500 hover:text-[#0B2E23] font-semibold mt-2 hover:underline cursor-pointer"
                  >
                    ← Send to a different email
                  </button>
                </div>
              ) : (
                /* Passwordless Email Input Form */
                <form onSubmit={handlePasswordlessSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 px-1">Corporate Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="kaiumallimon5@gmail.com"
                        className="w-full h-[50px] pl-11 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-sm text-[#0B251A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B251A] focus:ring-1 focus:ring-[#0B251A] transition-all"
                      />
                    </div>
                  </div>

                  <div className="mt-1">
                    <ButtonWithIcon
                      type="submit"
                      fullWidth
                      label="Send Magic Sign-in Link"
                      loading={isSubmitting || isLoading}
                      loadingLabel="Dispatching Link..."
                      icon={<Send size={16} strokeWidth={2.5} />}
                    />
                  </div>
                </form>
              )
            ) : (
              /* Password Login Form */
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 px-1">Corporate Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="kaiumallimon5@gmail.com"
                      className="w-full h-[50px] pl-11 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-sm text-[#0B251A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B251A] focus:ring-1 focus:ring-[#0B251A] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#0B2E23] font-semibold hover:underline transition-all"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={isVisible ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-[50px] pl-11 pr-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-sm text-[#0B251A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B251A] focus:ring-1 focus:ring-[#0B251A] transition-all"
                    />
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="mt-1">
                  <ButtonWithIcon
                    type="submit"
                    fullWidth
                    label="Sign In with Password"
                    loading={isSubmitting || isLoading}
                    loadingLabel="Authenticating..."
                    icon={<KeyRound size={16} strokeWidth={2.5} />}
                  />
                </div>
              </form>
            )}

            {/* Quick Demo Credentials */}
            <div className="mt-6 p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 font-medium px-1">
                <Sparkles className="w-3.5 h-3.5 text-[#0B2E23]" />
                <span>Super Admin Quick Fill:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('kaiumallimon5@gmail.com', '11223344')}
                  className="px-3.5 py-1.5 text-xs bg-white hover:bg-[#F3F4F6] text-[#0B251A] border border-[#E5E7EB] shadow-xs rounded-full transition-colors flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0B2E23]" />
                  Super Admin (kaiumallimon5@gmail.com)
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]" />
      }
    >
      <LoginContent />
    </Suspense>
  );
}
