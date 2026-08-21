'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Award,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Flame,
  PhoneCall,
  Plus,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { crmApi } from '../../../lib/api';
import { CrmDashboardSummary, CrmFunnelReport } from '../../../types/crm';
import CrmNavHeader from '../../../components/crm/crm-nav-header';

export default function CrmDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [dashboardSummary, setDashboardSummary] = useState<CrmDashboardSummary | null>(null);
  const [funnelReport, setFunnelReport] = useState<CrmFunnelReport | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, funnel] = await Promise.all([
        crmApi.reports.dashboard(),
        crmApi.reports.funnel(),
      ]);
      setDashboardSummary(summary);
      setFunnelReport(funnel);
    } catch (err: any) {
      showToast(err.message || 'Failed to load CRM dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCompleteActivity = async (activityId: string) => {
    try {
      await crmApi.activities.complete(activityId);
      showToast('Task marked as completed.');
      void loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete activity', 'error');
    }
  };

  const weightedVal =
    dashboardSummary?.kpis.weightedPipelineValue !== undefined
      ? dashboardSummary.kpis.weightedPipelineValue
      : Math.round((dashboardSummary?.kpis.openPipelineValue || 0) * 0.45);

  const wonVal =
    dashboardSummary?.kpis.wonDealValue !== undefined
      ? dashboardSummary.kpis.wonDealValue
      : dashboardSummary?.kpis.wonRevenue || 0;

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
        title="Sales Dashboard"
        subtitle="Sales pipeline health, weighted probability values, deal velocity, and team touchpoints."
        breadcrumb={[{ label: 'CRM & Sales', href: '/dashboard/crm' }]}
        onRefresh={() => void loadData()}
        isRefreshing={loading}
        actionButton={
          <Link
            href="/dashboard/crm/deals"
            className="h-9 px-4 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-xs hover:bg-[#0B251A] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Target className="size-3.5" />
            <span>Pipeline Board</span>
          </Link>
        }
      />

      {dashboardSummary && (
        <div className="space-y-6">
          {/* 6 Key Performance Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Open Pipeline</span>
                <span className="size-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="size-3" />
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
                ${(dashboardSummary.kpis.openPipelineValue || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {dashboardSummary.kpis.openDealsCount} in progress
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Weighted Pipeline</span>
                <span className="size-6 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                  <Scale className="size-3" />
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
                ${weightedVal.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Value × Probability
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Won Deal Value</span>
                <span className="size-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  <Award className="size-3" />
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
                ${wonVal.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {dashboardSummary.kpis.wonDealsCount} closed won
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Win Rate</span>
                <span className="size-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Target className="size-3" />
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 truncate">{dashboardSummary.kpis.winRate}%</p>
              <p className="text-[10px] text-slate-500 font-medium">
                Avg: ${(dashboardSummary.kpis.averageDealSize || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Active Accounts</span>
                <span className="size-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                  <Building2 className="size-3" />
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 truncate">{dashboardSummary.kpis.activeAccounts}</p>
              <p className="text-[10px] text-slate-500 font-medium">
                {dashboardSummary.kpis.totalContacts} contacts
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Open Deals</span>
                <span className="size-6 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                  <DollarSign className="size-3" />
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 truncate">{dashboardSummary.kpis.openDealsCount}</p>
              <p className="text-[10px] text-slate-500 font-medium">
                {dashboardSummary.kpis.totalDeals} all time
              </p>
            </div>
          </div>

          {/* 1. Sales Pipeline Funnel */}
          {funnelReport && (
            <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Sales Pipeline — {funnelReport.pipeline?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Stage conversion ratios and active deal values</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Total Pipeline: ${funnelReport.totalValue.toLocaleString()} ({funnelReport.dealsCount} deals)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {funnelReport.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          Stage {stage.order}
                        </span>
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: stage.color || '#0B2E23' }}
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">{stage.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{stage.probability}% Probability</p>
                    </div>

                    <div className="pt-2 border-t border-[#ECE5DA]/80">
                      <p className="text-sm font-black text-slate-900">${stage.totalValue.toLocaleString()}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{stage.dealsCount} Deals</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2 & 3 & 4. Activities & Recent Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Upcoming Activities / Tasks */}
            <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-emerald-800" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Upcoming Follow-ups</h3>
                  </div>
                  <Link
                    href="/dashboard/crm/activities"
                    className="text-[11px] font-bold text-[#0B2E23] hover:underline flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ChevronRight className="size-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {dashboardSummary.upcomingTasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 italic">No pending follow-ups.</div>
                  ) : (
                    dashboardSummary.upcomingTasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm ${
                                task.priority === 'URGENT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {task.type}
                            </span>
                            {task.dueDate && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate">{task.subject}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleCompleteActivity(task.id)}
                          className="size-7 rounded-full bg-white border border-[#E5E7EB] hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2 shadow-2xs"
                          title="Mark Complete"
                        >
                          <Check className="size-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activities Timeline */}
            <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-sky-800" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Recent Activities</h3>
                  </div>
                  <Link
                    href="/dashboard/crm/activities"
                    className="text-[11px] font-bold text-[#0B2E23] hover:underline flex items-center gap-0.5"
                  >
                    <span>Log</span>
                    <ChevronRight className="size-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {dashboardSummary.recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 italic">No activity logged yet.</div>
                  ) : (
                    dashboardSummary.recentActivities.slice(0, 4).map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700">
                              {act.type} • {act.relatedEntityType}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(act.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate">{act.subject}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Deals */}
            <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-3.5 text-amber-800" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Recent Deals</h3>
                  </div>
                  <Link
                    href="/dashboard/crm/deals"
                    className="text-[11px] font-bold text-[#0B2E23] hover:underline flex items-center gap-0.5"
                  >
                    <span>All Deals</span>
                    <ChevronRight className="size-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  {dashboardSummary.recentDeals.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 italic">No recent deals logged.</div>
                  ) : (
                    dashboardSummary.recentDeals.slice(0, 4).map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{deal.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {deal.accountId?.name || 'Account'} • {deal.stageId?.name}
                          </p>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <p className="text-xs font-black text-[#0B2E23]">${deal.value.toLocaleString()}</p>
                          <span
                            className={`text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                              deal.status === 'WON'
                                ? 'bg-emerald-100 text-emerald-800'
                                : deal.status === 'LOST'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {deal.status === 'WON' ? 'Closed Won' : deal.status === 'LOST' ? 'Closed Lost' : deal.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
