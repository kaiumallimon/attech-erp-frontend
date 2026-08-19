'use client';

import React from 'react';
import { DashboardPageSkeleton } from '../../../components/dashboard-skeletons';

export default function AuditLoading() {
  return <DashboardPageSkeleton pathname="/dashboard/audit" />;
}
