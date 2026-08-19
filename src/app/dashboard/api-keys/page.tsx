'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Spinner, Skeleton } from '@heroui/react';
import {
  KeyRound,
  Key,
  ShieldCheck,
  Shield,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Clock,
  Terminal,
  FileText,
  Trash2,
  Code2,
  Globe,
  Lock,
  ExternalLink,
  Sparkles,
  Play,
  Download,
  Laptop,
  CheckCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { apiKeysApi, publicApi } from '../../../lib/api';
import { ApiKeyItem, ApiKeyStats, CreateApiKeyPayload } from '../../../types/auth';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active Keys' },
  { value: 'REVOKED', label: 'Revoked Keys' },
];

const SCOPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Scopes' },
  { value: 'careers:read', label: 'Careers (Read)' },
  { value: 'careers:submit', label: 'Careers (Submit)' },
  { value: 'newsletter:subscribe', label: 'Newsletter (Subscribe)' },
  { value: 'cdn:upload', label: 'CDN (Upload)' },
  { value: 'projects:read', label: 'Projects (Read)' },
  { value: '*', label: 'Wildcard (*)' },
];

const AVAILABLE_SCOPES = [
  { id: 'careers:read', label: 'careers:read', desc: 'Query active job openings & career listings' },
  { id: 'careers:submit', label: 'careers:submit', desc: 'Submit candidate applications & portfolios' },
  { id: 'newsletter:subscribe', label: 'newsletter:subscribe', desc: 'Register email newsletter subscribers' },
  { id: 'cdn:upload', label: 'cdn:upload', desc: 'Directly upload media assets to Edge Cloudinary CDN' },
  { id: 'cdn:read', label: 'cdn:read', desc: 'List and inspect CDN media assets' },
  { id: 'projects:read', label: 'projects:read', desc: 'Query client projects & delivery milestones' },
  { id: '*', label: '* (Wildcard Full Access)', desc: 'Unrestricted machine API access (Super Admin only)' },
];

