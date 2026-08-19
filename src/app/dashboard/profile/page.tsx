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
import { Breadcrumbs } from '../../../components/breadcrumbs';

export default function ProfileAndRbacPage() {
  const { user, rbac, isSuperAdmin, isAdmin, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'A'}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight flex items-center gap-2">
          <ShieldCheck className="size-6 text-[#0B2E23]" />
          My Profile & RBAC Workstation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed breakdown of your agency profile, identity tokens, and effective permission matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <Card className="bg-white border border-[#E5E7EB] p-6 flex flex-col items-center text-center rounded-4xl shadow-xs">
          <Avatar className="w-20 h-20 text-xl font-bold bg-[#0B251A] text-[#AEFF48] shadow-md mb-4">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
          <h2 className="text-lg font-bold text-[#111111]">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>

          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider rounded-full px-3 py-1 bg-[#0B2E23]/10 text-[#0B251A] border border-[#0B2E23]/20">
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
              <span className="font-semibold text-slate-800">{user.department || 'Not assigned'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[#0B2E23]" /> Title:</span>
              <span className="font-semibold text-slate-800">{user.jobTitle || 'Not assigned'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-[#0B2E23]" /> Auth Provider:</span>
              <span className="font-semibold text-slate-800 capitalize">{user.authProvider?.toLowerCase()}</span>
            </div>
          </div>

          <div className="mt-8 w-full">
            <Button
              variant="danger-soft"
              onClick={logout}
              className="w-full text-xs font-bold py-2.5 rounded-4xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Workstation</span>
            </Button>
          </div>
        </Card>

        {/* RBAC Effective Matrix Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#0B2E23]" /> Effective RBAC Permissions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permissions automatically granted based on your role hierarchy and individual grants
                </p>
              </div>
              {isSuperAdmin && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#0B2E23] bg-[#0B2E23]/10 px-3 py-1 rounded-full border border-[#0B2E23]/20">
                  <Sparkles className="w-3.5 h-3.5 text-[#0B2E23]" /> Wildcard Root (*)
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {rbac?.permissions?.map((permission: string) => (
                <span
                  key={permission}
                  className={`text-xs px-3 py-1 rounded-full font-mono font-semibold border transition-all ${
                    permission === '*'
                      ? 'bg-[#0B2E23] text-white border-[#0B2E23]'
                      : 'bg-[#F9FAFB] text-slate-700 border-[#E5E7EB] hover:bg-slate-100'
                  }`}
                >
                  {permission}
                </span>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-xs text-slate-600">
              <p className="font-semibold text-slate-800 mb-1">Role Hierarchy Definition:</p>
              <p className="leading-relaxed">
                Your role grants automated access across operations according to the central agency security policy. Any modifications to custom permissions require approval from a Central Administrator.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
