'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { crmApi } from '../../../../lib/api';
import {
  CrmCustomField,
  CrmDealType,
  CrmLeadSource,
  CrmLostReason,
  CrmPipeline,
  CrmTag,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';

export default function CrmSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [leadSources, setLeadSources] = useState<CrmLeadSource[]>([]);
  const [dealTypes, setDealTypes] = useState<CrmDealType[]>([]);
  const [lostReasons, setLostReasons] = useState<CrmLostReason[]>([]);
  const [crmTags, setCrmTags] = useState<CrmTag[]>([]);
  const [customFields, setCustomFields] = useState<CrmCustomField[]>([]);

  // Modals for adding settings
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [sourceForm, setSourceForm] = useState({ name: '', description: '' });

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', color: '#0B2E23' });

  const [isLostReasonModalOpen, setIsLostReasonModalOpen] = useState(false);
  const [lostReasonForm, setLostReasonForm] = useState({ name: '', description: '' });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [pipeRes, srcRes, typeRes, reasonRes, tagRes, customRes] = await Promise.all([
        crmApi.settings.getPipelines().catch(() => []),
        crmApi.settings.getLeadSources().catch(() => []),
        crmApi.settings.getDealTypes().catch(() => []),
        crmApi.settings.getLostReasons().catch(() => []),
        crmApi.settings.getTags().catch(() => []),
        crmApi.settings.getCustomFields().catch(() => []),
      ]);

      setPipelines(Array.isArray(pipeRes) ? pipeRes : Array.isArray((pipeRes as any)?.data) ? (pipeRes as any).data : []);
      setLeadSources(Array.isArray(srcRes) ? srcRes : Array.isArray((srcRes as any)?.data) ? (srcRes as any).data : []);
      setDealTypes(Array.isArray(typeRes) ? typeRes : Array.isArray((typeRes as any)?.data) ? (typeRes as any).data : []);
      setLostReasons(Array.isArray(reasonRes) ? reasonRes : Array.isArray((reasonRes as any)?.data) ? (reasonRes as any).data : []);
      setCrmTags(Array.isArray(tagRes) ? tagRes : Array.isArray((tagRes as any)?.data) ? (tagRes as any).data : []);
      setCustomFields(Array.isArray(customRes) ? customRes : Array.isArray((customRes as any)?.data) ? (customRes as any).data : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleCreateLeadSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crmApi.settings.createLeadSource(sourceForm);
      showToast('Lead Source created.');
      setIsSourceModalOpen(false);
      setSourceForm({ name: '', description: '' });
      void loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to create lead source', 'error');
    }
  };

  const handleDeleteLeadSource = async (id: string) => {
    if (!confirm('Delete this lead source?')) return;
    try {
      await crmApi.settings.deleteLeadSource(id);
      showToast('Lead source removed.');
      void loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete lead source', 'error');
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crmApi.settings.createTag({ ...tagForm, applicableTo: ['LEAD', 'ACCOUNT', 'CONTACT', 'DEAL'] });
      showToast('Tag created.');
      setIsTagModalOpen(false);
      setTagForm({ name: '', color: '#0B2E23' });
      void loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to create tag', 'error');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    try {
      await crmApi.settings.deleteTag(id);
      showToast('Tag removed.');
      void loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete tag', 'error');
    }
  };

  const handleCreateLostReason = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crmApi.settings.createLostReason(lostReasonForm);
      showToast('Lost Reason created.');
      setIsLostReasonModalOpen(false);
      setLostReasonForm({ name: '', description: '' });
      void loadSettings();
    } catch (err: any) {
      showToast(err.message || 'Failed to create lost reason', 'error');
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
        title="Settings"
        subtitle="Configure sales pipelines, stages, lead acquisition channels, lost reasons, and tags."
        breadcrumb={[
          { label: 'CRM & Sales', href: '/dashboard/crm' },
        ]}
        onRefresh={() => void loadSettings()}
        isRefreshing={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales Pipelines & Stages */}
        <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Pipelines & Stages</h3>
            <p className="text-[11px] text-slate-400">Configured agency sales flows and weighted probabilities</p>
          </div>

          <div className="space-y-3.5">
            {pipelines.map((p) => (
              <div key={p.id} className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">{p.name}</h4>
                    {p.isDefault && (
                      <span className="text-[8.5px] font-bold uppercase px-2 py-0.2 rounded-md bg-[#0B2E23] text-[#AEFF48]">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.stages?.map((st) => (
                    <span
                      key={st.id}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#ECE5DA] text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: st.color || '#0B2E23' }}
                      />
                      {st.name} ({st.probability}%)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources, Lost Reasons & Tags */}
        <div className="space-y-5">
          {/* Inbound Lead Sources */}
          <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Lead Acquisition Sources</h3>
                <p className="text-[11px] text-slate-400">Categorized inbound prospect channels</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(true)}
                className="px-3 py-1 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Source</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {leadSources.map((src) => (
                <div
                  key={src.id}
                  className="px-3 py-1 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] text-xs font-bold text-slate-800 flex items-center gap-2 group"
                >
                  <span>{src.name}</span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteLeadSource(src.id)}
                    className="size-4 rounded-full text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lost Reasons */}
          <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Closed Lost Reasons</h3>
                <p className="text-[11px] text-slate-400">Database-driven reasons for deal loss analytics</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLostReasonModalOpen(true)}
                className="px-3 py-1 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Reason</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {lostReasons.map((lr) => (
                <span key={lr.id} className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
                  {lr.name}
                </span>
              ))}
            </div>
          </div>

          {/* CRM Tags */}
          <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">CRM Taxonomy Tags</h3>
                <p className="text-[11px] text-slate-400">Labels across Leads, Accounts, and Deals</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTagModalOpen(true)}
                className="px-3 py-1 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add Tag</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {crmTags.map((tg) => (
                <div
                  key={tg.id}
                  className="px-2.5 py-1 rounded-xl text-white text-[10px] font-bold flex items-center gap-1.5"
                  style={{ backgroundColor: tg.color || '#0B2E23' }}
                >
                  <span>{tg.name}</span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteTag(tg.id)}
                    className="size-3.5 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Lead Source */}
      {isSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900">Add Inbound Lead Source</h3>
            <form onSubmit={handleCreateLeadSource} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LinkedIn Campaign"
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </div>
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSourceModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer"
                >
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Lost Reason */}
      {isLostReasonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900">Add Lost Reason</h3>
            <form onSubmit={handleCreateLostReason} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budget Deficit"
                  value={lostReasonForm.name}
                  onChange={(e) => setLostReasonForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </div>
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLostReasonModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer"
                >
                  Add Reason
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Tag */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900">Add Taxonomy Tag</h3>
            <form onSubmit={handleCreateTag} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tag Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Client"
                  value={tagForm.name}
                  onChange={(e) => setTagForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tag Color</label>
                <input
                  type="color"
                  value={tagForm.color}
                  onChange={(e) => setTagForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-full h-9 p-1 rounded-2xl border border-[#E5E7EB] bg-white cursor-pointer"
                />
              </div>
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
