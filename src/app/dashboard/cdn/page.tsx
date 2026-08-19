'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Skeleton, Button, Spinner } from '@heroui/react';
import {
  PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@heroui/react';
import {
  Cloud,
  HardDrive,
  Activity,
  Layers,
  Sparkles,
  Search,
  RotateCcw,
  Upload,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Film,
  Folder,
  Sliders,
  Grid,
  List,
  Eye,
  X,
  Radio,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { cdnApi } from '../../../lib/api';
import { CdnUsageStats, CdnResourceItem } from '../../../types/auth';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';

const FOLDER_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Folders' },
  { value: 'attech_erp/avatars', label: 'attech_erp/avatars' },
  { value: 'attech_erp/branding', label: 'attech_erp/branding' },
  { value: 'attech_erp/documents', label: 'attech_erp/documents' },
  { value: 'attech_erp/uploads', label: 'attech_erp/uploads' },
];

const RESOURCE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Types' },
  { value: 'image', label: 'Images (PNG, JPG, WebP)' },
  { value: 'raw', label: 'Documents & Files (PDF, ZIP)' },
];

const LIMIT_OPTIONS: SelectOption[] = [
  { value: '12', label: '12 / page' },
  { value: '24', label: '24 / page' },
  { value: '48', label: '48 / page' },
];

