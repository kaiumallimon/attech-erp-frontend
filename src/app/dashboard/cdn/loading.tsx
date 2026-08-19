'use client';

import React from 'react';
import { DashboardPageSkeleton } from '../../../components/dashboard-skeletons';

export default function CdnLoading() {
  return <DashboardPageSkeleton pathname="/dashboard/cdn" />;
}
