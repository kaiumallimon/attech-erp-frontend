'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  company: 'Company & Org',
  employees: 'Employees & Workforce',
  users: 'Users',
  cdn: 'CDN & Storage',
  audit: 'Security & Audit',
  'api-keys': 'API Keys',
  newsletter: 'Newsletter & Broadcasts',
  profile: 'My Profile & RBAC',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium py-1">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-[#0B251A] transition-colors"
      >
        <Home className="size-3.5" />
        <span>Dashboard</span>
      </Link>

      {segments.slice(1).map((segment, index) => {
        const href = `/${segments.slice(0, index + 2).join('/')}`;
        const isLast = index === segments.length - 2;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-[#0B251A]">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-[#0B251A] transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
