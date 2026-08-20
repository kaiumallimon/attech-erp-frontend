'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  Printer,
  Download,
  CreditCard,
  Building2,
  Sparkles,
  Layers,
  Percent,
  Calendar,
  X,
  PlusCircle,
  Trash2,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { invoicingApi } from '@/lib/api';
import {
  Invoice,
  InvoicingStats,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentRecord,
} from '@/types/invoicing';
import { HeroSelect } from '@/components/ui/hero-select';
import { useAuth } from '@/context/auth-context';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  [InvoiceStatus.DRAFT]: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  [InvoiceStatus.ISSUED]: {
    label: 'Issued / Pending',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  [InvoiceStatus.PARTIALLY_PAID]: {
    label: 'Partially Paid',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [InvoiceStatus.PAID]: {
    label: 'Settled & Paid',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [InvoiceStatus.OVERDUE]: {
    label: 'Overdue',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  [InvoiceStatus.VOID]: {
    label: 'Voided',
    bg: 'bg-stone-100',
    text: 'text-stone-500',
    border: 'border-stone-200',
    dot: 'bg-stone-400',
  },
};

export default function FinancePage() {
  const { user } = useAuth();

  // State Management
  const [stats, setStats] = useState<InvoicingStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'revisions' | 'installments'>('invoices');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals & Selected Invoice
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceViewerOpen, setIsInvoiceViewerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({
    type: InvoiceType.CONTRACT_MILESTONE,
    isRevision: false,
    clientName: '',
    clientEmail: '',
    billingAddress: '',
    items: [{ description: 'Core Engineering Sprint Milestone', quantity: 1, unitPrice: 15000, amount: 15000 }],
    discount: 0,
    taxRate: 0,
    currency: 'USD',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'Wire transfer to AtTech Solutions banking account.',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: PaymentMethod.STRIPE,
    transactionReference: '',
    notes: '',
  });

  const [installmentsForm, setInstallmentsForm] = useState({
    milestones: [
      { title: 'Initial Project Deposit & Architecture Kickoff', percentage: 50, amount: 12500, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
      { title: 'UAT Sign-off & Final Production Handover', percentage: 50, amount: 12500, dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] },
    ],
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        invoicingApi.getStats().catch(() => null),
        invoicingApi.getInvoices({ limit: 100 }),
      ]);

      if (statsRes) setStats(statsRes);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab === 'revisions' && !inv.isRevision) return false;
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && inv.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchClient = inv.clientName?.toLowerCase().includes(q);
        const matchEmail = inv.clientEmail?.toLowerCase().includes(q);
        if (!matchNum && !matchClient && !matchEmail) return false;
      }
      return true;
    });
  }, [invoices, activeTab, statusFilter, typeFilter, searchQuery]);

  // Handlers
  const handleOpenInvoice = async (inv: Invoice) => {
    try {
      const full = await invoicingApi.getInvoiceById(inv._id);
      setSelectedInvoice(full);
      setIsInvoiceViewerOpen(true);
    } catch (err) {
      console.error('Failed to fetch invoice details:', err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientName || !invoiceForm.clientEmail) {
      alert('Please provide client name and email');
      return;
    }

    setSubmitting(true);
    try {
      await invoicingApi.createInvoice(invoiceForm);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setSubmitting(true);
    try {
      await invoicingApi.recordPayment(selectedInvoice._id, paymentForm);
      setIsPaymentModalOpen(false);
      handleOpenInvoice(selectedInvoice);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendEmail = async (invId: string) => {
    try {
      await invoicingApi.sendInvoiceEmail(invId);
      alert('Invoice dispatched to client email successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to send invoice email');
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#0B251A] tracking-tight">
              Finance & Invoicing Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0B2E23]/10 text-[#0B2E23] border border-[#0B2E23]/20">
              Installments & Revisions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage customizable milestone billing schedules, project revisions, and branded client receipts matching the AtTech portfolio aesthetic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-[#E5E7EB] transition-colors cursor-pointer"
            title="Refresh Invoicing Data"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="size-4 text-[#AEFF48]" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Warm Telemetry Bar (5 Segments) */}
      <div className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Total Invoiced */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Total Invoiced</span>
              <div className="size-8 rounded-2xl bg-[#0B2E23]/10 text-[#0B2E23] flex items-center justify-center">
                <Receipt className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B251A]">
                ${(stats?.totalInvoicedAmount || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">
                {stats?.totalInvoicesCount || 0} Total Invoices
              </span>
            </div>
          </div>

          {/* Cash Collected */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Cash Collected</span>
              <div className="size-8 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">
                ${(stats?.totalCollectedAmount || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-700/80 font-bold">
                {stats?.collectionRate || 0}% Collection Rate
              </span>
            </div>
          </div>

          {/* Outstanding Receivables */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Receivables</span>
              <div className="size-8 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-900">
                ${(stats?.totalReceivablesAmount || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">Pending Settlement</span>
            </div>
          </div>

          {/* Revision Revenue */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Revision Revenue</span>
              <div className="size-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Sparkles className="size-4 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-700">
                ${(stats?.totalRevisionRevenue || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-700/80 font-bold">Isolated Out-of-Scope</span>
            </div>
          </div>

          {/* Overdue */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Overdue Balance</span>
              <div className="size-8 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center">
                <AlertCircle className="size-4 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-red-700">
                ${(stats?.totalOverdueAmount || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-red-600 font-bold">Action Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Controls & View Selector */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-white p-1 rounded-full border border-[#E5E7EB] shadow-2xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'invoices' ? 'bg-[#0B2E23] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revisions')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'revisions' ? 'bg-[#0B2E23] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Project Revision Invoices ({invoices.filter((i) => i.isRevision).length})
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice #, client..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>

          <HeroSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              ...Object.keys(STATUS_CONFIG).map((s) => ({ value: s, label: STATUS_CONFIG[s as InvoiceStatus].label })),
            ]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INVOICES DIRECTORY TABLE                                                  */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAF7F2]">
                <th className="p-4 text-[10px] font-extrabold text-[#877E71] uppercase tracking-wider">Invoice #</th>
                <th className="p-4 text-[10px] font-extrabold text-[#877E71] uppercase tracking-wider">Client & Project</th>
                <th className="p-4 text-[10px] font-extrabold text-[#877E71] uppercase tracking-wider">Classification</th>
                <th className="p-4 text-[10px] font-extrabold text-[#877E71] uppercase tracking-wider">Total / Balance</th>
                <th className="p-4 text-[10px] font-extrabold text-[#877E71] uppercase tracking-wider">Status</th>
                <th className="p-4 text-[10px] font-extrabold text-[#877E71] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/60">
              {filteredInvoices.map((inv) => {
                const config = STATUS_CONFIG[inv.status] || STATUS_CONFIG[InvoiceStatus.DRAFT];

                return (
                  <tr key={inv._id} className="hover:bg-[#FAFAF9] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-[#0B2E23]" />
                        <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Due {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="p-4">
                      <strong className="text-xs text-slate-900 block truncate max-w-[200px]">{inv.clientName}</strong>
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px] block">
                        {typeof inv.projectId === 'object' ? inv.projectId?.name || inv.clientEmail : inv.clientEmail}
                      </span>
                    </td>

                    <td className="p-4">
                      {inv.isRevision ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Revision ({inv.revisionNumber || 'REV'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          Milestone {inv.installmentNumber || 1}/{inv.totalInstallments || 1}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <strong className="text-xs text-slate-900 block">
                          ${(inv.totalAmount || 0).toLocaleString()} {inv.currency}
                        </strong>
                        <span className={`text-[10px] font-bold ${inv.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {inv.balanceDue > 0 ? `$${inv.balanceDue.toLocaleString()} Due` : 'Fully Paid'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${config.bg} ${config.text} ${config.border}`}>
                        <div className={`size-1.5 rounded-full ${config.dot}`} />
                        <span>{config.label}</span>
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(inv)}
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-[#0B2E23] hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          View & Print
                        </button>
                        {inv.status !== InvoiceStatus.PAID && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentForm({
                                amount: inv.balanceDue,
                                method: PaymentMethod.STRIPE,
                                transactionReference: '',
                                notes: '',
                              });
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors cursor-pointer"
                          >
                            + Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                    No invoices found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BRANDED PORTFOLIO-STYLE INVOICE VIEWER                             */}
      {/* ========================================================================= */}
      {isInvoiceViewerOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAF9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0B251A]">Invoice {selectedInvoice.invoiceNumber}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[selectedInvoice.status].bg} ${STATUS_CONFIG[selectedInvoice.status].text} ${STATUS_CONFIG[selectedInvoice.status].border}`}>
                  {STATUS_CONFIG[selectedInvoice.status].label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendEmail(selectedInvoice._id)}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Send className="size-3.5" />
                  <span>Send to Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="size-3.5" />
                  <span>Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoiceViewerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Branded AtTech Invoice Preview Sheet */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Dark Green Brand Header Lockup */}
              <div className="rounded-3xl bg-[#0B2E23] text-white p-6 sm:p-8 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">AtTech Solutions</h2>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#AEFF48] mt-1">
                    Enterprise Engineering & AI Systems
                  </p>
                </div>
                <div className="text-right">
                  <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2">
                    Issued: {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Meta Grid (2x2) */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FAFAF9] border border-[#E5E7EB]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Billed To:</span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedInvoice.clientName}</h4>
                  <p className="text-xs text-slate-500">{selectedInvoice.clientEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Due Date:</span>
                  <h4 className="text-sm font-extrabold text-red-700 mt-0.5">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedInvoice.isRevision ? 'Project Scope Revision' : 'Contract Milestone Installment'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F2] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-3 text-[10px] font-extrabold text-[#877E71] uppercase">Scope Deliverable Description</th>
                      <th className="p-3 text-[10px] font-extrabold text-[#877E71] uppercase text-center">Qty</th>
                      <th className="p-3 text-[10px] font-extrabold text-[#877E71] uppercase text-right">Rate</th>
                      <th className="p-3 text-[10px] font-extrabold text-[#877E71] uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]/60">
                    {(selectedInvoice.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-3 text-xs font-bold text-slate-800">{it.description}</td>
                        <td className="p-3 text-xs text-slate-600 text-center">{it.quantity}</td>
                        <td className="p-3 text-xs text-slate-600 text-right">${it.unitPrice.toLocaleString()}</td>
                        <td className="p-3 text-xs font-extrabold text-slate-900 text-right">${it.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="ml-auto w-72 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span>${(selectedInvoice.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#0B2E23] border-t border-[#0B2E23]/20 pt-2">
                  <span>Total Payable:</span>
                  <span>${(selectedInvoice.totalAmount || 0).toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className={`flex justify-between font-bold pt-1 ${selectedInvoice.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  <span>Balance Due:</span>
                  <span>${(selectedInvoice.balanceDue || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment History Log */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-[#E5E7EB]">
                  <h4 className="text-xs font-extrabold text-[#0B251A] uppercase tracking-wider">
                    Recorded Payment Transactions
                  </h4>
                  <div className="space-y-1.5">
                    {selectedInvoice.payments.map((p) => (
                      <div
                        key={p._id}
                        className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          <div>
                            <span className="font-mono font-bold text-slate-900">{p.paymentNumber}</span>
                            <span className="text-[10px] text-slate-400 block">via {p.method} • {new Date(p.paidAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <strong className="text-emerald-800">+${p.amount.toLocaleString()} {p.currency}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE INVOICE MODAL                                               */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0B251A]">Generate Client Invoice</h3>
                <p className="text-xs text-slate-500">Create an itemized contract milestone or revision fee invoice.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Client / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.clientName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                    placeholder="e.g. Acme Corporation"
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Client Billing Email *</label>
                  <input
                    type="email"
                    required
                    value={invoiceForm.clientEmail}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientEmail: e.target.value })}
                    placeholder="e.g. billing@acme.com"
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Billing Address (Optional)</label>
                <input
                  type="text"
                  value={invoiceForm.billingAddress}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, billingAddress: e.target.value })}
                  placeholder="e.g. 100 Innovation Way, Suite 400, Austin, TX"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              {/* Item Details */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Invoice Deliverable Item</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.items[0]?.description}
                  onChange={(e) => {
                    const next = [...invoiceForm.items];
                    next[0].description = e.target.value;
                    setInvoiceForm({ ...invoiceForm, items: next });
                  }}
                  placeholder="e.g. 50% Milestone 1 Deposit - AI Engine Sprint"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Payable Amount (USD) *</label>
                  <input
                    type="number"
                    required
                    value={invoiceForm.items[0]?.unitPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const next = [...invoiceForm.items];
                      next[0].unitPrice = val;
                      next[0].amount = val;
                      setInvoiceForm({ ...invoiceForm, items: next });
                    }}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD PAYMENT MODAL                                               */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0B251A]">Record Payment</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Amount (USD) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Settlement Method</label>
                <HeroSelect
                  value={paymentForm.method}
                  onChange={(val) => setPaymentForm({ ...paymentForm, method: val as PaymentMethod })}
                  options={[
                    { value: PaymentMethod.STRIPE, label: 'Stripe Online' },
                    { value: PaymentMethod.WIRE_TRANSFER, label: 'Wire / SWIFT Transfer' },
                    { value: PaymentMethod.BANK_DEPOSIT, label: 'Direct Bank Deposit' },
                    { value: PaymentMethod.ACH, label: 'ACH Transfer' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Transaction Reference ID</label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  placeholder="e.g. TX-WIRE-992211"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-1.5 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
