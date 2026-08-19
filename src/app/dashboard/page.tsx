'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@heroui/react';
import {
  ShieldAlert,
  Users,
  FolderGit2,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Key,
  Layers,
  Cpu,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { Role } from '../../types/auth';

export default function DashboardOverviewPage() {
  const { user, rbac, role, isAdmin, isSuperAdmin } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E5E7EB] p-6 md:p-8 shadow-sm">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#AEFF48]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#0B2E23] uppercase tracking-wider">
                Workstation Session
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 bg-[#0B251A]/5 text-[#0B251A] border border-[#0B251A]/10">
                {user.role}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#111111] tracking-tight">
              Welcome back, {user.firstName} {user.lastName} 👋
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1.5 max-w-2xl font-normal leading-relaxed">
              {isSuperAdmin
                ? 'You have complete administrative oversight with root wildcard authority across all agency systems.'
                : isAdmin
                ? 'Managing agency operations, staff assignments, project health, and financial records.'
                : role === Role.CLIENT
                ? 'Track your active project deliverables, review milestones, and access invoices.'
                : 'Your engineering workspace is synced with current sprint goals and tickets.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/dashboard/users">
                <button
                  type="button"
                  className="px-4 py-2.5 bg-[#0B2E23] hover:bg-[#0B251A] text-white font-bold text-xs rounded-full shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Manage Staff</span>
                </button>
              </Link>
            )}
            <Link href="/dashboard/profile">
              <button
                type="button"
                className="px-4 py-2.5 border border-[#E5E7EB] hover:border-slate-400 bg-white text-slate-700 hover:text-[#111111] text-xs font-semibold rounded-full shadow-xs cursor-pointer transition-all"
              >
                Inspect RBAC
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Staff</span>
            <div className="p-2 rounded-xl bg-[#0B251A]/5 text-[#0B2E23]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#111111]">48</h3>
            <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5 font-semibold">
              <TrendingUp className="w-3 h-3" /> +4 hired this month
            </p>
          </div>
        </Card>

        <Card className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Client Projects</span>
            <div className="p-2 rounded-xl bg-[#0B251A]/5 text-[#0B2E23]">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#111111]">12</h3>
            <p className="text-[11px] text-blue-700 flex items-center gap-1 mt-0.5 font-semibold">
              <Activity className="w-3 h-3" /> 8 in active sprint
            </p>
          </div>
        </Card>

        <Card className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monthly Revenue</span>
            <div className="p-2 rounded-xl bg-[#0B251A]/5 text-[#0B2E23]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#111111]">$142,500</h3>
            <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5 font-semibold">
              <TrendingUp className="w-3 h-3" /> 98% collection rate
            </p>
          </div>
        </Card>

        <Card className="bg-white border border-[#E5E7EB] p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sprint Health</span>
            <div className="p-2 rounded-xl bg-[#0B251A]/5 text-[#0B2E23]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#111111]">94.2%</h3>
            <p className="text-[11px] text-purple-700 flex items-center gap-1 mt-0.5 font-semibold">
              <Clock className="w-3 h-3" /> On-track for release
            </p>
          </div>
        </Card>
      </div>

      {/* Role Specific Sections */}
      {(isSuperAdmin || isAdmin) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Control Matrix */}
          <Card className="bg-white border border-[#E5E7EB] lg:col-span-2 rounded-3xl shadow-sm p-2">
            <CardHeader className="flex justify-between items-center px-6 pt-6 pb-2">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0B2E23]" />
                  Central Agency Monolith Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Self-registering pluggable modules status</p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                All Modules Ready
              </span>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#0B2E23]" /> Auth & Google SSO
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">READY</span>
                  </div>
                  <p className="text-[11px] text-slate-500">JWT Bearer + Google OAuth 2.0 with Refresh Token rotation</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0B2E23]" /> RBAC & Permissions
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">READY</span>
                  </div>
                  <p className="text-[11px] text-slate-500">21 Agency Roles + 30 Granular Action Permissions</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#0B2E23]" /> MongoDB Atlas
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">CONNECTED</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Auto-indexing, resilient failover, DNS SRV resolution</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#0B2E23]" /> Central Audit Logging
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">ACTIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Full audit trail for logins, role updates, and resource changes</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-xs font-bold text-[#111111]">Super Admin Root Account</p>
                    <p className="text-[11px] text-slate-500">{user.email} (Encrypted in MongoDB)</p>
                  </div>
                </div>
                <Link href="/dashboard/users">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 text-xs font-semibold border border-[#E5E7EB] hover:border-[#0B251A] bg-white text-[#0B251A] rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                  >
                    <span>View Staff</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick RBAC Capability Card */}
          <Card className="bg-white border border-[#E5E7EB] rounded-3xl shadow-sm p-2">
            <CardHeader className="px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" /> Your Active Permissions
              </h3>
            </CardHeader>
            <CardContent className="px-6 py-4 space-y-3">
              <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                <p className="text-xs font-medium text-slate-500">Effective Authority</p>
                <p className="text-xs text-[#0B2E23] font-bold mt-0.5">
                  {isSuperAdmin ? 'Wildcard [*] Full Root Access' : `${rbac?.permissions?.length || 0} Granular Permissions`}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                    <span>User & Role Governance</span>
                    <span className="text-[#0B2E23] font-bold">100%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B2E23] rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                    <span>Audit Trail Review</span>
                    <span className="text-[#0B2E23] font-bold">100%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B2E23] rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-medium">
                    <span>SDLC & Release Controls</span>
                    <span className="text-[#0B2E23] font-bold">100%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B2E23] rounded-full w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff & Developer Task Panel */}
      {role !== Role.CLIENT && (
        <Card className="bg-white border border-[#E5E7EB] rounded-3xl shadow-sm p-2">
          <CardHeader className="px-6 pt-6 pb-2 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-[#0B2E23]" />
                Active Engineering & SDLC Milestones
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Sprint 24.3 - Next.js & NestJS ERP Integration</p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider rounded-full px-3 py-1 bg-[#0B251A]/5 text-[#0B251A] border border-[#0B251A]/10">
              8 Days Remaining
            </span>
          </CardHeader>
          <CardContent className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-bold text-[#111111]">Authentication Slice</span>
                  <span className="text-[10px] font-bold text-emerald-700">MERGED</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">NestJS JWT Auth, Local Bcrypt, RBAC Matrix & Google OAuth2</p>
                <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-[#0B2E23] rounded-full w-full" />
                </div>
              </div>

              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-bold text-[#111111]">AtTech Design System</span>
                  <span className="text-[10px] font-bold text-blue-700">ACTIVE</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">DM Sans, Clean White/Sage theme & Enlarged Logo</p>
                <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-[#0B2E23] rounded-full w-[95%]" />
                </div>
              </div>

              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-bold text-[#111111]">Pluggable Feature Slices</span>
                  <span className="text-[10px] font-bold text-slate-400">UPCOMING</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">Project Management, Financial Records, and Client Portal</p>
                <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-[#0B2E23]/40 rounded-full w-[40%]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
