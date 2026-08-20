'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Flame,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Target,
  Users,
} from 'lucide-react';

interface CrmNavHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  actionButton?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const CRM_NAV_ITEMS = [
  { href: '/dashboard/crm', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/crm/leads', label: 'Leads', icon: Flame },
  { href: '/dashboard/crm/accounts', label: 'Accounts', icon: Building2 },
  { href: '/dashboard/crm/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/crm/deals', label: 'Deals', icon: Target },
  { href: '/dashboard/crm/activities', label: 'Activities', icon: CheckCircle2 },
  { href: '/dashboard/crm/proposals', label: 'Proposals', icon: FileText },
  { href: '/dashboard/crm/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/crm/settings', label: 'Settings', icon: Settings },
];

export default function CrmNavHeader({
  title,
  subtitle,
  badge = 'Revenue & Pipeline Engine',
  actionButton,
  onRefresh,
  isRefreshing = false,
}: CrmNavHeaderProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-4xl bg-linear-to-r from-[#0B2E23] via-[#0B2E23]/95 to-[#0B251A] p-6 sm:p-8 text-white shadow-xs relative overflow-hidden select-none">
      <div className="absolute right-0 top-0 w-96 h-full opacity-10 pointer-events-none flex items-center justify-end pr-10">
        <Target className="w-80 h-80 text-white stroke-[0.8]" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#AEFF48]/20 text-[#AEFF48] text-[10px] font-extrabold uppercase tracking-wider border border-[#AEFF48]/30">
              {badge}
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/70 text-xs font-semibold">CRM Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{title}</h1>
          <p className="text-xs text-white/70 max-w-2xl leading-relaxed">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actionButton}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Pill Tabs Sub-Navigation */}
      <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {CRM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#AEFF48] text-[#0B2E23] shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
