'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  PaginationRoot,
  PaginationContent,
  PaginationItem,
  Skeleton,
} from '@heroui/react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  X,
  ShieldCheck,
  Building2,
  ArrowUpDown,
  Edit2,
  Trash2,
  Sparkles,
  Clock,
  Key,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { Role, UserProfile } from '../../../types/auth';
import { usersApi, PaginationMeta, UserStats } from '../../../lib/api';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';

const ALL_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.PROJECT_MANAGER,
  Role.TECH_LEAD,
  Role.SENIOR_DEVELOPER,
  Role.DEVELOPER,
  Role.JUNIOR_DEVELOPER,
  Role.QA_ENGINEER,
  Role.DEVOPS_ENGINEER,
  Role.UI_UX_DESIGNER,
  Role.GRAPHIC_DESIGNER,
  Role.HR_MANAGER,
  Role.HR_EXECUTIVE,
  Role.FINANCE_MANAGER,
  Role.ACCOUNTANT,
  Role.SALES_EXECUTIVE,
  Role.MARKETING_SPECIALIST,
  Role.CLIENT_ACCOUNT_MANAGER,
  Role.CLIENT,
  Role.INTERN,
  Role.GUEST,
];

const DEPARTMENTS = [
  'Engineering',
  'Design & Creative',
  'Product & Strategy',
  'Quality Assurance',
  'DevOps & Cloud',
  'Human Resources',
  'Finance & Accounting',
  'Sales & Marketing',
  'Client Relations',
  'Operations',
];

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN: { bg: 'bg-[#0B2E23]/10', text: 'text-[#0B251A]', border: 'border-[#0B2E23]/30' },
  ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  PROJECT_MANAGER: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  TECH_LEAD: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SENIOR_DEVELOPER: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  DEVELOPER: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  QA_ENGINEER: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DEVOPS_ENGINEER: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  UI_UX_DESIGNER: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  HR_MANAGER: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  FINANCE_MANAGER: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  CLIENT: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

function formatRoleLabel(role: string): string {
  return role.replace(/_/g, ' ');
}

// Prepared Select Options
const ROLE_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Roles (21)' },
  ...ALL_ROLES.map((r) => ({ value: r, label: formatRoleLabel(r) })),
];

const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Departments' },
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active Only' },
  { value: 'SUSPENDED', label: 'Suspended Only' },
  { value: 'INACTIVE', label: 'Inactive Only' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'createdAt', label: 'Sort: Joined Date' },
  { value: 'firstName', label: 'Sort: First Name' },
  { value: 'email', label: 'Sort: Email' },
  { value: 'role', label: 'Sort: Role' },
  { value: 'department', label: 'Sort: Department' },
];

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
  { value: '100', label: '100 / page' },
];

const FORM_ROLE_OPTIONS: SelectOption[] = ALL_ROLES.map((r) => ({
  value: r,
  label: formatRoleLabel(r),
}));

const FORM_DEPARTMENT_OPTIONS: SelectOption[] = DEPARTMENTS.map((d) => ({
  value: d,
  label: d,
}));