export default function CdnManagementPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  // Usage & Telemetry State
  const [usage, setUsage] = useState<CdnUsageStats | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(true);

  // Asset Resources State
  const [resources, setResources] = useState<CdnResourceItem[]>([]);
  const [totalResources, setTotalResources] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState('24');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Lightbox State
  const [selectedAsset, setSelectedAsset] = useState<CdnResourceItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState('attech_erp/uploads');
  const [isUploading, setIsUploading] = useState(false);

  // Action / Toast State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Usage Telemetry
  const fetchUsage = useCallback(async () => {
    setIsUsageLoading(true);
    try {
      const res = await cdnApi.getUsage();
      setUsage(res);
    } catch (err: any) {
      console.error('Failed to fetch CDN usage telemetry:', err);
    } finally {
      setIsUsageLoading(false);
    }
  }, []);

  // Fetch CDN Resources
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await cdnApi.getResources({
        maxResults: parseInt(itemsPerPage, 10),
        prefix: folderFilter || undefined,
        resourceType: resourceTypeFilter !== 'all' ? resourceTypeFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setResources(res.data || []);
      setTotalResources(res.meta?.total || res.data?.length || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch CDN resources.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, folderFilter, resourceTypeFilter, debouncedSearch]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Copy URL to Clipboard
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('CDN link copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Upload Asset Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      await cdnApi.upload(uploadFile, uploadFolder);
      showToast('Asset uploaded to Cloudinary CDN successfully.');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      await fetchResources();
      await fetchUsage();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload asset.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Asset Handler
  const handleDeleteSubmit = async () => {
    if (!selectedAsset) return;
    setIsUploading(true);
    try {
      await cdnApi.delete(selectedAsset.publicId, selectedAsset.resourceType);
      showToast('Asset deleted from Cloudinary CDN.');
      setIsDeleteModalOpen(false);
      setSelectedAsset(null);
      await fetchResources();
      await fetchUsage();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete asset.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setFolderFilter('');
    setResourceTypeFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(search || folderFilter || resourceTypeFilter !== 'all');

  return (
    <div className="w-full space-y-6">
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
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-full hover:bg-black/5 text-slate-500 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight flex items-center gap-2.5">
            <Cloud className="size-7 text-[#0B2E23]" />
            <span>Cloudinary CDN & Storage</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global edge media delivery network, real-time telemetry, transformations & asset management
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Status Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-2xs text-xs">
            <span className={`size-2 rounded-full ${usage?.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-bold text-slate-700 text-[11px]">
              {usage?.isLive ? 'Cloudinary Live' : 'Sandbox Mode'}
            </span>
          </div>

          {/* Upload Button */}
          {(isAdmin || isSuperAdmin) && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="h-11 px-5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="size-4 text-[#AEFF48]" />
              <span>Upload Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. UNIFIED STAT CARD (Single Card in Curated Warm Tones)                   */}
      {/* ========================================================================= */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {isUsageLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3 bg-[#FAF7F2]">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded-lg" />
              </div>
            ))
          ) : (
            <>
              {/* Stat 1: Storage Used */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Storage Used</span>
                  <div className="p-2 rounded-2xl bg-[#F7EFE6] text-[#B85D19] shadow-2xs">
                    <HardDrive className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#26221F]">{usage?.storage.usageHuman || '0 B'}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#ECE5DA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B85D19] rounded-full"
                        style={{ width: `${Math.min(usage?.storage.usedPercent || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#877E71] font-bold">{usage?.storage.usedPercent || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Stat 2: Bandwidth Delivery */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Bandwidth</span>
                  <div className="p-2 rounded-2xl bg-[#EEF5E8] text-[#3D7028] shadow-2xs">
                    <Activity className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#26221F]">{usage?.bandwidth.usageHuman || '0 B'}</p>
                  <p className="text-[10px] text-[#3D7028] font-bold mt-0.5">
                    Limit: {usage?.bandwidth.limitHuman || '25 GB'}
                  </p>
                </div>
              </div>

              {/* Stat 3: Total Assets */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Total Assets</span>
                  <div className="p-2 rounded-2xl bg-[#FDF4E2] text-[#B57C1E] shadow-2xs">
                    <Layers className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#26221F]">{usage?.objects.usage || 0}</p>
                  <p className="text-[10px] text-[#B57C1E] font-bold mt-0.5">Hosted Media & Files</p>
                </div>
              </div>

              {/* Stat 4: Transformations */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Transformations</span>
                  <div className="p-2 rounded-2xl bg-[#F5EEF7] text-[#7E3D8E] shadow-2xs">
                    <Zap className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#26221F]">{usage?.transformations.usage || 0}</p>
                  <p className="text-[10px] text-[#7E3D8E] font-bold mt-0.5">Auto WebP / Dynamic Resizes</p>
                </div>
              </div>

              {/* Stat 5: Cloud Tier */}
              <div className="p-5 flex flex-col justify-between col-span-2 sm:col-span-1 hover:bg-[#FFFDF9] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">CDN Tier</span>
                  <div className="p-2 rounded-2xl bg-[#F6EEE7] text-[#9C5535] shadow-2xs">
                    <Cloud className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-extrabold text-[#26221F] truncate">{usage?.plan || 'Standard Cloud'}</p>
                  <p className="text-[10px] text-[#9C5535] font-bold mt-0.5">Global Edge CDN</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. MAIN CARD: Filter Controls -> Asset Explorer (Grid / Table)            */}
      {/* ========================================================================= */}
      <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
        {/* Controls Row with HeroSelects */}
        <div className="p-5 border-b border-[#E5E7EB]/80 bg-white">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* Text Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by asset name or public ID..."
                className="w-full h-11 pl-10 pr-4 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <HeroSelect
                value={folderFilter}
                onChange={(val) => {
                  setFolderFilter(val);
                  setCurrentPage(1);
                }}
                options={FOLDER_OPTIONS}
                placeholder="Folder"
              />

              <HeroSelect
                value={resourceTypeFilter}
                onChange={(val) => {
                  setResourceTypeFilter(val);
                  setCurrentPage(1);
                }}
                options={RESOURCE_TYPE_OPTIONS}
                placeholder="Asset Type"
              />

              {/* View Mode Toggle (Grid vs Table) */}
              <div className="flex items-center p-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#0B2E23] text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid Gallery View"
                >
                  <Grid className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-[#0B2E23] text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Data Table View"
                >
                  <List className="size-4" />
                </button>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-11 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Reset all filters"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section B: Asset Explorer (Grid or Table) */}
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2 p-3 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-3 w-3/4 rounded-md" />
                  <Skeleton className="h-2 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Cloud className="size-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No CDN assets found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your folder or type filters, or upload a new file.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Visual Grid Gallery */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {resources.map((item) => {
                const isImage = item.resourceType === 'image';
                const displayName = item.publicId.split('/').pop() || item.publicId;

                return (
                  <div
                    key={item.publicId}
                    className="group relative bg-[#F9FAFB] hover:bg-white border border-[#E5E7EB] hover:border-slate-300 rounded-3xl p-3 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md"
                  >
                    {/* Media Thumbnail */}
                    <div
                      onClick={() => {
                        setSelectedAsset(item);
                        setIsPreviewModalOpen(true);
                      }}
                      className="relative h-32 w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer border border-[#E5E7EB]/60"
                    >
                      {isImage ? (
                        <img
                          src={item.secureUrl}
                          alt={item.publicId}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText className="size-8 text-[#0B2E23]" />
                          <span className="text-[10px] font-bold uppercase mt-1 text-slate-600">
                            {item.format || 'FILE'}
                          </span>
                        </div>
                      )}

                      {/* Format Badge */}
                      <span className="absolute top-2 left-2 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                        {item.format}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="mt-3">
                      <p className="text-xs font-bold text-[#111111] truncate" title={item.publicId}>
                        {displayName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{item.bytesHuman}</span>
                        {item.width && item.height && <span>{item.width}×{item.height}</span>}
                      </div>
                    </div>

                    {/* Quick Action Toolbar */}
                    <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item.secureUrl, item.publicId)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Copy CDN Secure URL"
                      >
                        {copiedId === item.publicId ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAsset(item);
                          setIsPreviewModalOpen(true);
                        }}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Preview & Insights"
                      >
                        <Eye className="size-3.5" />
                      </button>

                      {(isAdmin || isSuperAdmin) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAsset(item);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete from CDN"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Structured Data Table View */
            <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB]">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-[#F9FAFB] text-[10.5px] uppercase font-bold tracking-wider text-slate-400 border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">Folder</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Dimensions</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {resources.map((item) => (
                    <tr key={item.publicId} className="hover:bg-[#FAFAF9]/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-[#E5E7EB]">
                            {item.resourceType === 'image' ? (
                              <img src={item.secureUrl} alt={item.publicId} className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center text-slate-400">
                                <FileText className="size-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-[#111111] truncate max-w-xs" title={item.publicId}>
                            {item.publicId.split('/').pop()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {item.folder || item.publicId.split('/').slice(0, -1).join('/') || 'root'}
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-[10px] text-slate-600">
                        {item.format}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {item.width && item.height ? `${item.width} × ${item.height}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{item.bytesHuman}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(item.secureUrl, item.publicId)}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                            title="Copy CDN URL"
                          >
                            <Copy className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAsset(item);
                              setIsPreviewModalOpen(true);
                            }}
                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          {(isAdmin || isSuperAdmin) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAsset(item);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                              title="Delete Asset"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section C: Pagination Bar */}
        <div className="p-5 border-t border-[#E5E7EB]/80 bg-[#FAFAF9]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Showing <span className="font-bold text-[#111111]">{resources.length}</span> of{' '}
              <span className="font-bold text-[#111111]">{totalResources}</span> assets
            </span>

            <HeroSelect
              value={itemsPerPage}
              onChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              options={LIMIT_OPTIONS}
              className="w-32"
            />
          </div>

          {Math.ceil(totalResources / parseInt(itemsPerPage, 10)) > 1 && (
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

                  {Array.from(
                    { length: Math.ceil(totalResources / parseInt(itemsPerPage, 10)) },
                    (_, i) => i + 1
                  )
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === Math.ceil(totalResources / parseInt(itemsPerPage, 10)) ||
                        Math.abs(p - currentPage) <= 1
                    )
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
                      disabled={
                        currentPage >= Math.ceil(totalResources / parseInt(itemsPerPage, 10))
                      }
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(
                            Math.ceil(totalResources / parseInt(itemsPerPage, 10)),
                            p + 1
                          )
                        )
                      }
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
      {/* MODAL 1: ASSET LIGHTBOX & TRANSFORMATION PLAYGROUND                       */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Cloud className="size-4 text-[#0B2E23]" />
                  <span>CDN Asset Details & Insights</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{selectedAsset.publicId}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Asset Preview Frame */}
            <div className="w-full h-64 rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center relative border border-[#E5E7EB]">
              {selectedAsset.resourceType === 'image' ? (
                <img
                  src={selectedAsset.secureUrl}
                  alt={selectedAsset.publicId}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <FileText className="size-16 text-[#AEFF48] mb-2" />
                  <p className="text-xs font-bold uppercase">{selectedAsset.format} Document</p>
                </div>
              )}
            </div>

            {/* Metadata Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Format</span>
                <span className="text-xs font-bold text-[#111111] uppercase">{selectedAsset.format}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">File Size</span>
                <span className="text-xs font-bold text-[#111111]">{selectedAsset.bytesHuman}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dimensions</span>
                <span className="text-xs font-bold text-[#111111]">
                  {selectedAsset.width && selectedAsset.height ? `${selectedAsset.width}×${selectedAsset.height}` : '—'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery</span>
                <span className="text-xs font-bold text-emerald-600">HTTPS CDN</span>
              </div>
            </div>

            {/* CDN URL Bar */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Permanent Secure URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedAsset.secureUrl}
                  className="flex-1 h-11 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-slate-600 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedAsset.secureUrl, selectedAsset.publicId)}
                  className="h-11 px-4 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="size-3.5 text-[#AEFF48]" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={selectedAsset.secureUrl}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="size-3.5" />
                <span>Open in New Tab</span>
              </a>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="h-11 px-6 rounded-full bg-[#0B2E23] text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD DIRECT ASSET TO CLOUDINARY                                */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Upload className="size-4 text-[#0B2E23]" />
                  <span>Upload Asset to Cloudinary CDN</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Asset will be hosted on high-speed global edge servers</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target CDN Folder</label>
                <HeroSelect
                  value={uploadFolder}
                  onChange={(val) => setUploadFolder(val)}
                  options={FOLDER_OPTIONS.filter((f) => f.value !== '')}
                  className="w-full"
                  triggerClassName="w-full h-11 rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Media / Document</label>
                <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#0B2E23] rounded-3xl p-6 text-center cursor-pointer transition-colors bg-[#F9FAFB]">
                  <input
                    type="file"
                    required
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cdn-file-input"
                  />
                  <label htmlFor="cdn-file-input" className="cursor-pointer space-y-2 block">
                    <Cloud className="size-10 mx-auto text-[#0B2E23]" />
                    <p className="text-xs font-bold text-slate-700">
                      {uploadFile ? uploadFile.name : 'Click to select or drag and drop file'}
                    </p>
                    <p className="text-[11px] text-slate-400">Supports JPG, PNG, WebP, SVG, PDF up to 25MB</p>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="h-11 px-6 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? <Spinner size="sm" color="accent" /> : <Upload className="size-4 text-[#AEFF48]" />}
                  <span>{isUploading ? 'Uploading to CDN...' : 'Upload Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE ASSET CONFIRMATION                                        */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-2xl bg-red-50">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">Delete CDN Asset?</h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold font-mono text-slate-800">{selectedAsset.publicId}</span> from Cloudinary? Any
              web page or email embedding this asset will break.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={handleDeleteSubmit}
                className="h-11 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? <Spinner size="sm" color="accent" /> : <Trash2 className="size-4" />}
                <span>{isUploading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
