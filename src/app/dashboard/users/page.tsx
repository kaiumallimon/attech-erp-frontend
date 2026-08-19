'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Avatar,
  Spinner,
} from '@heroui/react';
import {
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  X,
  Mail,
  Lock,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { Role, UserProfile } from '../../../types/auth';
import { usersApi } from '../../../lib/api';
import ButtonWithIcon from '../../../components/ui/button-with-icon';
import { Breadcrumbs } from '../../../components/breadcrumbs';

export default function UsersManagementPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New User Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Engineering',
    jobTitle: '',
    role: Role.DEVELOPER,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll({
        search: searchTerm || undefined,
        role: selectedRole || undefined,
      });
      setUsers(res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedRole]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setUpdatingId(userId);
    try {
      await usersApi.updateRole(userId, newRole);
      setNotification(`Role updated to ${newRole} successfully`);
      await fetchUsers();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setCreateError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      setCreateError('Initial password must be at least 6 characters');
      return;
    }

    setCreateError(null);
    setIsCreating(true);
    try {
      await usersApi.create(formData);
      setNotification(`Staff account for ${formData.firstName} ${formData.lastName} created successfully.`);
      setIsModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        department: 'Engineering',
        jobTitle: '',
        role: Role.DEVELOPER,
      });
      await fetchUsers();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0B2E23]" />
            Agency Staff & Role Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centrally provision staff accounts, configure permissions, and manage departmental allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUsers}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-black border border-[#E5E7EB] hover:border-slate-400 bg-white rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {(isAdmin || isSuperAdmin) && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-md cursor-pointer flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#AEFF48]" />
              <span>Add New Staff</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="bg-white border border-[#E5E7EB] p-4 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all cursor-pointer"
            >
              <option value="">All Roles ({Object.keys(Role).length})</option>
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border border-[#E5E7EB] overflow-hidden rounded-3xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-slate-500 uppercase tracking-wider font-bold border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Department & Title</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Spinner size="md" color="accent" />
                    <p className="text-xs text-slate-500 mt-2">Loading agency staff...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const uInitials = `${u.firstName?.[0] || 'U'}${u.lastName?.[0] || 'A'}`.toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" className="bg-[#0B251A] text-white text-xs font-bold shrink-0">
                            <Avatar.Fallback>{uInitials}</Avatar.Fallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-[#111111]">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-medium">{u.department || 'General Agency'}</p>
                        <p className="text-[11px] text-slate-400">{u.jobTitle || 'Staff'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5 bg-[#0B251A]/5 text-[#0B251A] border border-[#0B251A]/10">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSuperAdmin || (isAdmin && u.role !== Role.SUPER_ADMIN) ? (
                          <select
                            disabled={updatingId === u.id || (u.role === Role.SUPER_ADMIN && !isSuperAdmin)}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                            className="px-3 py-1.5 text-[11px] bg-white border border-[#E5E7EB] rounded-full text-slate-800 focus:outline-none focus:border-[#0B251A] cursor-pointer disabled:opacity-50 shadow-2xs"
                          >
                            {Object.values(Role).map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-400">Restricted</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin User Provisioning Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-3xl shadow-2xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#0B2E23]" />
                  Provision New Agency User
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin authorization required. User will be created directly in MongoDB Atlas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 px-1">First Name *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Alex"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full h-[46px] pl-9 pr-3 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 px-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Morgan"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full h-[46px] px-4 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 px-1">Corporate Email *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="alex.morgan@attech.solutions"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-[46px] pl-9 pr-3 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 px-1">Initial Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-[46px] pl-9 pr-3 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 px-1">Department</label>
                  <input
                    type="text"
                    placeholder="Engineering / Design"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-[46px] px-4 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 px-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="Senior Developer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full h-[46px] px-4 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 px-1">Designated Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full h-[46px] px-4 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B251A] transition-all cursor-pointer"
                >
                  {Object.values(Role).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-[46px] px-5 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <ButtonWithIcon
                  type="submit"
                  label="Create Staff Account"
                  loading={isCreating}
                  loadingLabel="Provisioning..."
                  icon={<UserPlus size={16} strokeWidth={2.5} />}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
