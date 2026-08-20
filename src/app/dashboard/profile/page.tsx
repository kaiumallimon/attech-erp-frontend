'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, Spinner } from '@heroui/react';
import {
  ShieldCheck,
  Key,
  Building2,
  Briefcase,
  LogOut,
  Sparkles,
  Lock,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Save,
  User,
  Shield,
  Clock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Terminal,
  FileImage,
  Award,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { usersApi, authApi } from '../../../lib/api';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';
import { Role } from '../../../types/auth';

const DEPARTMENTS: SelectOption[] = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Design & Creative', label: 'Design & Creative' },
  { value: 'Product & Strategy', label: 'Product & Strategy' },
  { value: 'Quality Assurance', label: 'Quality Assurance' },
  { value: 'DevOps & Cloud', label: 'DevOps & Cloud' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Finance & Accounting', label: 'Finance & Accounting' },
  { value: 'Sales & Marketing', label: 'Sales & Marketing' },
  { value: 'Client Relations', label: 'Client Relations' },
  { value: 'Operations', label: 'Operations' },
];

export default function ProfileWorkstationPage() {
  const { user, rbac, isSuperAdmin, isAdmin, logout, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'rbac' | 'cdn'>('profile');

  // Async States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit Profile Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    department: 'Engineering',
    jobTitle: '',
    phone: '',
  });

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // RBAC Matrix Search State
  const [rbacSearch, setRbacSearch] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        department: user.department || 'Engineering',
        jobTitle: user.jobTitle || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (!user) return null;

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      showToast('Profile and permissions refreshed successfully.');
    } catch {
      showToast('Failed to refresh profile.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Avatar Upload to Cloudinary CDN
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await usersApi.uploadAvatar(file);
      await refreshProfile();
      showToast('Profile picture uploaded to Cloudinary CDN successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload profile picture.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDetails(true);
    try {
      await usersApi.update(user.id, form);
      await refreshProfile();
      showToast('Profile details updated successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Password changed successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'A'}`.toUpperCase();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = passwordForm.newPassword;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }, [passwordForm.newPassword]);

  // Filtered RBAC Permissions
  const filteredPermissions = useMemo(() => {
    const permissions = rbac?.permissions || [];
    if (!rbacSearch.trim()) return permissions;
    return permissions.filter((p: string) =>
      p.toLowerCase().includes(rbacSearch.toLowerCase())
    );
  }, [rbac?.permissions, rbacSearch]);

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
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
      {/* 1. HERO COVER & IDENTITY BANNER                                           */}
      {/* ========================================================================= */}
      <div className="relative rounded-4xl overflow-hidden border border-[#E5E7EB] bg-white shadow-xs">
        {/* Abstract Dark Emerald Hero Backdrop */}
        <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-[#0B251A] via-[#0B2E23] to-[#164E3D] relative overflow-hidden flex items-end justify-between p-6">
          <div className="absolute inset-0 bg-[radial-gradient(#AEFF48_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
          {/* Quick Header Action Pills */}
          <div className="relative z-10 flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 select-none"
              title="Refresh profile state"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(user.id, 'userId')}
              className="h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs select-none"
              title="Copy User ID"
            >
              {copiedKey === 'userId' ? (
                <Check className="size-3.5 text-[#AEFF48]" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span className="font-mono text-[11px]">ID</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="h-9 px-4 rounded-full bg-red-500/80 hover:bg-red-600 text-white text-xs font-bold backdrop-blur-md border border-red-400/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs select-none"
              title="Sign out of current workstation"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Profile Card Body with Overlapping Avatar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar & Name Group */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {/* Interactive Cloudinary Avatar */}
              <div className="relative group shrink-0">
                <div className="size-28 sm:size-36 rounded-full overflow-hidden border-4 border-white shadow-xl bg-[#0B251A] text-[#AEFF48] flex items-center justify-center font-extrabold text-3xl sm:text-4xl relative select-none">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}

                  {/* Upload Spinner Overlay */}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                      <Spinner size="sm" color="accent" />
                      <span className="text-[10px] font-bold mt-1.5">Uploading CDN...</span>
                    </div>
                  )}
                </div>

                {/* Camera Overlay Button */}
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile picture to Cloudinary CDN"
                  className="absolute bottom-1 right-1 size-9 sm:size-10 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white border-2 border-white shadow-md flex items-center justify-center transition-all hover:scale-110 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="size-4 text-[#AEFF48]" />
                </button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Identity Details */}
              <div className="text-center sm:text-left space-y-1 mb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                    {user.firstName} {user.lastName}
                  </h1>
                  {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider border border-purple-200">
                      <Sparkles className="size-3" /> Super Admin
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-[#0B2E23]" />
                    {user.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Briefcase className="size-3.5 text-[#0B2E23]" />
                    {user.jobTitle || 'System User'}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges Pill Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 self-center sm:self-end">
              <span className="text-[11px] uppercase font-bold tracking-wider rounded-full px-3.5 py-1 bg-[#0B2E23]/10 text-[#0B251A] border border-[#0B2E23]/20 shadow-2xs">
                {user.role.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] uppercase font-bold tracking-wider rounded-full px-3.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {user.status}
              </span>
              <span className="text-[11px] font-semibold rounded-full px-3.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                {user.department || 'Engineering'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNIFIED WARM-TONED TELEMETRY CARD                                      */}
      {/* ========================================================================= */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Segment 1: RBAC Authority Clearance */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#E8734A]/15 text-[#C44D25] shrink-0 border border-[#E8734A]/25">
              <Shield className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">RBAC Authority</p>
              <p className="text-base font-extrabold text-[#26221F] capitalize truncate">
                {user.role.toLowerCase().replace(/_/g, ' ')}
              </p>
              <p className="text-[11px] text-[#A39989]">
                {isSuperAdmin ? 'Unrestricted Root Tier' : 'Role-Based Clearance'}
              </p>
            </div>
          </div>

          {/* Segment 2: Active Permissions Count */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#5E7A68]/15 text-[#3D5A47] shrink-0 border border-[#5E7A68]/25">
              <Key className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Active Permissions</p>
              <p className="text-base font-extrabold text-[#26221F]">
                {rbac?.permissions?.includes('*')
                  ? 'Wildcard Root (*)'
                  : `${rbac?.permissions?.length || 0} Authorized`}
              </p>
              <p className="text-[11px] text-[#A39989]">Dynamic evaluation</p>
            </div>
          </div>

          {/* Segment 3: Auth Provider & Security */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#D4983D]/15 text-[#A66C15] shrink-0 border border-[#D4983D]/25">
              <Lock className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Auth Security</p>
              <p className="text-base font-extrabold text-[#26221F] capitalize">
                {user.authProvider?.toLowerCase() || 'Local Password'}
              </p>
              <p className="text-[11px] text-[#A39989]">JWT HttpOnly Cookie</p>
            </div>
          </div>

          {/* Segment 4: Longevity & Member Since */}
          <div className="p-5 lg:p-6 flex items-center gap-4 hover:bg-[#FFFDF9] transition-colors">
            <div className="p-3 rounded-2xl bg-[#7D5B8C]/15 text-[#5C3A6B] shrink-0 border border-[#7D5B8C]/25">
              <Calendar className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D7365]">Member Since</p>
              <p className="text-base font-extrabold text-[#26221F]">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Active'}
              </p>
              <p className="text-[11px] text-[#A39989]">Verified User Record</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 3. WORKSPACE TAB NAVIGATION                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`h-9 px-4 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${
            activeTab === 'profile'
              ? 'bg-[#0B2E23] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <User className="size-3.5" />
          <span>Personal Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`h-9 px-4 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${
            activeTab === 'security'
              ? 'bg-[#0B2E23] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Lock className="size-3.5" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rbac')}
          className={`h-9 px-4 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${
            activeTab === 'rbac'
              ? 'bg-[#0B2E23] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Key className="size-3.5" />
          <span>RBAC Matrix</span>
          <span
            className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
              activeTab === 'rbac' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {rbac?.permissions?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cdn')}
          className={`h-9 px-4 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${
            activeTab === 'cdn'
              ? 'bg-[#0B2E23] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileImage className="size-3.5" />
          <span>CDN Avatar Asset</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERSONAL DETAILS & CONTACT                                         */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Edit Form */}
          <Card className="lg:col-span-2 bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <User className="size-4 text-[#0B2E23]" />
                <span>Personal Information & Directory Profile</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your name, contact phone, department and organizational designation
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#0B2E23] rounded-2xl text-xs text-[#111111] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2E23]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#0B2E23] rounded-2xl text-xs text-[#111111] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2E23]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Corporate Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full h-11 pl-3.5 pr-10 bg-[#F3F4F6] border border-[#E5E7EB] rounded-2xl text-xs text-slate-500 font-medium cursor-not-allowed select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(user.email, 'email')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      title="Copy Email"
                    >
                      {copiedKey === 'email' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Direct Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+880 1..."
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#0B2E23] rounded-2xl text-xs text-[#111111] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2E23]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                  <HeroSelect
                    value={form.department}
                    onChange={(val) => setForm({ ...form, department: val })}
                    options={DEPARTMENTS}
                    className="w-full"
                    triggerClassName="w-full h-11 rounded-2xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation / Role Title</label>
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    placeholder="e.g. Lead Software Architect"
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#0B2E23] rounded-2xl text-xs text-[#111111] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2E23]/10"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="h-11 px-6 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50 select-none"
                >
                  <Save className="size-4 text-[#AEFF48]" />
                  <span>{isSavingDetails ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </Card>

          {/* Identity Snapshot Card */}
          <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-[#E5E7EB]">
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Award className="size-4 text-[#0B2E23]" />
                  <span>Account Summary</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Corporate credentials & metadata</p>
              </div>

              <div className="space-y-4 text-xs mt-5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">User Account ID</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 truncate max-w-[200px]">{user.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(user.id, 'cardId')}
                      className="text-slate-400 hover:text-slate-800 p-1"
                    >
                      {copiedKey === 'cardId' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Assigned Department</span>
                  <p className="font-bold text-slate-800">{user.department || 'Engineering'}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Joined Platform</span>
                  <p className="font-bold text-slate-800">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#0B251A] text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#AEFF48]">
                <ShieldCheck className="size-4" />
                <span>Enterprise Verified Account</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Your profile is synchronized with central Active Directory & RBAC access controls.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & PASSWORD CHANGE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Change Password Card */}
          <Card className="lg:col-span-2 bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Lock className="size-4 text-[#0B2E23]" />
                <span>Update Account Password</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure your account uses a strong, unique password with at least 8 characters
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    placeholder="Enter current password"
                    className="w-full h-11 pl-3.5 pr-10 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#0B2E23] rounded-2xl text-xs text-[#111111] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2E23]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      placeholder="Minimum 8 characters"
                      className="w-full h-11 pl-3.5 pr-10 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#0B2E23] rounded-2xl text-xs text-[#111111] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2E23]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      placeholder="Re-type new password"
                      className="w-full h-11 pl-3.5 pr-10 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#0B2E23] rounded-2xl text-xs text-[#111111] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2E23]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {passwordForm.newPassword && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Password Strength:</span>
                    <span
                      className={`font-bold ${
                        passwordStrength <= 1
                          ? 'text-red-600'
                          : passwordStrength <= 3
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {passwordStrength <= 1
                        ? 'Weak'
                        : passwordStrength <= 3
                        ? 'Moderate'
                        : 'Strong & Secure'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        passwordStrength >= 1 ? 'bg-red-500' : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        passwordStrength >= 2 ? 'bg-amber-500' : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full transition-all ${
                        passwordStrength >= 4 ? 'bg-emerald-600' : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="h-11 px-6 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50 select-none"
                >
                  <Key className="size-4 text-[#AEFF48]" />
                  <span>{isChangingPassword ? 'Updating Password...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </Card>

          {/* Active Session & Security Policies */}
          <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs space-y-5">
            <div className="pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#0B2E23]" />
                <span>Session Security</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Active session telemetry</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Current Session Token</span>
                <p className="font-semibold text-slate-800">HttpOnly Signed JWT (15-min rotation)</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Audit Logging</span>
                <p className="font-semibold text-slate-800">All password and role changes are recorded</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Multi-Factor Status</span>
                <p className="font-semibold text-slate-800">Passwordless Magic Links Enabled</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={logout}
                className="w-full h-11 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <LogOut className="size-4" />
                <span>Revoke Current Session</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RBAC & GOVERNANCE MATRIX                                           */}
      {/* ========================================================================= */}
      {activeTab === 'rbac' && (
        <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Key className="size-4 text-[#0B2E23]" />
                <span>Effective RBAC Permissions Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Granular capabilities actively authorized for your account role ({user.role})
              </p>
            </div>

            {/* Permissions Search Bar */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                value={rbacSearch}
                onChange={(e) => setRbacSearch(e.target.value)}
                placeholder="Filter permissions..."
                className="w-full h-9 pl-9 pr-3 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <div className="p-4 rounded-3xl bg-[#0B251A] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/10 text-[#AEFF48]">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Wildcard Root Super Administrator (*)</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Your account bypasses individual permission gates and has full operational sovereignty.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#AEFF48] text-[#0B251A]">
                ACTIVE
              </span>
            </div>
          )}

          {/* Permissions Grid */}
          <div className="flex flex-wrap gap-2.5">
            {filteredPermissions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 w-full">
                <Key className="size-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No matching permissions found</p>
              </div>
            ) : (
              filteredPermissions.map((permission: string) => {
                const isWildcard = permission === '*';
                const isCdn = permission.startsWith('cdn:');
                const isUser = permission.startsWith('users:');
                const isRole = permission.startsWith('roles:');

                let badgeColor = 'bg-slate-50 text-slate-700 border-slate-200';
                if (isWildcard) badgeColor = 'bg-[#0B2E23] text-[#AEFF48] border-[#0B2E23] font-bold';
                else if (isCdn) badgeColor = 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold';
                else if (isUser) badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
                else if (isRole) badgeColor = 'bg-purple-50 text-purple-800 border-purple-200 font-semibold';

                return (
                  <span
                    key={permission}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-mono border transition-all shadow-2xs ${badgeColor}`}
                  >
                    {permission}
                  </span>
                );
              })
            )}
          </div>

          <div className="p-4 bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] text-xs text-slate-600">
            <p className="font-bold text-slate-800 mb-1">Central RBAC Guard Enforcement:</p>
            <p className="leading-relaxed text-[11px] text-slate-500">
              All backend endpoints, mutations, data access routes, and dashboard modules dynamically evaluate this capability matrix before processing requests.
            </p>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CLOUDINARY AVATAR & EDGE MEDIA ASSET                               */}
      {/* ========================================================================= */}
      {activeTab === 'cdn' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Avatar Preview on Cloudinary CDN */}
          <Card className="lg:col-span-2 bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <FileImage className="size-4 text-[#0B2E23]" />
                <span>Cloudinary CDN Profile Picture</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                High-performance edge CDN media asset linked to your user record
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Large Image Preview */}
              <div className="size-56 mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-[#E5E7EB] shadow-md flex items-center justify-center relative">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile Avatar" className="size-full object-cover" />
                ) : (
                  <span className="text-5xl font-extrabold text-[#AEFF48]">{initials}</span>
                )}

                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  400×400 CDN
                </span>
              </div>

              {/* Asset URL & Details */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Direct Secure CDN Link</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={user.avatar || 'No custom avatar uploaded'}
                      className="w-full h-11 pl-3.5 pr-10 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-[11px] font-mono text-slate-700 select-all"
                    />
                    {user.avatar && (
                      <button
                        type="button"
                        onClick={() => handleCopy(user.avatar!, 'avatarUrl')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        title="Copy CDN URL"
                      >
                        {copiedKey === 'avatarUrl' ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">CDN Delivery</span>
                  <p className="font-semibold text-slate-800">Fastly / Cloudinary Global Edge Cache</p>
                </div>

                {user.avatar && (
                  <a
                    href={user.avatar}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B2E23] hover:underline"
                  >
                    <span>Open in new browser tab</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Upload Action */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <span className="text-xs text-slate-500">Supports PNG, JPG, WebP up to 5MB</span>
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50 select-none"
              >
                <Camera className="size-4 text-[#AEFF48]" />
                <span>{isUploadingAvatar ? 'Uploading...' : 'Replace Photo'}</span>
              </button>
            </div>
          </Card>

          {/* Cloudinary Integration Insights Card */}
          <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs space-y-5">
            <div className="pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Layers className="size-4 text-[#0B2E23]" />
                <span>Media Pipeline</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated image optimization</p>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Auto Face Detection</span>
                <p className="font-semibold text-slate-800">Gravity: face, Crop: fill (400×400)</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Format Optimization</span>
                <p className="font-semibold text-slate-800">WebP / AVIF auto-conversion for fast delivery</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Target CDN Folder</span>
                <p className="font-mono text-[11px] font-bold text-slate-800">attech_erp/avatars</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
