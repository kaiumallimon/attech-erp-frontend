'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Link as LinkIcon,
  PhoneCall,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { crmApi, employeesApi } from '../../../../lib/api';
import {
  ActivityPriority,
  ActivityStatus,
  ActivityType,
  CrmAccount,
  CrmActivity,
  CrmDeal,
  CrmLead,
} from '../../../../types/crm';
import CrmNavHeader from '../../../../components/crm/crm-nav-header';
import HeroSelect, { SelectOption } from '../../../../components/ui/hero-select';

export default function CrmActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [activitiesSearch, setActivitiesSearch] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityStatusFilter, setActivityStatusFilter] = useState('all');

  const [employees, setEmployees] = useState<any[]>([]);
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState<{
    type: string;
    subject: string;
    description: string;
    assignedToId: string;
    dueDate: string;
    priority: string;
    relatedEntityType: 'LEAD' | 'ACCOUNT' | 'CONTACT' | 'DEAL';
    relatedEntityId: string;
    callOutcome?: string;
    meetingLocation?: string;
  }>({
    type: ActivityType.TASK,
    subject: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    priority: ActivityPriority.MEDIUM,
    relatedEntityType: 'DEAL',
    relatedEntityId: '',
    callOutcome: '',
    meetingLocation: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const [actRes, empRes, dealRes, accRes, leadRes] = await Promise.all([
        crmApi.activities.list({
          type: activityTypeFilter,
          status: activityStatusFilter,
          search: activitiesSearch,
        }),
        employeesApi.list({ limit: 100 }).catch(() => ({ data: [] })),
        crmApi.deals.list().catch(() => ({ data: [] })),
        crmApi.accounts.list().catch(() => ({ data: [] })),
        crmApi.leads.list().catch(() => ({ data: [] })),
      ]);

      setActivities(Array.isArray(actRes) ? actRes : Array.isArray(actRes?.items) ? actRes.items : Array.isArray(actRes?.data) ? actRes.data : []);

      const empList = Array.isArray(empRes) ? empRes : Array.isArray((empRes as any)?.data) ? (empRes as any).data : [];
      setEmployees(empList);

      setDeals(Array.isArray(dealRes) ? dealRes : Array.isArray((dealRes as any)?.items) ? (dealRes as any).items : Array.isArray((dealRes as any)?.data) ? (dealRes as any).data : []);
      setAccounts(Array.isArray(accRes) ? accRes : Array.isArray((accRes as any)?.items) ? (accRes as any).items : Array.isArray((accRes as any)?.data) ? (accRes as any).data : []);
      setLeads(Array.isArray(leadRes) ? leadRes : Array.isArray((leadRes as any)?.items) ? (leadRes as any).items : Array.isArray((leadRes as any)?.data) ? (leadRes as any).data : []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActivities();
  }, [activityTypeFilter, activityStatusFilter]);

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

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await crmApi.activities.create(activityForm);
      showToast('Activity logged successfully.');
      setIsActivityModalOpen(false);
      void loadActivities();
    } catch (err: any) {
      showToast(err.message || 'Failed to log activity', 'error');
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      await crmApi.activities.complete(activityId);
      showToast('Activity marked as completed.');
      void loadActivities();
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

      {/* Compact ERP Header */}
      <CrmNavHeader
        title="Activities"
        subtitle="Universal log of client phone calls, meetings, follow-ups, and sales tasks."
        breadcrumb={[
          { label: 'CRM & Sales', href: '/dashboard/crm' },
        ]}
        onRefresh={() => void loadActivities()}
        isRefreshing={loading}
        actionButton={
          <button
            type="button"
            onClick={() => {
              setActivityForm({
                type: ActivityType.TASK,
                subject: '',
                description: '',
                assignedToId: employees[0]?.id || '',
                dueDate: '',
                priority: ActivityPriority.MEDIUM,
                relatedEntityType: 'DEAL',
                relatedEntityId: deals[0]?.id || accounts[0]?.id || leads[0]?.id || '',
                callOutcome: '',
                meetingLocation: '',
              });
              setIsActivityModalOpen(true);
            }}
            className="h-9 px-4 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold text-xs hover:bg-[#0B251A] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Log Activity</span>
          </button>
        }
      />

      {/* Toolbar Filters */}
      <div className="p-3.5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search activities by subject..."
              value={activitiesSearch}
              onChange={(e) => setActivitiesSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadActivities()}
              className="w-full h-9 pl-9 pr-3 rounded-full border border-[#E5E7EB] text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>

          <select
            value={activityTypeFilter}
            onChange={(e) => setActivityTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Types</option>
            <option value="TASK">Tasks</option>
            <option value="CALL">Calls</option>
            <option value="MEETING">Meetings</option>
            <option value="FOLLOW_UP">Follow-ups</option>
            <option value="NOTE">Notes</option>
          </select>

          <select
            value={activityStatusFilter}
            onChange={(e) => setActivityStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-full border border-[#E5E7EB] text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => void loadActivities()}
          className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-700 font-bold text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          Filter
        </button>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400 bg-white rounded-4xl border border-[#E5E7EB]">
            No CRM activities logged. Click &quot;Log Activity&quot; to record calls, meetings, or tasks.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className={`p-4 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
                act.status === 'COMPLETED'
                  ? 'bg-slate-50 border-[#E5E7EB] opacity-75'
                  : 'bg-white border-[#E5E7EB] shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`size-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                    act.type === 'CALL'
                      ? 'bg-sky-100 text-sky-800'
                      : act.type === 'MEETING'
                      ? 'bg-purple-100 text-purple-800'
                      : act.type === 'FOLLOW_UP'
                      ? 'bg-amber-100 text-amber-800'
                      : act.type === 'NOTE'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {act.type === 'CALL' && <PhoneCall className="size-4" />}
                  {act.type === 'MEETING' && <Video className="size-4" />}
                  {act.type === 'TASK' && <CheckCircle2 className="size-4" />}
                  {act.type === 'FOLLOW_UP' && <Clock className="size-4" />}
                  {act.type === 'NOTE' && <FileText className="size-4" />}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {act.type} • {act.relatedEntityType}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.2 rounded-md ${
                        act.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800'
                          : act.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {act.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{act.subject}</h4>
                  {act.description && (
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{act.description}</p>
                  )}
                  {act.meetingLocation && (
                    <p className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1 mt-1">
                      <LinkIcon className="size-3" />
                      <span>{act.meetingLocation}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {act.status !== 'COMPLETED' ? (
                  <button
                    type="button"
                    onClick={() => void handleCompleteActivity(act.id)}
                    className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="size-3" />
                    <span>Complete</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Done
                  </span>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    await crmApi.activities.delete(act.id);
                    showToast('Activity deleted.');
                    void loadActivities();
                  }}
                  className="size-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Log Activity */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg rounded-4xl bg-white shadow-2xl border border-[#E5E7EB] overflow-hidden my-8">
            <div className="p-5 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black">Log Activity</h3>
                <p className="text-[11px] text-white/70">Record calls, meetings, follow-ups, and notes</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="size-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Activity Type *</label>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="TASK">Task</option>
                    <option value="CALL">Call</option>
                    <option value="MEETING">Meeting</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="NOTE">Note</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={activityForm.priority}
                    onChange={(e) => setActivityForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up meeting with product team"
                  value={activityForm.subject}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Employee</label>
                  <HeroSelect
                    value={activityForm.assignedToId}
                    options={employeeOptions}
                    onChange={(val) => setActivityForm((prev) => ({ ...prev, assignedToId: val }))}
                    className="w-full h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={activityForm.dueDate}
                    onChange={(e) => setActivityForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Meeting URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={activityForm.meetingLocation}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, meetingLocation: e.target.value }))}
                  className="w-full h-9 px-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Details & Outcomes</label>
                <textarea
                  rows={3}
                  value={activityForm.description}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Notes, discussion topics, next steps..."
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-slate-800 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold hover:bg-[#0B251A] cursor-pointer shadow-xs"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
