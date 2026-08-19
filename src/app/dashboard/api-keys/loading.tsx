'use client';

import React from 'react';
import { DashboardPageSkeleton } from '../../../components/dashboard-skeletons';

export default function ApiKeysLoading() {
  return <DashboardPageSkeleton pathname="/dashboard/api-keys" />;
}