export default function UsersManagementPage() {
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();

  // Data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Independent Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Engineering',
    jobTitle: '',
    role: Role.DEVELOPER,
    phone: '',
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    department: '',
    jobTitle: '',
    phone: '',
  });
  const [roleForm, setRoleForm] = useState<{ role: Role }>({
    role: Role.DEVELOPER,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounce search input by 350ms - resets pagination to page 1 independently
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
      const res = await usersApi.getStats();
      if (res.data) setStats(res.data);
    } catch {
      // Fallback
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Paginated Users with Server-Side Queries
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        department: departmentFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: pageSize,
      });

      setUsers(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      setUsers([]);
      setNotification({ type: 'error', message: err.message || 'Failed to retrieve staff directory.' });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter, departmentFilter, statusFilter, sortBy, sortOrder, currentPage, pageSize]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Handler: Create Staff Member
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName || !createForm.lastName || !createForm.email) {
      setActionError('Please fill in all required fields.');
      return;
    }
    setActionError(null);
    setIsSubmitting(true);

    try {
      await usersApi.create(createForm);
      showToast(`Staff account for ${createForm.firstName} ${createForm.lastName} created.`);
      setIsCreateModalOpen(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        department: 'Engineering',
        jobTitle: '',
        role: Role.DEVELOPER,
        phone: '',
      });
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Edit Staff Profile
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await usersApi.update(selectedUser.id, editForm);
      showToast(`Profile for ${editForm.firstName} updated successfully.`);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Assign Role
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      await usersApi.updateRole(selectedUser.id, roleForm.role);
      showToast(`Role updated to ${formatRoleLabel(roleForm.role)}.`);
      setIsRoleModalOpen(false);
      setSelectedUser(null);
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Toggle Status (Active / Suspended)
  const handleToggleStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await usersApi.updateStatus(user.id, nextStatus);
      showToast(`Status for ${user.firstName} changed to ${nextStatus}.`);
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  // Handler: Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await usersApi.delete(selectedUser.id);
      showToast(`User account deleted successfully.`);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await fetchUsers();
      await fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('');
    setDepartmentFilter('');
    setStatusFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search || roleFilter || departmentFilter || statusFilter || sortBy !== 'createdAt' || sortOrder !== 'desc'
  );

  return (
    <div className="w-full space-y-6">
      {/* Notification Toast */}
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

      {/* ========================================================================= */}
      {/* 1. UNIFIED STAT CARD (Single Card with border-divided sections)           */}
      {/* ========================================================================= */}
      <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB]">
          {isStatsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-5 space-y-3">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded-lg" />
              </div>
            ))
          ) : (
            <>
              {/* Stat 1: Total Staff */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FAFAF9]/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
                  <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                    <Users className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#111111]">{stats?.totalUsers ?? meta.total}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Provisioned Accounts</p>
                </div>
              </div>

              {/* Stat 2: Active */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FAFAF9]/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active</span>
                  <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#111111]">{stats?.activeUsers ?? 0}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Operational Access</p>
                </div>
              </div>

              {/* Stat 3: Suspended */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FAFAF9]/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Suspended</span>
                  <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
                    <AlertTriangle className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#111111]">{stats?.suspendedUsers ?? 0}</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">Access Locked</p>
                </div>
              </div>

              {/* Stat 4: Admins & Leads */}
              <div className="p-5 flex flex-col justify-between hover:bg-[#FAFAF9]/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admins & Leads</span>
                  <div className="p-2 rounded-2xl bg-purple-50 text-purple-600">
                    <ShieldCheck className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#111111]">{stats?.adminCount ?? 0}</p>
                  <p className="text-[10px] text-purple-600 font-bold mt-0.5">Elevated RBAC</p>
                </div>
              </div>

              {/* Stat 5: Departments */}
              <div className="p-5 flex flex-col justify-between col-span-2 sm:col-span-1 hover:bg-[#FAFAF9]/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Departments</span>
                  <div className="p-2 rounded-2xl bg-teal-50 text-teal-600">
                    <Building2 className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-extrabold text-[#111111]">{stats?.departmentsCount ?? DEPARTMENTS.length}</p>
                  <p className="text-[10px] text-teal-600 font-bold mt-0.5">Functional Units</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. MAIN CARD: Search & Filtering -> Table -> HeroUI Pagination            */}
      {/* ========================================================================= */}
      <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden w-full">
        {/* Section A: Search and Filtering Row with HeroUI Selects */}
        <div className="p-5 border-b border-[#E5E7EB]/80 bg-white">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* Search Input (Independent Filter) */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name, email, title..."
                className="w-full h-11 pl-10 pr-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-xs text-[#0B251A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B2E23] transition-all font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Sorting Row using HeroUI Selects */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Role HeroUI Select */}
              <HeroSelect
                value={roleFilter}
                onChange={(val) => {
                  setRoleFilter(val);
                  setCurrentPage(1);
                }}
                options={ROLE_OPTIONS}
                placeholder="All Roles (21)"
              />

              {/* Department HeroUI Select */}
              <HeroSelect
                value={departmentFilter}
                onChange={(val) => {
                  setDepartmentFilter(val);
                  setCurrentPage(1);
                }}
                options={DEPARTMENT_OPTIONS}
                placeholder="All Departments"
              />

              {/* Status HeroUI Select */}
              <HeroSelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={STATUS_OPTIONS}
                placeholder="All Statuses"
              />

              {/* Sort By HeroUI Select */}
              <HeroSelect
                value={sortBy}
                onChange={(val) => {
                  setSortBy(val);
                  setCurrentPage(1);
                }}
                options={SORT_OPTIONS}
                placeholder="Sort By"
              />

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort Order: ${sortOrder.toUpperCase()}`}
                className="h-11 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-1.5 cursor-pointer shadow-2xs select-none"
              >
                <ArrowUpDown className="size-3.5 text-slate-400" />
                <span>{sortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}</span>
              </button>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-11 px-3.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-full transition-colors cursor-pointer select-none"
                >
                  Reset
                </button>
              )}

              {/* Add New Staff / Register Button */}
              {(isAdmin || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="h-11 px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-sm cursor-pointer flex items-center gap-2 transition-all shrink-0 ml-auto lg:ml-0 select-none"
                >
                  <UserPlus className="size-4 text-[#AEFF48]" />
                  <span>Register Staff</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section B: Staff Directory Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Staff Member</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Role & RBAC Authority</th>
                <th className="py-4 px-6">Account Status</th>
                <th className="py-4 px-6">Joined Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/70">
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32 rounded-md" />
                          <Skeleton className="h-3 w-40 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-5 w-28 rounded-full" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-4 px-6"><Skeleton className="h-3 w-20 rounded-md" /></td>
                    <td className="py-4 px-6 text-right"><Skeleton className="h-7 w-20 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Users className="size-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No staff members found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filter selections.</p>
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
                users.map((u) => {
                  const roleStyle = ROLE_COLORS[u.role] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };
                  const initials = `${u.firstName?.[0] || 'U'}${u.lastName?.[0] || ''}`.toUpperCase();
                  const isSuper = u.role === Role.SUPER_ADMIN;

                  return (
                    <tr key={u.id} className="hover:bg-[#FAFAF9]/60 transition-colors group">
                      {/* Staff Member Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="size-10 rounded-full bg-[#0B251A] text-[#AEFF48] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {initials}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : u.status === 'SUSPENDED'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-[#111111] truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              {isSuper && <Sparkles className="size-3 text-[#0B2E23] shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                            {u.jobTitle && (
                              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{u.jobTitle}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F9FAFB] text-slate-700 border border-[#E5E7EB]">
                          <Building2 className="size-3 text-slate-400" />
                          <span>{u.department || 'General'}</span>
                        </span>
                      </td>

                      {/* Role & RBAC Authority */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                          >
                            {formatRoleLabel(u.role)}
                          </span>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.status === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : u.status === 'SUSPENDED'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{u.status}</span>
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-slate-400" />
                          <span>
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {(isAdmin || isSuperAdmin) && (
                            <>
                              {/* Edit Profile */}
                              <button
                                type="button"
                                title="Edit Staff Details"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setEditForm({
                                    firstName: u.firstName,
                                    lastName: u.lastName,
                                    department: u.department || '',
                                    jobTitle: u.jobTitle || '',
                                    phone: u.phone || '',
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                              >
                                <Edit2 className="size-3.5" />
                              </button>

                              {/* Assign Role */}
                              <button
                                type="button"
                                title="Assign Role & RBAC"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setRoleForm({ role: u.role });
                                  setIsRoleModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors cursor-pointer"
                              >
                                <Key className="size-3.5" />
                              </button>

                              {/* Toggle Status */}
                              <button
                                type="button"
                                title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                                onClick={() => handleToggleStatus(u)}
                                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                  u.status === 'ACTIVE'
                                    ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? (
                                  <AlertTriangle className="size-3.5" />
                                ) : (
                                  <CheckCircle2 className="size-3.5" />
                                )}
                              </button>

                              {/* Delete Account */}
                              {isSuperAdmin && u.id !== currentUser?.id && (
                                <button
                                  type="button"
                                  title="Delete User"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Section C: Pagination Bar with HeroUI Pagination Controls & Page Size Selector */}
        <div className="p-5 border-t border-[#E5E7EB] bg-[#FAFAF9]/60 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          {/* Summary Text & Items per Page using HeroSelect */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span>
              Showing{' '}
              <strong className="text-[#111111]">
                {meta.total === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-[#111111]">
                {Math.min(currentPage * pageSize, meta.total)}
              </strong>{' '}
              of <strong className="text-[#111111]">{meta.total}</strong> total staff
            </span>

            <div className="flex items-center gap-2 border-l border-[#E5E7EB] pl-4">
              <span>Items per page:</span>
              <HeroSelect
                size="sm"
                value={String(pageSize)}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={PAGE_SIZE_OPTIONS}
              />
            </div>
          </div>

          {/* HeroUI Pagination Component */}
          {meta.totalPages > 1 && (
            <div className="flex items-center">
              <PaginationRoot className="flex items-center gap-1.5">
                <PaginationContent className="flex items-center gap-1.5">
                  {/* Previous Button */}
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

                  {/* Page Numbers */}
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - currentPage) <= 1)
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
                            className={`size-8 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                              currentPage === p
                                ? 'bg-[#0B2E23] text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#E5E7EB] shadow-2xs'
                            }`}
                          >
                            {p}
                          </button>
                        </PaginationItem>
                      </React.Fragment>
                    ))}

                  {/* Next Button */}
                  <PaginationItem>
                    <button
                      type="button"
                      disabled={currentPage >= meta.totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
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
      {/* MODAL 1: Register / Add New Staff Member                                  */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#0B2E23]/10 text-[#0B251A]">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Register New Staff Member</h3>
                  <p className="text-xs text-slate-500">Provision a corporate account and assign initial RBAC role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    placeholder="Kaium"
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="Limon"
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="name@attech.solutions"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Defaults to email magic sign-in if empty"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <HeroSelect
                    value={createForm.department}
                    onChange={(val) => setCreateForm({ ...createForm, department: val })}
                    options={FORM_DEPARTMENT_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full h-10 rounded-2xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <HeroSelect
                    value={createForm.role}
                    onChange={(val) => setCreateForm({ ...createForm, role: val as Role })}
                    options={FORM_ROLE_OPTIONS}
                    className="w-full"
                    triggerClassName="w-full h-10 rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={createForm.jobTitle}
                    onChange={(e) => setCreateForm({ ...createForm, jobTitle: e.target.value })}
                    placeholder="e.g. Lead Systems Architect"
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+880 1..."
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B2E23] hover:bg-[#0B251A] rounded-full transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating Account...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Edit Staff Details                                               */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#111111]">Edit Staff Details</h3>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleEditUser} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <HeroSelect
                  value={editForm.department}
                  onChange={(val) => setEditForm({ ...editForm, department: val })}
                  options={FORM_DEPARTMENT_OPTIONS}
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-2xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B2E23] hover:bg-[#0B251A] rounded-full transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Assign Role & RBAC Authority                                    */}
      {/* ========================================================================= */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-purple-50 text-purple-700">
                  <Key className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Assign Role Authority</h3>
                  <p className="text-xs text-slate-500">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleAssignRole} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Role Designation</label>
                <HeroSelect
                  value={roleForm.role}
                  onChange={(val) => setRoleForm({ role: val as Role })}
                  options={FORM_ROLE_OPTIONS}
                  className="w-full"
                  triggerClassName="w-full h-11 rounded-2xl"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-[#E5E7EB] text-xs text-slate-600">
                <p className="font-semibold text-slate-800 mb-0.5">Automated RBAC Matrix</p>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Changing role immediately re-evaluates all 30+ permissions for this account across agency operations.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-full transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Delete User Confirmation                                        */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 rounded-2xl bg-red-50 text-red-600">
                <Trash2 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">Delete User Account</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete the account for{' '}
              <strong className="text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteUser}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
