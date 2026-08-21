'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Flame,
  Scale,
  Target,
  TrendingUp,
} from 'lucide-react';
import { crmApi } from '../../../../lib/api';
import {
  CrmDashboardSummary,
  CrmFunnelReport,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';

export default function CrmReportsPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [dashboardSummary, setDashboardSummary] = useState<CrmDashboardSummary | null>(null);
  const [funnelReport, setFunnelReport] = useState<CrmFunnelReport | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const [summary, funnel] = await Promise.all([
        crmApi.reports.dashboard(),
        crmApi.reports.funnel(),
      ]);
      setDashboardSummary(summary);
      setFunnelReport(funnel);
    } catch (err: any) {
      showToast(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

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
        title="Reports"
        subtitle="Pipeline conversion ratios, acquisition channels, win/loss telemetry, and closed deal values."
        breadcrumb={[
          { label: 'CRM & Sales', href: '/dashboard/crm' },
        ]}
        onRefresh={() => void loadReports()}
        isRefreshing={loading}
      />

      {dashboardSummary && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Leads</span>
                <span className="size-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <Flame className="size-3" />
                </span>
              </div>
              <p className="text-xl font-black text-slate-900">{dashboardSummary.kpis.totalLeads}</p>
              <p className="text-[10px] text-slate-500 font-medium">
                {dashboardSummary.kpis.newLeads} new • {dashboardSummary.kpis.qualifiedLeads} qualified
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Conversion Rate</span>
                <span className="size-6 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="size-3" />
                </span>
              </div>
              <p className="text-xl font-black text-slate-900">{dashboardSummary.kpis.leadConversionRate}%</p>
              <p className="text-[10px] text-slate-500 font-medium">
                {dashboardSummary.kpis.convertedLeads} converted to accounts
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Weighted Pipeline</span>
                <span className="size-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Scale className="size-3" />
                </span>
              </div>
              <p className="text-xl font-black text-slate-900">${weightedVal.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 font-medium">
                ${dashboardSummary.kpis.openPipelineValue.toLocaleString()} gross
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Win Rate</span>
                <span className="size-6 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                  <Target className="size-3" />
                </span>
              </div>
              <p className="text-xl font-black text-slate-900">{dashboardSummary.kpis.winRate}%</p>
              <p className="text-[10px] text-slate-500 font-medium">
                {dashboardSummary.kpis.wonDealsCount} won / {dashboardSummary.kpis.lostDealsCount} lost
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Won Deal Value</span>
                <span className="size-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  <Award className="size-3" />
                </span>
              </div>
              <p className="text-xl font-black text-slate-900">
                ${wonVal.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Avg: ${(dashboardSummary.kpis.averageDealSize || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Acquisition Sources Performance Table */}
            <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Inbound Acquisition Sources</h4>
              <div className="space-y-2 pt-1">
                {dashboardSummary.leadSourceBreakdown.map((src) => (
                  <div key={src.id} className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA]">
                    <span className="text-slate-800">{src.name}</span>
                    <span className="font-extrabold text-[#0B2E23] bg-white px-2.5 py-0.5 rounded-full border border-[#ECE5DA]">
                      {src.count} Leads
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales Conversion Funnel Progress */}
            <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Conversion Funnel Velocity</h4>
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Total Inbound Leads</span>
                    <span>{dashboardSummary.kpis.totalLeads}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Qualified Prospects</span>
                    <span>{dashboardSummary.kpis.qualifiedLeads}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{
                        width: `${
                          dashboardSummary.kpis.totalLeads > 0
                            ? (dashboardSummary.kpis.qualifiedLeads / dashboardSummary.kpis.totalLeads) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Converted to Accounts / Deals</span>
                    <span>{dashboardSummary.kpis.convertedLeads}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${dashboardSummary.kpis.leadConversionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sales / Deal Commercial Performance */}
            <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Sales / Deal Performance</h4>
              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Closed Won Deal Value</p>
                  <p className="text-xl font-black text-emerald-950 mt-0.5">
                    ${wonVal.toLocaleString()} USD
                  </p>
                </div>

                <div className="p-4 rounded-3xl bg-sky-50 border border-sky-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Weighted Pipeline Value</p>
                  <p className="text-xl font-black text-sky-950 mt-0.5">
                    ${weightedVal.toLocaleString()} USD
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
