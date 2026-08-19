'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Card,
  Spinner,
  Skeleton,
  PaginationRoot,
  PaginationContent,
  PaginationItem,
} from '@heroui/react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Search,
  RefreshCw,
  Download,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Clock,
  Laptop,
  Smartphone,
  Terminal,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { auditApi } from '../../../lib/api';
import { AuditLogItem, AuditStats } from '../../../types/auth';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';

const ACTION_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Security Actions' },
  { value: 'AUTH_LOGIN', label: 'Login (AUTH_LOGIN)' },
  { value: 'AUTH_LOGOUT', label: 'Logout (AUTH_LOGOUT)' },
  { value: 'MAGIC_LINK_REQUESTED', label: 'Magic Link (REQUESTED)' },
  { value: 'MAGIC_LINK_VERIFIED', label: 'Magic Link (VERIFIED)' },
  { value: 'PASSWORD_CHANGED', label: 'Password Changed' },
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_UPDATED', label: 'User Details Updated' },
  { value: 'USER_ROLE_ASSIGNED', label: 'Role & RBAC Assigned' },
  { value: 'USER_STATUS_UPDATED', label: 'User Status Changed' },
  { value: 'USER_DELETED', label: 'User Account Deleted' },
  { value: 'USERS_BULK_DELETED', label: 'Users Bulk Deleted' },
  { value: 'USER_AVATAR_UPDATED', label: 'Avatar Uploaded' },
  { value: 'CDN_UPLOAD', label: 'CDN Asset Uploaded' },
  { value: 'CDN_ASSET_DELETED', label: 'CDN Asset Deleted' },
  { value: 'CDN_ASSETS_BULK_DELETED', label: 'CDN Bulk Deleted' },
];

const RESOURCE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Resources' },
  { value: 'auth', label: 'Auth & Sessions (auth)' },
  { value: 'users', label: 'Staff & Accounts (users)' },
  { value: 'cdn', label: 'Edge CDN Storage (cdn)' },
  { value: 'roles', label: 'RBAC Permissions (roles)' },
  { value: 'system', label: 'System Operations (system)' },
];

const SEVERITY_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'All Severities' },
  { value: 'INFO', label: 'Info (Routine Events)' },
  { value: 'WARNING', label: 'Warning (Mutations & Roles)' },
  { value: 'CRITICAL', label: 'Critical (Threats & Deletions)' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILURE', label: 'Failure / Denied' },
];

const LIMIT_OPTIONS: SelectOption[] = [
  { value: '15', label: '15 / page' },
  { value: '30', label: '30 / page' },
  { value: '50', label: '50 / page' },
  { value: '100', label: '100 / page' },
];

