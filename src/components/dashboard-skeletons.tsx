'use client';

import React from 'react';
import { Card, Skeleton } from '@heroui/react';

export function DashboardPageSkeleton({ pathname = '/dashboard' }: { pathname?: string }) {
  // 1. Newsletter & Promotional Campaigns Page Skeleton
  if (pathname.includes('/dashboard/newsletter')) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-64 rounded-full" />
        </div>

        {/* Warm Telemetry Card */}
        <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 lg:p-6 flex items-center gap-4">
                <Skeleton className="size-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-6 w-28 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Metadata Inputs Bar */}
        <Card className="p-5 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        </Card>

        {/* Split Screen Editor & Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Editor Card */}
          <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden h-[500px] flex flex-col">
            <div className="p-3 border-b border-[#E5E7EB] bg-[#FAFAF9] flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="p-6 space-y-4 flex-1">
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-12 w-48 rounded-full mx-auto" />
            </div>
          </Card>

          {/* Right Live Preview Card */}
          <Card className="bg-slate-100 border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden h-[500px] p-6 flex items-center justify-center">
            <div className="w-full max-w-[480px] bg-white rounded-3xl border border-[#E5E7EB] shadow-md p-6 space-y-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-6 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-12 w-40 rounded-full mx-auto" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 2. Staff & Roles Management Skeleton
  if (pathname.includes('/dashboard/users')) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 w-44 rounded-full" />
          </div>
        </div>

        {/* Warm Telemetry Card (5 Segments) */}
        <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="size-8 rounded-2xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-16 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Search & Multi-Filter Controls Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-[#E5E7EB] shadow-xs">
          <Skeleton className="h-10 w-full lg:max-w-md rounded-full" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>

        {/* Users Table Card */}
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAF9] flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="divide-y divide-[#E5E7EB]/70">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="py-4 px-6 flex items-center justify-between gap-4">
                <Skeleton className="size-4 rounded-md shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="size-10 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-48 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
                <Skeleton className="h-6 w-28 rounded-full hidden md:block" />
                <Skeleton className="h-6 w-20 rounded-full hidden lg:block" />
                <Skeleton className="h-4 w-24 rounded-md hidden lg:block" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // 3. CDN & Media Storage Skeleton
  if (pathname.includes('/dashboard/cdn')) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 rounded-xl" />
            <Skeleton className="h-4 w-80 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>

        {/* Warm Telemetry Card */}
        <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 lg:p-6 flex items-center gap-4">
                <Skeleton className="size-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Asset Grid Skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-xs p-3 space-y-2.5">
              <Skeleton className="w-full aspect-video rounded-2xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-12 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 4. Security & Audit Trail Skeleton
  if (pathname.includes('/dashboard/audit')) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>

        {/* Warm Telemetry Card */}
        <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 lg:p-6 flex items-center gap-4">
                <Skeleton className="size-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Table Skeleton */}
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full p-2">
          <div className="divide-y divide-[#E5E7EB]/70">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="py-4 px-6 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-72 rounded-md" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
                <Skeleton className="h-4 w-28 rounded-md hidden md:block" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // 5. API Keys & Machine Access Skeleton
  if (pathname.includes('/dashboard/api-keys')) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>

        {/* Warm Telemetry Card */}
        <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 lg:p-6 flex items-center gap-4">
                <Skeleton className="size-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Card Skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-44 rounded-md" />
                  <Skeleton className="h-3 w-64 rounded-md" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 6. User Profile & RBAC Skeleton
  if (pathname.includes('/dashboard/profile')) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        {/* Profile Hero Cover Skeleton */}
        <Card className="bg-[#0B251A] rounded-4xl border border-[#E5E7EB] overflow-hidden p-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 relative z-10">
            <Skeleton className="size-24 rounded-full border-4 border-white" />
            <div className="space-y-2.5 text-center sm:text-left flex-1">
              <Skeleton className="h-7 w-48 rounded-xl bg-white/20" />
              <Skeleton className="h-4 w-64 rounded-lg bg-white/20" />
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <Skeleton className="h-6 w-24 rounded-full bg-white/20" />
                <Skeleton className="h-6 w-28 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Form Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-4">
            <Skeleton className="h-5 w-36 rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </Card>
          <Card className="p-6 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-4">
            <Skeleton className="h-5 w-36 rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 7. General / Home Overview Skeleton (Default)
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Hero Welcome Card */}
      <Card className="bg-[#0B251A] rounded-4xl border border-[#E5E7EB] p-8 space-y-3">
        <Skeleton className="h-8 w-72 rounded-xl bg-white/20" />
        <Skeleton className="h-4 w-96 rounded-lg bg-white/20" />
      </Card>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-3">
            <Skeleton className="size-10 rounded-2xl" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-7 w-32 rounded-lg" />
          </Card>
        ))}
      </div>

      {/* Bottom Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-4 h-72">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </Card>
        <Card className="p-6 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs space-y-4 h-72">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </Card>
      </div>
    </div>
  );
}
