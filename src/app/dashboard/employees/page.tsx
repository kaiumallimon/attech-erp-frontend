'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase,
  Users,
  Building2,
  Layers,
  Award,
  MapPin,
  GitGraph,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Globe,
  Mail,
  Phone,
  Clock,
  DollarSign,
  FileText,
  Shield,
  ShieldAlert,
  X,
  Sparkles,
  Info,
  Check,
  Building,
  Upload,
  Calendar,
  Lock,
  Eye,
  FileDown,
  LayoutGrid,
  ListFilter,
  UserCheck,
  FolderGit2,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '@heroui/react';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';
import { useAuth } from '../../../context/auth-context';
import {
  employeesApi,
  skillsApi,
  companyApi,
  orgApi,
  usersApi,
} from '../../../lib/api';
import {
  Employee,
  EmploymentType,
  EmploymentStatus,
  EmployeeStats,
  Skill,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  AttachDocumentPayload,
} from '../../../types/employee';
import {
  Department,
  Team,
  Position,
  Level,
  Location,
} from '../../../types/company';
import { UserProfile } from '../../../types/auth';

const EMPLOYMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Employment Types' },
  { value: EmploymentType.FULL_TIME, label: 'Full-Time Employee' },
  { value: EmploymentType.PART_TIME, label: 'Part-Time Employee' },
  { value: EmploymentType.CONTRACT, label: 'Contractor / Fixed Term' },
  { value: EmploymentType.INTERN, label: 'Intern / Apprentice' },
  { value: EmploymentType.FREELANCE, label: 'Freelance Specialist' },
  { value: EmploymentType.TEMPORARY, label: 'Temporary Staff' },
];

const EMPLOYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: EmploymentStatus.ACTIVE, label: 'Active Staff' },
  { value: EmploymentStatus.ON_LEAVE, label: 'On Leave' },
  { value: EmploymentStatus.SUSPENDED, label: 'Suspended' },
  { value: EmploymentStatus.RESIGNED, label: 'Resigned (Past)' },
  { value: EmploymentStatus.TERMINATED, label: 'Terminated (Past)' },
  { value: EmploymentStatus.RETIRED, label: 'Retired' },
];

const DOCUMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'CONTRACT', label: 'Employment Contract & Agreement' },
  { value: 'NDA', label: 'Non-Disclosure Agreement (NDA)' },
  { value: 'IDENTIFICATION', label: 'Passport / National ID / Gov ID' },
  { value: 'CERTIFICATE', label: 'Professional Certificate / License' },
  { value: 'ACADEMIC', label: 'Degree / Academic Transcript' },
  { value: 'EXPERIENCE', label: 'Experience & Recommendation Letter' },
  { value: 'OTHER', label: 'Other HR / Legal Document' },
];

type ProfileTab = 'overview' | 'employment' | 'organization' | 'skills' | 'documents' | 'projects';