export default function SecurityAuditPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Privacy Mode Toggle (Default: Privacy Masked)
  // When false (Forensic Mode), reveals full raw IP addresses & unmasked emails
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [itemsPerPage, setItemsPerPage] = useState('15');
  const [currentPage, setCurrentPage] = useState(1);

  // Multi-Selection State (3-State Checkbox: Unselected, Indeterminate, Selected)
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Modals & Lightbox Inspector
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Toast State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Telemetry Stats
  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const res = await auditApi.getStats();
      setStats(res);
    } catch (err: any) {
      console.error('Failed to fetch audit stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Audit Logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.getLogs({
        search: debouncedSearch || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        resource: resourceFilter !== 'all' ? resourceFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: currentPage,
        limit: parseInt(itemsPerPage, 10),
      });

      setLogs(res.data || []);
      setTotalLogs(res.meta?.total || res.data?.length || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch security audit logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, actionFilter, resourceFilter, severityFilter, statusFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 3-State Checkbox Master Logic
  const isAllSelected = logs.length > 0 && selectedLogIds.size === logs.length;
  const isIndeterminate = selectedLogIds.size > 0 && selectedLogIds.size < logs.length;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLogIds(new Set());
    } else {
      setSelectedLogIds(new Set(logs.map((l) => l._id)));
    }
  };

  const toggleSelectLog = (id: string) => {
    const next = new Set(selectedLogIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLogIds(next);
  };

  // Mask Email Utility for Privacy Mode
  const maskEmail = (email?: string) => {
    if (!email) return 'System / Cron';
    if (!isPrivacyMode) return email;
    const [userPart, domain] = email.split('@');
    if (!domain) return email;
    const maskedUser = userPart.length > 2 ? `${userPart[0]}***${userPart[userPart.length - 1]}` : `${userPart[0]}***`;
    return `${maskedUser}@${domain}`;
  };

  // Mask IP Utility
  const getDisplayIp = (item: AuditLogItem) => {
    if (!item.ipAddress) return '127.0.0.***';
    if (isPrivacyMode) {
      return item.ipMasked || item.ipAddress.slice(0, Math.max(item.ipAddress.length - 4, 4)) + '***';
    }
    return item.ipAddress;
  };

  // Export Trigger
  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      await auditApi.exportLogs(format, {
        action: actionFilter !== 'all' ? actionFilter : undefined,
        resource: resourceFilter !== 'all' ? resourceFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      showToast(`Audit log exported as ${format.toUpperCase()} successfully.`);
      setIsExportModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to export audit logs.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setActionFilter('all');
    setResourceFilter('all');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search || actionFilter !== 'all' || resourceFilter !== 'all' || severityFilter !== 'ALL' || statusFilter !== 'ALL'
  );

  return (
    <div className="w-full space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-3xl border flex items-center justify-between text-xs font-semibold animate-fadeIn shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER: TITLE, PRIVACY SHIELD TOGGLE & EXPORT CONTROLS                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="size-6 text-[#0B2E23]" />
            <span>Security & Audit Governance Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable ledger tracking all administrative access, identity mutations, edge CDN assets, and system events
          </p>
        </div>

        {/* Action Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Privacy Mode vs Forensic Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsPrivacyMode((prev) => !prev);
              showToast(
                !isPrivacyMode
                  ? 'Privacy Mode enabled: Actor IPs & Emails are masked.'
                  : 'Forensic Security Mode enabled: Full raw IPs & Actor Emails are revealed.',
                !isPrivacyMode ? 'success' : 'error'
              );
            }}
            className={`h-11 px-4 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs border select-none ${
              isPrivacyMode
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Toggle Privacy Masking vs Forensic Investigation Mode"
          >
            {isPrivacyMode ? (
              <>
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Privacy Shield: Active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="size-4 text-amber-600" />
                <span>Forensic Mode: Unmasked</span>
              </>
            )}
          </button>

          {/* Export Report Trigger */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="h-11 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs select-none"
          >
            <Download className="size-4 text-[#0B2E23]" />
            <span>Export Compliance</span>
          </button>

          {/* Live Sync */}
          <button
            type="button"
            onClick={() => {
              fetchLogs();
              fetchStats();
              showToast('Security audit trail refreshed.');
            }}
            disabled={isLoading}
            className="h-11 px-4 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 select-none"
          >
            <RefreshCw className={`size-4 text-[#AEFF48] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Forensic Mode Active Warning Banner */}
      {!isPrivacyMode && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <p className="font-bold">Security Forensic Mode Active</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Full raw IP addresses and unmasked actor email addresses are displayed for incident investigation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivacyMode(true)}
            className="text-xs font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer ml-4 shrink-0"
          >
            Restore Privacy Shield
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. UNIFIED WARM-TONED TELEMETRY STAT CARD                                 */}
      {/* ========================================================================= */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Segment 1: Total Audit Events */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#E8734A]/15 text-[#C44D25] shrink-0 border border-[#E8734A]/25">
              <FileText className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Ledger Volume</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : (stats?.totalEvents || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#A39989]">Immutable Records</p>
            </div>
          </div>

          {/* Segment 2: Security Success Rate */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#5E7A68]/15 text-[#3D5A47] shrink-0 border border-[#5E7A68]/25">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-0.5 w-full">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Security Integrity</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : `${stats?.successRate || 100}%`}
              </p>
              <div className="w-24 h-1.5 bg-[#ECE5DA] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-[#5E7A68] rounded-full"
                  style={{ width: `${Math.min(stats?.successRate || 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Segment 3: 24h Activity Volume */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#D4983D]/15 text-[#A66C15] shrink-0 border border-[#D4983D]/25">
              <Clock className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">24h Activity</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : `${stats?.events24h || 0} events`}
              </p>
              <p className="text-[11px] text-[#A39989]">
                {stats?.activeActors24h || 0} active operators
              </p>
            </div>
          </div>

          {/* Segment 4: Threat / Failure Alerts */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#7D5B8C]/15 text-[#5C3A6B] shrink-0 border border-[#7D5B8C]/25">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Security Failures</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : (stats?.failures24h || 0)}
              </p>
              <p className="text-[11px] text-[#A39989]">Failed operations (24h)</p>
            </div>
          </div>

          {/* Segment 5: Privacy Shield State */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#B89B72]/15 text-[#8C6D44] shrink-0 border border-[#B89B72]/25">
              <Shield className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Privacy Shield</p>
              <p className="text-base font-extrabold text-[#26221F]">
                {isPrivacyMode ? 'Subnet Masked' : 'Raw IP Forensic'}
              </p>
              <p className="text-[11px] text-[#A39989]">GDPR / SOC2 Compliant</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. MAIN CARD: SEARCH, FILTERING & AUDIT TABLE                             */}
      {/* ========================================================================= */}
      <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
        {/* Section A: Search & Filter Toolbar */}
        <div className="p-5 border-b border-[#E5E7EB]/80 bg-[#FAFAF9]/40">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Field */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actor email, action, resource, IP address, or details..."
                className="w-full h-11 pl-10 pr-4 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <HeroSelect
                value={actionFilter}
                onChange={(val) => {
                  setActionFilter(val);
                  setCurrentPage(1);
                }}
                options={ACTION_OPTIONS}
                placeholder="Action"
              />

              <HeroSelect
                value={resourceFilter}
                onChange={(val) => {
                  setResourceFilter(val);
                  setCurrentPage(1);
                }}
                options={RESOURCE_OPTIONS}
                placeholder="Resource"
              />

              <HeroSelect
                value={severityFilter}
                onChange={(val) => {
                  setSeverityFilter(val);
                  setCurrentPage(1);
                }}
                options={SEVERITY_OPTIONS}
                placeholder="Severity"
              />

              <HeroSelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={STATUS_OPTIONS}
                placeholder="Status"
              />

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-11 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs select-none"
                  title="Reset all filters"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedLogIds.size > 0 && (
          <div className="px-6 py-3 bg-[#0B251A] text-white flex items-center justify-between animate-fadeIn border-b border-black/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#AEFF48]">
                {selectedLogIds.size} of {logs.length} events selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedLogIds(new Set())}
                className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
              >
                Deselect All
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="h-8 px-4 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Download className="size-3.5" />
              <span>Export Selected CSV</span>
            </button>
          </div>
        )}

        {/* Section B: Structured Audit Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 pl-6 pr-2 w-10">
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="size-4 rounded-md border-[#E5E7EB] text-[#0B2E23] focus:ring-[#0B2E23] cursor-pointer accent-[#0B2E23]"
                    title={isAllSelected ? 'Deselect All' : 'Select All'}
                  />
                </th>
                <th className="py-4 px-4">Timestamp</th>
                <th className="py-4 px-4">Severity & Status</th>
                <th className="py-4 px-4">Actor & Role</th>
                <th className="py-4 px-4">Action & Resource</th>
                <th className="py-4 px-4">Actor IP Address</th>
                <th className="py-4 px-4">Client Fingerprint</th>
                <th className="py-4 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/70">
              {isLoading ? (
                Array.from({ length: parseInt(itemsPerPage, 10) }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-6 pr-2 w-10"><Skeleton className="size-4 rounded-md" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-36 rounded-md" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-32 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24 rounded-md" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-7 w-16 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <ShieldAlert className="size-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No audit events found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filter options or search keyword.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((item) => {
                  const isSelected = selectedLogIds.has(item._id);
                  const displayIp = getDisplayIp(item);
                  const isFailure = item.status === 'FAILURE';
                  const displayEmail = maskEmail(item.userEmail);

                  // Severity Styling
                  let severityBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (item.severity === 'CRITICAL') {
                    severityBadge = 'bg-red-100 text-red-800 border-red-200 font-bold';
                  } else if (item.severity === 'WARNING') {
                    severityBadge = 'bg-amber-100 text-amber-900 border-amber-200 font-semibold';
                  } else if (item.severity === 'INFO') {
                    severityBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  }

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-[#FAFAF9]/80 transition-colors group ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-6 pr-2 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLog(item._id)}
                          className="size-4 rounded-md border-[#E5E7EB] text-[#0B2E23] focus:ring-[#0B2E23] cursor-pointer accent-[#0B2E23]"
                        />
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-bold text-[#111111] text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </p>
                      </td>

                      {/* Severity & Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${severityBadge}`}
                          >
                            {item.severity || 'INFO'}
                          </span>

                          <span
                            className={`size-2 rounded-full ${
                              isFailure ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                            }`}
                            title={item.status}
                          />
                        </div>
                      </td>

                      {/* Actor & Role */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-[#0B251A] text-[#AEFF48] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {item.userEmail?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate max-w-[160px]" title={item.userEmail}>
                              {displayEmail}
                            </p>
                            <span className="text-[9.5px] uppercase font-semibold text-slate-400">
                              {item.userRole?.replace(/_/g, ' ') || 'Anonymous'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action & Resource */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-[11px] font-bold text-[#0B2E23] block truncate max-w-[200px]" title={item.action}>
                          {item.action}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          res: {item.resource}
                        </span>
                      </td>

                      {/* Actor IP Address (Masked or Unmasked) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {displayIp}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.ipAddress || displayIp, item._id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copy IP Address"
                          >
                            {copiedKey === item._id ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Client Fingerprint (Browser / OS) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          {item.deviceInfo?.deviceType === 'Mobile' ? (
                            <Smartphone className="size-3.5 text-[#0B2E23]" />
                          ) : item.deviceInfo?.deviceType === 'API Client' ? (
                            <Terminal className="size-3.5 text-[#0B2E23]" />
                          ) : (
                            <Laptop className="size-3.5 text-[#0B2E23]" />
                          )}
                          <span className="truncate max-w-[130px]" title={`${item.deviceInfo?.browser || ''} on ${item.deviceInfo?.os || ''}`}>
                            {item.deviceInfo?.browser || 'Browser'} / {item.deviceInfo?.os || 'OS'}
                          </span>
                        </div>
                      </td>

                      {/* Inspect Event Details */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(item);
                            setIsInspectorOpen(true);
                          }}
                          className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="size-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Section C: Pagination Bar */}
        <div className="p-5 border-t border-[#E5E7EB]/80 bg-[#FAFAF9]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Showing <span className="font-bold text-[#111111]">{logs.length}</span> of{' '}
              <span className="font-bold text-[#111111]">{totalLogs}</span> security events
            </span>

            <HeroSelect
              placement="top"
              value={itemsPerPage}
              onChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              options={LIMIT_OPTIONS}
              className="w-32"
            />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center">
              <PaginationRoot className="flex items-center gap-1.5">
                <PaginationContent className="flex items-center gap-1.5">
                  <PaginationItem>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-3 rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs select-none"
                    >
                      Previous
                    </button>
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <PaginationItem>
                            <span className="px-1 text-slate-400 text-xs font-bold select-none">…</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`size-8 rounded-full text-xs font-bold transition-all cursor-pointer select-none flex items-center justify-center ${
                              currentPage === p
                                ? 'bg-[#0B2E23] text-white shadow-xs'
                                : 'bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        </PaginationItem>
                      </React.Fragment>
                    ))}

                  <PaginationItem>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 px-3 rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs select-none"
                    >
                      Next
                    </button>
                  </PaginationItem>
                </PaginationContent>
              </PaginationRoot>
            </div>
          )}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: AUDIT EVENT INSPECTOR & METADATA LIGHTBOX                        */}
      {/* ========================================================================= */}
      {isInspectorOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <ShieldAlert className="size-4 text-[#0B2E23]" />
                  <span>Security Audit Event Details</span>
                </h3>
                <p className="font-mono text-[11px] text-slate-400 mt-0.5">{selectedLog._id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Event Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Security Action</span>
                <p className="font-mono font-bold text-[#0B2E23] truncate">{selectedLog.action}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Target Resource</span>
                <p className="font-bold text-slate-800">{selectedLog.resource}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Severity</span>
                <p className="font-bold text-slate-800">{selectedLog.severity || 'INFO'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Actor Email</span>
                <p className="font-bold text-slate-800 truncate">{selectedLog.userEmail || 'Anonymous'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Actor IP Address</span>
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-800 truncate">{getDisplayIp(selectedLog)}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedLog.ipAddress || getDisplayIp(selectedLog), 'modalIp')}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <p className={`font-bold ${selectedLog.status === 'SUCCESS' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {selectedLog.status}
                </p>
              </div>
            </div>

            {/* Description / Message */}
            {selectedLog.description && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-[#E5E7EB] text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Event Description</span>
                <p className="text-slate-700 leading-relaxed font-medium">{selectedLog.description}</p>
              </div>
            )}

            {/* Error Message if Failure */}
            {selectedLog.errorMessage && (
              <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900">
                <span className="text-[10px] uppercase font-bold text-red-600 block mb-1">Failure Exception</span>
                <p className="font-mono text-[11px] leading-relaxed">{selectedLog.errorMessage}</p>
              </div>
            )}

            {/* Client User-Agent Fingerprint */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-[#E5E7EB] text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Client User-Agent</span>
              <p className="font-mono text-[11px] text-slate-600 break-all">{selectedLog.userAgent || 'None captured'}</p>
            </div>

            {/* Metadata JSON Inspector */}
            {selectedLog.metadata && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  Sanitized Event Payload Metadata
                </span>
                <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-40 border border-slate-800">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="h-10 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EXPORT COMPLIANCE AUDIT TRAIL                                    */}
      {/* ========================================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Download className="size-4 text-[#0B2E23]" />
                <span>Export Security Audit Trail</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Export the historical security audit trail for external compliance certifications, SOC2 / ISO27001 audits, or local archival.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('csv')}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-[#E5E7EB] text-slate-800 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              >
                <FileText className="size-5 text-[#0B2E23]" />
                <span className="text-xs font-bold">Export as CSV</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('json')}
                className="h-14 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-[#E5E7EB] text-slate-800 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
              >
                <Terminal className="size-5 text-[#0B2E23]" />
                <span className="text-xs font-bold">Export as JSON</span>
              </button>
            </div>

            {isExporting && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#0B2E23]">
                <Spinner size="sm" color="accent" />
                <span>Generating secure export bundle...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
