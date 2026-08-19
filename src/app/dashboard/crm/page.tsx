'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  Mail,
  User,
  RefreshCw,
  Download,
  X,
  FileText,
  Copy,
  Check,
  Send,
  Zap,
  MessageSquare,
  PhoneCall,
  Sparkles,
  Clock,
  ArrowRight,
  History,
} from 'lucide-react';
import { Card } from '@heroui/react';
import {
  CrmLead,
  CrmClient,
  CrmActivity,
  CrmProposal,
  CrmStats,
  LeadStage,
  LeadSource,
  LeadPriority,
  BudgetRange,
  ClientTier,
  CrmActivityType,
} from '../../../types/crm';
import { crmApi } from '../../../lib/api';
import { HeroSelect } from '../../../components/ui/hero-select';

const STAGE_CONFIG: Record<
  LeadStage,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  [LeadStage.NEW_INQUIRY]: {
    label: 'New Inbound',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    desc: 'Unreviewed inbound portfolio briefs',
  },
  [LeadStage.DISCOVERY_SCHEDULED]: {
    label: 'Discovery Booked',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    desc: 'Cal.com scoping session confirmed',
  },
  [LeadStage.QUALIFIED]: {
    label: 'Qualified',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    desc: 'Budget & requirements validated',
  },
  [LeadStage.PROPOSAL_SENT]: {
    label: 'Proposal Sent',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    desc: 'Itemized quotation issued',
  },
  [LeadStage.NEGOTIATION]: {
    label: 'Negotiation',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    desc: 'Contract & terms review',
  },
  [LeadStage.WON]: {
    label: 'Won & Onboarded',
    bg: 'bg-[#EEF5E8]',
    text: 'text-[#0B2E23]',
    border: 'border-[#D8EAD0]',
    desc: 'Official converted client account',
  },
  [LeadStage.LOST]: {
    label: 'Closed Lost',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    desc: 'Archived or non-responsive',
  },
  [LeadStage.NURTURING]: {
    label: 'Nurturing',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    desc: 'Future follow-up queue',
  },
};

const KANBAN_STAGES = [
  LeadStage.NEW_INQUIRY,
  LeadStage.DISCOVERY_SCHEDULED,
  LeadStage.QUALIFIED,
  LeadStage.PROPOSAL_SENT,
  LeadStage.NEGOTIATION,
  LeadStage.WON,
];

const ATTECH_SERVICES = [
  'Cloud Infrastructure',
  '30-Day AI & Automation Sprint',
  'AI & Machine Learning',
  'Full-Stack Development Sprint',
  'Web & Mobile Dev',
  'Cybersecurity',
  'Data & Business Intelligence',
  'Workflow Automation',
  'UI/UX Design',
  'Visual Identity & Graphics Sprint',
  'Connected E-Commerce & ERP Sprint',
];

const BUDGET_OPTIONS = [
  { value: BudgetRange.UNDER_5K, label: 'Under $5,000' },
  { value: BudgetRange.FIVE_TO_15K, label: '$5,000 – $15,000' },
  { value: BudgetRange.FIFTEEN_TO_50K, label: '$15,000 – $50,000' },
  { value: BudgetRange.FIFTY_PLUS, label: '$50,000+' },
  { value: BudgetRange.UNSPECIFIED, label: 'Not sure yet' },
];