export default function EmployeesWorkforcePage() {
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();

  // Core Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Lookups
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skillsLibrary, setSkillsLibrary] = useState<Skill[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPos, setSelectedPos] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLoc, setSelectedLoc] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals & Drawers
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<Employee | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('overview');

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetEmployee, setStatusTargetEmployee] = useState<Employee | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: EmploymentStatus.ACTIVE,
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTargetEmployee, setDocTargetEmployee] = useState<Employee | null>(null);
  const [docForm, setDocForm] = useState<{
    title: string;
    documentType: string;
    fileUrl: string;
    isSensitive: boolean;
  }>({
    title: '',
    documentType: 'CONTRACT',
    fileUrl: '',
    isSensitive: false,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    employee: Employee;
  } | null>(null);

  // Employee Form State
  const [employeeForm, setEmployeeForm] = useState<CreateEmployeePayload>({
    userId: '',
    departmentId: '',
    teamId: '',
    positionId: '',
    levelId: '',
    locationId: '',
    managerId: '',
    employmentType: EmploymentType.FULL_TIME,
    employmentStatus: EmploymentStatus.ACTIVE,
    joiningDate: new Date().toISOString().split('T')[0],
    probationEndDate: '',
    confirmationDate: '',
    employmentEndDate: '',
    bio: '',
    skills: [],
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  const [newSkillInput, setNewSkillInput] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Lookup Data (Departments, Teams, Positions, Levels, Locations, Skills, Users)
  const loadLookups = useCallback(async () => {
    try {
      const [deptData, teamData, posData, levelData, locData, skillData, usersRes] = await Promise.all([
        orgApi.listDepartments().catch(() => []),
        orgApi.listTeams().catch(() => []),
        orgApi.listPositions().catch(() => []),
        orgApi.listLevels().catch(() => []),
        orgApi.listLocations().catch(() => []),
        skillsApi.list().catch(() => []),
        usersApi.getAll({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      setDepartments(Array.isArray(deptData) ? deptData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
      setPositions(Array.isArray(posData) ? posData : []);
      setLevels(Array.isArray(levelData) ? levelData : []);
      setLocations(Array.isArray(locData) ? locData : []);
      setSkillsLibrary(Array.isArray(skillData) ? skillData : []);
      const uData = Array.isArray((usersRes as any)?.data)
        ? (usersRes as any).data
        : Array.isArray(usersRes)
        ? usersRes
        : [];
      setUsersList(uData);
    } catch (err) {
      console.error('Failed to load lookups:', err);
    }
  }, []);

  // Load Employees List & Stats
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, statsData] = await Promise.all([
        employeesApi.list({
          search: debouncedSearch || undefined,
          departmentId: selectedDept !== 'all' ? selectedDept : undefined,
          teamId: selectedTeam !== 'all' ? selectedTeam : undefined,
          positionId: selectedPos !== 'all' ? selectedPos : undefined,
          levelId: selectedLevel !== 'all' ? selectedLevel : undefined,
          locationId: selectedLoc !== 'all' ? selectedLoc : undefined,
          employmentType: selectedType !== 'all' ? selectedType : undefined,
          employmentStatus: selectedStatus !== 'all' ? selectedStatus : undefined,
          page: currentPage,
          limit: pageSize,
        }),
        employeesApi.getStats().catch(() => null),
      ]);

      const items = Array.isArray(res.data) ? res.data : [];
      setEmployees(items);
      setTotalCount(res.meta?.total || items.length);
      setTotalPages(res.meta?.totalPages || 1);
      setStats(statsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load employees.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    selectedDept,
    selectedTeam,
    selectedPos,
    selectedLevel,
    selectedLoc,
    selectedType,
    selectedStatus,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  // Derived options for dropdown selects
  const safeUsers = Array.isArray(usersList) ? usersList : [];
  const safeDepts = Array.isArray(departments) ? departments : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safePositions = Array.isArray(positions) ? positions : [];
  const safeLevels = Array.isArray(levels) ? levels : [];
  const safeLocations = Array.isArray(locations) ? locations : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];

  // Find users not yet linked to an employee (for new employee modal)
  const existingEmployeeUserIds = useMemo(() => {
    const set = new Set<string>();
    safeEmployees.forEach((e) => {
      const uId = typeof e.userId === 'string' ? e.userId : (e.userId as any)?.id || (e.userId as any)?._id;
      if (uId) set.add(uId.toString());
    });
    return set;
  }, [safeEmployees]);

  const userSelectOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: 'Select User Account (1:1 Link)' },
      ...safeUsers.map((u) => {
        const uId = u.id || (u as any)._id || '';
        const isLinked = existingEmployeeUserIds.has(uId.toString());
        const isEditingCurrent = editingEmployee && (typeof editingEmployee.userId === 'string' ? editingEmployee.userId : (editingEmployee.userId as any)?.id || (editingEmployee.userId as any)?._id) === uId;
        const disabled = isLinked && !isEditingCurrent;
        return {
          value: uId,
          label: `${u.firstName} ${u.lastName} (${u.email})${disabled ? ' - Already Registered' : ''}`,
        };
      }),
    ];
  }, [safeUsers, existingEmployeeUserIds, editingEmployee]);

  const deptSelectOptions: SelectOption[] = [
    { value: '', label: 'Select Department' },
    ...safeDepts.map((d) => ({
      value: d.id || (d as any)._id,
      label: `${d.name} (${d.code})`,
    })),
  ];

  const deptFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Departments' },
    ...safeDepts.map((d) => ({
      value: d.id || (d as any)._id,
      label: d.name,
    })),
  ];

  const teamFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Teams' },
    ...safeTeams.map((t) => ({
      value: t.id || (t as any)._id,
      label: t.name,
    })),
  ];

  const posFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Positions' },
    ...safePositions.map((p) => ({
      value: p.id || (p as any)._id,
      label: p.name,
    })),
  ];

  const levelFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Levels' },
    ...safeLevels.map((l) => ({
      value: l.id || (l as any)._id,
      label: `${l.name} (${l.code})`,
    })),
  ];

  const locationFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Locations' },
    ...safeLocations.map((loc) => ({
      value: loc.id || (loc as any)._id,
      label: `${loc.name} (${loc.city || loc.country || 'Global'})`,
    })),
  ];

  // Teams options filtered by selected department in the form
  const modalTeamOptions: SelectOption[] = useMemo(() => {
    const list = employeeForm.departmentId
      ? safeTeams.filter((t) => {
          const dId = typeof t.departmentId === 'string' ? t.departmentId : (t.departmentId as any)?._id || (t.departmentId as any)?.id;
          return dId === employeeForm.departmentId;
        })
      : safeTeams;

    return [
      { value: '', label: 'None / Department-wide' },
      ...list.map((t) => ({
        value: t.id || (t as any)._id,
        label: `${t.name} (${t.code})`,
      })),
    ];
  }, [safeTeams, employeeForm.departmentId]);

  const modalPosOptions: SelectOption[] = [
    { value: '', label: 'Select Position' },
    ...safePositions.map((p) => ({
      value: p.id || (p as any)._id,
      label: `${p.name} (${p.code})`,
    })),
  ];

  const modalLevelOptions: SelectOption[] = [
    { value: '', label: 'Select Level' },
    ...safeLevels.map((l) => ({
      value: l.id || (l as any)._id,
      label: `${l.name} (${l.code} - Rank ${l.rank})`,
    })),
  ];

  const modalLocationOptions: SelectOption[] = [
    { value: '', label: 'Select Location' },
    ...safeLocations.map((loc) => ({
      value: loc.id || (loc as any)._id,
      label: `${loc.name} (${loc.city || loc.country})`,
    })),
  ];

  const modalManagerOptions: SelectOption[] = useMemo(() => {
    const list = safeEmployees.filter((e) => {
      if (editingEmployee && (e.id === editingEmployee.id || (e as any)._id === editingEmployee.id)) {
        return false; // cannot be manager of oneself
      }
      return e.employmentStatus === EmploymentStatus.ACTIVE;
    });

    return [
      { value: '', label: 'None / Executive Root' },
      ...list.map((e) => {
        const u = typeof e.userId === 'object' ? (e.userId as UserProfile) : null;
        const pos = typeof e.positionId === 'object' ? (e.positionId as Position)?.name : '';
        const name = u ? `${u.firstName} ${u.lastName}` : e.employeeId;
        return {
          value: e.id || (e as any)._id,
          label: `${name} (${e.employeeId}${pos ? ` - ${pos}` : ''})`,
        };
      }),
    ];
  }, [safeEmployees, editingEmployee]);

  // =========================================================================
  // HANDLERS: ADD / EDIT EMPLOYEE
  // =========================================================================

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setWizardStep(1);
    setEmployeeForm({
      userId: '',
      departmentId: '',
      teamId: '',
      positionId: '',
      levelId: '',
      locationId: '',
      managerId: '',
      employmentType: EmploymentType.FULL_TIME,
      employmentStatus: EmploymentStatus.ACTIVE,
      joiningDate: new Date().toISOString().split('T')[0],
      probationEndDate: '',
      confirmationDate: '',
      employmentEndDate: '',
      bio: '',
      skills: [],
      portfolioUrl: '',
      githubUrl: '',
      linkedinUrl: '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setWizardStep(1);

    const uId = typeof emp.userId === 'string' ? emp.userId : (emp.userId as any)?.id || (emp.userId as any)?._id || '';
    const dId = typeof emp.departmentId === 'string' ? emp.departmentId : (emp.departmentId as any)?.id || (emp.departmentId as any)?._id || '';
    const tId = typeof emp.teamId === 'string' ? emp.teamId : (emp.teamId as any)?.id || (emp.teamId as any)?._id || '';
    const pId = typeof emp.positionId === 'string' ? emp.positionId : (emp.positionId as any)?.id || (emp.positionId as any)?._id || '';
    const lId = typeof emp.levelId === 'string' ? emp.levelId : (emp.levelId as any)?.id || (emp.levelId as any)?._id || '';
    const locId = typeof emp.locationId === 'string' ? emp.locationId : (emp.locationId as any)?.id || (emp.locationId as any)?._id || '';
    const mId = typeof emp.managerId === 'string' ? emp.managerId : (emp.managerId as any)?.id || (emp.managerId as any)?._id || '';

    setEmployeeForm({
      userId: uId,
      departmentId: dId,
      teamId: tId,
      positionId: pId,
      levelId: lId,
      locationId: locId,
      managerId: mId,
      employmentType: emp.employmentType || EmploymentType.FULL_TIME,
      employmentStatus: emp.employmentStatus || EmploymentStatus.ACTIVE,
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      probationEndDate: emp.probationEndDate ? new Date(emp.probationEndDate).toISOString().split('T')[0] : '',
      confirmationDate: emp.confirmationDate ? new Date(emp.confirmationDate).toISOString().split('T')[0] : '',
      employmentEndDate: emp.employmentEndDate ? new Date(emp.employmentEndDate).toISOString().split('T')[0] : '',
      bio: emp.bio || '',
      skills: emp.skills || [],
      portfolioUrl: emp.portfolioUrl || '',
      githubUrl: emp.githubUrl || '',
      linkedinUrl: emp.linkedinUrl || '',
    });
    setIsAddEditModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.userId) {
      showToast('Please select a User account to link to this employee.', 'error');
      setWizardStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPayload: CreateEmployeePayload = {
        userId: employeeForm.userId,
        departmentId: employeeForm.departmentId || undefined,
        teamId: employeeForm.teamId || undefined,
        positionId: employeeForm.positionId || undefined,
        levelId: employeeForm.levelId || undefined,
        locationId: employeeForm.locationId || undefined,
        managerId: employeeForm.managerId || undefined,
        employmentType: employeeForm.employmentType,
        employmentStatus: employeeForm.employmentStatus,
        joiningDate: employeeForm.joiningDate || undefined,
        probationEndDate: employeeForm.probationEndDate || undefined,
        confirmationDate: employeeForm.confirmationDate || undefined,
        employmentEndDate: employeeForm.employmentEndDate || undefined,
        bio: employeeForm.bio?.trim() || undefined,
        skills: employeeForm.skills || [],
        portfolioUrl: employeeForm.portfolioUrl?.trim() || undefined,
        githubUrl: employeeForm.githubUrl?.trim() || undefined,
        linkedinUrl: employeeForm.linkedinUrl?.trim() || undefined,
      };

      if (editingEmployee) {
        const empId = editingEmployee.id || (editingEmployee as any)._id;
        await employeesApi.update(empId, cleanPayload as UpdateEmployeePayload);
        showToast(`Employee ${editingEmployee.employeeId} updated successfully.`);
      } else {
        const created = await employeesApi.create(cleanPayload);
        showToast(`Employee ${(created as any).employeeId || 'record'} registered successfully.`);
      }

      setIsAddEditModalOpen(false);
      await loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to save employee profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSkillTag = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (employeeForm.skills?.includes(trimmed)) return;
    setEmployeeForm((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), trimmed],
    }));
    setNewSkillInput('');
  };

  const handleRemoveSkillTag = (skillToRemove: string) => {
    setEmployeeForm((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skillToRemove),
    }));
  };

  // =========================================================================
  // HANDLERS: STATUS TRANSITION
  // =========================================================================

  const handleOpenStatusModal = (emp: Employee) => {
    setStatusTargetEmployee(emp);
    setStatusForm({
      status: emp.employmentStatus,
      reason: '',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetEmployee) return;
    setIsSubmitting(true);
    try {
      const empId = statusTargetEmployee.id || (statusTargetEmployee as any)._id;
      await employeesApi.updateStatus(empId, statusForm);
      showToast(`Employee status changed to ${statusForm.status}.`);
      setIsStatusModalOpen(false);
      await loadEmployees();
      if (selectedEmployeeForView && (selectedEmployeeForView.id === empId || (selectedEmployeeForView as any)._id === empId)) {
        const refreshed = await employeesApi.getById(empId);
        setSelectedEmployeeForView(refreshed.data ?? refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update employee status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // HANDLERS: DOCUMENT ATTACHMENT
  // =========================================================================

  const handleOpenDocModal = (emp: Employee) => {
    setDocTargetEmployee(emp);
    setDocForm({
      title: '',
      documentType: 'CONTRACT',
      fileUrl: '',
      isSensitive: false,
    });
    setIsDocModalOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTargetEmployee) return;
    if (!docForm.title || !docForm.fileUrl) {
      showToast('Document title and file URL are required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const empId = docTargetEmployee.id || (docTargetEmployee as any)._id;
      await employeesApi.attachDocument(empId, {
        title: docForm.title,
        documentType: docForm.documentType,
        fileUrl: docForm.fileUrl,
        isSensitive: docForm.isSensitive,
      });
      showToast('Document attached successfully.');
      setIsDocModalOpen(false);
      await loadEmployees();
      if (selectedEmployeeForView && (selectedEmployeeForView.id === empId || (selectedEmployeeForView as any)._id === empId)) {
        const refreshed = await employeesApi.getById(empId);
        setSelectedEmployeeForView(refreshed.data ?? refreshed);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to attach document.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!selectedEmployeeForView) return;
    const empId = selectedEmployeeForView.id || (selectedEmployeeForView as any)._id;
    try {
      await employeesApi.removeDocument(empId, docId);
      showToast('Document removed successfully.');
      const refreshed = await employeesApi.getById(empId);
      setSelectedEmployeeForView(refreshed.data ?? refreshed);
      await loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove document.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS: DELETE / ARCHIVE
  // =========================================================================

  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsSubmitting(true);
    try {
      const empId = deleteConfirm.employee.id || (deleteConfirm.employee as any)._id;
      await employeesApi.delete(empId);
      showToast(`Employee ${deleteConfirm.employee.employeeId} archived successfully.`);
      setDeleteConfirm(null);
      if (selectedEmployeeForView && (selectedEmployeeForView.id === empId || (selectedEmployeeForView as any)._id === empId)) {
        setSelectedEmployeeForView(null);
      }
      await loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive employee.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProfile = async (emp: Employee) => {
    const empId = emp.id || (emp as any)._id;
    try {
      const res = await employeesApi.getById(empId);
      const detailed = res.data ?? res;
      setSelectedEmployeeForView(detailed);
      setActiveProfileTab('overview');
    } catch (err) {
      setSelectedEmployeeForView(emp);
      setActiveProfileTab('overview');
    }
  };

  // Helper getters for populating table and cards
  const getUserName = (u: any) => {
    if (!u) return 'Unassigned';
    if (typeof u === 'string') return u;
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User';
  };

  const getUserEmail = (u: any) => {
    if (!u) return '';
    if (typeof u === 'string') return '';
    return u.email || '';
  };

  const getUserAvatar = (u: any) => {
    if (!u || typeof u === 'string') return undefined;
    return u.avatar;
  };

  const getDeptName = (d: any) => {
    if (!d) return '—';
    if (typeof d === 'string') return d;
    return d.name || d.code || '—';
  };

  const getTeamName = (t: any) => {
    if (!t) return '—';
    if (typeof t === 'string') return t;
    return t.name || t.code || '—';
  };

  const getPosName = (p: any) => {
    if (!p) return '—';
    if (typeof p === 'string') return p;
    return p.name || '—';
  };

  const getLevelBadge = (l: any) => {
    if (!l) return null;
    if (typeof l === 'string') return <span className="text-xs font-mono font-bold text-slate-600">{l}</span>;
    return (
      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold">
        {l.code || l.name}
      </span>
    );
  };

  const getLocationLabel = (loc: any) => {
    if (!loc) return '—';
    if (typeof loc === 'string') return loc;
    return loc.name ? `${loc.name} (${loc.city || loc.country || 'HQ'})` : '—';
  };

  const getManagerName = (m: any) => {
    if (!m) return 'None (Executive Root)';
    if (typeof m === 'string') return m;
    const u = m.userId;
    if (u && typeof u === 'object') {
      return `${u.firstName} ${u.lastName} (${m.employeeId})`;
    }
    return m.employeeId || 'Manager';
  };

  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case EmploymentStatus.ACTIVE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case EmploymentStatus.ON_LEAVE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="size-1.5 rounded-full bg-blue-500" />
            On Leave
          </span>
        );
      case EmploymentStatus.SUSPENDED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Suspended
          </span>
        );
      case EmploymentStatus.RESIGNED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <span className="size-1.5 rounded-full bg-purple-500" />
            Resigned
          </span>
        );
      case EmploymentStatus.TERMINATED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Terminated
          </span>
        );
      case EmploymentStatus.RETIRED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <span className="size-1.5 rounded-full bg-slate-500" />
            Retired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: EmploymentType) => {
    const label = type.replace('_', ' ');
    return (
      <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#ECE5DA] text-slate-700">
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold animate-slideUp ${
            notification.type === 'success'
              ? 'bg-[#0B2E23] text-white border-[#0B251A]'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-5 text-[#AEFF48] shrink-0" />
          ) : (
            <AlertTriangle className="size-5 text-rose-200 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-[#0B2E23] text-[#AEFF48] flex items-center justify-center shadow-xs">
              <Briefcase className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#111111] tracking-tight">
                Employees & Workforce
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified workforce directory, 1:1 user linkage, organizational hierarchy, skill matrices & secure documents
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => void loadEmployees()}
            disabled={isLoading}
            className="h-10 px-3.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-2 transition-all shadow-xs"
            title="Refresh workforce telemetry"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Table / Grid Switcher */}
          <div className="flex items-center p-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-full cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-[#0B2E23] text-[#AEFF48] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view"
            >
              <ListFilter className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-[#0B2E23] text-[#AEFF48] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid card view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>

          {(isAdmin || isSuperAdmin) && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="h-10 px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-sm cursor-pointer flex items-center gap-2 transition-all"
            >
              <Plus className="size-4 text-[#AEFF48]" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Workforce Telemetry Summary Card (5 segments) */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Workforce</span>
              <div className="size-8 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-[#111111] font-mono">{stats?.totalEmployees ?? totalCount}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Registered personnel</p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Staff</span>
              <div className="size-8 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <UserCheck className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-emerald-700 font-mono">{stats?.activeEmployees ?? 0}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats?.activeRate ?? 100}% workforce active
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">On Leave / Away</span>
              <div className="size-8 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-blue-700 font-mono">{stats?.onLeaveEmployees ?? 0}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Approved leave terms</p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full-Time vs Contract</span>
              <div className="size-8 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                <Briefcase className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-2xl font-extrabold text-[#111111]">{stats?.fullTimeCount ?? 0}</span>
                <span className="text-xs text-slate-400 font-bold">/</span>
                <span className="text-sm font-bold text-slate-600">{stats?.contractCount ?? 0}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">FT / Contractors</p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Departments</span>
              <div className="size-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                <Layers className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-[#111111] font-mono">
                {stats?.departmentBreakdown?.length ?? safeDepts.length}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Organizational units</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Search & Multi-Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, ID, skills, bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2E23] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div className="lg:col-span-1">
          <HeroSelect
            value={selectedDept}
            options={deptFilterOptions}
            onChange={(val) => {
              setSelectedDept(val);
              setCurrentPage(1);
            }}
            placeholder="Department"
            className="h-11 text-xs"
          />
        </div>

        {/* Team Filter */}
        <div className="lg:col-span-1">
          <HeroSelect
            value={selectedTeam}
            options={teamFilterOptions}
            onChange={(val) => {
              setSelectedTeam(val);
              setCurrentPage(1);
            }}
            placeholder="Team"
            className="h-11 text-xs"
          />
        </div>

        {/* Position Filter */}
        <div className="lg:col-span-1">
          <HeroSelect
            value={selectedPos}
            options={posFilterOptions}
            onChange={(val) => {
              setSelectedPos(val);
              setCurrentPage(1);
            }}
            placeholder="Position"
            className="h-11 text-xs"
          />
        </div>

        {/* Level Filter */}
        <div className="lg:col-span-1">
          <HeroSelect
            value={selectedLevel}
            options={levelFilterOptions}
            onChange={(val) => {
              setSelectedLevel(val);
              setCurrentPage(1);
            }}
            placeholder="Level"
            className="h-11 text-xs"
          />
        </div>

        {/* Employment Type Filter */}
        <div className="lg:col-span-1">
          <HeroSelect
            value={selectedType}
            options={EMPLOYMENT_TYPE_OPTIONS}
            onChange={(val) => {
              setSelectedType(val);
              setCurrentPage(1);
            }}
            placeholder="Type"
            className="h-11 text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-1">
          <HeroSelect
            value={selectedStatus}
            options={EMPLOYMENT_STATUS_OPTIONS}
            onChange={(val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            }}
            placeholder="Status"
            className="h-11 text-xs"
          />
        </div>
      </div>

      {/* Directory Content Area */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAF7F2]/60 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="py-4 px-5">Employee & Account</th>
                  <th className="py-4 px-4">Department & Team</th>
                  <th className="py-4 px-4">Position & Level</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Manager</th>
                  <th className="py-4 px-4">Type & Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="py-4 px-5">
                        <div className="h-5 bg-slate-100 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : safeEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <Briefcase className="size-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700 text-sm">No employees match criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  safeEmployees.map((emp) => {
                    const u = typeof emp.userId === 'object' ? (emp.userId as UserProfile) : null;
                    const avatar = getUserAvatar(emp.userId);
                    const initials = u
                      ? `${u.firstName?.[0] || 'E'}${u.lastName?.[0] || 'P'}`.toUpperCase()
                      : emp.employeeId.slice(0, 2);

                    return (
                      <tr
                        key={emp.id || (emp as any)._id}
                        className="hover:bg-[#FAF7F2]/40 transition-colors group cursor-pointer"
                        onClick={() => handleViewProfile(emp)}
                      >
                        {/* Employee & Account */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-[#0B2E23] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                              {avatar ? (
                                <img src={avatar} alt="" className="size-full object-cover" />
                              ) : (
                                <span>{initials}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 text-xs hover:text-[#0B2E23]">
                                  {getUserName(emp.userId)}
                                </p>
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                  {emp.employeeId}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {getUserEmail(emp.userId)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Department & Team */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{getDeptName(emp.departmentId)}</p>
                            <p className="text-[11px] text-slate-400">{getTeamName(emp.teamId)}</p>
                          </div>
                        </td>

                        {/* Position & Level */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 text-xs">{getPosName(emp.positionId)}</p>
                            <div>{getLevelBadge(emp.levelId)}</div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600 font-medium">{getLocationLabel(emp.locationId)}</span>
                        </td>

                        {/* Manager */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600">{getManagerName(emp.managerId)}</span>
                        </td>

                        {/* Type & Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {getStatusBadge(emp.employmentStatus)}
                            {getTypeBadge(emp.employmentType)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-5 text-right space-x-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleViewProfile(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white border border-transparent hover:border-[#E5E7EB] transition-all cursor-pointer"
                            title="View employee profile"
                          >
                            <Eye className="size-4" />
                          </button>

                          {(isAdmin || isSuperAdmin) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(emp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                                title="Edit employee profile"
                              >
                                <Edit2 className="size-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenStatusModal(emp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-all cursor-pointer"
                                title="Change lifecycle status"
                              >
                                <Shield className="size-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDocModal(emp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                                title="Attach document"
                              >
                                <Upload className="size-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ isOpen: true, employee: emp })}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Archive employee"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#E5E7EB] bg-[#FAF7F2]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{safeEmployees.length}</span> of{' '}
              <span className="font-bold text-slate-800">{totalCount}</span> employees
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <span className="px-3 py-1 font-mono font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoading}
                className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </Card>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 bg-white border border-[#E5E7EB] rounded-4xl animate-pulse space-y-4">
                <div className="size-12 bg-slate-100 rounded-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </Card>
            ))
          ) : safeEmployees.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Briefcase className="size-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">No employees match criteria</p>
            </div>
          ) : (
            safeEmployees.map((emp) => {
              const u = typeof emp.userId === 'object' ? (emp.userId as UserProfile) : null;
              const avatar = getUserAvatar(emp.userId);
              const initials = u
                ? `${u.firstName?.[0] || 'E'}${u.lastName?.[0] || 'P'}`.toUpperCase()
                : emp.employeeId.slice(0, 2);

              return (
                <Card
                  key={emp.id || (emp as any)._id}
                  className="p-5 bg-white border border-[#E5E7EB] rounded-4xl shadow-xs hover:border-[#0B2E23] transition-all space-y-4 cursor-pointer flex flex-col justify-between"
                  onClick={() => handleViewProfile(emp)}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-[#0B2E23] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                          {avatar ? (
                            <img src={avatar} alt="" className="size-full object-cover" />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-slate-900 text-sm">{getUserName(emp.userId)}</h3>
                          </div>
                          <span className="font-mono text-[10.5px] font-bold text-slate-400">
                            {emp.employeeId}
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(emp.employmentStatus)}</div>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-slate-800">{getPosName(emp.positionId)}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {getDeptName(emp.departmentId)} {emp.teamId ? `• ${getTeamName(emp.teamId)}` : ''}
                      </p>
                    </div>

                    {emp.bio && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {emp.bio}
                      </p>
                    )}

                    {/* Skill Badges */}
                    {emp.skills && emp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {emp.skills.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                          >
                            {s}
                          </span>
                        ))}
                        {emp.skills.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                            +{emp.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#ECE5DA] flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-600">{getLocationLabel(emp.locationId)}</span>
                    <span className="font-bold text-[#0B2E23] flex items-center gap-1 hover:underline">
                      View Profile <ArrowUpRight className="size-3" />
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED EMPLOYEE PROFILE DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedEmployeeForView && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 bg-[#0B2E23] text-white flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl overflow-hidden shadow-inner shrink-0">
                  {getUserAvatar(selectedEmployeeForView.userId) ? (
                    <img src={getUserAvatar(selectedEmployeeForView.userId)} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-[#AEFF48]">
                      {getUserName(selectedEmployeeForView.userId).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-white">
                      {getUserName(selectedEmployeeForView.userId)}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#AEFF48] text-[#0B2E23] font-mono text-xs font-bold shadow-xs">
                      {selectedEmployeeForView.employeeId}
                    </span>
                    {getStatusBadge(selectedEmployeeForView.employmentStatus)}
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">
                    {getPosName(selectedEmployeeForView.positionId)} • {getDeptName(selectedEmployeeForView.departmentId)}
                  </p>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                    {getUserEmail(selectedEmployeeForView.userId)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployeeForView(null)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Profile Tabs Navigation */}
            <div className="flex items-center gap-2 p-3 bg-[#FAF7F2] border-b border-[#ECE5DA] overflow-x-auto shrink-0">
              {(
                [
                  { key: 'overview', label: 'Overview', icon: UserCheck },
                  { key: 'employment', label: 'Employment', icon: Calendar },
                  { key: 'organization', label: 'Organization', icon: GitGraph },
                  { key: 'skills', label: 'Skills & Credentials', icon: Award },
                  { key: 'documents', label: `Documents (${selectedEmployeeForView.documents?.length || 0})`, icon: FileText },
                  { key: 'projects', label: 'Projects', icon: FolderGit2 },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeProfileTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveProfileTab(tab.key)}
                    className={`h-9 px-4 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-[#0B2E23] text-[#AEFF48] shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-[#ECE5DA]'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Tab Contents */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB: OVERVIEW */}
              {activeProfileTab === 'overview' && (
                <div className="space-y-6">
                  {/* Bio */}
                  {selectedEmployeeForView.bio && (
                    <div className="p-4 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-1.5">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Professional Bio</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{selectedEmployeeForView.bio}</p>
                    </div>
                  )}

                  {/* Quick Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-3xl border border-[#E5E7EB] bg-white space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                      <p className="text-xs font-bold text-slate-800">{getDeptName(selectedEmployeeForView.departmentId)}</p>
                    </div>
                    <div className="p-4 rounded-3xl border border-[#E5E7EB] bg-white space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team</p>
                      <p className="text-xs font-bold text-slate-800">{getTeamName(selectedEmployeeForView.teamId)}</p>
                    </div>
                    <div className="p-4 rounded-3xl border border-[#E5E7EB] bg-white space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                      <p className="text-xs font-bold text-slate-800">{getLocationLabel(selectedEmployeeForView.locationId)}</p>
                    </div>
                    <div className="p-4 rounded-3xl border border-[#E5E7EB] bg-white space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting Manager</p>
                      <p className="text-xs font-bold text-slate-800">{getManagerName(selectedEmployeeForView.managerId)}</p>
                    </div>
                    <div className="p-4 rounded-3xl border border-[#E5E7EB] bg-white space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employment Type</p>
                      <p className="text-xs font-bold text-slate-800">{selectedEmployeeForView.employmentType?.replace('_', ' ')}</p>
                    </div>
                    <div className="p-4 rounded-3xl border border-[#E5E7EB] bg-white space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joining Date</p>
                      <p className="text-xs font-bold text-slate-800">
                        {selectedEmployeeForView.joiningDate ? new Date(selectedEmployeeForView.joiningDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Social & Portfolio Links */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {selectedEmployeeForView.portfolioUrl && (
                      <a
                        href={selectedEmployeeForView.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-4 rounded-full bg-[#FAF7F2] hover:bg-[#ECE5DA] border border-[#ECE5DA] text-slate-700 font-bold flex items-center gap-2 transition-colors text-xs"
                      >
                        <Globe className="size-3.5 text-emerald-700" />
                        <span>Portfolio Website</span>
                        <ExternalLink className="size-3 text-slate-400" />
                      </a>
                    )}
                    {selectedEmployeeForView.githubUrl && (
                      <a
                        href={selectedEmployeeForView.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-4 rounded-full bg-[#FAF7F2] hover:bg-[#ECE5DA] border border-[#ECE5DA] text-slate-700 font-bold flex items-center gap-2 transition-colors text-xs"
                      >
                        <span>GitHub Profile</span>
                        <ExternalLink className="size-3 text-slate-400" />
                      </a>
                    )}
                    {selectedEmployeeForView.linkedinUrl && (
                      <a
                        href={selectedEmployeeForView.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-4 rounded-full bg-[#FAF7F2] hover:bg-[#ECE5DA] border border-[#ECE5DA] text-slate-700 font-bold flex items-center gap-2 transition-colors text-xs"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="size-3 text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: EMPLOYMENT */}
              {activeProfileTab === 'employment' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-4xl bg-[#FAF7F2] border border-[#ECE5DA] space-y-4">
                    <h3 className="font-extrabold text-sm text-[#111111]">Employment Lifecycle Milestones</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-3xl bg-white border border-[#ECE5DA] space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joining Date</p>
                        <p className="text-xs font-extrabold text-slate-900">
                          {selectedEmployeeForView.joiningDate ? new Date(selectedEmployeeForView.joiningDate).toLocaleDateString() : '—'}
                        </p>
                      </div>

                      <div className="p-4 rounded-3xl bg-white border border-[#ECE5DA] space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Probation End Date</p>
                        <p className="text-xs font-extrabold text-slate-900">
                          {selectedEmployeeForView.probationEndDate ? new Date(selectedEmployeeForView.probationEndDate).toLocaleDateString() : '—'}
                        </p>
                      </div>

                      <div className="p-4 rounded-3xl bg-white border border-[#ECE5DA] space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirmation Date</p>
                        <p className="text-xs font-extrabold text-slate-900">
                          {selectedEmployeeForView.confirmationDate ? new Date(selectedEmployeeForView.confirmationDate).toLocaleDateString() : 'Pending confirmation'}
                        </p>
                      </div>

                      <div className="p-4 rounded-3xl bg-white border border-[#ECE5DA] space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contract End Date</p>
                        <p className="text-xs font-extrabold text-slate-900">
                          {selectedEmployeeForView.employmentEndDate ? new Date(selectedEmployeeForView.employmentEndDate).toLocaleDateString() : 'Indefinite / Permanent'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ORGANIZATION */}
              {activeProfileTab === 'organization' && (
                <div className="space-y-6">
                  {/* Reporting Manager Card */}
                  <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] space-y-3">
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Direct Manager</p>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA]">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-2xl bg-[#0B2E23] text-[#AEFF48] font-bold text-xs flex items-center justify-center">
                          <Users className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{getManagerName(selectedEmployeeForView.managerId)}</p>
                          <p className="text-[11px] text-slate-500">Supervisory reporting manager</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Direct Reports */}
                  <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        Direct Reports ({selectedEmployeeForView.directReports?.length || 0})
                      </p>
                    </div>

                    {!selectedEmployeeForView.directReports || selectedEmployeeForView.directReports.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No employees report to this team member.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedEmployeeForView.directReports.map((dr) => (
                          <div
                            key={dr.employeeId}
                            className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-slate-800 text-xs">
                                {dr.userId?.firstName} {dr.userId?.lastName}
                              </p>
                              <span className="font-mono text-[10px] text-slate-500">
                                {dr.employeeId} • {dr.positionId?.name || 'Position'}
                              </span>
                            </div>
                            {getStatusBadge(dr.employmentStatus)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SKILLS & CREDENTIALS */}
              {activeProfileTab === 'skills' && (
                <div className="space-y-6">
                  {/* Skills Cloud */}
                  <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] space-y-3">
                    <h3 className="font-extrabold text-sm text-[#111111]">Technical & Domain Skills</h3>
                    {!selectedEmployeeForView.skills || selectedEmployeeForView.skills.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No skills recorded yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployeeForView.skills.map((s) => (
                          <span
                            key={s}
                            className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                          >
                            <Tag className="size-3 text-emerald-600" />
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certifications */}
                  <div className="p-5 rounded-4xl bg-white border border-[#E5E7EB] space-y-3">
                    <h3 className="font-extrabold text-sm text-[#111111]">Certifications & Accreditations</h3>
                    {!selectedEmployeeForView.certifications || selectedEmployeeForView.certifications.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No certifications attached.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmployeeForView.certifications.map((c, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#ECE5DA] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Award className="size-5 text-purple-600 shrink-0" />
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                                <p className="text-[11px] text-slate-500">{c.issuer}</p>
                              </div>
                            </div>
                            {c.credentialUrl && (
                              <a
                                href={c.credentialUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                              >
                                <span>Verify</span>
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: DOCUMENTS */}
              {activeProfileTab === 'documents' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#111111]">Employee Document Repository</h3>
                      <p className="text-xs text-slate-400">Contracts, NDAs, credentials & identification</p>
                    </div>

                    {(isAdmin || isSuperAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleOpenDocModal(selectedEmployeeForView)}
                        className="h-9 px-4 bg-[#0B2E23] text-[#AEFF48] rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer"
                      >
                        <Upload className="size-3.5" />
                        <span>Upload Document</span>
                      </button>
                    )}
                  </div>

                  {!selectedEmployeeForView.documents || selectedEmployeeForView.documents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 bg-[#FAF7F2] rounded-3xl border border-[#ECE5DA]">
                      <FileText className="size-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No documents on file</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedEmployeeForView.documents.map((doc: any) => (
                        <div
                          key={doc.id || doc._id}
                          className="p-4 rounded-3xl bg-white border border-[#E5E7EB] hover:border-slate-300 transition-all flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              <FileText className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-xs">{doc.title}</h4>
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                  {doc.documentType}
                                </span>
                                {doc.isSensitive && (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                                    <Lock className="size-2.5" /> Confidential
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] text-slate-400 mt-0.5">
                                Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <FileDown className="size-3.5" />
                              <span>Download</span>
                            </a>

                            {(isAdmin || isSuperAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(doc.id || doc._id)}
                                className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete document"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PROJECTS */}
              {activeProfileTab === 'projects' && (
                <div className="p-8 rounded-4xl bg-[#FAF7F2] border border-[#ECE5DA] text-center space-y-3">
                  <div className="size-12 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <FolderGit2 className="size-6" />
                  </div>
                  <h3 className="font-extrabold text-sm text-[#111111]">Project Management Integration</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    This section will automatically index client deliverables, assigned sprint tickets, code reviews, and time tracking once the Project Management module is activated.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT EMPLOYEE MODAL (4-STEP WIZARD) */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full my-8 flex flex-col overflow-hidden animate-scaleUp">
            <div className="p-6 bg-[#0B2E23] text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  {editingEmployee ? `Edit Employee (${editingEmployee.employeeId})` : 'Register New Employee'}
                </h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Step {wizardStep} of 4: {
                    wizardStep === 1
                      ? 'User Account Linkage'
                      : wizardStep === 2
                      ? 'Organizational Placement'
                      : wizardStep === 3
                      ? 'Employment Terms'
                      : 'Professional Skills & Bio'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 border-b border-[#E5E7EB] text-center text-xs font-bold bg-[#FAF7F2]">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setWizardStep(step as any)}
                  className={`py-3 border-b-2 transition-colors cursor-pointer ${
                    wizardStep === step
                      ? 'border-[#0B2E23] text-[#0B2E23]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Step {step}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-5 text-xs">
              {/* STEP 1: USER ACCOUNT LINKAGE */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <p className="font-bold">1:1 Account Architecture</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Select an existing User login account. The Employee entity will represent their employment and organizational records.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Associated User Account <span className="text-rose-500">*</span>
                    </label>
                    <HeroSelect
                      value={employeeForm.userId}
                      options={userSelectOptions}
                      onChange={(val) => setEmployeeForm((prev) => ({ ...prev, userId: val }))}
                      disabled={!!editingEmployee}
                      placeholder="Select user account"
                      className="h-11 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: ORGANIZATIONAL PLACEMENT */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Department</label>
                      <HeroSelect
                        value={employeeForm.departmentId || ''}
                        options={deptSelectOptions}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, departmentId: val, teamId: '' }))}
                        placeholder="Select Department"
                        className="h-11 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Team</label>
                      <HeroSelect
                        value={employeeForm.teamId || ''}
                        options={modalTeamOptions}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, teamId: val }))}
                        placeholder="Select Team"
                        className="h-11 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Position Title</label>
                      <HeroSelect
                        value={employeeForm.positionId || ''}
                        options={modalPosOptions}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, positionId: val }))}
                        placeholder="Select Position"
                        className="h-11 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Hierarchy Level</label>
                      <HeroSelect
                        value={employeeForm.levelId || ''}
                        options={modalLevelOptions}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, levelId: val }))}
                        placeholder="Select Level"
                        className="h-11 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Workplace Location</label>
                      <HeroSelect
                        value={employeeForm.locationId || ''}
                        options={modalLocationOptions}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, locationId: val }))}
                        placeholder="Select Location"
                        className="h-11 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Reporting Manager</label>
                      <HeroSelect
                        value={employeeForm.managerId || ''}
                        options={modalManagerOptions}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, managerId: val }))}
                        placeholder="Select Manager"
                        className="h-11 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: EMPLOYMENT TERMS & DATES */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Employment Type</label>
                      <HeroSelect
                        value={employeeForm.employmentType || EmploymentType.FULL_TIME}
                        options={EMPLOYMENT_TYPE_OPTIONS.filter((o) => o.value !== 'all')}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, employmentType: val as any }))}
                        className="h-11 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Employment Status</label>
                      <HeroSelect
                        value={employeeForm.employmentStatus || EmploymentStatus.ACTIVE}
                        options={EMPLOYMENT_STATUS_OPTIONS.filter((o) => o.value !== 'all')}
                        onChange={(val) => setEmployeeForm((prev) => ({ ...prev, employmentStatus: val as any }))}
                        className="h-11 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Joining Date</label>
                      <input
                        type="date"
                        value={employeeForm.joiningDate || ''}
                        onChange={(e) => setEmployeeForm((prev) => ({ ...prev, joiningDate: e.target.value }))}
                        className="w-full h-11 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Probation End Date</label>
                      <input
                        type="date"
                        value={employeeForm.probationEndDate || ''}
                        onChange={(e) => setEmployeeForm((prev) => ({ ...prev, probationEndDate: e.target.value }))}
                        className="w-full h-11 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Confirmation Date</label>
                      <input
                        type="date"
                        value={employeeForm.confirmationDate || ''}
                        onChange={(e) => setEmployeeForm((prev) => ({ ...prev, confirmationDate: e.target.value }))}
                        className="w-full h-11 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Contract / End Date</label>
                      <input
                        type="date"
                        value={employeeForm.employmentEndDate || ''}
                        onChange={(e) => setEmployeeForm((prev) => ({ ...prev, employmentEndDate: e.target.value }))}
                        className="w-full h-11 px-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PROFESSIONAL PROFILE & SKILLS */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Professional Bio</label>
                    <textarea
                      rows={3}
                      placeholder="Brief background and career overview..."
                      value={employeeForm.bio || ''}
                      onChange={(e) => setEmployeeForm((prev) => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                    />
                  </div>

                  {/* Skills Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Skills & Technologies</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add a skill (e.g. Next.js, Flutter, AWS)..."
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkillTag(newSkillInput);
                          }
                        }}
                        className="flex-1 h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-800 focus:outline-none focus:border-[#0B2E23]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillTag(newSkillInput)}
                        className="h-10 px-4 rounded-xl bg-[#0B2E23] text-[#AEFF48] font-bold text-xs cursor-pointer hover:bg-[#0B251A]"
                      >
                        Add
                      </button>
                    </div>

                    {/* Skill Library Quick Chips */}
                    {skillsLibrary.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {skillsLibrary.slice(0, 8).map((sk) => (
                          <button
                            key={sk.name}
                            type="button"
                            onClick={() => handleAddSkillTag(sk.name)}
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer"
                          >
                            + {sk.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Assigned Skills Badges */}
                    <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-[#FAF7F2] rounded-2xl border border-[#ECE5DA]">
                      {(!employeeForm.skills || employeeForm.skills.length === 0) && (
                        <span className="text-slate-400 italic text-[11px]">No skills selected yet</span>
                      )}
                      {employeeForm.skills?.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkillTag(s)}
                            className="hover:text-rose-700 cursor-pointer"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Portfolio URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={employeeForm.portfolioUrl || ''}
                        onChange={(e) => setEmployeeForm((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">GitHub URL</label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={employeeForm.githubUrl || ''}
                        onChange={(e) => setEmployeeForm((prev) => ({ ...prev, githubUrl: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={employeeForm.linkedinUrl || ''}
                        onChange={(e) => setEmployeeForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                <div>
                  {wizardStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep((s) => (s - 1) as any)}
                      className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-700 font-bold hover:bg-[#FAF7F2] cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="h-10 px-4 rounded-full border border-[#E5E7EB] text-slate-600 hover:bg-[#FAF7F2] cursor-pointer font-bold"
                  >
                    Cancel
                  </button>

                  {wizardStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep((s) => (s + 1) as any)}
                      className="h-10 px-6 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold cursor-pointer hover:bg-[#0B251A]"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-10 px-6 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold cursor-pointer hover:bg-[#0B251A] disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Complete Registration'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUS TRANSITION MODAL */}
      {/* ========================================================================= */}
      {isStatusModalOpen && statusTargetEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#111111]">
                Change Status: {statusTargetEmployee.employeeId}
              </h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">New Status</label>
                <HeroSelect
                  value={statusForm.status}
                  options={EMPLOYMENT_STATUS_OPTIONS.filter((o) => o.value !== 'all')}
                  onChange={(val) => setStatusForm((prev) => ({ ...prev, status: val as any }))}
                  className="h-11 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Reason / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Parental leave, sabbatical, project completion..."
                  value={statusForm.reason}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-3 rounded-2xl border border-[#E5E7EB] bg-white text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Effective Date</label>
                <input
                  type="date"
                  value={statusForm.effectiveDate}
                  onChange={(e) => setStatusForm((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold"
                >
                  {isSubmitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATTACH DOCUMENT MODAL */}
      {/* ========================================================================= */}
      {isDocModalOpen && docTargetEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#111111]">
                Attach Document: {docTargetEmployee.employeeId}
              </h3>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master Services Agreement 2026"
                  value={docForm.title}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Document Type</label>
                <HeroSelect
                  value={docForm.documentType}
                  options={DOCUMENT_TYPE_OPTIONS}
                  onChange={(val) => setDocForm((prev) => ({ ...prev, documentType: val }))}
                  className="h-11 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">File URL / Cloudinary CDN</label>
                <input
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sensitiveCheck"
                  checked={docForm.isSensitive}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, isSensitive: e.target.checked }))}
                  className="rounded text-[#0B2E23] focus:ring-0"
                />
                <label htmlFor="sensitiveCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Confidential Document (Restricted access)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-[#E5E7EB] text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-full bg-[#0B2E23] text-[#AEFF48] font-bold"
                >
                  {isSubmitting ? 'Attaching...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-4xl border border-[#E5E7EB] shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="size-12 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-sm text-slate-900">
                Archive Employee {deleteConfirm.employee.employeeId}?
              </h3>
              <p className="text-xs text-slate-500">
                This will transition the employee to TERMINATED status and soft-delete their profile while preserving historical links to projects, documents, and audit logs.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="h-10 px-5 rounded-full border border-[#E5E7EB] text-slate-700 font-bold hover:bg-slate-50 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
