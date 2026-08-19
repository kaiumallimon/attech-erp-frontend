'use client';

import React from 'react';
import { DashboardPageSkeleton } from '../../../components/dashboard-skeletons';

export default function ProfileLoading() {
  return <DashboardPageSkeleton pathname="/dashboard/profile" />;
}
