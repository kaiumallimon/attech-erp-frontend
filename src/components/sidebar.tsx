'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  FolderGit2,
  Receipt,
  UserCheck,
  Globe2,
  Settings,
  LogOut,
  Sparkles,
  Cloud,
  KeyRound,
  Mail,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import AtTechLogo from './ui/attech-logo';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, isAdmin, isSuperAdmin, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || 'A'}`.toUpperCase();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Team Member';

  const overviewNav = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  ];

  const governanceNav = [
    { name: 'Company & Org', href: '/dashboard/company', icon: Building2 },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'CDN & Storage', href: '/dashboard/cdn', icon: Cloud },
    { name: 'Security & Audit', href: '/dashboard/audit', icon: ShieldAlert },
    { name: 'API Keys & Access', href: '/dashboard/api-keys', icon: KeyRound },
  ];

  const operationsNav = [
    { name: 'Newsletter & Email', href: '/dashboard/newsletter', icon: Mail },
  ];

  const accountNav = [
    { name: 'My Profile & RBAC', href: '/dashboard/profile', icon: Settings },
  ];

  return (
    <>
      <aside className="flex h-full w-64 flex-col rounded-4xl border border-[#E5E7EB] bg-white shadow-xs select-none overflow-hidden">
        {/* Brand Logo Lockup Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E5E7EB] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <AtTechLogo className="h-8 w-auto transition-transform group-hover:scale-105" variant="dark" />
          </Link>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0B2E23]/10 text-[#0B251A] border border-[#0B2E23]/20">
            ERP
          </span>
        </div>

        {/* User Identity Banner in Sidebar */}
        <div className="p-4 border-b border-[#E5E7EB]/60 bg-[#FAFAF9]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-[#0B2E23] text-xs font-bold text-[#AEFF48] shadow-xs">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={fullName}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-[#111111] truncate">{fullName}</p>
                {isSuperAdmin && <Sparkles className="size-3 text-[#0B2E23] shrink-0" />}
              </div>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              <div className="mt-1">
                <span className="inline-block rounded-full bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-slate-700 border border-[#E5E7EB] shadow-2xs">
                  {role || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Main / Overview */}
          <div>
            <div className="space-y-0.5">
              {overviewNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-4xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#0B2E23] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-[#F3F4F6] hover:text-[#0B251A]'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? 'text-[#AEFF48]' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Agency Governance (Admin only) */}
          {(isAdmin || isSuperAdmin) && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Governance
              </div>
              <div className="space-y-0.5">
                {governanceNav.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 rounded-4xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#0B2E23] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-[#F3F4F6] hover:text-[#0B251A]'
                      }`}
                    >
                      <Icon className={`size-4 shrink-0 ${isActive ? 'text-[#AEFF48]' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Operations & SDLC */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              Operations & SDLC
            </div>
            <div className="space-y-0.5">
              {operationsNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-4xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#0B2E23] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-[#F3F4F6] hover:text-[#0B251A]'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? 'text-[#AEFF48]' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Account */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              Account
            </div>
            <div className="space-y-0.5">
              {accountNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-4xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#0B2E23] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-[#F3F4F6] hover:text-[#0B251A]'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? 'text-[#AEFF48]' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer / Sign Out Section */}
        <div className="border-t border-[#E5E7EB] p-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-4xl px-3.5 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign out Workstation</span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-4xl bg-white p-6 shadow-xl border border-[#E5E7EB]">
            <h2 className="text-base font-bold text-[#111111]">Sign Out Workstation</h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to end your current active session?
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-4xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutModal(false);
                  await logout();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-4xl transition-colors shadow-xs cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
