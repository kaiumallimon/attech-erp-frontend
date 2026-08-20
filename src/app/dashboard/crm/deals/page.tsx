'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Eye,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { crmApi, employeesApi } from '../../../../lib/api';
import {
  CrmAccount,
  CrmDeal,
  CrmDealType,
  CrmLostReason,
  CrmPipeline,
  DealStatus,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';
import HeroSelect, { SelectOption } from '../../../../components/ui/hero-select';

export default function CrmDealsPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [dealsViewMode, setDealsViewMode] = useState<'kanban' | 'table'>('kanban');
  const [kanbanData, setKanbanData] = useState<{ pipeline: any; stages: any[]; totalDeals: number; totalPipelineValue: number } | null>(null);

  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dealTypes, setDealTypes] = useState<CrmDealType[]>([]);
  const [lostReasons, setLostReasons] = useState<CrmLostReason[]>([]);

  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<CrmDeal | null>(null);
  const [selectedDealDetail, setSelectedDealDetail] = useState<CrmDeal | null>(null);

  const [dealForm, setDealForm] = useState<{
    name: string;
    description: string;
    accountId: string;
    contactId: string;
    pipelineId: string;
    stageId: string;
    ownerId: string;
    value: number;
    currency: string;
    probability: number;
    expectedCloseDate: string;
    dealTypeId: string;
    status: string;
    tags: string[];
  }>({
    name: '',
    description: '',
    accountId: '',
    contactId: '',
    pipelineId: '',
    stageId: '',
    ownerId: '',
    value: 0,
    currency: 'USD',
    probability: 20,
    expectedCloseDate: '',
    dealTypeId: '',
    status: DealStatus.OPEN,
    tags: [],
  });

  const [isMarkLostModalOpen, setIsMarkLostModalOpen] = useState(false);
  const [targetLostDealId, setTargetLostDealId] = useState<string | null>(null);
  const [lostReasonForm, setLostReasonForm] = useState<{ lostReasonId: string; lostNotes: string }>({
    lostReasonId: '',
    lostNotes: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDeals = async () => {
    setLoading(true);
    try {
      const [tableRes, kanbanRes, pipeRes, accRes, empRes, typeRes, reasonRes] = await Promise.all([
        crmApi.deals.list({ pipelineId: activePipelineId }),
        crmApi.deals.kanban(activePipelineId),
        crmApi.settings.getPipelines().catch(() => []),
        crmApi.accounts.list().catch(() => ({ data: [] })),
        employeesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
        crmApi.settings.getDealTypes().catch(() => []),
        crmApi.settings.getLostReasons().catch(() => []),
      ]);

      setDeals(Array.isArray(tableRes) ? tableRes : Array.isArray(tableRes?.items) ? tableRes.items : Array.isArray(tableRes?.data) ? tableRes.data : []);
      setKanbanData(kanbanRes);

      const pipeList = Array.isArray(pipeRes) ? pipeRes : Array.isArray((pipeRes as any)?.data) ? (pipeRes as any).data : [];
      setPipelines(pipeList);
      if (pipeList.length > 0 && !activePipelineId) {
        const def = pipeList.find((p: any) => p.isDefault) || pipeList[0];
        setActivePipelineId(def.id);
      }

      setAccounts(Array.isArray(accRes) ? accRes : Array.isArray((accRes as any)?.items) ? (accRes as any).items : Array.isArray((accRes as any)?.data) ? (accRes as any).data : []);

      const empList = Array.isArray(empRes) ? empRes : Array.isArray((empRes as any)?.data) ? (empRes as any).data : [];
      setEmployees(empList);

      setDealTypes(Array.isArray(typeRes) ? typeRes : Array.isArray((typeRes as any)?.data) ? (typeRes as any).data : []);
      setLostReasons(Array.isArray(reasonRes) ? reasonRes : Array.isArray((reasonRes as any)?.data) ? (reasonRes as any).data : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load deals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeals();
  }, [activePipelineId]);

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

  const pipelineOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(pipelines) ? pipelines : [];
    return list.map((p) => ({
      key: p.id,
      value: p.id,
      label: p.isDefault ? `${p.name} (Default)` : p.name,
    }));
  }, [pipelines]);

  const currentPipelineStages = useMemo(() => {
    const list = Array.isArray(pipelines) ? pipelines : [];
    const p = list.find((pipe) => pipe.id === (dealForm.pipelineId || activePipelineId));
    return Array.isArray(p?.stages) ? p.stages : [];
  }, [pipelines, dealForm.pipelineId, activePipelineId]);

  const stageOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(currentPipelineStages) ? currentPipelineStages : [];
    return list.map((s) => ({
      key: s.id,
      value: s.id,
      label: `${s.name} (${s.probability}%)`,
    }));
  }, [currentPipelineStages]);

  const accountSelectOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    return [
      { key: '', value: '', label: 'Select Client Account' },
      ...list.map((a) => ({ key: a.id, value: a.id, label: a.name })),
    ];
  }, [accounts]);

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDeal) {
        await crmApi.deals.update(editingDeal.id, dealForm);
        showToast('Deal updated successfully.');
      } else {
        await crmApi.deals.create(dealForm);
        showToast('New Deal created successfully.');
      }
      setIsDealModalOpen(false);
      setEditingDeal(null);
      void loadDeals();
    } catch (err: any) {
      showToast(err.message || 'Failed to save deal', 'error');
    }
  };

  const handleMoveDealStage = async (dealId: string, targetStageId: string) => {
    try {
      await crmApi.deals.updateStage(dealId, { stageId: targetStageId });
      showToast('Deal stage updated.');
      void loadDeals();
    } catch (err: any) {
      showToast(err.message || 'Failed to move deal', 'error');
    }
  };

  const handleMarkWon = async (dealId: string) => {
    try {
      await crmApi.deals.markWon(dealId);
      showToast('🎉 Congratulations! Deal marked as WON.');
      void loadDeals();
    } catch (err: any) {
      showToast(err.message || 'Failed to mark deal as won', 'error');
    }
  };

  const handleOpenMarkLost = (dealId: string) => {
    setTargetLostDealId(dealId);
    setLostReasonForm({ lostReasonId: lostReasons[0]?.id || '', lostNotes: '' });
    setIsMarkLostModalOpen(true);
  };

  const handleExecuteMarkLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLostDealId) return;
    try {
      await crmApi.deals.markLost(targetLostDealId, lostReasonForm);
      showToast('Deal marked as Closed Lost.');
      setIsMarkLostModalOpen(false);
      setTargetLostDealId(null);
      void loadDeals();
    } catch (err: any) {
      showToast(err.message || 'Failed to mark deal as lost', 'error');
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
        title="Sales Pipeline & Deals"
        subtitle="Visual drag-and-drop Kanban opportunity stages, deal velocity, probability scoring, and won revenue."
        onRefresh={() => void loadDeals()}
        isRefreshing={loading}
        actionButton={
          <button
            type="button"
            onClick={() => {
              setEditingDeal(null);
              setDealForm({
                name: '',
                description: '',
                accountId: accounts[0]?.id || '',
                contactId: '',
                pipelineId: activePipelineId,
                stageId: currentPipelineStages[0]?.id || '',
                ownerId: employees[0]?.id || '',
                value: 30000,
                currency: 'USD',
                probability: 20,
                expectedCloseDate: '',
                dealTypeId: dealTypes[0]?.id || '',
                status: DealStatus.OPEN,
                tags: [],
              });
              setIsDealModalOpen(true);
            }}
            className="h-10 px-5 rounded-full bg-[#AEFF48] text-[#0B2E23] font-bold text-xs hover:bg-[#9DE83E] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="size-4" />
            <span>Create Deal</span>
          </button>
        }
      />

      {/* Pipeline Toolbar */}
      <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Pipeline:</span>
          <select
            value={activePipelineId}
            onChange={(e) => setActivePipelineId(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#E5E7EB] text-xs font-bold text-slate-900 bg-white"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-[#FAF7F2] p-1 rounded-full border border-[#ECE5DA]">
            <button
              type="button"
              onClick={() => setDealsViewMode('kanban')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                dealsViewMode === 'kanban'
                  ? 'bg-[#0B2E23] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kanban Board
            </button>
            <button
              type="button"
              onClick={() => setDealsViewMode('table')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                dealsViewMode === 'table'
                  ? 'bg-[#0B2E23] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Total Value: <span className="font-extrabold text-[#0B2E23]">${(kanbanData?.totalPipelineValue || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Kanban Board View */}
      {dealsViewMode === 'kanban' && kanbanData && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[600px]">
          {kanbanData.stages.map((stage) => (
            <div
              key={stage.id}
              className="w-80 shrink-0 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] p-3.5 space-y-3 flex flex-col max-h-[750px]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DA]">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: stage.color || '#0B2E23' }}
                  />
                  <h4 className="text-xs font-black text-slate-900">{stage.name}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-[#ECE5DA]">
                  {stage.count}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
                <span>{stage.probability}% Probability</span>
                <span>${stage.totalValue.toLocaleString()}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stage.deals.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-slate-400 italic">No deals in this stage</div>
                ) : (
                  stage.deals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#0B2E23]/30 transition-all space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{deal.name}</h5>
                        <span className="text-xs font-black text-[#0B2E23] shrink-0">
                          ${deal.value.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span className="truncate">{deal.accountId?.name || 'Prospect Client'}</span>
                        {deal.expectedCloseDate && (
                          <span className="text-[10px] text-slate-400">
                            Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {kanbanData.stages
                            .filter((s) => s.id !== stage.id)
                            .slice(0, 2)
                            .map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => void handleMoveDealStage(deal.id, s.id)}
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-[#0B2E23] hover:text-[#AEFF48] text-slate-600 text-[9px] font-bold transition-colors cursor-pointer"
                                title={`Move to ${s.name}`}
                              >
                                $\to$ {s.name.split(' ')[0]}
                              </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMarkWon(deal.id)}
                            className="size-6 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                            title="Mark as WON"
                          >
                            $\checkmark$
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenMarkLost(deal.id)}
                            className="size-6 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                            title="Mark as LOST"
                          >
                            $\times$
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const full = await crmApi.deals.get(deal.id);
                              setSelectedDealDetail(full);
                            }}
                            className="size-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                            title="View Deal History & Proposals"
                          >
                            <Eye className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {dealsViewMode === 'table' && (
        <div className="rounded-4xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E5E7EB] text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Deal Name</th>
                  <th className="py-3.5 px-4">Client Account</th>
                  <th className="py-3.5 px-4">Value</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                      No deals found. Click &quot;Create Deal&quot; to add an opportunity.
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{deal.name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{deal.accountId?.name || '—'}</td>
                      <td className="py-3.5 px-4 font-black text-[#0B2E23]">
                        ${deal.value.toLocaleString()} {deal.currency}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        <span
                          className="inline-block size-2 rounded-full mr-1.5"
                          style={{ backgroundColor: deal.stageId?.color || '#0B2E23' }}
                        />
                        {deal.stageId?.name} ({deal.probability}%)
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            deal.status === 'WON'
                              ? 'bg-emerald-100 text-emerald-800'
                              : deal.status === 'LOST'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {deal.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {deal.ownerId?.userId
                          ? `${deal.ownerId.userId.firstName} ${deal.ownerId.userId.lastName}`
                          : 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={async () => {
                            const full = await crmApi.deals.get(deal.id);
                            setSelectedDealDetail(full);
                          }}
                          className="px-3 py-1 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] hover:bg-[#0B251A] cursor-pointer transition-colors"
                        >
                          Overview
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Delete deal ${deal.name}?`)) {
                              await crmApi.deals.delete(deal.id);
                              showToast('Deal deleted.');
                              void loadDeals();
                            }
                          }}
                          className="size-7 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 inline-flex items-center justify-center cursor-pointer transition-colors"
                          title="Delete Deal"
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
      )}

      {/* Modal: Add/Edit Deal */}
      {isDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-6 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">{editingDeal ? 'Edit Deal' : 'New Sales Opportunity'}</h3>
                <p className="text-xs text-white/70">Configure deal value, stages, and customer linkage</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDealModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Mobile Banking Platform"
                  value={dealForm.name}
                  onChange={(e) => setDealForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Account *</label>
                  <HeroSelect
                    value={dealForm.accountId}
                    options={accountSelectOptions}
                    onChange={(val) => setDealForm((prev) => ({ ...prev, accountId: val }))}
                    className="w-full h-10 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deal Value ($) *</label>
                  <input
                    type="number"
                    required
                    value={dealForm.value}
                    onChange={(e) => setDealForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs font-black text-[#0B2E23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Pipeline *</label>
                  <HeroSelect
                    value={dealForm.pipelineId}
                    options={pipelineOptions}
                    onChange={(val) => setDealForm((prev) => ({ ...prev, pipelineId: val }))}
                    className="w-full h-10 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pipeline Stage *</label>
                  <HeroSelect
                    value={dealForm.stageId}
                    options={stageOptions}
                    onChange={(val) => setDealForm((prev) => ({ ...prev, stageId: val }))}
                    className="w-full h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deal Owner (Employee)</label>
                  <HeroSelect
                    value={dealForm.ownerId}
                    options={employeeOptions}
                    onChange={(val) => setDealForm((prev) => ({ ...prev, ownerId: val }))}
                    className="w-full h-10 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={dealForm.expectedCloseDate}
                    onChange={(e) => setDealForm((prev) => ({ ...prev, expectedCloseDate: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opportunity Scope Description</label>
                <textarea
                  rows={3}
                  value={dealForm.description}
                  onChange={(e) => setDealForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Deliverables, technology stack, timeline constraints..."
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  {editingDeal ? 'Save Changes' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Deal Lost */}
      {isMarkLostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] p-6 space-y-4 text-xs">
            <h3 className="text-sm font-black text-rose-900">Mark Opportunity as Closed Lost</h3>
            <p className="text-slate-500">Document lost reason to optimize pipeline conversion analytics.</p>

            <form onSubmit={handleExecuteMarkLost} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Loss</label>
                <select
                  value={lostReasonForm.lostReasonId}
                  onChange={(e) => setLostReasonForm((prev) => ({ ...prev, lostReasonId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  {lostReasons.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Feedback & Notes</label>
                <textarea
                  rows={3}
                  value={lostReasonForm.lostNotes}
                  onChange={(e) => setLostReasonForm((prev) => ({ ...prev, lostNotes: e.target.value }))}
                  placeholder="Competitor chosen, budget deficit details..."
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMarkLostModalOpen(false)}
                  className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-rose-800 text-white font-bold hover:bg-rose-900 cursor-pointer"
                >
                  Confirm Closed Lost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
