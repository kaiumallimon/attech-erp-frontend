'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, RefreshCw } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CrmNavHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  actionButton?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function CrmNavHeader({
  title,
  subtitle,
  breadcrumb = [{ label: 'CRM & Sales', href: '/dashboard/crm' }],
  actionButton,
  secondaryActions,
  onRefresh,
  isRefreshing = false,
}: CrmNavHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB] select-none">
      <div className="space-y-1">
        {/* Compact Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="size-3 text-slate-300 shrink-0" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-[#0B2E23] hover:underline transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-600">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
          <ChevronRight className="size-3 text-slate-300 shrink-0" />
          <span className="text-[#0B2E23] font-bold">{title}</span>
        </div>

        {/* Title & Short Description */}
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium hidden md:inline-block">
              {subtitle}
            </p>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium md:hidden">{subtitle}</p>
        )}
      </div>

      {/* Primary & Secondary Action Controls */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {secondaryActions}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="h-9 px-3.5 rounded-full border border-[#E5E7EB] bg-white text-slate-700 font-bold text-xs hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Refresh CRM Data"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
        {actionButton}
      </div>
    </div>
  );
}
