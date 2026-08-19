'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@heroui/react';
import { Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import ButtonWithIcon from '../../components/ui/button-with-icon';
import AtTechLogo from '../../components/ui/attech-logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FAFAF9]">
      {/* Subtle Background Radial Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#AEFF48]/20 via-[#0B251A]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 flex flex-col items-center">
          <Link href="/" className="inline-flex items-center justify-center mb-3 group py-1">
            <AtTechLogo className="h-10 sm:h-12 w-auto transition-transform group-hover:scale-105" variant="dark" />
          </Link>
          <p className="text-xs text-slate-500 font-medium">Security & Password Recovery</p>
        </div>

        <Card className="bg-white border border-[#E5E7EB] shadow-xl shadow-black/5 rounded-3xl p-4 text-[#0B251A]">
          <CardHeader className="px-4 pt-4 pb-2">
            <h2 className="text-lg font-bold text-[#111111]">Password Recovery</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your corporate email address to receive secure reset instructions
            </p>
          </CardHeader>

          <CardContent className="px-4 py-4">
            {isSubmitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-800">Instructions Dispatched</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an account exists for <span className="font-semibold text-slate-900">{email}</span>, a secure password recovery link has been sent.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 px-1">Registered Corporate Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@attech.solutions"
                      className="w-full h-[50px] pl-11 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-sm text-[#0B251A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <ButtonWithIcon
                    type="submit"
                    fullWidth
                    label="Send Recovery Link"
                    loading={isLoading}
                    loadingLabel="Sending Link..."
                    icon={<Send size={16} strokeWidth={2.5} />}
                  />
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="px-4 py-4 bg-[#F9FAFB]/70 border-t border-[#E5E7EB] flex justify-center text-xs text-slate-500 rounded-b-3xl">
            <Link href="/login" className="flex items-center gap-1.5 text-[#0B2E23] font-bold hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
