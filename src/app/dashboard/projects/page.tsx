'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FolderPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  GitBranch,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  DollarSign,
  FileCode2,
  FileText,
  X,
  PlusCircle,
  MoreVertical,
  Activity,
  Receipt,
  Filter,
} from 'lucide-react';
import { projectsApi, crmApi } from '@/lib/api';
import {
  Project,
  Sprint,
  Task,
  ProjectsStats,
  ProjectStatus,
  ProjectType,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  SprintStatus,
} from '@/types/projects';
import { CrmClient, CrmLead } from '@/types/crm';
import { HeroSelect } from '@/components/ui/hero-select';
import { useAuth } from '@/context/auth-context';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  [ProjectStatus.PLANNING]: {
    label: 'Planning & Setup',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  [ProjectStatus.ACTIVE_SPRINT]: {
    label: 'Active Sprint',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [ProjectStatus.CLIENT_REVIEW]: {
    label: 'Client Review / UAT',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [ProjectStatus.COMPLETED]: {
    label: 'Delivered & Live',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  [ProjectStatus.ON_HOLD]: {
    label: 'On Hold',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
  [ProjectStatus.ARCHIVED]: {
    label: 'Archived',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-200',
    dot: 'bg-stone-400',
  },
};

const TASK_STAGES: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.CODE_REVIEW,
  TaskStatus.TESTING,
  TaskStatus.DONE,
];

const TASK_STAGE_CONFIG: Record<TaskStatus, { label: string; bg: string; dot: string }> = {
  [TaskStatus.BACKLOG]: { label: 'Backlog', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  [TaskStatus.TODO]: { label: 'To Do', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', bg: 'bg-amber-100', dot: 'bg-amber-500' },
  [TaskStatus.CODE_REVIEW]: { label: 'Code Review', bg: 'bg-purple-100', dot: 'bg-purple-500' },
  [TaskStatus.TESTING]: { label: 'Testing / QA', bg: 'bg-pink-100', dot: 'bg-pink-500' },
  [TaskStatus.DONE]: { label: 'Completed', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
};

export default function ProjectsPage() {
  const { user } = useAuth();

  // State Management
  const [stats, setStats] = useState<ProjectsStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kanban' | 'projects' | 'tasks'>('kanban');

  // Filters & Selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Selected Project Detail Drawer
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    type: ProjectType.FULLSTACK_SPRINT,
    priority: ProjectPriority.MEDIUM,
    clientId: '',
    originLeadId: '',
    contractAmount: 25000,
    repositoryUrl: '',
    demoUrl: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    projectId: '',
    sprintId: '',
    priority: TaskPriority.MEDIUM,
    estimatedHours: 8,
  });

  const [sprintForm, setSprintForm] = useState({
    name: '',
    projectId: '',
    goal: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [revisionForm, setRevisionForm] = useState({
    title: '',
    description: '',
    amount: 2500,
    autoInvoice: true,
  });

  const [submitting, setSubmitting] = useState(false);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, projectsRes, clientsRes, leadsRes] = await Promise.all([
        projectsApi.getStats().catch(() => null),
        projectsApi.getProjects({ limit: 100 }),
        crmApi.getClients({ limit: 100 }).catch(() => ({ data: [] })),
        crmApi.getLeads({ status: 'WON', limit: 50 }).catch(() => ({ data: [] })),
      ]);

      if (statsRes) setStats(statsRes);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
    } catch (err) {
      console.error('Failed to fetch projects data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchCode = p.code?.toLowerCase().includes(q);
        const matchClient = p.clientId?.companyName?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchClient) return false;
      }
      return true;
    });
  }, [projects, statusFilter, typeFilter, searchQuery]);

  // Active Project for Kanban & Tasks
  const currentProject = useMemo(() => {
    if (selectedProjectId === 'ALL') {
      return filteredProjects[0] || null;
    }
    return projects.find((p) => p._id === selectedProjectId) || null;
  }, [projects, selectedProjectId, filteredProjects]);

  // Kanban Tasks by Stage
  const kanbanTasks = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.CODE_REVIEW]: [],
      [TaskStatus.TESTING]: [],
      [TaskStatus.DONE]: [],
    };

    const tasksList = currentProject?.tasks || [];
    tasksList.forEach((t) => {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    });

    return map;
  }, [currentProject]);

  // Handlers
  const handleOpenDetail = async (proj: Project) => {
    try {
      const fullProj = await projectsApi.getProjectById(proj._id);
      setSelectedProject(fullProj);
      setIsDetailDrawerOpen(true);
    } catch (err) {
      console.error('Failed to get project details:', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.clientId) {
      alert('Please select a client account');
      return;
    }

    setSubmitting(true);
    try {
      await projectsApi.createProject(projectForm);
      setIsCreateModalOpen(false);
      setProjectForm({
        name: '',
        description: '',
        type: ProjectType.FULLSTACK_SPRINT,
        priority: ProjectPriority.MEDIUM,
        clientId: '',
        originLeadId: '',
        contractAmount: 25000,
        repositoryUrl: '',
        demoUrl: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProjId = taskForm.projectId || currentProject?._id;
    if (!targetProjId) {
      alert('Please select a target project');
      return;
    }

    setSubmitting(true);
    try {
      await projectsApi.createTask({
        ...taskForm,
        projectId: targetProjId,
      });
      setIsTaskModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        projectId: '',
        sprintId: '',
        priority: TaskPriority.MEDIUM,
        estimatedHours: 8,
      });
      if (selectedProject) {
        handleOpenDetail(selectedProject);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setSubmitting(true);
    try {
      await projectsApi.addRevision(selectedProject._id, revisionForm);
      setIsRevisionModalOpen(false);
      setRevisionForm({
        title: '',
        description: '',
        amount: 2500,
        autoInvoice: true,
      });
      handleOpenDetail(selectedProject);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to log revision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskStageChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await projectsApi.updateTaskStatus(taskId, newStatus);
      if (selectedProject) {
        handleOpenDetail(selectedProject);
      }
      fetchData();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#0B251A] tracking-tight">
              Projects & Agile SDLC Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0B2E23]/10 text-[#0B2E23] border border-[#0B2E23]/20">
              Enterprise Sprints
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track full-stack delivery sprints, scope revisions, team velocities, and Git milestones directly linked to CRM client accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-[#E5E7EB] transition-colors cursor-pointer"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (currentProject) {
                setTaskForm((prev) => ({ ...prev, projectId: currentProject._id }));
              }
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="size-4 text-slate-600" />
            <span>Add Task</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <FolderPlus className="size-4 text-[#AEFF48]" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* 2. Warm Telemetry Bar (4 Segments) */}
      <div className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Active Projects */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Active Sprints</span>
              <div className="size-8 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FolderGit2 className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B251A]">{stats?.activeProjectsCount || 0}</p>
              <span className="text-[10px] text-slate-500 font-medium">
                {stats?.totalProjectsCount || 0} Total Workspaces
              </span>
            </div>
          </div>

          {/* Core Contract Value */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Contract Budget</span>
              <div className="size-8 rounded-2xl bg-[#0B2E23]/10 text-[#0B2E23] flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2E23]">
                ${(stats?.totalContractValue || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500 font-medium">Core Scope Value</span>
            </div>
          </div>

          {/* Revision Fees Value (Isolated Entity) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Revision Revenue</span>
              <div className="size-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Sparkles className="size-4 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-700">
                ${(stats?.totalRevisionValue || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-700/80 font-bold">Isolated Out-of-Scope</span>
            </div>
          </div>

          {/* Task Velocity */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#877E71] uppercase tracking-wider">Delivery Velocity</span>
              <div className="size-8 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-900">{stats?.taskCompletionRate || 0}%</p>
              <span className="text-[10px] text-slate-500 font-medium">
                {stats?.tasksInReviewCount || 0} In Review
              </span>
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
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'kanban' ? 'bg-[#0B2E23] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sprint Kanban Board
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'projects' ? 'bg-[#0B2E23] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Workspaces ({projects.length})
          </button>
        </div>

        {/* Search & Project Pickers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {activeTab === 'kanban' && (
            <HeroSelect
              value={selectedProjectId}
              onChange={(val) => setSelectedProjectId(val)}
              options={[
                { value: 'ALL', label: 'Select Active Project Workspace' },
                ...projects.map((p) => ({ value: p._id, label: `${p.code} - ${p.name}` })),
              ]}
              className="min-w-[240px]"
            />
          )}

          <div className="relative min-w-[200px]">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, code..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: SPRINT TASK KANBAN BOARD                                          */}
      {/* ========================================================================= */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          {currentProject ? (
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-[#0B2E23]">{currentProject.code}</span>
                  <h3 className="text-base font-extrabold text-[#0B251A]">{currentProject.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[currentProject.status].bg} ${STATUS_CONFIG[currentProject.status].text} ${STATUS_CONFIG[currentProject.status].border}`}>
                    {STATUS_CONFIG[currentProject.status].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client: <strong className="text-slate-700">{currentProject.clientId?.companyName || 'AtTech Core'}</strong> • Budget: <strong>${(currentProject.contractAmount || 0).toLocaleString()}</strong> {currentProject.revisionTotalAmount > 0 && <span className="text-amber-600 font-bold">(+${currentProject.revisionTotalAmount.toLocaleString()} in Revisions)</span>}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(currentProject)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Activity className="size-3.5" />
                  <span>Workspace Hub</span>
                </button>
                {currentProject.repositoryUrl && (
                  <a
                    href={currentProject.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <GitBranch className="size-4" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#FAF7F2] border border-dashed border-[#ECE5DA] rounded-3xl text-center space-y-2">
              <FolderGit2 className="size-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Projects Created Yet</h4>
              <p className="text-xs text-slate-500">Create your first delivery project or convert a won CRM lead to initialize a workspace.</p>
            </div>
          )}

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
            {TASK_STAGES.map((st) => {
              const config = TASK_STAGE_CONFIG[st];
              const tasksInStage = kanbanTasks[st] || [];

              return (
                <div
                  key={st}
                  className="bg-[#F8F8F6] rounded-3xl p-3 flex flex-col min-h-[500px] border border-[#ECE5DA]/80 shadow-2xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`size-2 rounded-full ${config.dot}`} />
                      <span className="text-xs font-extrabold text-[#0B251A]">{config.label}</span>
                    </div>
                    <span className="size-5 rounded-full bg-slate-200/80 text-[10px] font-bold text-slate-700 flex items-center justify-center">
                      {tasksInStage.length}
                    </span>
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-2.5 flex-1">
                    {tasksInStage.map((t) => (
                      <div
                        key={t._id}
                        className="p-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs hover:shadow-xs transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="text-xs font-bold text-slate-900 leading-tight">{t.title}</h5>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${t.priority === TaskPriority.URGENT ? 'bg-red-100 text-red-700' : t.priority === TaskPriority.HIGH ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            {t.priority}
                          </span>
                        </div>

                        {t.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]/60 text-[10px] text-slate-400">
                          <span className="font-mono">{t.estimatedHours || 0}h est.</span>

                          {/* Quick Advance Button */}
                          <div className="flex items-center gap-1">
                            {st !== TaskStatus.DONE && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextIdx = TASK_STAGES.indexOf(st) + 1;
                                  if (nextIdx < TASK_STAGES.length) {
                                    handleTaskStageChange(t._id, TASK_STAGES[nextIdx]);
                                  }
                                }}
                                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-[#0B2E23] hover:text-white text-slate-600 text-[9px] font-bold transition-colors cursor-pointer"
                              >
                                Advance →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {tasksInStage.length === 0 && (
                      <div className="h-24 border border-dashed border-[#ECE5DA] rounded-2xl flex items-center justify-center text-[11px] text-slate-400">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ALL PROJECTS DIRECTORY                                            */}
      {/* ========================================================================= */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p._id}
              onClick={() => handleOpenDetail(p)}
              className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-2xs hover:shadow-xs hover:border-[#0B2E23]/40 transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-[#0B2E23] bg-[#0B2E23]/10 px-2 py-0.5 rounded-full">
                      {p.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_CONFIG[p.status].bg} ${STATUS_CONFIG[p.status].text} ${STATUS_CONFIG[p.status].border}`}>
                      {STATUS_CONFIG[p.status].label}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#0B251A] truncate">{p.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{p.clientId?.companyName || 'Enterprise Account'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-[#FAFAF9] border border-[#E5E7EB] text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Core Budget</span>
                  <strong className="text-slate-800">${(p.contractAmount || 0).toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Revisions</span>
                  <strong className={p.revisionTotalAmount > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                    ${(p.revisionTotalAmount || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="text-[11px] font-medium">
                  {p.revisions?.length || 0} Revisions • {p.tasks?.length || 0} Tasks
                </span>
                <span className="text-[11px] font-bold text-[#0B2E23] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Open Hub →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: PROJECT DETAIL, REVISIONS & WORKSPACE HUB                        */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-[#E5E7EB] bg-[#FAFAF9] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#0B2E23] bg-[#0B2E23]/10 px-2 py-0.5 rounded-full">
                    {selectedProject.code}
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0B251A] truncate">{selectedProject.name}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  Client: {selectedProject.clientId?.companyName} • {selectedProject.clientId?.billingEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Drawer Scroll Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Financial Breakdown (2x2 Grid with Isolated Revisions) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 sm:p-4 bg-[#FAFAF9] rounded-2xl border border-[#E5E7EB] space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contract Budget</span>
                  <p className="text-sm sm:text-base font-extrabold text-[#0B2E23]">
                    ${(selectedProject.contractAmount || 0).toLocaleString()} {selectedProject.currency}
                  </p>
                  <span className="text-[10px] text-slate-500">Core milestone deliverables</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Revision Amount</span>
                  <p className="text-sm sm:text-base font-extrabold text-amber-800">
                    ${(selectedProject.revisionTotalAmount || 0).toLocaleString()} {selectedProject.currency}
                  </p>
                  <span className="text-[10px] text-amber-700/80">Flagged out-of-scope</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="flex-1 py-2.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles className="size-4 text-amber-700" />
                  <span>+ Log Project Revision</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTaskForm((prev) => ({ ...prev, projectId: selectedProject._id }));
                    setIsTaskModalOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="size-4 text-[#AEFF48]" />
                  <span>+ Add Sprint Task</span>
                </button>
              </div>

              {/* Revisions Manager Section */}
              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#0B251A] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-600" />
                    <span>Project Change Revisions ({selectedProject.revisions?.length || 0})</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">Separately Billed</span>
                </div>

                <div className="space-y-2.5">
                  {(selectedProject.revisions || []).map((rev) => (
                    <div
                      key={rev.revisionNumber}
                      className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                            {rev.revisionNumber}
                          </span>
                          <h5 className="text-xs font-bold text-[#0B251A]">{rev.title}</h5>
                        </div>
                        {rev.description && <p className="text-xs text-slate-600 leading-relaxed">{rev.description}</p>}
                        <span className="text-[10px] text-slate-400">
                          Requested on {new Date(rev.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-amber-800">${rev.amount.toLocaleString()}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {rev.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!selectedProject.revisions || selectedProject.revisions.length === 0) && (
                    <p className="text-xs text-slate-400 italic p-3 bg-[#FAFAF9] rounded-2xl text-center">
                      No scope revisions requested for this project.
                    </p>
                  )}
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-extrabold text-[#0B251A] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="size-4 text-[#0B2E23]" />
                  <span>Sprint Tasks Backlog ({selectedProject.tasks?.length || 0})</span>
                </h4>

                <div className="space-y-2">
                  {(selectedProject.tasks || []).map((t) => (
                    <div
                      key={t._id}
                      className="p-3 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800">{t.title}</span>
                        <span className="text-[10px] text-slate-400 block">{t.estimatedHours || 0} hrs estimated</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${TASK_STAGE_CONFIG[t.status]?.bg || 'bg-slate-100'}`}>
                        {TASK_STAGE_CONFIG[t.status]?.label || t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE PROJECT MODAL                                             */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0B251A]">Create Delivery Project</h3>
                <p className="text-xs text-slate-500">Provision a new delivery workspace linked to a client account.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {/* Client Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Client Account *</label>
                <HeroSelect
                  value={projectForm.clientId}
                  onChange={(val) => setProjectForm({ ...projectForm, clientId: val })}
                  options={[
                    { value: '', label: 'Select Client Account' },
                    ...clients.map((c) => ({ value: c._id, label: `${c.companyName} (${c.tier})` })),
                  ]}
                />
              </div>

              {/* Project Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g. Neuroweb - AI CMS Architecture"
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              {/* Type and Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Sprint Offering</label>
                  <HeroSelect
                    value={projectForm.type}
                    onChange={(val) => setProjectForm({ ...projectForm, type: val as ProjectType })}
                    options={[
                      { value: ProjectType.AI_AUTOMATION_SPRINT, label: '30-Day AI Sprint' },
                      { value: ProjectType.FULLSTACK_SPRINT, label: 'Full-Stack Sprint' },
                      { value: ProjectType.CLOUD_INFRASTRUCTURE, label: 'Cloud Infrastructure' },
                      { value: ProjectType.CYBERSECURITY, label: 'Cybersecurity' },
                      { value: ProjectType.CUSTOM_DEV, label: 'Custom Engineering' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Contract Budget (USD) *</label>
                  <input
                    type="number"
                    required
                    value={projectForm.contractAmount}
                    onChange={(e) => setProjectForm({ ...projectForm, contractAmount: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Scope Deliverables & Goals</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Key milestones, deliverables, and technical stack requirements..."
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOG REVISION MODAL                                               */}
      {/* ========================================================================= */}
      {isRevisionModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#0B251A]">Log Project Scope Revision</h3>
                <p className="text-xs text-amber-700 font-bold">Revision amount will not inflate the core contract.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRevision} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Revision Title *</label>
                <input
                  type="text"
                  required
                  value={revisionForm.title}
                  onChange={(e) => setRevisionForm({ ...revisionForm, title: e.target.value })}
                  placeholder="e.g. Additional Payment Gateway Integration"
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Revision Fee (USD) *</label>
                <input
                  type="number"
                  required
                  value={revisionForm.amount}
                  onChange={(e) => setRevisionForm({ ...revisionForm, amount: Number(e.target.value) })}
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Out-of-Scope Rationale</label>
                <textarea
                  rows={2}
                  value={revisionForm.description}
                  onChange={(e) => setRevisionForm({ ...revisionForm, description: e.target.value })}
                  placeholder="Specify what additional requirements were requested beyond initial proposal..."
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA]">
                <input
                  type="checkbox"
                  id="autoInvoice"
                  checked={revisionForm.autoInvoice}
                  onChange={(e) => setRevisionForm({ ...revisionForm, autoInvoice: e.target.checked })}
                  className="size-4 accent-[#0B2E23] cursor-pointer"
                />
                <label htmlFor="autoInvoice" className="text-xs text-slate-700 font-bold cursor-pointer">
                  Auto-generate distinct revision fee invoice in Finance module
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE SPRINT TASK MODAL                                         */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-base font-extrabold text-[#0B251A]">Add Sprint Task</h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Implement JWT Refresh Rotation"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Priority</label>
                  <HeroSelect
                    value={taskForm.priority}
                    onChange={(val) => setTaskForm({ ...taskForm, priority: val as TaskPriority })}
                    options={[
                      { value: TaskPriority.LOW, label: 'Low' },
                      { value: TaskPriority.MEDIUM, label: 'Medium' },
                      { value: TaskPriority.HIGH, label: 'High' },
                      { value: TaskPriority.URGENT, label: 'Urgent' },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Est. Hours</label>
                  <input
                    type="number"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Acceptance criteria or implementation details..."
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-1.5 rounded-full bg-[#0B2E23] hover:bg-[#08221a] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
