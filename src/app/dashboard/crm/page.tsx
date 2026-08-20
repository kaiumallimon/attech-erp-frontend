'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Plus,
  Target,
  TrendingUp,
  Users,
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
        title="CRM Executive Dashboard"
        subtitle="Live sales performance, open deal velocity, pipeline health, and stakeholder touchpoints."
        onRefresh={() => void loadData()}
        isRefreshing={loading}
        actionButton={
          <Link
            href="/dashboard/crm/deals"
            className="h-10 px-5 rounded-full bg-[#AEFF48] text-[#0B2E23] font-bold text-xs hover:bg-[#9DE83E] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Target className="size-4" />
            <span>Open Pipeline Board</span>
          </Link>
        }
      />

      {dashboardSummary && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open Pipeline</span>
                <span className="size-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                ${(dashboardSummary.kpis.openPipelineValue || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {dashboardSummary.kpis.openDealsCount} active opportunities in progress
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Won Revenue</span>
                <span className="size-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  <Award className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                ${(dashboardSummary.kpis.wonRevenue || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {dashboardSummary.kpis.wonDealsCount} closed won deals
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Win Rate</span>
                <span className="size-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Target className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">{dashboardSummary.kpis.winRate}%</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Avg deal size: ${(dashboardSummary.kpis.averageDealSize || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Accounts</span>
                <span className="size-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                  <Building2 className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">{dashboardSummary.kpis.activeAccounts}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {dashboardSummary.kpis.totalContacts} individual stakeholder contacts
              </p>
            </div>
          </div>

          {/* Pipeline Funnel Visualizer */}
          {funnelReport && (
            <div className="p-6 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sales Pipeline Funnel — {funnelReport.pipeline?.name}
                  </h3>
                  <p className="text-xs text-slate-400">Stage-by-stage conversion velocity and opportunity value</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Total Pipeline: ${funnelReport.totalValue.toLocaleString()} ({funnelReport.dealsCount} deals)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {funnelReport.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          Stage {stage.order}
                        </span>
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: stage.color || '#0B2E23' }}
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{stage.name}</p>
                      <p className="text-[11px] text-slate-500">{stage.probability}% Probability</p>
                    </div>

                    <div className="pt-3 border-t border-[#ECE5DA]/80">
                      <p className="text-base font-black text-slate-900">${stage.totalValue.toLocaleString()}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{stage.dealsCount} Deals</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities & High-Value Deals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Follow-ups & Tasks</h3>
                </div>
                <Link
                  href="/dashboard/crm/activities"
                  className="text-xs font-bold text-[#0B2E23] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>

              <div className="space-y-2">
                {dashboardSummary.upcomingTasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No pending follow-ups scheduled.
                  </div>
                ) : (
                  dashboardSummary.upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              task.priority === 'URGENT'
                                ? 'bg-rose-100 text-rose-800'
                                : task.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {task.type} • {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-400">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">{task.subject}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleCompleteActivity(task.id)}
                        className="size-8 rounded-full bg-white border border-[#E5E7EB] hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
                        title="Mark as Completed"
                      >
                        <Check className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Sales Opportunities</h3>
                </div>
                <Link
                  href="/dashboard/crm/deals"
                  className="text-xs font-bold text-[#0B2E23] hover:underline flex items-center gap-1"
                >
                  <span>View All Deals</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>

              <div className="space-y-2">
                {dashboardSummary.recentDeals.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No recent deals logged.</div>
                ) : (
                  dashboardSummary.recentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{deal.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          Client: {deal.accountId?.name || 'Prospect'} • Stage: {deal.stageId?.name}
                        </p>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-extrabold text-[#0B2E23]">
                          ${deal.value.toLocaleString()} {deal.currency}
                        </p>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            deal.status === 'WON'
                              ? 'bg-emerald-100 text-emerald-800'
                              : deal.status === 'LOST'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {deal.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
