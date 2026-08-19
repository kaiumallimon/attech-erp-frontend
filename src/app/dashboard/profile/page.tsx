'use client';

import React from 'react';
import { Card, Avatar, Button } from '@heroui/react';
import {
  ShieldCheck,
  Key,
  Building,
  Briefcase,
  LogOut,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';

export default function ProfileAndRbacPage() {
  const { user, rbac, isSuperAdmin, isAdmin, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'A'}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#0B2E23]" />
          My Profile & RBAC Workstation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed breakdown of your agency profile, identity tokens, and effective permission matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <Card className="bg-white border border-[#E5E7EB] p-6 flex flex-col items-center text-center rounded-3xl shadow-sm">
          <Avatar className="w-20 h-20 text-xl font-bold bg-[#0B251A] text-white shadow-md mb-4">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
          <h2 className="text-lg font-bold text-[#111111]">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>

          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider rounded-full px-3 py-1 bg-[#0B251A]/5 text-[#0B251A] border border-[#0B251A]/10">
              {user.role}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider rounded-full px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
              {user.status}
            </span>
          </div>

          <div className="my-6 w-full h-[1px] bg-[#E5E7EB]" />

          <div className="w-full space-y-3 text-left text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#0B2E23]" /> Department:</span>
              <span className="text-slate-900 font-medium">{user.department || 'Not assigned'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#0B2E23]" /> Job Title:</span>
              <span className="text-slate-900 font-medium">{user.jobTitle || 'Staff Member'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[#0B2E23]" /> Auth Provider:</span>
              <span className="text-slate-900 font-medium uppercase">{user.authProvider}</span>
            </div>
          </div>

          <Button
            variant="danger-soft"
            onClick={logout}
            className="w-full mt-6 text-xs font-bold py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Sign Out of Workstation
          </Button>
        </Card>

        {/* RBAC Inspection Card */}
        <Card className="bg-white border border-[#E5E7EB] md:col-span-2 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-[#111111]">Resolved RBAC Capabilities</h3>
            </div>
            {isSuperAdmin && (
              <span className="px-3 py-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-full flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Root Wildcard Authority
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Permissions are dynamically resolved by merging your default role matrix with any specific agency-granted override permissions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
              <span className="text-[11px] text-slate-500 font-medium">Administrative Level</span>
              <p className="text-sm font-bold text-[#111111] mt-0.5">
                {isSuperAdmin ? 'Super Administrator' : isAdmin ? 'Administrator' : 'Standard Agency User'}
              </p>
            </div>

            <div className="p-3.5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
              <span className="text-[11px] text-slate-500 font-medium">Permission Count</span>
              <p className="text-sm font-bold text-[#0B2E23] mt-0.5">
                {isSuperAdmin ? 'Wildcard [*]' : `${rbac?.permissions?.length || 0} permissions`}
              </p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Active Granular Permissions Matrix
          </h4>

          <div className="max-h-72 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
            {rbac?.permissions?.map((perm, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs"
              >
                <code className="text-[#0B2E23] font-mono text-[11px] font-semibold">{perm}</code>
                <span className="text-[10px] text-emerald-700 font-bold px-2.5 py-0.5 bg-emerald-50 rounded-full border border-emerald-200">
                  ALLOWED
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
