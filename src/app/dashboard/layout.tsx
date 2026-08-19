'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderGit2,
  Receipt,
  UserCheck,
  Globe2,
  LogOut,
  Sparkles,
  Settings,
  Search,
} from 'lucide-react';
import { Button, Avatar, Spinner } from '@heroui/react';
import { useAuth } from '../../context/auth-context';
import { Role } from '../../types/auth';
import AtTechLogo from '../../components/ui/attech-logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isAdmin, isSuperAdmin, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF9] text-[#0B251A]">
        <Spinner size="lg" color="accent" />
        <p className="mt-4 text-xs text-[#0B2E23] font-semibold tracking-wide">Loading AtTech Workstation...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, visible: true },
    {
      label: 'Staff & Roles',
      href: '/dashboard/users',
      icon: Users,
      visible: isAdmin || isSuperAdmin,
      badge: 'Admin',
    },
    {
      label: 'Security & Audit',
      href: '/dashboard/audit',
      icon: ShieldAlert,
      visible: isSuperAdmin || isAdmin,
      badge: 'Audit',
    },
    {
      label: 'Projects & SDLC',
      href: '/dashboard/projects',
      icon: FolderGit2,
      visible: role !== Role.CLIENT,
    },
    {
      label: 'Finance & Invoicing',
      href: '/dashboard/finance',
      icon: Receipt,
      visible: isAdmin || role === Role.FINANCE_MANAGER || role === Role.ACCOUNTANT,
    },
    {
      label: 'People & HR',
      href: '/dashboard/hr',
      icon: UserCheck,
      visible: isAdmin || role === Role.HR_MANAGER || role === Role.HR_EXECUTIVE,
    },
    {
      label: 'Client Portal',
      href: '/dashboard/portal',
      icon: Globe2,
      visible: true,
    },
    {
      label: 'My Profile & RBAC',
      href: '/dashboard/profile',
      icon: Settings,
      visible: true,
    },
  ];

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'A'}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#0B251A] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0B251A] text-white flex flex-col justify-between shrink-0 p-4 relative z-20 shadow-xl">
        <div>
          {/* Logo & Agency Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-white/10">
            <Link href="/" className="inline-flex items-center group py-1">
              <AtTechLogo className="h-8 md:h-9 w-auto transition-transform group-hover:scale-105" variant="light" />
            </Link>
          </div>

          {/* User Role Card in Sidebar */}
          <div className="mb-6 p-3 bg-[#0B2E23] rounded-2xl border border-white/10 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Avatar size="sm" className="bg-[#AEFF48] text-[#0B251A] text-xs font-bold shrink-0">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-slate-300 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 bg-[#AEFF48]/15 text-[#AEFF48] border border-[#AEFF48]/30">
                {user.role}
              </span>
              {isSuperAdmin && (
                <span className="text-[10px] text-[#AEFF48] font-semibold flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3" /> Root
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#AEFF48] text-[#0B251A] shadow-md shadow-[#AEFF48]/20'
                        : 'text-slate-300 hover:text-white hover:bg-[#0B2E23]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && !isActive && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#071710] text-[#AEFF48] rounded border border-white/10">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Sidebar Footer with Logout Button */}
        <div className="pt-4 border-t border-white/10 mt-6">
          <Button
            variant="danger-soft"
            onClick={logout}
            className="w-full text-xs font-bold py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Workstation</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-[#111111] capitalize">
              {pathname.replace('/dashboard', '').replace('/', '') || 'Operations Overview'}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Atlas DB: 99.9% Uptime
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center relative">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, tickets, repos..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-800 focus:outline-none focus:border-[#0B251A] w-64 transition-all"
              />
            </div>

            {/* Quick Profile Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
              <Avatar size="sm" className="bg-[#0B251A] text-white text-xs font-bold shrink-0">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#111111] leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  {user.role}
                </span>
              </div>
              <Button
                size="sm"
                isIconOnly
                variant="ghost"
                onClick={logout}
                aria-label="Logout"
                className="text-slate-400 hover:text-red-500 cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
