'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, Button, Spinner } from '@heroui/react';
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
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { usersApi } from '../../../lib/api';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';

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

export default function ProfileAndRbacPage() {
  const { user, rbac, isSuperAdmin, isAdmin, logout, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    department: '',
    jobTitle: '',
    phone: '',
  });

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

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'A'}`.toUpperCase();

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
        </div>
      )}

      {/* Main Grid: Identity Card & Profile Management Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Interactive Avatar & Quick Identity Card */}
        <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs flex flex-col items-center text-center">
          {/* Avatar Container with Cloudinary Upload Trigger */}
          <div className="relative group mb-4">
            <div className="size-28 sm:size-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-[#0B251A] text-[#AEFF48] flex items-center justify-center font-extrabold text-3xl relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="size-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}

              {/* Upload Spinner Overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <Spinner size="sm" color="accent" />
                  <span className="text-[10px] font-bold mt-1.5">Uploading...</span>
                </div>
              )}
            </div>

            {/* Camera Overlay Button */}
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture (Cloudinary CDN)"
              className="absolute bottom-1 right-1 size-9 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white border-2 border-white shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
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

          <h2 className="text-lg font-extrabold text-[#111111] flex items-center justify-center gap-1.5">
            <span>{user.firstName} {user.lastName}</span>
            {isSuperAdmin && <Sparkles className="size-4 text-[#0B2E23]" />}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <span className="text-[10.5px] uppercase font-bold tracking-wider rounded-full px-3 py-1 bg-[#0B2E23]/10 text-[#0B251A] border border-[#0B2E23]/20">
              {user.role.replace(/_/g, ' ')}
            </span>
            <span className="text-[10.5px] uppercase font-bold tracking-wider rounded-full px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
              {user.status}
            </span>
          </div>

          <div className="my-6 w-full h-px bg-[#E5E7EB]" />

          {/* Quick Details List */}
          <div className="w-full space-y-3.5 text-left text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-2">
                <Building2 className="size-3.5 text-[#0B2E23]" /> Department:
              </span>
              <span className="font-semibold text-slate-800">{user.department || 'General'}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-2">
                <Briefcase className="size-3.5 text-[#0B2E23]" /> Designation:
              </span>
              <span className="font-semibold text-slate-800">{user.jobTitle || 'Corporate Staff'}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-2">
                <Lock className="size-3.5 text-[#0B2E23]" /> Auth Provider:
              </span>
              <span className="font-semibold text-slate-800 capitalize">{user.authProvider?.toLowerCase()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-2">
                <Calendar className="size-3.5 text-[#0B2E23]" /> Joined:
              </span>
              <span className="font-semibold text-slate-800">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>

          <div className="mt-8 w-full">
            <button
              type="button"
              onClick={logout}
              className="w-full h-11 text-xs font-bold rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
            >
              <LogOut className="size-4" />
              <span>Sign Out Workstation</span>
            </button>
          </div>
        </Card>

        {/* Right Column (2 Spans): Edit Profile Details & RBAC Matrix */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form Card */}
          <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <User className="size-4 text-[#0B2E23]" />
                  <span>Profile Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact info and personal credentials
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Corporate Email</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full h-11 px-3.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-2xl text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+880 1..."
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <HeroSelect
                    value={form.department}
                    onChange={(val) => setForm({ ...form, department: val })}
                    options={DEPARTMENTS}
                    className="w-full"
                    triggerClassName="w-full h-11 rounded-2xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Designation / Job Title</label>
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Fullstack Engineer"
                    className="w-full h-11 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="h-11 px-6 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50 select-none"
                >
                  <Save className="size-4 text-[#AEFF48]" />
                  <span>{isSavingDetails ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </Card>

          {/* RBAC Effective Matrix Card */}
          <Card className="bg-white border border-[#E5E7EB] p-6 rounded-4xl shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Key className="size-4 text-[#0B2E23]" />
                  <span>Effective RBAC Permissions Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Granular capabilities dynamically authorized for your account
                </p>
              </div>
              {isSuperAdmin && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#0B251A] bg-[#0B2E23]/10 px-3 py-1 rounded-full border border-[#0B2E23]/20">
                  <Sparkles className="size-3.5 text-[#0B2E23]" /> Wildcard Root (*)
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {rbac?.permissions?.map((permission: string) => (
                <span
                  key={permission}
                  className={`text-xs px-3 py-1 rounded-full font-mono font-semibold border transition-all ${
                    permission === '*'
                      ? 'bg-[#0B2E23] text-white border-[#0B2E23]'
                      : 'bg-[#F9FAFB] text-slate-700 border-[#E5E7EB] hover:bg-slate-100'
                  }`}
                >
                  {permission}
                </span>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] text-xs text-slate-600">
              <p className="font-semibold text-slate-800 mb-1">Central Security & RBAC Policy:</p>
              <p className="leading-relaxed text-[11px] text-slate-500">
                All API endpoints, mutation actions, and module capabilities are evaluated in real-time against this permission matrix. Custom overrides can be granted by Super Administrators.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
