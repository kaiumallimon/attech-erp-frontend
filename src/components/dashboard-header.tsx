'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  X,
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderGit2,
  Receipt,
  UserCheck,
  Globe2,
  Settings,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { Breadcrumbs } from './breadcrumbs';
import { Sidebar } from './sidebar';
import GradualBlur from './ui/gradual-blur';

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Overview Dashboard', subtitle: 'Real-time agency operations, projects & metrics' },
  '/dashboard/users': { title: 'Staff & Role Governance', subtitle: 'Centralized staff provisioning & RBAC assignments' },
  '/dashboard/profile': { title: 'My Profile & RBAC', subtitle: 'Identity credentials & active permissions breakdown' },
  '/dashboard/audit': { title: 'Security Audit Trail', subtitle: 'Immutable compliance logging & telemetry' },
  '/dashboard/projects': { title: 'Projects & SDLC Sprints', subtitle: 'Engineering velocity, sprints & delivery tracking' },
  '/dashboard/finance': { title: 'Finance & Invoicing Ledger', subtitle: 'Billing accounts, revenue pipelines & statements' },
  '/dashboard/hr': { title: 'People & HR Management', subtitle: 'Staff directory, payroll & team allocation' },
  '/dashboard/portal': { title: 'Client-Facing Portal', subtitle: 'Client deliverables, review cycles & approvals' },
};

const SEARCH_ITEMS = [
  { id: 'overview', name: 'Overview Dashboard', href: '/dashboard', category: 'Pages', icon: LayoutDashboard, keywords: 'home stats metrics summary' },
  { id: 'users', name: 'Staff & Role Governance', href: '/dashboard/users', category: 'Pages', icon: Users, keywords: 'team members roles permissions users' },
  { id: 'audit', name: 'Security Audit Trail', href: '/dashboard/audit', category: 'Pages', icon: ShieldAlert, keywords: 'security logs compliance events' },
  { id: 'projects', name: 'Projects & SDLC Sprints', href: '/dashboard/projects', category: 'Pages', icon: FolderGit2, keywords: 'projects tasks sprints code delivery' },
  { id: 'finance', name: 'Finance & Invoicing Ledger', href: '/dashboard/finance', category: 'Pages', icon: Receipt, keywords: 'billing revenue payments invoices' },
  { id: 'hr', name: 'People & HR Management', href: '/dashboard/hr', category: 'Pages', icon: UserCheck, keywords: 'employees leave attendance payroll' },
  { id: 'portal', name: 'Client-Facing Portal', href: '/dashboard/portal', category: 'Pages', icon: Globe2, keywords: 'client deliverables milestones review' },
  { id: 'profile', name: 'My Profile & Permissions', href: '/dashboard/profile', category: 'Account', icon: Settings, keywords: 'profile password rbac account settings' },
];

export function DashboardHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [openSearch, setOpenSearch] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentMeta = ROUTE_TITLES[pathname] || {
    title: pathname.split('/').pop()?.replace('-', ' ').toUpperCase() || 'Dashboard',
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpenSearch(false);
      setMobileNavOpen(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpenSearch((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (openSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [openSearch]);

  const filteredItems = SEARCH_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q);
  });

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || 'A'}`.toUpperCase();

  return (
    <>
      {/* Permanent Optical Gradual Blur Veil with Soft Fade */}
      <GradualBlur
        position="top"
        height="7.5rem"
        layers={8}
        maxBlur={28}
        tint="from-white/20 via-white/5 to-transparent"
      />

      {/* 100% Transparent Floating Header Overlay */}
      <header className="absolute top-0 inset-x-0 z-30 pointer-events-none px-6 sm:px-8 py-5 flex items-center justify-between bg-transparent">
        {/* Left Pod: Mobile Menu Toggle + Title Above Breadcrumbs */}
        <div className="pointer-events-auto flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex size-9 items-center justify-center rounded-full border border-black/5 bg-white/70 hover:bg-white text-slate-700 transition-colors md:hidden cursor-pointer shadow-2xs shrink-0"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0 flex flex-col justify-center select-none">
            {/* Title of the page ABOVE Breadcrumbs */}
            <h1 className="text-base sm:text-lg font-extrabold text-[#111111] tracking-tight leading-tight truncate">
              {currentMeta.title}
            </h1>
            {/* Breadcrumbs Navigation below Title */}
            <div className="mt-0.5">
              <Breadcrumbs />
            </div>
          </div>
        </div>

        {/* Right Pod: Search, Status, Notifications & Profile Avatar */}
        <div className="pointer-events-auto flex items-center gap-2.5 shrink-0 select-none">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/5 bg-white/60 text-[11px] font-semibold text-slate-600 shadow-2xs">
            <Zap className="size-3 text-emerald-600 fill-emerald-600" />
            <span>Atlas Live</span>
          </div>

          {/* Search Command Trigger */}
          <button
            type="button"
            onClick={() => setOpenSearch(true)}
            className="flex items-center gap-2 rounded-full border border-black/5 hover:border-black/10 bg-white/60 hover:bg-white px-3.5 py-1.5 text-xs text-slate-500 transition-colors cursor-pointer shadow-2xs"
          >
            <Search className="size-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search agency...</span>
            <kbd className="pointer-events-none hidden sm:inline select-none rounded-full border border-black/5 bg-[#F9FAFB]/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Notification Button */}
          <div className="relative">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-black/5 hover:border-black/10 bg-white/60 hover:bg-white text-slate-600 transition-colors cursor-pointer shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#0B2E23] ring-2 ring-white" />
          </div>

          {/* User Profile Avatar Pill */}
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-black/5 hover:border-black/10 bg-white/60 hover:bg-white transition-colors cursor-pointer shadow-2xs"
          >
            <div className="size-7 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <span className="text-xs font-bold text-[#111111] hidden sm:inline">
              {user?.firstName || 'User'}
            </span>
          </Link>
        </div>
      </header>

      {/* Global Command Palette / Search Dialog */}
      {openSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden">
            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E7EB]">
              <Search className="size-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules, pages, operations..."
                className="w-full text-xs text-[#0B251A] placeholder-slate-400 bg-transparent focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setOpenSearch(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No matching modules found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    Modules & Operations
                  </div>
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setOpenSearch(false);
                          router.push(item.href);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-[#F3F4F6] text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-[#0B251A]/5 text-[#0B2E23] group-hover:bg-[#0B2E23] group-hover:text-white transition-colors">
                            <Icon className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#111111]">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{item.href}</p>
                          </div>
                        </div>
                        <ArrowRight className="size-3 text-slate-300 group-hover:text-[#0B2E23] transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Keybind Footer */}
            <div className="px-4 py-2.5 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Navigate with arrow keys</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slide-Out Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fadeIn">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-64 flex-col bg-white shadow-2xl z-10">
            <div className="flex justify-end p-2 border-b border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DashboardHeader;
