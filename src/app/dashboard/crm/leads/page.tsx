'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Flame,
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
  CrmAccount,
  CrmContact,
  CrmLead,
  CrmLeadSource,
  CrmPipeline,
  LeadStatus,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';
import HeroSelect, { SelectOption } from '../../../../components/ui/hero-select';

export default function CrmLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsStatusFilter, setLeadsStatusFilter] = useState('all');
  const [leadsSourceFilter, setLeadsSourceFilter] = useState('all');

  const [employees, setEmployees] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<CrmLeadSource[]>([]);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [leadForm, setLeadForm] = useState<{
    firstName: string;
    lastName: string;
    companyName: string;
    jobTitle: string;
    email: string;
    phone: string;
    website: string;
    sourceId: string;
    status: string;
    ownerId: string;
    estimatedValue: number;
    description: string;
    tags: string[];
  }>({
    firstName: '',
    lastName: '',
    companyName: '',
    jobTitle: '',
    email: '',
    phone: '',
    website: '',
    sourceId: '',
    status: LeadStatus.NEW,
    ownerId: '',
    estimatedValue: 20000,
    description: '',
    tags: [],
  });

  // Lead Conversion Modal State (3-Step Entity Creation / Selection)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState<CrmLead | null>(null);
  const [accountMode, setAccountMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [contactMode, setContactMode] = useState<'NEW' | 'EXISTING'>('NEW');

  const [convertForm, setConvertForm] = useState<{
    existingAccountId: string;
    newAccountName: string;
    existingContactId: string;
    newContactFirstName: string;
    newContactLastName: string;
    newContactEmail: string;
    newContactPhone: string;
    createDeal: boolean;
    dealName: string;
    dealValue: number;
    currency: string;
    pipelineId: string;
    stageId: string;
    expectedCloseDate: string;
  }>({
    existingAccountId: '',
    newAccountName: '',
    existingContactId: '',
    newContactFirstName: '',
    newContactLastName: '',
    newContactEmail: '',
    newContactPhone: '',
    createDeal: true,
    dealName: '',
    dealValue: 0,
    currency: 'USD',
    pipelineId: '',
    stageId: '',
    expectedCloseDate: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, empRes, srcRes, pipeRes, accRes, contactRes] = await Promise.all([
        crmApi.leads.list({
          search: leadsSearch,
          status: leadsStatusFilter,
          sourceId: leadsSourceFilter,
        }),
        employeesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
        crmApi.settings.getLeadSources().catch(() => []),
        crmApi.settings.getPipelines().catch(() => []),
        crmApi.accounts.list().catch(() => ({ data: [] })),
        crmApi.contacts.list().catch(() => ({ data: [] })),
      ]);

      setLeads(Array.isArray(leadsRes) ? leadsRes : Array.isArray(leadsRes?.items) ? leadsRes.items : Array.isArray(leadsRes?.data) ? leadsRes.data : []);

      const empList = Array.isArray(empRes)
        ? empRes
        : Array.isArray((empRes as any)?.data)
        ? (empRes as any).data
        : Array.isArray((empRes as any)?.items)
        ? (empRes as any).items
        : [];
      setEmployees(empList);

      setLeadSources(Array.isArray(srcRes) ? srcRes : Array.isArray((srcRes as any)?.data) ? (srcRes as any).data : []);
      setPipelines(Array.isArray(pipeRes) ? pipeRes : Array.isArray((pipeRes as any)?.data) ? (pipeRes as any).data : []);
      setAccounts(Array.isArray(accRes) ? accRes : Array.isArray((accRes as any)?.items) ? (accRes as any).items : Array.isArray((accRes as any)?.data) ? (accRes as any).data : []);
      setContacts(Array.isArray(contactRes) ? contactRes : Array.isArray((contactRes as any)?.items) ? (contactRes as any).items : Array.isArray((contactRes as any)?.data) ? (contactRes as any).data : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeads();
  }, [leadsStatusFilter, leadsSourceFilter]);

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

  const leadSourceOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(leadSources) ? leadSources : [];
    return [
      { key: '', value: '', label: 'Select Source' },
      ...list.map((s) => ({ key: s.id, value: s.id, label: s.name })),
    ];
  }, [leadSources]);

  const pipelineOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(pipelines) ? pipelines : [];
    return list.map((p) => ({
      key: p.id,
      value: p.id,
      label: p.isDefault ? `${p.name} (Default)` : p.name,
    }));
  }, [pipelines]);

  const accountSelectOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    return [
      { key: '', value: '', label: 'Select Existing Account' },
      ...list.map((a) => ({ key: a.id, value: a.id, label: a.name })),
    ];
  }, [accounts]);

  const contactSelectOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(contacts) ? contacts : [];
    return [
      { key: '', value: '', label: 'Select Existing Contact' },
      ...list.map((c) => ({
        key: c.id,
        value: c.id,
        label: `${c.firstName} ${c.lastName} (${(c.accountId as any)?.name || 'Direct'})`,
      })),
    ];
  }, [contacts]);

  const conversionPipelineStages = useMemo(() => {
    const pipe = pipelines.find((p) => p.id === convertForm.pipelineId) || pipelines[0];
    return Array.isArray(pipe?.stages) ? pipe.stages : [];
  }, [pipelines, convertForm.pipelineId]);

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await crmApi.leads.update(editingLead.id, leadForm);
        showToast('Lead updated successfully.');
      } else {
        await crmApi.leads.create(leadForm);
        showToast('New Lead created successfully.');
      }
      setIsLeadModalOpen(false);
      setEditingLead(null);
      void loadLeads();
    } catch (err: any) {
      showToast(err.message || 'Failed to save lead', 'error');
    }
  };

  const handleOpenConvertModal = (lead: CrmLead) => {
    setConvertingLead(lead);
    setAccountMode('NEW');
    setContactMode('NEW');

    const defaultPipe = pipelines[0];
    setConvertForm({
      existingAccountId: accounts[0]?.id || '',
      newAccountName: lead.companyName || `${lead.firstName} ${lead.lastName}`,
      existingContactId: contacts[0]?.id || '',
      newContactFirstName: lead.firstName || '',
      newContactLastName: lead.lastName || '',
      newContactEmail: lead.email || '',
      newContactPhone: lead.phone || '',
      createDeal: true,
      dealName: `${lead.companyName || lead.firstName} - Solution Engagement`,
      dealValue: lead.estimatedValue || 25000,
      currency: lead.currency || 'USD',
      pipelineId: defaultPipe?.id || '',
      stageId: defaultPipe?.stages?.[0]?.id || '',
      expectedCloseDate: '',
    });
    setIsConvertModalOpen(true);
  };

  const handleExecuteConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;
    try {
      const payload: any = {
        createDeal: convertForm.createDeal,
      };

      if (accountMode === 'EXISTING') {
        payload.existingAccountId = convertForm.existingAccountId;
      } else {
        payload.newAccountName = convertForm.newAccountName;
      }

      if (contactMode === 'EXISTING') {
        payload.existingContactId = convertForm.existingContactId;
      }

      if (convertForm.createDeal) {
        payload.dealName = convertForm.dealName;
        payload.dealValue = convertForm.dealValue;
        payload.pipelineId = convertForm.pipelineId;
        payload.stageId = convertForm.stageId;
        if (convertForm.expectedCloseDate) {
          payload.expectedCloseDate = convertForm.expectedCloseDate;
        }
      }

      await crmApi.leads.convert(convertingLead.id, payload);
      showToast(`Lead '${convertingLead.firstName} ${convertingLead.lastName}' converted successfully!`);
      setIsConvertModalOpen(false);
      setConvertingLead(null);
      void loadLeads();
    } catch (err: any) {
      showToast(err.message || 'Lead conversion failed', 'error');
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
        title="Leads"
        subtitle="Manage and qualify prospective client inquiries before conversion."
        breadcrumb={[
          { label: 'CRM & Sales', href: '/dashboard/crm' },
        ]}
        onRefresh={() => void loadLeads()}
        isRefreshing={loading}
        actionButton={
          <button
            type="button"
            onClick={() => {
              setEditingLead(null);
              setLeadForm({
                firstName: '',
                lastName: '',
                companyName: '',
                jobTitle: '',
                email: '',
                phone: '',
                website: '',
                sourceId: leadSources[0]?.id || '',
                status: LeadStatus.NEW,
                ownerId: employees[0]?.id || '',
                estimatedValue: 20000,
                description: '',
                tags: [],
              });
              setIsLeadModalOpen(true);
            }}
            className="h-9 px-4 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-xs hover:bg-[#0B251A] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Lead</span>
          </button>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="p-3.5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, company, email..."
              value={leadsSearch}
              onChange={(e) => setLeadsSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadLeads()}
              className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E5E7EB] text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>

          <select
            value={leadsStatusFilter}
            onChange={(e) => setLeadsStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONVERTED">Converted</option>
          </select>

          <select
            value={leadsSourceFilter}
            onChange={(e) => setLeadsSourceFilter(e.target.value)}
            className="h-9 px-3 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Sources</option>
            {leadSources.map((src) => (
              <option key={src.id} value={src.id}>
                {src.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void loadLeads()}
          className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-700 font-bold text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Leads Table */}
      <div className="rounded-4xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E5E7EB] text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                    No leads found. Click &quot;Add Lead&quot; to register new prospect opportunities.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {lead.firstName} {lead.lastName}
                      {lead.jobTitle && (
                        <span className="block text-[10px] font-normal text-slate-400">{lead.jobTitle}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {lead.companyName || '—'}
                      {lead.website && (
                        <a
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>Website</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      {lead.email && <p className="text-slate-600">{lead.email}</p>}
                      {lead.phone && <p className="text-[10px] text-slate-400">{lead.phone}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {lead.sourceId?.name || 'Direct'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0B2E23]">
                      ${(lead.estimatedValue || 0).toLocaleString()} {lead.currency}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          lead.status === 'CONVERTED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : lead.status === 'QUALIFIED'
                            ? 'bg-sky-100 text-sky-800'
                            : lead.status === 'UNQUALIFIED'
                            ? 'bg-rose-100 text-rose-800'
                            : lead.status === 'CONTACTED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {lead.ownerId?.userId
                        ? `${lead.ownerId.userId.firstName} ${lead.ownerId.userId.lastName}`
                        : 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {lead.status !== 'CONVERTED' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenConvertModal(lead)}
                          className="px-3 py-1 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] hover:bg-[#0B251A] cursor-pointer transition-colors"
                        >
                          Convert Lead
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">Converted</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLead(lead);
                          setLeadForm({
                            firstName: lead.firstName,
                            lastName: lead.lastName,
                            companyName: lead.companyName || '',
                            jobTitle: lead.jobTitle || '',
                            email: lead.email || '',
                            phone: lead.phone || '',
                            website: lead.website || '',
                            sourceId: (lead.sourceId as any)?.id || (lead.sourceId as any)?._id || '',
                            status: lead.status as string,
                            ownerId: (lead.ownerId as any)?.id || (lead.ownerId as any)?._id || '',
                            estimatedValue: lead.estimatedValue || 0,
                            description: lead.description || '',
                            tags: lead.tags || [],
                          });
                          setIsLeadModalOpen(true);
                        }}
                        className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                        title="Edit Lead"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete lead ${lead.firstName} ${lead.lastName}?`)) {
                            await crmApi.leads.delete(lead.id);
                            showToast('Lead deleted.');
                            void loadLeads();
                          }
                        }}
                        className="size-7 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Lead */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-5 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">{editingLead ? 'Edit Lead' : 'Register New Lead'}</h3>
                <p className="text-[11px] text-white/70">Capture prospective inquiry details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.firstName}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.lastName}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={leadForm.companyName}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={leadForm.jobTitle}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Source</label>
                  <HeroSelect
                    value={leadForm.sourceId}
                    options={leadSourceOptions}
                    onChange={(val) => setLeadForm((prev) => ({ ...prev, sourceId: val }))}
                    className="w-full h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800 font-semibold"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="UNQUALIFIED">Unqualified</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Owner</label>
                  <HeroSelect
                    value={leadForm.ownerId}
                    options={employeeOptions}
                    onChange={(val) => setLeadForm((prev) => ({ ...prev, ownerId: val }))}
                    className="w-full h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Value ($)</label>
                  <input
                    type="number"
                    value={leadForm.estimatedValue}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, estimatedValue: Number(e.target.value) }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scope & Notes</label>
                <textarea
                  rows={3}
                  value={leadForm.description}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Details of client inquiry, tech stack requirements..."
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  {editingLead ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Structured Lead Conversion Engine */}
      {isConvertModalOpen && convertingLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-5 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#AEFF48]">
                  Conversion Workflow
                </span>
                <h3 className="text-base font-black">
                  Convert Lead: {convertingLead.firstName} {convertingLead.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleExecuteConversion} className="p-6 space-y-4 text-xs">
              {/* 1. Account Section */}
              <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-emerald-800" />
                    <h4 className="font-extrabold text-slate-900 text-xs">1. Account</h4>
                  </div>
                  <div className="flex items-center bg-white p-0.5 rounded-full border border-[#ECE5DA]">
                    <button
                      type="button"
                      onClick={() => setAccountMode('NEW')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        accountMode === 'NEW' ? 'bg-[#0B2E23] text-white' : 'text-slate-500'
                      }`}
                    >
                      Create New
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountMode('EXISTING')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        accountMode === 'EXISTING' ? 'bg-[#0B2E23] text-white' : 'text-slate-500'
                      }`}
                    >
                      Select Existing
                    </button>
                  </div>
                </div>

                {accountMode === 'NEW' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Account Name *</label>
                    <input
                      type="text"
                      required
                      value={convertForm.newAccountName}
                      onChange={(e) => setConvertForm((prev) => ({ ...prev, newAccountName: e.target.value }))}
                      className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-bold text-slate-800"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Link to Existing Account *</label>
                    <HeroSelect
                      value={convertForm.existingAccountId}
                      options={accountSelectOptions}
                      onChange={(val) => setConvertForm((prev) => ({ ...prev, existingAccountId: val }))}
                      className="w-full h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 2. Contact Section */}
              <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-emerald-800" />
                    <h4 className="font-extrabold text-slate-900 text-xs">2. Contact</h4>
                  </div>
                  <div className="flex items-center bg-white p-0.5 rounded-full border border-[#ECE5DA]">
                    <button
                      type="button"
                      onClick={() => setContactMode('NEW')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        contactMode === 'NEW' ? 'bg-[#0B2E23] text-white' : 'text-slate-500'
                      }`}
                    >
                      Create New
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactMode('EXISTING')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        contactMode === 'EXISTING' ? 'bg-[#0B2E23] text-white' : 'text-slate-500'
                      }`}
                    >
                      Select Existing
                    </button>
                  </div>
                </div>

                {contactMode === 'NEW' ? (
                  <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-2xl border border-[#ECE5DA]">
                    Will create primary contact for <span className="font-bold text-slate-900">{convertingLead.firstName} {convertingLead.lastName}</span> ({convertingLead.email || 'No email provided'}).
                  </p>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select Existing Contact</label>
                    <HeroSelect
                      value={convertForm.existingContactId}
                      options={contactSelectOptions}
                      onChange={(val) => setConvertForm((prev) => ({ ...prev, existingContactId: val }))}
                      className="w-full h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 3. Deal Section */}
              <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="size-4 text-emerald-800" />
                    <h4 className="font-extrabold text-slate-900 text-xs">3. Sales Deal</h4>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={convertForm.createDeal}
                      onChange={(e) => setConvertForm((prev) => ({ ...prev, createDeal: e.target.checked }))}
                      className="size-4 rounded accent-[#0B2E23]"
                    />
                    <span className="text-[11px] font-bold text-slate-700">Create Deal</span>
                  </label>
                </div>

                {convertForm.createDeal && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Deal Title *</label>
                      <input
                        type="text"
                        required
                        value={convertForm.dealName}
                        onChange={(e) => setConvertForm((prev) => ({ ...prev, dealName: e.target.value }))}
                        className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Target Pipeline</label>
                        <HeroSelect
                          value={convertForm.pipelineId}
                          options={pipelineOptions}
                          onChange={(val) => setConvertForm((prev) => ({ ...prev, pipelineId: val }))}
                          className="w-full h-9 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Deal Value ($)</label>
                        <input
                          type="number"
                          value={convertForm.dealValue}
                          onChange={(e) => setConvertForm((prev) => ({ ...prev, dealValue: Number(e.target.value) }))}
                          className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-black text-[#0B2E23]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-6 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  Convert Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
