'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@heroui/react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import ButtonWithIcon from '../../components/ui/button-with-icon';
import AtTechLogo from '../../components/ui/attech-logo';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/google`;
  };

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
          <CardHeader className="flex flex-col gap-1 items-start px-4 pt-4 pb-2">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-500">Access your role-based workstation</p>
          </CardHeader>

          <CardContent className="px-4 py-4">
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              {/* Signature Hero Section Button for Login */}
              <div className="mt-2">
                <ButtonWithIcon
                  type="submit"
                  fullWidth
                  label="Sign In to Workstation"
                  loading={isSubmitting || isLoading}
                  loadingLabel="Authenticating..."
                  icon={<ArrowRight size={16} strokeWidth={2.5} />}
                />
              </div>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-[#E5E7EB]" />
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">or</span>
              <div className="flex-1 h-[1px] bg-[#E5E7EB]" />
            </div>

            {/* Google OAuth Button - matching h-[50px] rounded-full size */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-[50px] rounded-full border border-[#E5E7EB] hover:border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-[#0B251A] text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>

            {/* Quick Demo Credentials */}
            <div className="mt-6 p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 font-medium px-1">
                <Sparkles className="w-3.5 h-3.5 text-[#0B2E23]" />
                <span>Super Admin Preset:</span>
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

          <CardFooter className="px-4 py-4 bg-[#F9FAFB]/70 border-t border-[#E5E7EB] flex justify-center text-xs text-slate-500 rounded-b-3xl">
            <span>New agency member?</span>{' '}
            <Link href="/register" className="ml-1 text-[#0B2E23] font-bold hover:underline">
              Create account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
