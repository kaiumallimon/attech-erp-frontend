'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  ExternalLink,
  FileText,
  FolderGit2,
  FolderOpen,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Target,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { crmApi, employeesApi } from '../../../../lib/api';
import {
  AccountStatus,
  CrmAccount,
  CrmActivity,
  CrmContact,
  CrmDeal,
  CrmProposal,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';
import HeroSelect, { SelectOption } from '../../../../components/ui/hero-select';

export default function CrmAccountsPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [accountsSearch, setAccountsSearch] = useState('');
  const [accountsStatusFilter, setAccountsStatusFilter] = useState('all');

  const [employees, setEmployees] = useState<any[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CrmAccount | null>(null);
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<CrmAccount | null>(null);
  const [activeAccountTab, setActiveAccountTab] = useState<'overview' | 'contacts' | 'deals' | 'activities' | 'proposals' | 'documents' | 'projects'>('overview');

  const [accountForm, setAccountForm] = useState<{
    name: string;
    legalName: string;
    industry: string;
    website: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    status: string;
    ownerId: string;
    description: string;
    tags: string[];
  }>({
    name: '',
    legalName: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    status: AccountStatus.ACTIVE,
    ownerId: '',
    description: '',
    tags: [],
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const [accRes, empRes] = await Promise.all([
        crmApi.accounts.list({
          search: accountsSearch,
          status: accountsStatusFilter,
        }),
        employeesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      setAccounts(Array.isArray(accRes) ? accRes : Array.isArray(accRes?.items) ? accRes.items : Array.isArray(accRes?.data) ? accRes.data : []);

      const empList = Array.isArray(empRes)
        ? empRes
        : Array.isArray((empRes as any)?.data)
        ? (empRes as any).data
        : Array.isArray((empRes as any)?.items)
        ? (empRes as any).items
        : [];
      setEmployees(empList);
    } catch (err: any) {
      showToast(err.message || 'Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, [accountsStatusFilter]);

  const employeeOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return [
      { key: '', value: '', label: 'Unassigned' },
      ...list.map((e) => ({
        key: e.id || e._id,
        value: e.id || e._id,
        label: `${e.userId?.firstName || ''} ${e.userId?.lastName || ''} (${e.employeeId || 'Staff'})`.trim(),
      })),
    ];
  }, [employees]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await crmApi.accounts.update(editingAccount.id, accountForm);
        showToast('Account updated successfully.');
      } else {
        await crmApi.accounts.create(accountForm);
        showToast('Account created successfully.');
      }
      setIsAccountModalOpen(false);
      setEditingAccount(null);
      void loadAccounts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save account', 'error');
    }
  };

  const handleOpenAccountProfile = async (accountId: string) => {
    try {
      const full = await crmApi.accounts.get(accountId);
      setSelectedAccountDetail(full);
      setActiveAccountTab('overview');
    } catch (err: any) {
      showToast(err.message || 'Failed to load account details', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-[#0B2E23] text-[#AEFF48] border-[#AEFF48]/30'
              : 'bg-rose-950 text-rose-200 border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Compact ERP Header */}
      <CrmNavHeader
        title="Accounts"
        subtitle="Client organizations, corporate directory, key contacts, and aggregated sales history."
        breadcrumb={[
          { label: 'CRM & Sales', href: '/dashboard/crm' },
        ]}
        onRefresh={() => void loadAccounts()}
        isRefreshing={loading}
        actionButton={
          <button
            type="button"
            onClick={() => {
              setEditingAccount(null);
              setAccountForm({
                name: '',
                legalName: '',
                industry: '',
                website: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: '',
                status: AccountStatus.ACTIVE,
                ownerId: employees[0]?.id || '',
                description: '',
                tags: [],
              });
              setIsAccountModalOpen(true);
            }}
            className="h-9 px-4 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-xs hover:bg-[#0B251A] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Account</span>
          </button>
        }
      />

      {/* Toolbar Search & Filter */}
      <div className="p-3.5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search accounts by name, industry, email..."
              value={accountsSearch}
              onChange={(e) => setAccountsSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadAccounts()}
              className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E5E7EB] text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>

          <select
            value={accountsStatusFilter}
            onChange={(e) => setAccountsStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="PROSPECT">Prospects</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => void loadAccounts()}
          className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-700 font-bold text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-slate-400 bg-white rounded-4xl border border-[#E5E7EB]">
            No client accounts found. Click &quot;Add Account&quot; to register a client organization.
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs hover:border-[#0B2E23]/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {acc.industry || 'Client Organization'}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{acc.name}</h4>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      acc.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : acc.status === 'PROSPECT'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>

                {acc.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{acc.description}</p>
                )}

                <div className="pt-2 space-y-1 text-[11px] text-slate-500">
                  {acc.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3 text-slate-400 shrink-0" />
                      <span className="truncate">{acc.email}</span>
                    </div>
                  )}
                  {acc.website && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="size-3 text-slate-400 shrink-0" />
                      <a
                        href={acc.website.startsWith('http') ? acc.website : `https://${acc.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline truncate"
                      >
                        {acc.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Total Deals</p>
                  <p className="font-bold text-slate-800">
                    {acc.dealsCount || 0} (${(acc.totalDealValue || 0).toLocaleString()})
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleOpenAccountProfile(acc.id)}
                    className="px-3 py-1.5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] hover:bg-[#0B251A] cursor-pointer transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccount(acc);
                      setAccountForm({
                        name: acc.name,
                        legalName: acc.legalName || '',
                        industry: acc.industry || '',
                        website: acc.website || '',
                        email: acc.email || '',
                        phone: acc.phone || '',
                        address: acc.address || '',
                        city: acc.city || '',
                        country: acc.country || '',
                        status: acc.status as string,
                        ownerId: (acc.ownerId as any)?.id || (acc.ownerId as any)?._id || '',
                        description: acc.description || '',
                        tags: acc.tags || [],
                      });
                      setIsAccountModalOpen(true);
                    }}
                    className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                    title="Edit Account"
                  >
                    <Edit2 className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Delete account ${acc.name}?`)) {
                        await crmApi.accounts.delete(acc.id);
                        showToast('Account deleted.');
                        void loadAccounts();
                      }
                    }}
                    className="size-7 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                    title="Delete Account"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add/Edit Account */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-5 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">{editingAccount ? 'Edit Account' : 'New Account'}</h3>
                <p className="text-[11px] text-white/70">Client organization record</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Name *</label>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Industry / Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Fintech, SaaS"
                    value={accountForm.industry}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, industry: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={accountForm.website}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={accountForm.status}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Owner (Employee)</label>
                <HeroSelect
                  value={accountForm.ownerId}
                  options={employeeOptions}
                  onChange={(val) => setAccountForm((prev) => ({ ...prev, ownerId: val }))}
                  className="w-full h-9 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Overview Description</label>
                <textarea
                  rows={3}
                  value={accountForm.description}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Detailed Account Profile with 7 Tabs */}
      {selectedAccountDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end animate-fadeIn">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl border-l border-[#E5E7EB] overflow-y-auto p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header Profile Title */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedAccountDetail.industry || 'Client Account Profile'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedAccountDetail.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      {selectedAccountDetail.status}
                    </span>
                    {selectedAccountDetail.createdAt && (
                      <span className="text-[10px] text-slate-400">
                        Client since {new Date(selectedAccountDetail.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAccountDetail(null)}
                  className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Navigation Tabs inside Account Drawer */}
              <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] pb-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'contacts', label: `Contacts (${selectedAccountDetail.contacts?.length || 0})` },
                  { id: 'deals', label: `Deals (${selectedAccountDetail.deals?.length || 0})` },
                  { id: 'activities', label: `Activities (${selectedAccountDetail.activities?.length || 0})` },
                  { id: 'proposals', label: 'Proposals' },
                  { id: 'documents', label: 'Documents' },
                  { id: 'projects', label: 'Projects' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveAccountTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeAccountTab === tab.id
                        ? 'bg-[#0B2E23] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeAccountTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA]">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Legal Name</span>
                      <p className="font-semibold text-slate-800">{selectedAccountDetail.legalName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Industry</span>
                      <p className="font-semibold text-slate-800">{selectedAccountDetail.industry || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Corporate Email</span>
                      <p className="font-semibold text-slate-800">{selectedAccountDetail.email || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Corporate Phone</span>
                      <p className="font-semibold text-slate-800">{selectedAccountDetail.phone || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Website</span>
                      <p className="font-semibold text-emerald-800">
                        {selectedAccountDetail.website ? (
                          <a href={selectedAccountDetail.website} target="_blank" rel="noreferrer" className="hover:underline">
                            {selectedAccountDetail.website}
                          </a>
                        ) : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Account Manager</span>
                      <p className="font-semibold text-slate-800">
                        {selectedAccountDetail.ownerId?.userId
                          ? `${selectedAccountDetail.ownerId.userId.firstName} ${selectedAccountDetail.ownerId.userId.lastName}`
                          : 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {selectedAccountDetail.description && (
                    <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Company Overview</span>
                      <p className="text-slate-600 leading-relaxed">{selectedAccountDetail.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Contacts */}
              {activeAccountTab === 'contacts' && (
                <div className="space-y-3">
                  {selectedAccountDetail.contacts?.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 italic">No contacts registered.</div>
                  ) : (
                    selectedAccountDetail.contacts?.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {c.firstName} {c.lastName} {c.isPrimary && '🌟'}
                          </p>
                          <p className="text-[11px] text-slate-500">{c.jobTitle || 'Contact'} • {c.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Deals */}
              {activeAccountTab === 'deals' && (
                <div className="space-y-3">
                  {selectedAccountDetail.deals?.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 italic">No deals associated.</div>
                  ) : (
                    selectedAccountDetail.deals?.map((d) => (
                      <div key={d.id} className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{d.name}</p>
                          <p className="text-[11px] text-slate-500">${d.value.toLocaleString()} USD</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-[#ECE5DA]">
                          {d.status === 'WON' ? 'Closed Won' : d.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Activities Timeline */}
              {activeAccountTab === 'activities' && (
                <div className="space-y-3">
                  {selectedAccountDetail.activities?.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 italic">No activity timeline recorded.</div>
                  ) : (
                    selectedAccountDetail.activities?.map((a) => (
                      <div key={a.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500">{a.type}</span>
                          <span className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{a.subject}</p>
                        {a.description && <p className="text-[11px] text-slate-500">{a.description}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: Proposals */}
              {activeAccountTab === 'proposals' && (
                <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] text-center space-y-2">
                  <FileText className="size-8 text-slate-400 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-800">Account Proposals</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    View and generate quotation proposals associated with this account via the CRM Proposals module.
                  </p>
                  <Link
                    href="/dashboard/crm/proposals"
                    className="inline-block mt-2 px-4 py-1.5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px]"
                  >
                    Open Proposals Engine
                  </Link>
                </div>
              )}

              {/* Tab 6: Documents */}
              {activeAccountTab === 'documents' && (
                <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] text-center space-y-2">
                  <FolderOpen className="size-8 text-slate-400 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-800">CDN & Storage Integration</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Contract files, NDA agreements, and specifications uploaded to the CDN & Cloud Storage module for this account.
                  </p>
                  <Link
                    href="/dashboard/cdn"
                    className="inline-block mt-2 px-4 py-1.5 rounded-full bg-slate-800 text-white font-bold text-[10px]"
                  >
                    Access Cloud Storage
                  </Link>
                </div>
              )}

              {/* Tab 7: Projects Integration Point */}
              {activeAccountTab === 'projects' && (
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <FolderGit2 className="size-8 text-emerald-800 mx-auto" />
                  <h4 className="text-xs font-bold text-emerald-950">Project Management Integration</h4>
                  <p className="text-[11px] text-emerald-800 max-w-sm mx-auto">
                    When deals for this account are Closed Won, they link to the Project Management module for sprint delivery, milestone tracking, and timesheets.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSelectedAccountDetail(null)}
                className="w-full h-10 rounded-full bg-[#0B2E23] text-white font-bold text-xs hover:bg-[#0B251A] cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
