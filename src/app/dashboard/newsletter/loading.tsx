'use client';

import React from 'react';
import { DashboardPageSkeleton } from '../../../components/dashboard-skeletons';

export default function NewsletterLoading() {
  return <DashboardPageSkeleton pathname="/dashboard/newsletter" />;
}
