'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@heroui/react';
import {
  ShieldCheck,
  Star,
  ArrowRight,
  Database,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import ButtonWithIcon from '../components/ui/button-with-icon';
import AtTechLogo from '../components/ui/attech-logo';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#0B251A] relative overflow-hidden flex flex-col justify-between">
      {/* Subtle Background Radial Aura */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-[#AEFF48]/20 via-[#0B251A]/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between relative z-10 border-b border-black/5 bg-white/80 backdrop-blur-md rounded-b-3xl mt-0 shadow-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <AtTechLogo className="h-9 md:h-11 w-auto transition-transform group-hover:scale-105" variant="dark" />
          <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-[#0B251A]/5 text-[#0B251A] border border-[#0B251A]/10">
            ERP Platform
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link href="/dashboard">
              <button
                type="button"
                className="h-[46px] px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white font-bold text-xs rounded-full shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Workstation ({user.firstName})</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#AEFF48]" />
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button
                  type="button"
                  className="h-[46px] px-6 rounded-full text-[#0B251A] hover:bg-black/5 text-xs font-semibold cursor-pointer border border-black/10 transition-all"
                >
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button
                  type="button"
                  className="h-[46px] px-6 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-14 md:py-24 text-center relative z-10 flex flex-col items-center">
        {/* Rating Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-xs font-semibold mb-6">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAFAF9] text-[#0B251A] font-bold">
            <span>4.9</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          </span>
          <span className="w-[1px] h-3 bg-black/10" />
          <span className="text-slate-600 font-medium">Enterprise Agency Delivery & Operations</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#111111] tracking-tight leading-[1.08] max-w-4xl">
          Your agency doesn’t fit in a box.{' '}
          <span className="text-[#0B2E23] underline decoration-[#AEFF48] decoration-4 underline-offset-4">
            Your ERP shouldn’t either.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mt-6 leading-relaxed font-normal">
          Generic SaaS tools force agency teams to adapt. We build custom modular operations around your team—governing client lifecycles, project delivery, internal finance, and granular RBAC.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full justify-center">
          <Link href="/login" className="w-full sm:w-auto">
            <ButtonWithIcon
              label="Enter Workstation"
              className="w-full sm:w-auto min-w-[220px]"
              icon={<ArrowRight size={16} strokeWidth={2.5} />}
            />
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto h-[50px] min-w-[190px] px-8 rounded-full border border-black/15 hover:border-black/30 bg-white hover:bg-black/5 text-[#0B251A] font-semibold text-sm transition-all duration-300 cursor-pointer shadow-sm"
            >
              Join AtTech Team
            </button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20 text-left w-full">
          <Card className="bg-white border border-black/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#0B251A]/5 text-[#0B251A] flex items-center justify-center mb-4 border border-black/5">
              <ShieldCheck className="w-5 h-5 text-[#0B2E23]" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Central Admin & RBAC</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              21 industry-standard agency roles with 30+ granular permission matrices and wildcard Super Admin authority.
            </p>
          </Card>

          <Card className="bg-white border border-black/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#0B251A]/5 text-[#0B251A] flex items-center justify-center mb-4 border border-black/5">
              <Lock className="w-5 h-5 text-[#0B2E23]" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">OAuth 2.0 & JWT Security</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Bcrypt encryption, Refresh Token rotation with reuse prevention, and Google Workspace SSO integration.
            </p>
          </Card>

          <Card className="bg-white border border-black/5 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all">
            <div className="w-11 h-11 rounded-2xl bg-[#0B251A]/5 text-[#0B251A] flex items-center justify-center mb-4 border border-black/5">
              <Database className="w-5 h-5 text-[#0B2E23]" />
            </div>
            <h3 className="text-base font-bold text-[#111111]">Modular Monolith</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Self-registering feature vertical slices on top of MongoDB Atlas with automated audit trail logging.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-black/5 text-center text-xs text-slate-500">
        © 2026 AtTech Solutions Inc. All rights reserved. Precision Agency ERP & Operations Platform.
      </footer>
    </div>
  );
}
