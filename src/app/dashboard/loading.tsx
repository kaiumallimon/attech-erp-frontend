'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DashboardPageSkeleton } from '../../components/dashboard-skeletons';

export default function DashboardLoading() {
  const pathname = usePathname();
  return <DashboardPageSkeleton pathname={pathname} />;
}