const getActivityConfig = (type: CrmActivityType | string) => {
  switch (type) {
    case CrmActivityType.SYSTEM_EVENT:
      return {
        icon: Zap,
        dotBg: 'bg-purple-600',
        ringColor: 'ring-purple-100',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        label: 'System Ingestion',
      };
    case CrmActivityType.NOTE:
      return {
        icon: MessageSquare,
        dotBg: 'bg-[#0B2E23]',
        ringColor: 'ring-[#0B2E23]/15',
        badgeBg: 'bg-[#EEF5E8] text-[#0B2E23] border-[#D8EAD0]',
        label: 'Sales Note',
      };
    case CrmActivityType.STAGE_CHANGE:
      return {
        icon: TrendingUp,
        dotBg: 'bg-amber-500',
        ringColor: 'ring-amber-100',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        label: 'Pipeline Stage Move',
      };
    case CrmActivityType.CALL:
      return {
        icon: PhoneCall,
        dotBg: 'bg-emerald-600',
        ringColor: 'ring-emerald-100',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Call Log',
      };
    case CrmActivityType.MEETING:
      return {
        icon: Calendar,
        dotBg: 'bg-indigo-600',
        ringColor: 'ring-indigo-100',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        label: 'Scoping Session',
      };
    case CrmActivityType.EMAIL:
      return {
        icon: Mail,
        dotBg: 'bg-sky-500',
        ringColor: 'ring-sky-100',
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        label: 'Email Sent',
      };
    case CrmActivityType.PROPOSAL:
      return {
        icon: FileText,
        dotBg: 'bg-violet-600',
        ringColor: 'ring-violet-100',
        badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
        label: 'Proposal Issued',
      };
    case CrmActivityType.CONVERTED:
      return {
        icon: CheckCircle2,
        dotBg: 'bg-[#0B2E23]',
        ringColor: 'ring-[#AEFF48]/40',
        badgeBg: 'bg-[#0B2E23] text-[#AEFF48] border-[#0B2E23]',
        label: 'Client Account Converted',
      };
    default:
      return {
        icon: Clock,
        dotBg: 'bg-slate-600',
        ringColor: 'ring-slate-100',
        badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
        label: 'Activity',
      };
  }
};

