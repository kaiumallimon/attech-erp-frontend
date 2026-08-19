'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { DashboardHeader } from '../../components/dashboard-header';
import { Sidebar } from '../../components/sidebar';
import { DashboardPageSkeleton } from '../../components/dashboard-skeletons';

/**
 * Modern Dual-Island Dashboard Shell Layout:
 * - Left Island: Floating full-height curved Sidebar (rounded-4xl) with outer margins
 * - Right Island: Floating full-height curved Workspace Panel (rounded-4xl) with 100% transparent header and permanent gradual optical blur with soft fade
 * - Smooth Page-Dependent HeroUI Skeletons during hydration and page reloads
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen w-full bg-[#FAFAF9] p-3.5 sm:p-4 gap-4 text-[#0B251A] overflow-hidden">
      {/* Floating Curved Left Sidebar with distinct outer separation */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Floating Curved Right Workspace Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden rounded-4xl border border-[#E5E7EB] bg-white shadow-xs relative">
        {/* Floating Overlay Header with 100% Transparent Background and Optical Gradual Blur with Soft Fade */}
        <DashboardHeader />

        {/* Scrollable Workstation Content Canvas flowing under the gradual blur */}
        <main className="flex-1 h-full overflow-y-auto px-6 sm:px-8 pt-24 pb-8 relative">
          <div className="w-full space-y-6">
            {isLoading || !isAuthenticated || !user ? (
              <DashboardPageSkeleton pathname={pathname} />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
