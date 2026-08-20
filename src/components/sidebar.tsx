'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  FileText,
  Flame,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import AtTechLogo from './ui/attech-logo';

interface SidebarProps {
  onNavigate?: () => void;
}

interface TreeChildItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  badge?: string;
}

interface TreeBranch {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  defaultHref?: string;
  children: TreeChildItem[];
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, isAdmin, isSuperAdmin, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || 'A'}`.toUpperCase();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Team Member';

  // Define Tree Structure
  const treeBranches: TreeBranch[] = useMemo(
    () => [
      {
        id: 'core',
        title: 'Core Engine',
        icon: LayoutDashboard,
        defaultHref: '/dashboard',
        children: [
          { name: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard },
        ],
      },
      {
        id: 'crm',
        title: 'CRM & Sales Pipeline',
        icon: Target,
        defaultHref: '/dashboard/crm',
        children: [
          { name: 'Executive Dashboard', href: '/dashboard/crm', icon: LayoutDashboard },
          { name: 'Leads & Prospects', href: '/dashboard/crm/leads', icon: Flame },
          { name: 'Client Accounts', href: '/dashboard/crm/accounts', icon: Building2 },
          { name: 'Stakeholder Contacts', href: '/dashboard/crm/contacts', icon: Users },
          { name: 'Deals & Pipeline Board', href: '/dashboard/crm/deals', icon: Target },
          { name: 'Activities & Tasks', href: '/dashboard/crm/activities', icon: CheckCircle2 },
          { name: 'Quotation Proposals', href: '/dashboard/crm/proposals', icon: FileText },
          { name: 'Sales Reports & Funnel', href: '/dashboard/crm/reports', icon: BarChart3 },
          { name: 'CRM Settings', href: '/dashboard/crm/settings', icon: Target },
        ],
      },
      {
        id: 'workforce',
        title: 'Workforce & Org',
        icon: Briefcase,
        children: [
          { name: 'Company & Structure', href: '/dashboard/company', icon: Building2, adminOnly: true },
          { name: 'Employees Directory', href: '/dashboard/employees', icon: Briefcase },
          { name: 'User Accounts & RBAC', href: '/dashboard/users', icon: Users, adminOnly: true },
        ],
      },
      {
        id: 'communications',
        title: 'Communications',
        icon: Mail,
        children: [
          { name: 'Newsletter & Broadcasts', href: '/dashboard/newsletter', icon: Mail, adminOnly: true },
        ],
      },
      {
        id: 'system',
        title: 'System & Security',
        icon: ShieldAlert,
        children: [
          { name: 'CDN & Cloud Storage', href: '/dashboard/cdn', icon: Cloud, adminOnly: true },
          { name: 'API Keys & Webhooks', href: '/dashboard/api-keys', icon: KeyRound, adminOnly: true },
          { name: 'Security & Audit Logs', href: '/dashboard/audit', icon: ShieldAlert, adminOnly: true },
        ],
      },
      {
        id: 'workspace',
        title: 'Personal Workspace',
        icon: UserCheck,
        children: [
          { name: 'Profile & Security', href: '/dashboard/profile', icon: UserCheck },
        ],
      },
    ],
    [],
  );

  // Initialize expanded branches based on current pathname
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {
      core: true,
      crm: true,
      workforce: true,
      communications: true,
      system: true,
      workspace: true,
    };
    return initialState;
  });

  // Auto-expand active branch when route changes
  useEffect(() => {
    treeBranches.forEach((branch) => {
      const hasActiveChild = branch.children.some((child) => {
        if (child.href === '/dashboard') return pathname === '/dashboard';
        return pathname === child.href || pathname.startsWith(`${child.href}/`);
      });
      if (hasActiveChild) {
        setExpandedBranches((prev) => ({ ...prev, [branch.id]: true }));
      }
    });
  }, [pathname, treeBranches]);

  const toggleBranch = (branchId: string) => {
    setExpandedBranches((prev) => ({
      ...prev,
      [branchId]: !prev[branchId],
    }));
  };

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
                  <img src={user.avatar} alt={fullName} className="size-full object-cover" />
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

        {/* Tree Structured Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
          {treeBranches.map((branch) => {
            const visibleChildren = branch.children.filter(
              (item) => !item.adminOnly || isAdmin || isSuperAdmin,
            );

            if (visibleChildren.length === 0) return null;

            const isExpanded = !!expandedBranches[branch.id];
            const BranchIcon = branch.icon;

            const isBranchActive = visibleChildren.some((child) => {
              if (child.href === '/dashboard') return pathname === '/dashboard';
              if (child.href === '/dashboard/crm') return pathname === '/dashboard/crm';
              return pathname === child.href || pathname.startsWith(`${child.href}/`);
            });

            return (
              <div key={branch.id} className="space-y-1">
                {/* Branch Header Node */}
                <button
                  type="button"
                  onClick={() => toggleBranch(branch.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer group ${
                    isBranchActive
                      ? 'bg-slate-100/90 text-[#0B2E23]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BranchIcon
                      className={`size-3.5 shrink-0 transition-colors ${
                        isBranchActive ? 'text-[#0B2E23]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="truncate text-[11.5px] tracking-tight">{branch.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.2 rounded-md bg-white border border-[#E5E7EB] text-[9px] font-bold text-slate-500 shadow-2xs">
                      {visibleChildren.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="size-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
                    ) : (
                      <ChevronRight className="size-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
                    )}
                  </div>
                </button>

                {/* Branch Tree Children with Connecting Lines */}
                {isExpanded && (
                  <div className="relative ml-3.5 pl-3 border-l-2 border-[#ECE5DA] space-y-0.5 animate-fadeIn">
                    {visibleChildren.map((item, index) => {
                      const ItemIcon = item.icon;
                      const isItemActive =
                        item.href === '/dashboard'
                          ? pathname === '/dashboard'
                          : item.href === '/dashboard/crm'
                          ? pathname === '/dashboard/crm'
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);

                      const isLast = index === visibleChildren.length - 1;

                      return (
                        <div key={item.name} className="relative">
                          {/* Tree node connector line */}
                          <div
                            className={`absolute -left-3 top-3.5 w-2.5 h-[1.5px] ${
                              isItemActive ? 'bg-[#0B2E23]' : 'bg-[#ECE5DA]'
                            }`}
                          />

                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 text-[11px] font-semibold transition-all group ${
                              isItemActive
                                ? 'bg-[#0B2E23] text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:bg-[#FAF7F2] hover:text-[#0B251A]'
                            }`}
                          >
                            <ItemIcon
                              className={`size-3.5 shrink-0 transition-colors ${
                                isItemActive
                                  ? 'text-[#AEFF48]'
                                  : 'text-slate-400 group-hover:text-[#0B2E23]'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                            {isItemActive && (
                              <span className="ml-auto size-1.5 rounded-full bg-[#AEFF48] shrink-0" />
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / Sign Out Section */}
        <div className="border-t border-[#E5E7EB] p-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-4xl px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-4xl transition-colors cursor-pointer shadow-xs"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
