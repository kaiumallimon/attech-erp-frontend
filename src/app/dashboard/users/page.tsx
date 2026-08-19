'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Button,
  Avatar,
  Spinner,
} from '@heroui/react';
import {
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { Role, UserProfile } from '../../../types/auth';
import { usersApi } from '../../../lib/api';

export default function UsersManagementPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

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
            Centrally manage agency personnel, role-based access control, and departmental allocations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-black border border-[#E5E7EB] hover:border-slate-400 bg-white rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Roster</span>
        </button>
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
              <option value="">All Roles</option>
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
    </div>
  );
}
