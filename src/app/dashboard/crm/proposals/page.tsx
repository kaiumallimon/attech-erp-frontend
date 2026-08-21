'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { crmApi } from '../../../../lib/api';
import {
  CrmDeal,
  CrmProposal,
  CrmProposalItem,
  ProposalStatus,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';
import HeroSelect, { SelectOption } from '../../../../components/ui/hero-select';

export default function CrmProposalsPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [proposals, setProposals] = useState<CrmProposal[]>([]);
  const [proposalsSearch, setProposalsSearch] = useState('');
  const [deals, setDeals] = useState<CrmDeal[]>([]);

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<CrmProposal | null>(null);

  const [proposalForm, setProposalForm] = useState<{
    dealId: string;
    title: string;
    validUntil: string;
    terms: string;
    notes: string;
    items: CrmProposalItem[];
  }>({
    dealId: '',
    title: '',
    validUntil: '',
    terms: 'Payment schedule: 30% advance on signing, 40% on milestone testing, 30% upon production deployment.',
    notes: '',
    items: [{ name: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0, total: 0 }],
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProposals = async () => {
    setLoading(true);
    try {
      const [propRes, dealRes] = await Promise.all([
        crmApi.proposals.list({ search: proposalsSearch }),
        crmApi.deals.list().catch(() => ({ data: [] })),
      ]);

      setProposals(Array.isArray(propRes) ? propRes : Array.isArray(propRes?.items) ? propRes.items : Array.isArray(propRes?.data) ? propRes.data : []);
      setDeals(Array.isArray(dealRes) ? dealRes : Array.isArray((dealRes as any)?.items) ? (dealRes as any).items : Array.isArray((dealRes as any)?.data) ? (dealRes as any).data : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load proposals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProposals();
  }, []);

  const dealSelectOptions: SelectOption[] = useMemo(() => {
    const list = Array.isArray(deals) ? deals : [];
    return [
      { key: '', value: '', label: 'Select Deal' },
      ...list.map((d) => ({
        key: d.id,
        value: d.id,
        label: `${d.name} ($${d.value.toLocaleString()})`,
      })),
    ];
  }, [deals]);

  const calculateProposalTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    proposalForm.items.forEach((item) => {
      const gross = (item.quantity || 0) * (item.unitPrice || 0);
      const discount = item.discount || 0;
      const tax = item.tax || 0;
      subtotal += gross;
      totalDiscount += discount;
      totalTax += tax;
    });

    const finalTotal = Math.max(0, subtotal - totalDiscount + totalTax);
    return { subtotal, totalDiscount, totalTax, finalTotal };
  }, [proposalForm.items]);

  const handleAddProposalItem = () => {
    setProposalForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: '', description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0, total: 0 },
      ],
    }));
  };

  const handleRemoveProposalItem = (index: number) => {
    setProposalForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleProposalItemChange = (index: number, field: keyof CrmProposalItem, value: any) => {
    setProposalForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      const qty = items[index].quantity || 0;
      const unit = items[index].unitPrice || 0;
      const disc = items[index].discount || 0;
      const tx = items[index].tax || 0;
      items[index].total = Math.max(0, qty * unit - disc + tx);
      return { ...prev, items };
    });
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crmApi.proposals.create(proposalForm);
      showToast('Proposal generated successfully.');
      setIsProposalModalOpen(false);
      void loadProposals();
    } catch (err: any) {
      showToast(err.message || 'Failed to create proposal', 'error');
    }
  };

  const handleUpdateProposalStatus = async (proposalId: string, status: string) => {
    try {
      await crmApi.proposals.updateStatus(proposalId, status);
      showToast(`Proposal marked as ${status}.`);
      void loadProposals();
      if (selectedProposalDetail?.id === proposalId) {
        const updated = await crmApi.proposals.get(proposalId);
        setSelectedProposalDetail(updated);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
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
        title="Proposals"
        subtitle="Quotation proposals, line-item scopes, payment terms, and client approvals."
        breadcrumb={[
          { label: 'CRM & Sales', href: '/dashboard/crm' },
        ]}
        onRefresh={() => void loadProposals()}
        isRefreshing={loading}
        actionButton={
          <button
            type="button"
            onClick={() => {
              setProposalForm({
                dealId: deals[0]?.id || '',
                title: 'New Service Proposal v1',
                validUntil: '',
                terms: 'Standard milestone payment schedule: 30% upfront, 40% beta testing, 30% deployment.',
                notes: '',
                items: [
                  { name: 'Core Software Development', description: 'Next.js frontend, NestJS backend API', quantity: 1, unitPrice: 25000, discount: 0, tax: 0, total: 25000 },
                ],
              });
              setIsProposalModalOpen(true);
            }}
            className="h-9 px-4 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-xs hover:bg-[#0B251A] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Generate Proposal</span>
          </button>
        }
      />

      {/* Search Toolbar */}
      <div className="p-3.5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search proposals by title or terms..."
            value={proposalsSearch}
            onChange={(e) => setProposalsSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void loadProposals()}
            className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E5E7EB] text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
          />
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-slate-400 bg-white rounded-4xl border border-[#E5E7EB]">
            No proposals generated yet. Click &quot;Generate Proposal&quot; to create quotation documents.
          </div>
        ) : (
          proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      v{prop.version} • {prop.dealId?.name || 'Deal'}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{prop.title}</h4>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      prop.status === 'ACCEPTED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : prop.status === 'SENT'
                        ? 'bg-sky-100 text-sky-800'
                        : prop.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {prop.status}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500">
                  <p>Account: {prop.dealId?.accountId?.name || 'Prospect Client'}</p>
                  {prop.validUntil && (
                    <p>Valid until: {new Date(prop.validUntil).toLocaleDateString()}</p>
                  )}
                </div>

                {/* Line Items Preview */}
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {prop.items?.length || 0} Scope Deliverables
                  </p>
                  {prop.items?.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate">{item.name}</span>
                      <span className="shrink-0 ml-2 font-bold">${item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Total Value</p>
                  <p className="text-base font-black text-[#0B2E23]">
                    ${prop.total.toLocaleString()} {prop.currency}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {prop.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => void handleUpdateProposalStatus(prop.id, ProposalStatus.SENT)}
                      className="px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Mark Sent
                    </button>
                  )}
                  {prop.status === 'SENT' && (
                    <button
                      type="button"
                      onClick={() => void handleUpdateProposalStatus(prop.id, ProposalStatus.ACCEPTED)}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[10px] cursor-pointer transition-colors"
                    >
                      Accept
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const full = await crmApi.proposals.get(prop.id);
                      setSelectedProposalDetail(full);
                    }}
                    className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                    title="View Document"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Proposal Builder */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-5 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">Generate Proposal</h3>
                <p className="text-[11px] text-white/70">Calculates line items, deliverable scopes, and payment terms</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveProposal} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Deal *</label>
                  <HeroSelect
                    value={proposalForm.dealId}
                    options={dealSelectOptions}
                    onChange={(val) => setProposalForm((prev) => ({ ...prev, dealId: val }))}
                    className="w-full h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proposal Title *</label>
                  <input
                    type="text"
                    required
                    value={proposalForm.title}
                    onChange={(e) => setProposalForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Deliverables & Line Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddProposalItem}
                    className="px-3 py-1 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {proposalForm.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Deliverable Name (e.g. Core API Backend)"
                          value={item.name}
                          onChange={(e) => handleProposalItemChange(index, 'name', e.target.value)}
                          className="flex-1 h-8 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-slate-800"
                        />
                        {proposalForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProposalItem(index)}
                            className="size-7 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleProposalItemChange(index, 'quantity', Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Unit Price ($)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleProposalItemChange(index, 'unitPrice', Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Discount ($)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => handleProposalItemChange(index, 'discount', Number(e.target.value))}
                            className="w-full h-8 px-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Total</label>
                          <div className="h-8 px-2.5 rounded-xl bg-white border border-[#E5E7EB] flex items-center font-black text-[#0B2E23]">
                            ${item.total.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-4 rounded-3xl bg-[#0B2E23] text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-white/70">Proposal Net Value</p>
                  <p className="text-xl font-black text-[#AEFF48]">
                    ${calculateProposalTotals.finalTotal.toLocaleString()} USD
                  </p>
                </div>
                <div className="text-right text-[11px] text-white/70">
                  <p>Subtotal: ${calculateProposalTotals.subtotal.toLocaleString()}</p>
                  {calculateProposalTotals.totalDiscount > 0 && (
                    <p className="text-amber-300">Discount: -${calculateProposalTotals.totalDiscount.toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contract & Payment Terms</label>
                <textarea
                  rows={2}
                  value={proposalForm.terms}
                  onChange={(e) => setProposalForm((prev) => ({ ...prev, terms: e.target.value }))}
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  Create Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Proposal Viewer */}
      {selectedProposalDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end animate-fadeIn">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-[#E5E7EB] overflow-y-auto p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Proposal v{selectedProposalDetail.version}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-0.5">{selectedProposalDetail.title}</h3>
                  <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {selectedProposalDetail.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProposalDetail(null)}
                  className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Line Items & Scope</h4>
                <div className="space-y-2">
                  {selectedProposalDetail.items?.map((it, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-1">
                      <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                        <span>{it.name}</span>
                        <span>${it.total.toLocaleString()}</span>
                      </div>
                      {it.description && <p className="text-[11px] text-slate-500">{it.description}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-4 rounded-3xl bg-[#0B2E23] text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/70">Grand Total</p>
                  <p className="text-xl font-black text-[#AEFF48]">${selectedProposalDetail.total.toLocaleString()} USD</p>
                </div>
              </div>

              {selectedProposalDetail.terms && (
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">Terms & Conditions</p>
                  <p className="text-[11px] leading-relaxed">{selectedProposalDetail.terms}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSelectedProposalDetail(null)}
                className="w-full h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
