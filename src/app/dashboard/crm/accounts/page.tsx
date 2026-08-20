'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit2,
  Globe,
  Mail,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { crmApi, employeesApi } from '../../../../lib/api';
import {
  AccountStatus,
  CrmAccount,
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
        showToast('Client Account created successfully.');
      }
      setIsAccountModalOpen(false);
      setEditingAccount(null);
      void loadAccounts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save account', 'error');
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

      <CrmNavHeader
        title="Client Accounts Directory"
        subtitle="Manage client organizations, corporate profiles, key decision makers, and aggregated sales value."
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
            className="h-10 px-5 rounded-full bg-[#AEFF48] text-[#0B2E23] font-bold text-xs hover:bg-[#9DE83E] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="size-4" />
            <span>New Client Account</span>
          </button>
        }
      />

      {/* Toolbar Search & Filter */}
      <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search accounts by name, industry, email..."
              value={accountsSearch}
              onChange={(e) => setAccountsSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadAccounts()}
              className="w-full h-10 pl-10 pr-4 rounded-full border border-[#E5E7EB] text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>

          <select
            value={accountsStatusFilter}
            onChange={(e) => setAccountsStatusFilter(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active Clients</option>
            <option value="PROSPECT">Prospects</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => void loadAccounts()}
          className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-700 font-bold text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-slate-400 bg-white rounded-4xl border border-[#E5E7EB]">
            No client accounts found. Click &quot;New Client Account&quot; to get started.
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
                      {acc.industry || 'General Client'}
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
                    onClick={async () => {
                      const full = await crmApi.accounts.get(acc.id);
                      setSelectedAccountDetail(full);
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] hover:bg-[#0B251A] cursor-pointer transition-colors"
                  >
                    Profile & History
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
                      if (confirm(`Delete client account ${acc.name}?`)) {
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
            <div className="p-6 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">
                  {editingAccount ? 'Edit Client Account' : 'Create Client Organization'}
                </h3>
                <p className="text-xs text-white/70">Client accounts represent customer companies</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Account Name *</label>
                  <input
                    type="text"
                    required
                    value={accountForm.name}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Industry / Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Fintech, Healthcare"
                    value={accountForm.industry}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, industry: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
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
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={accountForm.status}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full h-10 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="ACTIVE">Active Client</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Manager (Employee Owner)</label>
                <HeroSelect
                  value={accountForm.ownerId}
                  options={employeeOptions}
                  onChange={(val) => setAccountForm((prev) => ({ ...prev, ownerId: val }))}
                  className="w-full h-10 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Overview</label>
                <textarea
                  rows={3}
                  value={accountForm.description}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Account Profile */}
      {selectedAccountDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end animate-fadeIn">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-[#E5E7EB] overflow-y-auto p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedAccountDetail.industry || 'Client Organization'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedAccountDetail.name}</h3>
                  <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {selectedAccountDetail.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAccountDetail(null)}
                  className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Contacts */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Key Stakeholders & Contacts ({selectedAccountDetail.contacts?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedAccountDetail.contacts?.map((c) => (
                    <div key={c.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {c.firstName} {c.lastName} {c.isPrimary && '🌟'}
                        </p>
                        <p className="text-[11px] text-slate-500">{c.jobTitle} • {c.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deals */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Deals & Opportunities ({selectedAccountDetail.deals?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedAccountDetail.deals?.map((d) => (
                    <div key={d.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{d.name}</p>
                        <p className="text-[11px] text-slate-500">${d.value.toLocaleString()} • {d.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSelectedAccountDetail(null)}
                className="w-full h-11 rounded-full bg-[#0B2E23] text-white font-bold text-xs hover:bg-[#0B251A] cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