export default function CrmPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'directory' | 'clients' | 'api'>('kanban');
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);

  // Leads
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [budgetFilter, setBudgetFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Clients
  const [clients, setClients] = useState<CrmClient[]>([]);

  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState<(CrmLead & { activities?: CrmActivity[]; proposals?: CrmProposal[] }) | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    location: '',
    service: '30-Day AI & Automation Sprint',
    budgetRange: BudgetRange.FIFTEEN_TO_50K,
    description: '',
    estimatedValue: 25000,
    priority: LeadPriority.HIGH,
  });

  const [convertForm, setConvertForm] = useState({
    companyName: '',
    industry: 'Technology & Cloud Solutions',
    tier: ClientTier.GROWTH,
    initialContractValue: 25000,
    billingEmail: '',
  });

  const [proposalForm, setProposalForm] = useState({
    title: 'Enterprise Architecture & 30-Day AI Sprint Proposal',
    serviceName: '30-Day AI & Automation Sprint',
    quantity: 1,
    unitPrice: 25000,
    discount: 0,
    terms: '50% initial milestone upon signing, 50% upon deployment & UAT handover.',
  });

  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState<CrmActivityType>(CrmActivityType.NOTE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedApiKeySnippet, setCopiedApiKeySnippet] = useState(false);

  // Fetch Telemetry Stats
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const data = await crmApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load CRM stats', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    try {
      const res = await crmApi.getLeads({
        search: searchQuery || undefined,
        service: serviceFilter,
        budgetRange: budgetFilter,
        priority: priorityFilter,
        limit: 100,
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
      setLeads(list);
    } catch (err) {
      console.error('Failed to load leads', err);
      setLeads([]);
    }
  }, [searchQuery, serviceFilter, budgetFilter, priorityFilter]);

  // Fetch Clients
  const fetchClients = useCallback(async () => {
    try {
      const res = await crmApi.getClients({ limit: 50 });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
      setClients(list);
    } catch (err) {
      console.error('Failed to load clients', err);
      setClients([]);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLeads();
  }, [fetchStats, fetchLeads]);

  useEffect(() => {
    if (activeTab === 'clients') {
      fetchClients();
    }
  }, [activeTab, fetchClients]);

  // Open Lead Details
  const handleOpenLeadDetail = async (leadId: string) => {
    try {
      setIsDetailDrawerOpen(true);
      const data = await crmApi.getLeadById(leadId);
      setSelectedLead(data);
    } catch (err) {
      console.error('Failed to load lead details', err);
    }
  };

  // Stage Transition
  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      await crmApi.updateLeadStage(leadId, newStage);
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, status: newStage } : l))
      );
      fetchStats();
      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, status: newStage } : null));
      }
    } catch (err) {
      console.error('Failed to update stage', err);
    }
  };

  // Create Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await crmApi.createLead(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        email: '',
        company: '',
        phone: '',
        location: '',
        service: '30-Day AI & Automation Sprint',
        budgetRange: BudgetRange.FIFTEEN_TO_50K,
        description: '',
        estimatedValue: 25000,
        priority: LeadPriority.HIGH,
      });
      fetchLeads();
      fetchStats();
    } catch (err) {
      console.error('Failed to create lead', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Activity Note
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activityNote.trim()) return;
    try {
      setIsSubmitting(true);
      const titleMap: Record<string, string> = {
        [CrmActivityType.NOTE]: 'Internal Team Note',
        [CrmActivityType.CALL]: 'Phone / WhatsApp Discussion',
        [CrmActivityType.MEETING]: 'Discovery & Architecture Meeting',
        [CrmActivityType.EMAIL]: 'Client Email Correspondence',
      };
      const activity = await crmApi.logActivity(selectedLead._id, {
        type: activityType,
        title: titleMap[activityType] || 'Activity Logged',
        content: activityNote.trim(),
      });
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              activities: [activity, ...(prev.activities || [])],
            }
          : null
      );
      setActivityNote('');
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert to Client
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setIsSubmitting(true);
      const res = await crmApi.convertLeadToClient(selectedLead._id, convertForm);
      setIsConvertModalOpen(false);
      setSelectedLead((prev) => (prev ? { ...prev, status: LeadStage.WON, convertedClientId: res.client._id } : null));
      fetchLeads();
      fetchStats();
      fetchClients();
    } catch (err) {
      console.error('Failed to convert lead', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setIsSubmitting(true);
      await crmApi.createProposal({
        leadId: selectedLead._id,
        title: proposalForm.title,
        clientName: selectedLead.name,
        clientEmail: selectedLead.email,
        items: [
          {
            serviceName: proposalForm.serviceName,
            quantity: proposalForm.quantity,
            unitPrice: proposalForm.unitPrice,
            amount: proposalForm.quantity * proposalForm.unitPrice,
          },
        ],
        discount: proposalForm.discount,
        termsAndConditions: proposalForm.terms,
      });
      setIsProposalModalOpen(false);
      const freshData = await crmApi.getLeadById(selectedLead._id);
      setSelectedLead(freshData);
      fetchLeads();
      fetchStats();
    } catch (err) {
      console.error('Failed to create proposal', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!leads.length) return;
    const headers = ['Name', 'Email', 'Company', 'Service', 'Budget', 'Stage', 'Priority', 'Score', 'Value ($)', 'Source', 'Created At'];
    const rows = leads.map((l) => [
      `"${l.name}"`,
      `"${l.email}"`,
      `"${l.company || ''}"`,
      `"${l.service}"`,
      `"${l.budgetRange || ''}"`,
      `"${l.status}"`,
      `"${l.priority}"`,
      l.score || 50,
      l.estimatedValue || 0,
      `"${l.source}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AtTech_CRM_Pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kanban Columns Mapping
  const kanbanColumns = useMemo(() => {
    const map: Record<LeadStage, CrmLead[]> = {
      [LeadStage.NEW_INQUIRY]: [],
      [LeadStage.DISCOVERY_SCHEDULED]: [],
      [LeadStage.QUALIFIED]: [],
      [LeadStage.PROPOSAL_SENT]: [],
      [LeadStage.NEGOTIATION]: [],
      [LeadStage.WON]: [],
      [LeadStage.LOST]: [],
      [LeadStage.NURTURING]: [],
    };

    const leadList = Array.isArray(leads) ? leads : [];
    leadList.forEach((lead) => {
      if (lead && lead.status && map[lead.status]) {
        map[lead.status].push(lead);
      }
    });

    return map;
  }, [leads]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Header Lockup & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B251A] tracking-tight">
              CRM & Sales Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0B2E23]/10 text-[#0B2E23] text-xs font-bold border border-[#0B2E23]/20">
              Agency Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Inbound briefs, Cal.com scoping sessions, deal velocity, client accounts, and proposals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchLeads();
            }}
            className="p-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Pipeline"
          >
            <RefreshCw className="size-4 text-slate-600" />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="size-3.5 text-[#AEFF48]" />
            <span>+ Create Lead</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Warm Telemetry Card (5 Segments) */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Stat 1: Total Pipeline Value */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Pipeline Value</span>
              <div className="p-2 rounded-2xl bg-[#EEF5E8] text-[#3D7028] shadow-2xs">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#0B2E23]">
                {isStatsLoading ? '...' : `$${(stats?.totalPipelineValue || 0).toLocaleString()}`}
              </p>
              <p className="text-[10px] text-[#3D7028] font-bold mt-0.5">Active Opportunities</p>
            </div>
          </div>

          {/* Stat 2: Active Inquiries */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Active Inquiries</span>
              <div className="p-2 rounded-2xl bg-[#F7EFE6] text-[#B85D19] shadow-2xs">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : stats?.activeLeadsCount || 0}
              </p>
              <p className="text-[10px] text-[#877E71] font-medium mt-0.5">In Pipeline</p>
            </div>
          </div>

          {/* Stat 3: Scoping Calls */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Scoping Calls</span>
              <div className="p-2 rounded-2xl bg-[#F5EEF7] text-[#7E3D8E] shadow-2xs">
                <Calendar className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : stats?.scopingCallsBooked || 0}
              </p>
              <p className="text-[10px] text-[#7E3D8E] font-bold mt-0.5">Cal.com Scheduled</p>
            </div>
          </div>

          {/* Stat 4: Win Rate */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Win Rate</span>
              <div className="p-2 rounded-2xl bg-[#FDF4E2] text-[#B57C1E] shadow-2xs">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : `${stats?.winConversionRate || 0}%`}
              </p>
              <p className="text-[10px] text-[#B57C1E] font-bold mt-0.5">{stats?.wonDealsCount || 0} Deals Won</p>
            </div>
          </div>

          {/* Stat 5: Active Client Retainers */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Client Accounts</span>
              <div className="p-2 rounded-2xl bg-[#E8F0F7] text-[#2C6E9E] shadow-2xs">
                <Building2 className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">
                {isStatsLoading ? '...' : stats?.activeClientsCount || 0}
              </p>
              <p className="text-[10px] text-[#2C6E9E] font-bold mt-0.5">Active Organizations</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Tab Switchers & Search Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-white p-1 rounded-full border border-[#E5E7EB] shadow-2xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'kanban'
                ? 'bg-[#0B2E23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pipeline Kanban ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-[#0B2E23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leads Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-[#0B2E23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Client Accounts ({clients.length || stats?.activeClientsCount || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-[#0B2E23] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portfolio API Guide
          </button>
        </div>

        {/* Search & Multi-Filters (Visible on Kanban & Directory) */}
        {(activeTab === 'kanban' || activeTab === 'directory') && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, briefs..."
                className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
              />
            </div>

            <HeroSelect
              value={serviceFilter}
              onChange={(val) => setServiceFilter(val)}
              options={[{ value: 'ALL', label: 'All Services' }, ...ATTECH_SERVICES.map((s) => ({ value: s, label: s }))]}
              className="min-w-[160px]"
            />

            <HeroSelect
              value={budgetFilter}
              onChange={(val) => setBudgetFilter(val)}
              options={[{ value: 'ALL', label: 'All Budgets' }, ...BUDGET_OPTIONS]}
              className="min-w-[140px]"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: INTERACTIVE KANBAN PIPELINE BOARD                                 */}
      {/* ========================================================================= */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const config = STAGE_CONFIG[stage];
            const columnLeads = kanbanColumns[stage] || [];
            const colTotalValue = columnLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

            return (
              <div
                key={stage}
                className="bg-[#F8F8F6] rounded-3xl p-3 flex flex-col min-h-[600px] border border-[#ECE5DA]/80 shadow-2xs"
              >
                {/* Column Header */}
                <div className="p-2 border-b border-[#ECE5DA] flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${config.bg} border ${config.border}`} />
                      <h3 className="text-xs font-extrabold text-[#0B251A]">{config.label}</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {colTotalValue > 0 ? `$${colTotalValue.toLocaleString()}` : '$0'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-slate-700 border border-[#E5E7EB] shadow-2xs">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {columnLeads.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-[#ECE5DA] rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-[11px] font-semibold text-slate-400">No leads in stage</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{config.desc}</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const isBooking = Boolean(lead.scopingCall?.scheduledAt);

                      return (
                        <Card
                          key={lead._id}
                          onClick={() => handleOpenLeadDetail(lead._id)}
                          className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-3"
                        >
                          {/* Top Card Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-[#0B251A] truncate group-hover:text-[#0B2E23]">
                                {lead.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {lead.company || lead.email}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                                lead.priority === LeadPriority.HIGH || lead.priority === LeadPriority.URGENT
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {lead.priority}
                            </span>
                          </div>

                          {/* Service Tag */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-[#0B2E23] text-[10px] font-bold border border-emerald-200/60 truncate">
                              {lead.service}
                            </span>
                          </div>

                          {/* Scoping Call Indicator if Booked */}
                          {isBooking && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                              <Calendar className="size-3 text-purple-600 shrink-0" />
                              <span className="truncate">
                                {new Date(lead.scopingCall!.scheduledAt!).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}

                          {/* Bottom Card Row */}
                          <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-[#0B2E23] font-extrabold">
                              <DollarSign className="size-3 text-emerald-600" />
                              <span>{(lead.estimatedValue || 0).toLocaleString()}</span>
                            </div>

                            {/* Qualification Score Pill */}
                            <div
                              title={`Algorithmic Lead Score: ${lead.score}/100`}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                lead.score >= 75
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : lead.score >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lead.score} pts
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: LEADS DIRECTORY TABLE                                             */}
      {/* ========================================================================= */}
      {activeTab === 'directory' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E5E7EB] bg-[#FAFAF9] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Lead / Contact</th>
                  <th className="py-4 px-6">Service Required</th>
                  <th className="py-4 px-6">Budget Bracket</th>
                  <th className="py-4 px-6">Stage</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Est. Value</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/70">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <Briefcase className="size-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No leads found matching criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => {
                    const stageConf = STAGE_CONFIG[l.status] || STAGE_CONFIG[LeadStage.NEW_INQUIRY];
                    return (
                      <tr
                        key={l._id}
                        className="hover:bg-[#FAFAF9]/60 transition-colors cursor-pointer"
                        onClick={() => handleOpenLeadDetail(l._id)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-[#0B2E23] text-[#AEFF48] text-xs font-bold flex items-center justify-center shrink-0">
                              {l.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">{l.name}</p>
                              <p className="text-[11px] text-slate-400">{l.company || l.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-700">{l.service}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-slate-600">{l.budgetRange || 'Unspecified'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${stageConf.bg} ${stageConf.text} ${stageConf.border}`}>
                            {stageConf.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-extrabold text-[#0B2E23]">{l.score}/100</span>
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-900">
                          ${(l.estimatedValue || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLeadDetail(l._id);
                            }}
                            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-[#0B2E23] hover:text-white text-slate-700 text-xs font-bold transition-colors"
                          >
                            Inspect Brief
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: CLIENT ACCOUNTS DIRECTORY                                         */}
      {/* ========================================================================= */}
      {activeTab === 'clients' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0B251A]">Official Client Organizations</h2>
              <p className="text-xs text-slate-400">Converted enterprise accounts with active service agreements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {clients.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <Building2 className="size-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No client accounts onboarded yet</p>
                <p className="text-xs text-slate-400 mt-1">Convert a won lead in the pipeline to create your first client account.</p>
              </div>
            ) : (
              clients.map((c) => (
                <Card key={c._id} className="p-5 bg-[#FAF7F2] border border-[#ECE5DA] rounded-3xl space-y-3 shadow-2xs hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#0B251A]">{c.companyName}</h3>
                      <p className="text-[11px] text-slate-500">{c.industry || 'Technology Solutions'}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EEF5E8] text-[#0B2E23] border border-[#D8EAD0] text-[10px] font-bold">
                      {c.tier}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#ECE5DA] space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <User className="size-3 text-slate-400" />
                      <span>{c.primaryContactName}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="size-3 text-slate-400" />
                      <span>{c.primaryContactEmail}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#ECE5DA] flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Lifetime Spend</span>
                    <span className="font-extrabold text-[#0B2E23]">${(c.totalLifetimeValue || 0).toLocaleString()} USD</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: PORTFOLIO API INTEGRATION GUIDE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'api' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-[#0B2E23]" />
              <h2 className="text-lg font-bold text-[#0B251A]">AtTech Portfolio Website Ingestion Bridge</h2>
            </div>
            <p className="text-xs text-slate-500">
              How the AtTech portfolio website (<code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">/contact</code> & <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">ContactScheduler</code>) pushes inbound leads directly into ERP in real time.
            </p>
          </div>

          <div className="bg-[#0B251A] rounded-3xl p-5 sm:p-6 text-white space-y-4 font-mono text-xs overflow-x-auto relative">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`// In AtTech/src/app/api/contact/route.ts or ContactScheduler
await fetch('http://localhost:4000/api/v1/public/crm/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.io',
    company: 'Cyberdyne Systems',
    service: '30-Day AI & Automation Sprint',
    budget: '$50,000+',
    message: 'We require a 30-day sprint for autonomous workflow deployment.',
    scheduledSlot: '2026-08-25T14:00:00Z',
    timeZone: 'America/New_York',
  }),
});`);
                setCopiedApiKeySnippet(true);
                setTimeout(() => setCopiedApiKeySnippet(false), 2000);
              }}
              className="absolute right-4 top-4 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#AEFF48] text-[11px] font-sans font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedApiKeySnippet ? <Check className="size-3" /> : <Copy className="size-3" />}
              <span>{copiedApiKeySnippet ? 'Copied' : 'Copy Snippet'}</span>
            </button>

            <p className="text-slate-400 font-sans text-xs">
              // Direct Ingestion Endpoint: <span className="text-[#AEFF48]">POST /api/v1/public/crm/leads</span>
            </p>
            <pre className="text-emerald-300 leading-relaxed">
{`// Example payload sent when user submits contact form or Cal.com scheduler
await fetch('http://localhost:4000/api/v1/public/crm/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.io',
    company: 'Cyberdyne Systems',
    service: '30-Day AI & Automation Sprint',
    budget: '$50,000+',
    message: 'We require a 30-day sprint for autonomous workflow deployment.',
    scheduledSlot: '2026-08-25T14:00:00Z',
    timeZone: 'America/New_York',
  }),
});`}
            </pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-1">
              <h4 className="text-xs font-bold text-[#0B251A]">1. Instant Ingestion</h4>
              <p className="text-[11px] text-slate-500">Brief arrives in ERP Kanban column &quot;New Inbound&quot; or &quot;Discovery Booked&quot; with zero delay.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-1">
              <h4 className="text-xs font-bold text-[#0B251A]">2. AI Qualification</h4>
              <p className="text-[11px] text-slate-500">Algorithmic scoring weights budget brackets ($50k+ = 75+ score) and marks priority.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-1">
              <h4 className="text-xs font-bold text-[#0B251A]">3. Auto-Responder Email</h4>
              <p className="text-[11px] text-slate-500">Sends responsive branded confirmation email with scheduled slot to client via Resend.</p>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE LEAD MODAL                                                */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-4xl shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="size-5 text-[#0B2E23]" />
                <h2 className="text-lg font-bold text-[#0B251A]">Create New Lead</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="elena@enterprise.io"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Organization / Company</label>
                  <input
                    type="text"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                    placeholder="e.g. Apex HealthTech"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Service Required
                  </label>
                  <HeroSelect
                    value={createForm.service}
                    onChange={(val) => setCreateForm({ ...createForm, service: val })}
                    options={ATTECH_SERVICES.map((s) => ({ value: s, label: s }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Budget Range
                  </label>
                  <HeroSelect
                    value={createForm.budgetRange}
                    onChange={(val) => setCreateForm({ ...createForm, budgetRange: val as BudgetRange })}
                    options={BUDGET_OPTIONS}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Project Brief / Scoping Notes
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Details about infrastructure requirements, architecture goals, or sprint deliverables..."
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Creating...' : 'Create Lead'}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: LEAD DETAIL & TIMELINE DRAWER                                     */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-[#E5E7EB] bg-[#FAFAF9] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251A] truncate">{selectedLead.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${STAGE_CONFIG[selectedLead.status].bg} ${STAGE_CONFIG[selectedLead.status].text} ${STAGE_CONFIG[selectedLead.status].border}`}>
                    {STAGE_CONFIG[selectedLead.status].label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{selectedLead.company || 'Private Client'} • {selectedLead.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Drawer Scroll Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Top Quick Actions Bar */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#877E71] uppercase tracking-wider block pl-1">
                  Move Pipeline Stage:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {KANBAN_STAGES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStageChange(selectedLead._id, st)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedLead.status === st
                          ? 'bg-[#0B2E23] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-[#E5E7EB]'
                      }`}
                    >
                      {STAGE_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Summary Grid (2x2 Layout) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 sm:p-4 bg-[#FAFAF9] rounded-2xl border border-[#E5E7EB] space-y-1 min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Budget Bracket</span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">{selectedLead.budgetRange}</p>
                </div>
                <div className="p-3.5 sm:p-4 bg-[#FAFAF9] rounded-2xl border border-[#E5E7EB] space-y-1 min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Value</span>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0B2E23] truncate">${(selectedLead.estimatedValue || 0).toLocaleString()}</p>
                </div>
                <div className="p-3.5 sm:p-4 bg-[#FAFAF9] rounded-2xl border border-[#E5E7EB] space-y-1 min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Algorithmic Score</span>
                  <p className="text-xs sm:text-sm font-extrabold text-purple-700 truncate">{selectedLead.score}/100 pts</p>
                </div>
                <div className="p-3.5 sm:p-4 bg-[#FAFAF9] rounded-2xl border border-[#E5E7EB] space-y-1 min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Acquisition Source</span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">{selectedLead.source}</p>
                </div>
              </div>

              {/* Scoping Call Card if present */}
              {selectedLead.scopingCall?.scheduledAt && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-xs">
                      <Calendar className="size-4 text-purple-700 shrink-0" />
                      <span>Cal.com Scoping Call Confirmed</span>
                    </div>
                    <p className="text-xs text-purple-800 font-bold">
                      📅 {new Date(selectedLead.scopingCall.scheduledAt).toLocaleString()} ({selectedLead.scopingCall.timezone})
                    </p>
                  </div>
                </div>
              )}

              {/* Project Brief */}
              <div className="p-4 rounded-2xl bg-[#FAFAF9] border border-[#E5E7EB] space-y-2">
                <h4 className="text-xs font-extrabold text-[#0B251A] uppercase tracking-wider">Project Brief & Description</h4>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedLead.description || 'No detailed brief notes entered.'}
                </p>
              </div>

              {/* Conversion / Proposal Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(true)}
                  className="flex-1 py-2.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText className="size-4" />
                  <span>+ Generate Proposal</span>
                </button>

                {!selectedLead.convertedClientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setConvertForm({
                        companyName: selectedLead.company || `${selectedLead.name}'s Organization`,
                        industry: 'Technology & Cloud Solutions',
                        tier: ClientTier.GROWTH,
                        initialContractValue: selectedLead.estimatedValue || 25000,
                        billingEmail: selectedLead.email,
                      });
                      setIsConvertModalOpen(true);
                    }}
                    className="flex-1 py-2.5 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="size-4 text-[#AEFF48]" />
                    <span>Convert to Client Account</span>
                  </button>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="space-y-5 pt-5 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-[#0B2E23]" />
                    <h4 className="text-xs font-extrabold text-[#0B251A] uppercase tracking-wider">
                      Activity Timeline & Engagement Logs
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {(selectedLead.activities || []).length + 1} Events
                  </span>
                </div>

                {/* Add Note / Activity Form */}
                <form onSubmit={handleAddActivity} className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-3 shadow-2xs">
                  {/* Activity Type Selector Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#877E71] uppercase tracking-wider mr-1">Log Type:</span>
                    {[
                      { type: CrmActivityType.NOTE, label: 'Note', icon: MessageSquare },
                      { type: CrmActivityType.CALL, label: 'Phone Call', icon: PhoneCall },
                      { type: CrmActivityType.MEETING, label: 'Meeting', icon: Calendar },
                      { type: CrmActivityType.EMAIL, label: 'Email', icon: Mail },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = activityType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setActivityType(item.type)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0B2E23] text-white shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-[#E5E7EB]'
                          }`}
                        >
                          <Icon className="size-3" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    placeholder={`Write ${activityType === CrmActivityType.CALL ? 'call takeaways' : activityType === CrmActivityType.MEETING ? 'scoping meeting highlights' : 'internal notes or updates'}...`}
                    rows={2}
                    className="w-full p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">Timestamps and actor info are recorded automatically.</span>
                    <button
                      type="submit"
                      disabled={isSubmitting || !activityNote.trim()}
                      className="px-4 py-1.5 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Send className="size-3 text-[#AEFF48]" />
                      <span>{isSubmitting ? 'Posting...' : 'Post Entry'}</span>
                    </button>
                  </div>
                </form>

                {/* Vertical Continuous Timeline Structure (Flex Row Track) */}
                <div className="space-y-3 pt-2 pb-2">
                  {/* Activity Timeline Entries */}
                  {(selectedLead.activities || []).map((act) => {
                    const config = getActivityConfig(act.type);
                    const Icon = config.icon;

                    return (
                      <div key={act._id} className="flex items-stretch gap-3.5 group">
                        {/* Left Column: Fixed-width track with centered Node Dot & Line */}
                        <div className="flex flex-col items-center shrink-0 w-8">
                          {/* Node Dot */}
                          <div
                            className={`size-8 rounded-full ${config.dotBg} text-white flex items-center justify-center ring-4 ${config.ringColor} shadow-xs shrink-0 z-10 transition-transform group-hover:scale-105`}
                          >
                            <Icon className="size-4" />
                          </div>

                          {/* Vertical connecting line connecting this dot to the next item */}
                          <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                        </div>

                        {/* Right Column: Content Card */}
                        <div className="flex-1 min-w-0 bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all space-y-2 mb-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#0B251A]">{act.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${config.badgeBg}`}>
                                {config.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(act.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {act.content && (
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-[#FAFAF9] p-2.5 rounded-xl border border-[#ECE5DA]/60">
                              {act.content}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <User className="size-3 text-slate-400" />
                              <span>Logged by <strong className="text-slate-600 font-semibold">{act.actorName || 'System'}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Initial Lead Creation Genesis Milestone Marker */}
                  <div className="flex items-stretch gap-3.5 group">
                    {/* Left Column: Genesis Dot */}
                    <div className="flex flex-col items-center shrink-0 w-8">
                      <div className="size-8 rounded-full bg-slate-500 text-white flex items-center justify-center ring-4 ring-slate-100 shadow-xs shrink-0 z-10">
                        <Sparkles className="size-4 text-amber-300" />
                      </div>
                    </div>

                    {/* Right Column: Genesis Content Card */}
                    <div className="flex-1 min-w-0 bg-[#FAFAF9] border border-dashed border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">Inbound Lead Originated</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Genesis
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(selectedLead.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Received inquiry for <strong>{selectedLead.service}</strong> with budget bracket <strong>{selectedLead.budgetRange}</strong> via <strong>{selectedLead.source}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONVERT TO CLIENT MODAL                                          */}
      {/* ========================================================================= */}
      {isConvertModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-4xl shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-[#0B251A]">Convert Lead to Client Account</h2>
              </div>
              <button type="button" onClick={() => setIsConvertModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={convertForm.companyName}
                  onChange={(e) => setConvertForm({ ...convertForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Industry Vertical</label>
                  <input
                    type="text"
                    value={convertForm.industry}
                    onChange={(e) => setConvertForm({ ...convertForm, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Client Tier
                  </label>
                  <HeroSelect
                    value={convertForm.tier}
                    onChange={(val) => setConvertForm({ ...convertForm, tier: val as ClientTier })}
                    options={[
                      { value: ClientTier.STARTUP, label: 'Startup' },
                      { value: ClientTier.GROWTH, label: 'Growth' },
                      { value: ClientTier.ENTERPRISE, label: 'Enterprise' },
                      { value: ClientTier.RETAINER, label: 'Monthly Retainer' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Initial Contract Value ($ USD)</label>
                <input
                  type="number"
                  value={convertForm.initialContractValue.toString()}
                  onChange={(e) => setConvertForm({ ...convertForm, initialContractValue: Number(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Billing Email</label>
                <input
                  type="email"
                  value={convertForm.billingEmail}
                  onChange={(e) => setConvertForm({ ...convertForm, billingEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Converting...' : 'Confirm Account Conversion'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROPOSAL CREATOR MODAL                                           */}
      {/* ========================================================================= */}
      {isProposalModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <Card className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-4xl shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-[#0B251A]">Generate Itemized Proposal</h2>
              </div>
              <button type="button" onClick={() => setIsProposalModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Proposal Title *</label>
                <input
                  type="text"
                  required
                  value={proposalForm.title}
                  onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Service Deliverable
                  </label>
                  <HeroSelect
                    value={proposalForm.serviceName}
                    onChange={(val) => setProposalForm({ ...proposalForm, serviceName: val })}
                    options={ATTECH_SERVICES.map((s) => ({ value: s, label: s }))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Unit Price ($ USD)</label>
                  <input
                    type="number"
                    value={proposalForm.unitPrice.toString()}
                    onChange={(e) => setProposalForm({ ...proposalForm, unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B251A]">Total Quotation Amount</span>
                <span className="text-lg font-extrabold text-[#0B2E23]">
                  ${(proposalForm.quantity * proposalForm.unitPrice - proposalForm.discount).toLocaleString()} USD
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Milestones & Payment Terms</label>
                <textarea
                  value={proposalForm.terms}
                  onChange={(e) => setProposalForm({ ...proposalForm, terms: e.target.value })}
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue & Send Proposal'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
