'use client';

import React from 'react';
import { DashboardPageSkeleton } from '../../../components/dashboard-skeletons';

export default function UsersLoading() {
  return <DashboardPageSkeleton pathname="/dashboard/users" />;
}
