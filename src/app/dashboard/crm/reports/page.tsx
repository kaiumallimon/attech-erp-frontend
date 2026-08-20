'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Flame,
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
        title="Sales Reports & Analytics"
        subtitle="Pipeline conversion ratios, lead source acquisition velocity, win/loss telemetry, and closed revenue metrics."
        onRefresh={() => void loadReports()}
        isRefreshing={loading}
      />

      {dashboardSummary && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
                <span className="size-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <Flame className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">{dashboardSummary.kpis.totalLeads}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {dashboardSummary.kpis.newLeads} new • {dashboardSummary.kpis.qualifiedLeads} qualified
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Conversion Rate</span>
                <span className="size-8 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">{dashboardSummary.kpis.leadConversionRate}%</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {dashboardSummary.kpis.convertedLeads} converted to accounts/deals
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
                {dashboardSummary.kpis.wonDealsCount} won / {dashboardSummary.kpis.lostDealsCount} lost
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Won Revenue</span>
                <span className="size-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  <Award className="size-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                ${(dashboardSummary.kpis.wonRevenue || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Avg deal: ${(dashboardSummary.kpis.averageDealSize || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Inbound Acquisition Sources</h4>
              <div className="space-y-2.5 pt-1">
                {dashboardSummary.leadSourceBreakdown.map((src) => (
                  <div key={src.id} className="flex items-center justify-between text-xs font-semibold p-2 rounded-2xl bg-[#FAF7F2]">
                    <span className="text-slate-800">{src.name}</span>
                    <span className="font-extrabold text-[#0B2E23] bg-white px-2.5 py-0.5 rounded-full border border-[#ECE5DA]">
                      {src.count} Leads
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sales Conversion Funnel</h4>
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
                    <span>Converted to Deal / Client</span>
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

            <div className="p-6 rounded-4xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenue Performance</h4>
              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Won Revenue</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">
                    ${(dashboardSummary.kpis.wonRevenue || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">In-Flight Pipeline Value</p>
                  <p className="text-2xl font-black text-amber-950 mt-1">
                    ${(dashboardSummary.kpis.openPipelineValue || 0).toLocaleString()}
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