export default function ApiKeysPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  // Keys State
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [stats, setStats] = useState<ApiKeyStats | null>(null);
  const [totalKeys, setTotalKeys] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState('all');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSecretRevealModalOpen, setIsSecretRevealModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetKey, setTargetKey] = useState<ApiKeyItem | null>(null);

  // Generated Secret State (Revealed ONLY ONCE)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    apiKey: ApiKeyItem | null;
    rawSecret: string;
  }>({ apiKey: null, rawSecret: '' });

  // Create Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formScopes, setFormScopes] = useState<string[]>(['newsletter:subscribe', 'careers:read', 'careers:submit']);
  const [formOrigins, setFormOrigins] = useState('');
  const [formIps, setFormIps] = useState('');
  const [formExpiry, setFormExpiry] = useState('never');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sandbox Tester State
  const [sandboxEndpoint, setSandboxEndpoint] = useState<'newsletter' | 'careers'>('newsletter');
  const [sandboxKey, setSandboxKey] = useState('');
  const [sandboxSecret, setSandboxSecret] = useState('');
  const [sandboxEmail, setSandboxEmail] = useState('developer@attech.io');
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  // Active Code Snippet Tab in Reveal Modal
  const [snippetTab, setSnippetTab] = useState<'curl' | 'node' | 'python'>('curl');

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

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const res = await apiKeysApi.getStats();
      setStats(res);
    } catch (err: any) {
      console.error('Failed to fetch API key stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Keys
  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiKeysApi.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        scope: scopeFilter !== 'all' ? scopeFilter : undefined,
      });
      setKeys(res.data || []);
      setTotalKeys(res.meta?.total || res.data?.length || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch API keys', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, scopeFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // Create Key Submit
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Key name is required.', 'error');
      return;
    }
    if (formScopes.length === 0) {
      showToast('Select at least one permission scope.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let expiresAt: string | null = null;
      if (formExpiry === '30d') {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        expiresAt = d.toISOString();
      } else if (formExpiry === '90d') {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        expiresAt = d.toISOString();
      } else if (formExpiry === '1y') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        expiresAt = d.toISOString();
      }

      const origins = formOrigins
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const ips = formIps
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateApiKeyPayload = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        scopes: formScopes,
        allowedOrigins: origins.length > 0 ? origins : undefined,
        allowedIps: ips.length > 0 ? ips : undefined,
        expiresAt,
      };

      const res = await apiKeysApi.create(payload);

      setGeneratedCredentials({
        apiKey: res.apiKey,
        rawSecret: res.rawSecret,
      });

      // Populate sandbox defaults
      setSandboxKey(res.apiKey.key);
      setSandboxSecret(res.rawSecret);

      setIsCreateModalOpen(false);
      setIsSecretRevealModalOpen(true);
      showToast('API Key generated successfully. Save your secret now!');

      // Reset form
      setFormName('');
      setFormDescription('');
      setFormOrigins('');
      setFormIps('');
      setFormScopes(['newsletter:subscribe', 'careers:read', 'careers:submit']);
      setFormExpiry('never');

      fetchKeys();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate API Key.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Scope Checkbox
  const toggleScope = (scopeId: string) => {
    if (scopeId === '*') {
      setFormScopes((prev) => (prev.includes('*') ? [] : ['*']));
      return;
    }
    setFormScopes((prev) => {
      const filtered = prev.filter((s) => s !== '*');
      if (filtered.includes(scopeId)) {
        return filtered.filter((s) => s !== scopeId);
      }
      return [...filtered, scopeId];
    });
  };

  // Status Toggle (Active / Revoke)
  const handleToggleStatus = async (item: ApiKeyItem) => {
    const nextStatus = item.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      await apiKeysApi.updateStatus(item._id, nextStatus);
      showToast(`API Key status changed to ${nextStatus}`);
      fetchKeys();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update key status', 'error');
    }
  };

  // Regenerate Secret
  const handleRegenerateSecret = async () => {
    if (!targetKey) return;
    setIsSubmitting(true);
    try {
      const res = await apiKeysApi.regenerateSecret(targetKey._id);
      setGeneratedCredentials({
        apiKey: res.apiKey,
        rawSecret: res.rawSecret,
      });
      setSandboxKey(res.apiKey.key);
      setSandboxSecret(res.rawSecret);
      setIsRegenerateModalOpen(false);
      setIsSecretRevealModalOpen(true);
      showToast('New API Secret rolled successfully!');
      fetchKeys();
    } catch (err: any) {
      showToast(err.message || 'Failed to roll API secret', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Key
  const handleDeleteKey = async () => {
    if (!targetKey) return;
    setIsSubmitting(true);
    try {
      await apiKeysApi.delete(targetKey._id);
      showToast(`API Key '${targetKey.name}' permanently deleted.`);
      setIsDeleteModalOpen(false);
      setTargetKey(null);
      fetchKeys();
      fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete API Key', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download .env File
  const handleDownloadEnv = () => {
    if (!generatedCredentials.apiKey) return;
    const content = `# AtTech Solutions ERP External API Credentials
ATTECH_API_KEY=${generatedCredentials.apiKey.key}
ATTECH_API_SECRET=${generatedCredentials.rawSecret}
ATTECH_API_BASE_URL=http://localhost:5000/api/v1
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.attech-${generatedCredentials.apiKey.name.toLowerCase().replace(/\s+/g, '-')}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Run Sandbox Request
  const handleRunSandbox = async () => {
    if (!sandboxKey.trim() || !sandboxSecret.trim()) {
      setSandboxError('Please enter both X-API-KEY and X-API-SECRET to test');
      return;
    }

    setSandboxLoading(true);
    setSandboxError(null);
    setSandboxResponse(null);

    try {
      let result;
      if (sandboxEndpoint === 'newsletter') {
        result = await publicApi.subscribeNewsletter(
          sandboxKey.trim(),
          sandboxSecret.trim(),
          sandboxEmail.trim(),
          'sandbox-test'
        );
      } else {
        result = await publicApi.getCareers(sandboxKey.trim(), sandboxSecret.trim());
      }
      setSandboxResponse(result);
      fetchStats();
      fetchKeys();
    } catch (err: any) {
      setSandboxError(err.message || 'API call failed');
    } finally {
      setSandboxLoading(false);
    }
  };

  const hasActiveFilters = Boolean(search || statusFilter !== 'ALL' || scopeFilter !== 'all');

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
      {/* HEADER: TITLE & TOP ACTIONS                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight flex items-center gap-2.5">
            <KeyRound className="size-6 text-[#0B2E23]" />
            <span>API Keys & Machine Access</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate cryptographically secure API credentials with fine-grained scopes for external applications (Careers, Newsletter, Mobile Apps)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Open Sandbox Tester */}
          <button
            type="button"
            onClick={() => setIsSandboxOpen(true)}
            className="h-11 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs select-none"
          >
            <Play className="size-3.5 text-[#0B2E23] fill-[#0B2E23]" />
            <span>Live API Sandbox</span>
          </button>

          {/* Sync Refresh */}
          <button
            type="button"
            onClick={() => {
              fetchKeys();
              fetchStats();
              showToast('API keys state refreshed');
            }}
            disabled={isLoading}
            className="h-11 px-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs select-none disabled:opacity-50"
            title="Refresh keys"
          >
            <RefreshCw className={`size-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Generate New Key */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-11 px-4 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs select-none"
          >
            <Plus className="size-4 text-[#AEFF48]" />
            <span>Generate New Key</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. UNIFIED WARM-TONED TELEMETRY STAT CARD                                 */}
      {/* ========================================================================= */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Segment 1: Active API Keys */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#E8734A]/15 text-[#C44D25] shrink-0 border border-[#E8734A]/25">
              <KeyRound className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Active Machines</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : stats?.activeKeys || 0}
              </p>
              <p className="text-[11px] text-[#A39989]">
                {stats?.totalKeys || 0} total credentials
              </p>
            </div>
          </div>

          {/* Segment 2: Total API Traffic Requests */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#5E7A68]/15 text-[#3D5A47] shrink-0 border border-[#5E7A68]/25">
              <Terminal className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">API Requests</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : (stats?.totalApiRequests || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#A39989]">Total external calls</p>
            </div>
          </div>

          {/* Segment 3: Scoped Capabilties */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#D4983D]/15 text-[#A66C15] shrink-0 border border-[#D4983D]/25">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Active Scopes</p>
              <p className="text-xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : stats?.topScopes?.length || 0}
              </p>
              <p className="text-[11px] text-[#A39989]">Fine-grained access tiers</p>
            </div>
          </div>

          {/* Segment 4: Cryptography & Security */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#7D5B8C]/15 text-[#5C3A6B] shrink-0 border border-[#7D5B8C]/25">
              <Lock className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Cryptography</p>
              <p className="text-base font-extrabold text-[#26221F]">bcrypt Hash</p>
              <p className="text-[11px] text-[#A39989]">Zero plaintext secrets stored</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. MAIN CARD: SEARCH, FILTERING & KEYS TABLE                              */}
      {/* ========================================================================= */}
      <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
        {/* Search & Filter Toolbar */}
        <div className="p-5 border-b border-[#E5E7EB]/80 bg-[#FAFAF9]/40">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by key label, public key prefix, or description..."
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
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={STATUS_OPTIONS}
                placeholder="Status"
              />

              <HeroSelect
                value={scopeFilter}
                onChange={(val) => setScopeFilter(val)}
                options={SCOPE_OPTIONS}
                placeholder="Scope"
              />

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setScopeFilter('all');
                  }}
                  className="h-11 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs select-none"
                  title="Reset filters"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Structured Keys Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">API Key & Label</th>
                <th className="py-4 px-4">Credentials (Public / Secret)</th>
                <th className="py-4 px-4">Authorized Scopes</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Traffic & Usage</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/70">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><Skeleton className="h-4 w-36 rounded-md" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-44 rounded-md" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-32 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-7 w-20 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <KeyRound className="size-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No API keys found</p>
                    <p className="text-xs text-slate-400 mt-1">Generate your first API key to enable external access for Careers & Newsletter.</p>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="size-3.5 text-[#AEFF48]" />
                      <span>Generate API Key</span>
                    </button>
                  </td>
                </tr>
              ) : (
                keys.map((item) => {
                  const isActive = item.status === 'ACTIVE';
                  const isRevoked = item.status === 'REVOKED';

                  return (
                    <tr key={item._id} className="hover:bg-[#FAFAF9]/80 transition-colors">
                      {/* Name & Creator */}
                      <td className="py-4 px-6">
                        <p className="font-bold text-[#111111] text-xs">{item.name}</p>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {item.description}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          Created {new Date(item.createdAt).toLocaleDateString()} by{' '}
                          <span className="font-semibold text-slate-600">
                            {item.createdBy?.firstName || 'Admin'}
                          </span>
                        </p>
                      </td>

                      {/* Credentials */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-[#0B2E23] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {item.key}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.key, `key-${item._id}`)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy Public Key"
                            >
                              {copiedKey === `key-${item._id}` ? (
                                <Check className="size-3 text-emerald-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span>Secret: {item.secretPrefix}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">
                              Hashed
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Scopes */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.scopes.map((s) => (
                            <span
                              key={s}
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                s === '*'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : s.startsWith('careers')
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : s.startsWith('newsletter')
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Traffic */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800 font-mono text-xs">
                          {item.usageCount.toLocaleString()} requests
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.lastUsedAt
                            ? `Last used ${new Date(item.lastUsedAt).toLocaleDateString()}`
                            : 'Never used'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Test in Sandbox */}
                          <button
                            type="button"
                            onClick={() => {
                              setSandboxKey(item.key);
                              setSandboxSecret('');
                              setIsSandboxOpen(true);
                            }}
                            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Test in Sandbox"
                          >
                            <Play className="size-3.5 fill-slate-700" />
                          </button>

                          {/* Roll Secret */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetKey(item);
                              setIsRegenerateModalOpen(true);
                            }}
                            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Regenerate Private Secret"
                          >
                            <RotateCcw className="size-3.5" />
                          </button>

                          {/* Revoke / Reactivate */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {isActive ? 'Revoke' : 'Activate'}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetKey(item);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete API Key"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: GENERATE NEW API KEY                                             */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <KeyRound className="size-4 text-[#0B2E23]" />
                  <span>Generate New API Key & Secret</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure capability scopes and machine access permissions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              {/* Key Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Key Name / Client Identifier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Careers Web Portal, Marketing Newsletter, Mobile Client"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. External web integration for submitting candidate resumes and capturing emails"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              {/* Capability Scopes Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Authorized Capability Scopes <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 bg-[#FAFAF9] p-3 rounded-2xl border border-[#E5E7EB]">
                  {AVAILABLE_SCOPES.map((scope) => {
                    const isChecked = formScopes.includes(scope.id);
                    return (
                      <label
                        key={scope.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-[#E5E7EB] hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleScope(scope.id)}
                          className="mt-0.5 size-4 rounded text-[#0B2E23] focus:ring-[#0B2E23] accent-[#0B2E23]"
                        />
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-[#0B2E23] block">
                            {scope.label}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight">
                            {scope.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Allowed Origins (CORS Whitelist) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Allowed Domains / Origins (Optional)
                </label>
                <input
                  type="text"
                  value={formOrigins}
                  onChange={(e) => setFormOrigins(e.target.value)}
                  placeholder="e.g. https://attech.io, https://careers.attech.io (leave empty for any)"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] text-xs font-medium focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Key Expiration Period
                </label>
                <select
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] text-xs font-medium bg-white focus:outline-none focus:border-[#0B2E23]"
                >
                  <option value="never">Never Expires (Recommended for Production microservices)</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="1y">1 Year</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" color="accent" />
                  ) : (
                    <KeyRound className="size-3.5 text-[#AEFF48]" />
                  )}
                  <span>Generate Key & Secret</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ONE-TIME SECRET REVEAL & INTEGRATION QUICKSTART                  */}
      {/* ========================================================================= */}
      {isSecretRevealModalOpen && generatedCredentials.apiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
                  <CheckCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">
                    API Credentials Generated
                  </h3>
                  <p className="text-xs text-slate-400">
                    Save your API Secret now. It will not be shown again.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSecretRevealModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Critical Security Warning */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">Important Security Notice:</span> This is the only time your private API Secret is displayed in plain text. Store it securely in your environment variables.
              </p>
            </div>

            {/* Credentials Boxes */}
            <div className="space-y-3">
              {/* Public Key */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Public API Key (X-API-KEY)
                </label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB]">
                  <span className="font-mono text-xs font-bold text-[#0B2E23] break-all">
                    {generatedCredentials.apiKey.key}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedCredentials.apiKey!.key, 'reveal-key')}
                    className="ml-2 p-1.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-slate-100 cursor-pointer"
                    title="Copy API Key"
                  >
                    {copiedKey === 'reveal-key' ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Private Secret */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Private API Secret (X-API-SECRET)
                </label>
                <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                  <span className="font-mono text-xs font-bold text-emerald-950 break-all">
                    {generatedCredentials.rawSecret}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(generatedCredentials.rawSecret, 'reveal-secret')}
                    className="ml-2 p-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                    title="Copy API Secret"
                  >
                    {copiedKey === 'reveal-secret' ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5 text-emerald-700" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Integration Code Snippets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Integration Quickstart Snippet
                </span>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSnippetTab('curl')}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      snippetTab === 'curl' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnippetTab('node')}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      snippetTab === 'node' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Node.js / TS
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnippetTab('python')}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                      snippetTab === 'python' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              {snippetTab === 'curl' && (
                <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto border border-slate-800">
{`curl -X POST http://localhost:5000/api/v1/public/newsletter/subscribe \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${generatedCredentials.apiKey.key}" \\
  -H "X-API-SECRET: ${generatedCredentials.rawSecret}" \\
  -d '{"email": "subscriber@domain.com", "source": "careers-portal"}'`}
                </pre>
              )}

              {snippetTab === 'node' && (
                <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto border border-slate-800">
{`const res = await fetch("http://localhost:5000/api/v1/public/newsletter/subscribe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": "${generatedCredentials.apiKey.key}",
    "X-API-SECRET": "${generatedCredentials.rawSecret}",
  },
  body: JSON.stringify({ email: "subscriber@domain.com", source: "careers-portal" }),
});
const data = await res.json();`}
                </pre>
              )}

              {snippetTab === 'python' && (
                <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto border border-slate-800">
{`import requests

url = "http://localhost:5000/api/v1/public/newsletter/subscribe"
headers = {
    "X-API-KEY": "${generatedCredentials.apiKey.key}",
    "X-API-SECRET": "${generatedCredentials.rawSecret}"
}
response = requests.post(url, json={"email": "subscriber@domain.com"}, headers=headers)
print(response.json())`}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={handleDownloadEnv}
                className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Download .env File</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSecretRevealModalOpen(false)}
                className="h-10 px-6 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Done & Saved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGENERATE / ROLL SECRET                                         */}
      {/* ========================================================================= */}
      {isRegenerateModalOpen && targetKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
                <RotateCcw className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">Roll API Secret</h3>
                <p className="text-xs text-slate-400">Key: {targetKey.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Generating a new private API secret will <span className="font-bold text-red-600">immediately invalidate</span> the old secret. All external services using the previous secret will lose API access until updated.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRegenerateModalOpen(false)}
                className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRegenerateSecret}
                className="h-10 px-5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Rolling Secret...' : 'Yes, Roll Secret'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE KEY CONFIRMATION                                          */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && targetKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-700">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111]">Delete API Key</h3>
                <p className="text-xs text-slate-400">{targetKey.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this API Key? This action is irreversible and will break any external integration consuming this credential.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteKey}
                className="h-10 px-5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: LIVE API SANDBOX & TEST PLAYGROUND                               */}
      {/* ========================================================================= */}
      {isSandboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#0B2E23] text-[#AEFF48]">
                  <Play className="size-4 fill-[#AEFF48]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">
                    Live API Testing Sandbox
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verify external endpoint execution with your API Key & Secret
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSandboxOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Endpoint Selector */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Endpoint</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSandboxEndpoint('newsletter')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      sandboxEndpoint === 'newsletter'
                        ? 'bg-emerald-50 border-emerald-300 font-bold text-[#0B2E23]'
                        : 'bg-slate-50 border-[#E5E7EB] text-slate-600'
                    }`}
                  >
                    <span className="block font-bold">POST /public/newsletter/subscribe</span>
                    <span className="text-[10px] text-slate-500 font-normal">Scope: newsletter:subscribe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSandboxEndpoint('careers')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      sandboxEndpoint === 'careers'
                        ? 'bg-emerald-50 border-emerald-300 font-bold text-[#0B2E23]'
                        : 'bg-slate-50 border-[#E5E7EB] text-slate-600'
                    }`}
                  >
                    <span className="block font-bold">GET /public/careers</span>
                    <span className="text-[10px] text-slate-500 font-normal">Scope: careers:read</span>
                  </button>
                </div>
              </div>

              {/* Key & Secret Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">X-API-KEY</label>
                  <input
                    type="text"
                    value={sandboxKey}
                    onChange={(e) => setSandboxKey(e.target.value)}
                    placeholder="at_live_key_..."
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] font-mono text-xs focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">X-API-SECRET</label>
                  <input
                    type="password"
                    value={sandboxSecret}
                    onChange={(e) => setSandboxSecret(e.target.value)}
                    placeholder="at_live_sec_..."
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] font-mono text-xs focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              {/* Payload Field if Newsletter */}
              {sandboxEndpoint === 'newsletter' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subscriber Email</label>
                  <input
                    type="email"
                    value={sandboxEmail}
                    onChange={(e) => setSandboxEmail(e.target.value)}
                    placeholder="candidate@company.com"
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              )}

              {/* Run Trigger */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={sandboxLoading}
                  onClick={handleRunSandbox}
                  className="w-full h-10 rounded-xl bg-[#0B2E23] hover:bg-[#0B251A] text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {sandboxLoading ? (
                    <Spinner size="sm" color="accent" />
                  ) : (
                    <Play className="size-3.5 fill-[#AEFF48] text-[#AEFF48]" />
                  )}
                  <span>Execute Endpoint Test</span>
                </button>
              </div>

              {/* Error Output */}
              {sandboxError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-600 shrink-0" />
                  <span>{sandboxError}</span>
                </div>
              )}

              {/* Response Inspector */}
              {sandboxResponse && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Response Payload (200 OK)</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Verified & Authorized</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-48 border border-slate-800">
                    {JSON.stringify(sandboxResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
