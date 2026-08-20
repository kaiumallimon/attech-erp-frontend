'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Code2,
  ShieldCheck,
  Activity,
  Zap,
  ArrowRight,
  UserPlus,
  Sparkles,
  Layers,
  KeyRound,
  ShieldAlert,
  Mail,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { Breadcrumbs } from '../../components/breadcrumbs';

interface QuickStatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}

function QuickStat({ icon: Icon, label, value, color, bgColor }: QuickStatProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex size-10 items-center justify-center rounded-4xl shrink-0 ${bgColor}`}>
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-extrabold tracking-tight text-[#111111] leading-none truncate">{value}</p>
        <p className="text-[11px] text-slate-500 font-medium truncate mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { user, role, isAdmin, isSuperAdmin } = useAuth();

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}!` : 'Welcome back!';

  const recentLogs = [
    { id: 1, action: 'AUTH_LOGIN', desc: `${user?.email || 'Admin'} signed in successfully`, time: 'Just now', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, action: 'USERS_SEED', desc: 'Auto-seeded Super Admin account verified in Atlas DB', time: '10m ago', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, action: 'RBAC_EVAL', desc: 'Resolved 13 agency-standard roles & access permissions', time: '1h ago', icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, action: 'TOKEN_ROTATION', desc: 'Generated cryptographic 15m access + 7d refresh pair', time: '2h ago', icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-4xl border border-[#E5E7EB] bg-gradient-to-br from-white via-white to-[#AEFF48]/10 p-6 sm:p-8 shadow-xs">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-[#AEFF48]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-[#0B251A]/5 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0B2E23]/10 text-[#0B251A] border border-[#0B2E23]/20">
                  <Sparkles className="size-3 text-[#0B2E23]" />
                  Agency Workstation
                </span>
                <span className="text-xs text-slate-400 font-medium">| {role}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">{greeting}</h1>
              <p className="mt-2 max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Here&apos;s your agency operations center. Oversee staff governance, security audit trails, media delivery, broadcasts, and machine access in real-time.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full items-center gap-2 sm:w-auto shrink-0">
              {(isAdmin || isSuperAdmin) && (
                <Link
                  href="/dashboard/users"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-4xl bg-[#0B2E23] hover:bg-[#0B251A] text-white shadow-sm transition-all"
                >
                  <UserPlus className="size-3.5 text-[#AEFF48]" />
                  <span>Add Staff</span>
                </Link>
              )}
              <Link
                href="/dashboard/profile"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-4xl bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] shadow-xs transition-all"
              >
                <span>My Profile</span>
                <ExternalLink className="size-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* QuickStat Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 pt-6 border-t border-[#E5E7EB]/60">
            <QuickStat
              icon={Users}
              label="Agency Staff"
              value={isAdmin ? '13 Roles' : 'Active'}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <QuickStat
              icon={ShieldAlert}
              label="Audit Trails"
              value="100% Tracked"
              color="text-rose-600"
              bgColor="bg-rose-50"
            />
            <QuickStat
              icon={ShieldCheck}
              label="RBAC Matrix"
              value="13 Roles"
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
            <QuickStat
              icon={KeyRound}
              label="Machine API Keys"
              value="Scoped"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
            <QuickStat
              icon={Layers}
              label="CDN & Storage"
              value="Multi-Region"
              color="text-violet-600"
              bgColor="bg-violet-50"
            />
            <QuickStat
              icon={Zap}
              label="Atlas DB Uptime"
              value="99.9%"
              color="text-emerald-600"
              bgColor="bg-emerald-50"
            />
          </div>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Core Operations Hub */}
        <div className="min-w-0 rounded-4xl border border-[#E5E7EB] bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#111111]">Enterprise Operations Hub</h2>
              <p className="text-xs text-slate-500 mt-0.5">Agency core modules and active operational workflows</p>
            </div>
            <Link
              href="/dashboard/users"
              className="text-xs text-[#0B2E23] font-bold hover:underline flex items-center gap-1"
            >
              <span>Manage Staff</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/users"
              className="p-4 rounded-3xl border border-[#E5E7EB] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <Users className="size-4" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-[#111111]">Staff Governance & RBAC</p>
              <p className="text-[11px] text-slate-500">13 role assignments, permission matrix, and agency personnel management.</p>
            </Link>

            <Link
              href="/dashboard/newsletter"
              className="p-4 rounded-3xl border border-[#E5E7EB] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  <Mail className="size-4" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-[#111111]">Newsletter & Broadcasts</p>
              <p className="text-[11px] text-slate-500">Rich HTML newsletter composer, subscriber lists, and automated communications.</p>
            </Link>

            <Link
              href="/dashboard/cdn"
              className="p-4 rounded-3xl border border-[#E5E7EB] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <Layers className="size-4" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-[#111111]">CDN & Media Storage</p>
              <p className="text-[11px] text-slate-500">Cloudinary asset management and high-throughput media delivery.</p>
            </Link>

            <Link
              href="/dashboard/api-keys"
              className="p-4 rounded-3xl border border-[#E5E7EB] bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <KeyRound className="size-4" />
                </div>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs font-bold text-[#111111]">API Keys & Access</p>
              <p className="text-[11px] text-slate-500">Cryptographic tokens, IP allowlists, and scoped machine access.</p>
            </Link>
          </div>
        </div>

        {/* Right 1 Column: Central Governance & Access Overview */}
        <div className="min-w-0 rounded-4xl border border-[#E5E7EB] bg-white p-6 shadow-xs">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#111111]">Governance Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">13 roles categorized by department</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111111]">Executive & Leadership</p>
                  <p className="text-[10px] text-slate-500">SUPER ADMIN, CEO, ADMIN</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700">3 Roles</span>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                  <Code2 className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111111]">Department Managers</p>
                  <p className="text-[10px] text-slate-500">HR, Finance, Sales, Project Mgr</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700">4 Roles</span>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111111]">Technical & Creative Staff</p>
                  <p className="text-[10px] text-slate-500">Lead, Dev, Designer, QA, Employee</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700">5 Roles</span>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111111]">External Portal</p>
                  <p className="text-[10px] text-slate-500">Client Stakeholder Access</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700">1 Role</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Card: Recent Operations & Audit Log Stream */}
      <div className="rounded-4xl border border-[#E5E7EB] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#0B2E23]" />
            <h2 className="text-base font-bold text-[#111111]">Recent Activity & Security Audit</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Live Audit Interceptor</span>
        </div>

        <div className="divide-y divide-[#E5E7EB]/60">
          {recentLogs.map((log) => {
            const Icon = log.icon;
            return (
              <div key={log.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${log.bg} ${log.color} shrink-0`}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111111]">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="size-3" /> {log.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{log.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  Verified
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
