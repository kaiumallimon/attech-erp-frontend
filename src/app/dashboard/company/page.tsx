'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
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
  ChevronDown,
  Globe,
  Mail,
  Phone,
  Clock,
  DollarSign,
  FileText,
  Shield,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
  Check,
  Building,
} from 'lucide-react';
import { Card } from '@heroui/react';
import { HeroSelect, SelectOption } from '../../../components/ui/hero-select';
import { useAuth } from '../../../context/auth-context';
import { companyApi, orgApi, usersApi } from '../../../lib/api';
import {
  Company,
  CompanyStatus,
  Department,
  Team,
  Position,
  Level,
  Location,
  LocationType,
  OrgStatus,
  OrgChartTree,
  CompanyStats,
  UserSummary,
} from '../../../types/company';

type TabKey =
  | 'overview'
  | 'profile'
  | 'departments'
  | 'teams'
  | 'positions'
  | 'levels'
  | 'locations'
  | 'org-chart';

const TAB_CONFIG: { key: TabKey; label: string; icon: any; badge?: string }[] = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'profile', label: 'Company Profile', icon: FileText },
  { key: 'departments', label: 'Departments', icon: Layers },
  { key: 'teams', label: 'Teams', icon: Users },
  { key: 'positions', label: 'Positions', icon: Award },
  { key: 'levels', label: 'Levels & Hierarchy', icon: GitGraph },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'org-chart', label: 'Org Chart', icon: Sparkles },
];

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: OrgStatus.ACTIVE, label: 'Active Only' },
  { value: OrgStatus.INACTIVE, label: 'Inactive' },
];

const LOCATION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All Location Types' },
  { value: LocationType.OFFICE, label: 'Corporate Office' },
  { value: LocationType.REMOTE, label: 'Remote / Virtual' },
  { value: LocationType.HYBRID, label: 'Hybrid Workplace' },
  { value: LocationType.CLIENT_SITE, label: 'Client Site' },
  { value: LocationType.OTHER, label: 'Other Facilities' },
];

export default function CompanyOrganizationPage() {
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Core Data States
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [orgChart, setOrgChart] = useState<OrgChartTree | null>(null);
  const [usersList, setUsersList] = useState<UserSummary[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('all');
  const [locationTypeFilter, setLocationTypeFilter] = useState('all');

  // Modals States
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', headId: '', status: OrgStatus.ACTIVE });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', code: '', description: '', departmentId: '', leadId: '', status: OrgStatus.ACTIVE });

  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [posForm, setPosForm] = useState({ name: '', code: '', description: '', departmentId: '', levelId: '', status: OrgStatus.ACTIVE });

  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelForm, setLevelForm] = useState({ name: '', code: '', description: '', rank: 1, status: OrgStatus.ACTIVE });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    type: LocationType.OFFICE,
    address: '',
    city: '',
    country: '',
    timezone: 'America/New_York',
    description: '',
    status: OrgStatus.ACTIVE,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'department' | 'team' | 'position' | 'level' | 'location';
    id: string;
    title: string;
    description: string;
  } | null>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Partial<Company>>({});
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Fetch all core data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        companyData,
        statsData,
        deptData,
        teamData,
        posData,
        levelData,
        locData,
        chartData,
        userRes,
      ] = await Promise.all([
        companyApi.getProfile().catch(() => null),
        companyApi.getStats().catch(() => null),
        orgApi.listDepartments().catch(() => []),
        orgApi.listTeams().catch(() => []),
        orgApi.listPositions().catch(() => []),
        orgApi.listLevels().catch(() => []),
        orgApi.listLocations().catch(() => []),
        companyApi.getOrgChart().catch(() => null),
        usersApi.getAll({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      if (companyData) {
        const rawComp = (companyData as any)?.data ?? companyData;
        setCompany(rawComp);
        setProfileForm(rawComp);
      }
      setStats(statsData || null);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setTeams(Array.isArray(teamData) ? teamData : []);
      setPositions(Array.isArray(posData) ? posData : []);
      setLevels(Array.isArray(levelData) ? levelData : []);
      setLocations(Array.isArray(locData) ? locData : []);
      setOrgChart(chartData || null);
      const extractedUsers = Array.isArray((userRes as any)?.data)
        ? (userRes as any).data
        : Array.isArray(userRes)
        ? userRes
        : [];
      setUsersList(extractedUsers);
    } catch (err: any) {
      showToast(err.message || 'Failed to load company organization data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // =========================================================================
  // HANDLERS: COMPANY PROFILE
  // =========================================================================

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const cleanPayload: Partial<Company> = {
        name: profileForm.name,
        legalName: profileForm.legalName,
        logo: profileForm.logo,
        shortDescription: profileForm.shortDescription,
        industry: profileForm.industry,
        website: profileForm.website,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        country: profileForm.country,
        postalCode: profileForm.postalCode,
        timezone: profileForm.timezone,
        currency: profileForm.currency,
        fiscalYear: profileForm.fiscalYear,
        taxId: profileForm.taxId,
        vatNumber: profileForm.vatNumber,
        registrationNumber: profileForm.registrationNumber,
        status: profileForm.status,
      };

      const res = await companyApi.updateProfile(cleanPayload);
      const updated = (res as any)?.data ?? res;
      if (updated) {
        setCompany(updated);
        setProfileForm(updated);
      }
      setIsProfileSaved(true);
      showToast('Company business profile updated successfully.');
      setTimeout(() => setIsProfileSaved(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Failed to update company profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // HANDLERS: DEPARTMENTS
  // =========================================================================

  const handleOpenDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        code: dept.code,
        description: dept.description || '',
        headId: typeof dept.headId === 'string' ? dept.headId : (dept.headId as any)?._id || (dept.head as any)?._id || '',
        status: dept.status || OrgStatus.ACTIVE,
      });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', code: '', description: '', headId: '', status: OrgStatus.ACTIVE });
    }
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      showToast('Department name and code are required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingDept) {
        await orgApi.updateDepartment(editingDept.id || (editingDept as any)._id, deptForm);
        showToast(`Department '${deptForm.name}' updated successfully.`);
      } else {
        await orgApi.createDepartment(deptForm);
        showToast(`Department '${deptForm.name}' created successfully.`);
      }
      setIsDeptModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save department.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDeptStatus = async (dept: Department) => {
    try {
      await orgApi.toggleDepartmentStatus(dept.id || (dept as any)._id);
      showToast(`Department status changed.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS: TEAMS
  // =========================================================================

  const handleOpenTeamModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamForm({
        name: team.name,
        code: team.code,
        description: team.description || '',
        departmentId: typeof team.departmentId === 'string' ? team.departmentId : (team.departmentId as any)?._id || '',
        leadId: typeof team.leadId === 'string' ? team.leadId : (team.leadId as any)?._id || '',
        status: team.status || OrgStatus.ACTIVE,
      });
    } else {
      setEditingTeam(null);
      setTeamForm({
        name: '',
        code: '',
        description: '',
        departmentId: departments[0]?.id || (departments[0] as any)?._id || '',
        leadId: '',
        status: OrgStatus.ACTIVE,
      });
    }
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.code || !teamForm.departmentId) {
      showToast('Team name, code, and department are required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingTeam) {
        await orgApi.updateTeam(editingTeam.id || (editingTeam as any)._id, teamForm);
        showToast(`Team '${teamForm.name}' updated successfully.`);
      } else {
        await orgApi.createTeam(teamForm);
        showToast(`Team '${teamForm.name}' created successfully.`);
      }
      setIsTeamModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save team.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTeamStatus = async (team: Team) => {
    try {
      await orgApi.toggleTeamStatus(team.id || (team as any)._id);
      showToast('Team status changed.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS: POSITIONS
  // =========================================================================

  const handleOpenPosModal = (pos?: Position) => {
    if (pos) {
      setEditingPos(pos);
      setPosForm({
        name: pos.name,
        code: pos.code,
        description: pos.description || '',
        departmentId: typeof pos.departmentId === 'string' ? pos.departmentId : (pos.departmentId as any)?._id || '',
        levelId: typeof pos.levelId === 'string' ? pos.levelId : (pos.levelId as any)?._id || '',
        status: pos.status || OrgStatus.ACTIVE,
      });
    } else {
      setEditingPos(null);
      setPosForm({
        name: '',
        code: '',
        description: '',
        departmentId: '',
        levelId: '',
        status: OrgStatus.ACTIVE,
      });
    }
    setIsPosModalOpen(true);
  };

  const handleSavePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posForm.name || !posForm.code) {
      showToast('Position name and code are required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingPos) {
        await orgApi.updatePosition(editingPos.id || (editingPos as any)._id, posForm);
        showToast(`Position '${posForm.name}' updated successfully.`);
      } else {
        await orgApi.createPosition(posForm);
        showToast(`Position '${posForm.name}' created successfully.`);
      }
      setIsPosModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save position.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePosStatus = async (pos: Position) => {
    try {
      await orgApi.togglePositionStatus(pos.id || (pos as any)._id);
      showToast('Position status changed.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS: LEVELS & RANKING
  // =========================================================================

  const handleOpenLevelModal = (lvl?: Level) => {
    if (lvl) {
      setEditingLevel(lvl);
      setLevelForm({
        name: lvl.name,
        code: lvl.code,
        description: lvl.description || '',
        rank: lvl.rank,
        status: lvl.status || OrgStatus.ACTIVE,
      });
    } else {
      setEditingLevel(null);
      setLevelForm({
        name: '',
        code: '',
        description: '',
        rank: levels.length + 1,
        status: OrgStatus.ACTIVE,
      });
    }
    setIsLevelModalOpen(true);
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.name || !levelForm.code) {
      showToast('Level name and code are required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingLevel) {
        await orgApi.updateLevel(editingLevel.id || (editingLevel as any)._id, levelForm);
        showToast(`Level '${levelForm.name}' updated successfully.`);
      } else {
        await orgApi.createLevel(levelForm);
        showToast(`Level '${levelForm.name}' created successfully.`);
      }
      setIsLevelModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save level.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveRank = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === levels.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...levels];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const rankPayload = reordered.map((lvl, idx) => ({
      id: lvl.id || (lvl as any)._id,
      rank: idx + 1,
    }));

    try {
      await orgApi.reorderLevels(rankPayload);
      showToast('Levels hierarchy rank updated.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reorder levels.', 'error');
    }
  };

  const handleToggleLevelStatus = async (lvl: Level) => {
    try {
      await orgApi.toggleLevelStatus(lvl.id || (lvl as any)._id);
      showToast('Level status changed.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS: LOCATIONS
  // =========================================================================

  const handleOpenLocationModal = (loc?: Location) => {
    if (loc) {
      setEditingLocation(loc);
      setLocationForm({
        name: loc.name,
        type: loc.type,
        address: loc.address || '',
        city: loc.city || '',
        country: loc.country || '',
        timezone: loc.timezone || 'America/New_York',
        description: loc.description || '',
        status: loc.status || OrgStatus.ACTIVE,
      });
    } else {
      setEditingLocation(null);
      setLocationForm({
        name: '',
        type: LocationType.OFFICE,
        address: '',
        city: '',
        country: 'United States',
        timezone: 'America/New_York',
        description: '',
        status: OrgStatus.ACTIVE,
      });
    }
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name) {
      showToast('Location name is required.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingLocation) {
        await orgApi.updateLocation(editingLocation.id || (editingLocation as any)._id, locationForm);
        showToast(`Location '${locationForm.name}' updated successfully.`);
      } else {
        await orgApi.createLocation(locationForm);
        showToast(`Location '${locationForm.name}' created successfully.`);
      }
      setIsLocationModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save location.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLocationStatus = async (loc: Location) => {
    try {
      await orgApi.toggleLocationStatus(loc.id || (loc as any)._id);
      showToast('Location status changed.');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // =========================================================================
  // GENERIC DELETE EXECUTION
  // =========================================================================

  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsSubmitting(true);
    try {
      const { type, id } = deleteConfirm;
      if (type === 'department') await orgApi.deleteDepartment(id);
      if (type === 'team') await orgApi.deleteTeam(id);
      if (type === 'position') await orgApi.deletePosition(id);
      if (type === 'level') await orgApi.deleteLevel(id);
      if (type === 'location') await orgApi.deleteLocation(id);

      showToast(`${deleteConfirm.title} deleted successfully.`);
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers for Dropdown Selects
  const safeUsersList = Array.isArray(usersList) ? usersList : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safePositions = Array.isArray(positions) ? positions : [];
  const safeLevels = Array.isArray(levels) ? levels : [];
  const safeLocations = Array.isArray(locations) ? locations : [];

  const userSelectOptions: SelectOption[] = [
    { value: '', label: 'Unassigned / None' },
    ...safeUsersList.map((u) => ({
      value: u.id || (u as any)._id || '',
      label: `${u.firstName} ${u.lastName} (${u.email})`,
    })),
  ];

  const deptSelectOptions: SelectOption[] = [
    { value: '', label: 'Select Department' },
    ...safeDepartments.map((d) => ({
      value: d.id || (d as any)._id,
      label: `${d.name} (${d.code})`,
    })),
  ];

  const deptFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Departments' },
    ...safeDepartments.map((d) => ({
      value: d.id || (d as any)._id,
      label: d.name,
    })),
  ];

  const levelSelectOptions: SelectOption[] = [
    { value: '', label: 'Select Level' },
    ...safeLevels.map((l) => ({
      value: l.id || (l as any)._id,
      label: `${l.name} (${l.code} - Rank ${l.rank})`,
    })),
  ];

  const levelFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Levels' },
    ...safeLevels.map((l) => ({
      value: l.id || (l as any)._id,
      label: `${l.name} (${l.code})`,
    })),
  ];

  // Filtered views
  const filteredDepartments = safeDepartments.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredTeams = safeTeams.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    const deptId = typeof t.departmentId === 'string' ? t.departmentId : (t.departmentId as any)?._id;
    if (selectedDeptFilter !== 'all' && deptId !== selectedDeptFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredPositions = safePositions.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    const deptId = typeof p.departmentId === 'string' ? p.departmentId : (p.departmentId as any)?._id;
    if (selectedDeptFilter !== 'all' && deptId !== selectedDeptFilter) return false;
    const levelId = typeof p.levelId === 'string' ? p.levelId : (p.levelId as any)?._id;
    if (selectedLevelFilter !== 'all' && levelId !== selectedLevelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredLocations = safeLocations.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (locationTypeFilter !== 'all' && l.type !== locationTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.country?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-semibold animate-slideUp max-w-md ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertTriangle className="size-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 rounded-full hover:bg-black/5 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER SECTION & TELEMETRY SUMMARY                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight flex items-center gap-2.5">
            <span>Company & Organization</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              {company?.status || 'Active'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Database-driven agency identity, dynamic departments, teams, positions, seniority levels, locations, and organizational chart.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void loadData()}
            className="h-10 px-3.5 rounded-full bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            title="Refresh All Organizational Data"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Unified Telemetry Card in Warm Agency Tones */}
      <Card className="bg-[#FAF7F2] border border-[#ECE5DA] rounded-4xl shadow-2xs overflow-hidden w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE5DA]">
          {/* Stat 1: Departments */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Departments</span>
              <div className="p-2 rounded-2xl bg-[#F7EFE6] text-[#B85D19] shadow-2xs">
                <Layers className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">{stats?.totalDepartments ?? departments.length}</p>
              <p className="text-[10px] text-[#877E71] mt-0.5 font-medium">{stats?.activeDepartments ?? departments.length} Active Units</p>
            </div>
          </div>

          {/* Stat 2: Teams */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Active Teams</span>
              <div className="p-2 rounded-2xl bg-[#EEF5E8] text-[#3D7028] shadow-2xs">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">{stats?.totalTeams ?? teams.length}</p>
              <p className="text-[10px] text-[#3D7028] font-bold mt-0.5">Operational Squads</p>
            </div>
          </div>

          {/* Stat 3: Positions */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Job Positions</span>
              <div className="p-2 rounded-2xl bg-[#FDF4E2] text-[#B57C1E] shadow-2xs">
                <Award className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">{stats?.totalPositions ?? positions.length}</p>
              <p className="text-[10px] text-[#B57C1E] font-bold mt-0.5">Defined Roles</p>
            </div>
          </div>

          {/* Stat 4: Levels Hierarchy */}
          <div className="p-5 flex flex-col justify-between hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Levels Hierarchy</span>
              <div className="p-2 rounded-2xl bg-[#F5EEF7] text-[#7E3D8E] shadow-2xs">
                <GitGraph className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">{stats?.totalLevels ?? levels.length}</p>
              <p className="text-[10px] text-[#7E3D8E] font-bold mt-0.5">Rank 1 to {levels.length}</p>
            </div>
          </div>

          {/* Stat 5: Locations */}
          <div className="p-5 flex flex-col justify-between col-span-2 sm:col-span-1 hover:bg-[#FFFDF9] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#999083]">Locations</span>
              <div className="p-2 rounded-2xl bg-[#F6EEE7] text-[#9C5535] shadow-2xs">
                <MapPin className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-[#26221F]">{stats?.totalLocations ?? locations.length}</p>
              <p className="text-[10px] text-[#9C5535] font-bold mt-0.5">Operating Hubs</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. PILL TAB NAVIGATION (8 Tabs)                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full w-full sm:w-fit shadow-2xs overflow-x-auto">
        {TAB_CONFIG.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTab(t.key);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                isActive
                  ? 'bg-[#0B2E23] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B251A] hover:bg-white/80'
              }`}
            >
              <Icon className={`size-3.5 ${isActive ? 'text-[#AEFF48]' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & EXECUTIVE SUMMARY                                        */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Company Business Snapshot Card */}
          <Card className="bg-white border border-[#E5E7EB] rounded-4xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-3xl bg-[#0B2E23]/10 border border-[#0B2E23]/20 flex items-center justify-center font-bold text-2xl text-[#0B251A] overflow-hidden shadow-xs">
                  {company?.logo ? (
                    <img src={company.logo} alt={company.name} className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-8 text-[#0B2E23]" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#111111]">{company?.name || 'Company Profile'}</h2>
                  <p className="text-xs text-slate-500 font-medium">{company?.legalName || 'Legal Corporate Entity'}</p>
                  <p className="text-xs text-[#0B2E23] font-bold mt-1">{company?.industry || 'Technology & Digital Services'}</p>
                </div>
              </div>

              {(isAdmin || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Edit2 className="size-3.5 text-[#AEFF48]" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Headquarters</span>
                <p className="font-semibold text-slate-800">{company?.city ? `${company.city}, ${company.country}` : 'New York, USA'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Timezone & Currency</span>
                <p className="font-semibold text-slate-800">{company?.timezone || 'UTC'} • {company?.currency || 'USD'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Tax / VAT ID</span>
                <p className="font-mono font-bold text-slate-800">{company?.taxId || company?.vatNumber || 'US-987654321'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Fiscal Year</span>
                <p className="font-semibold text-slate-800">{company?.fiscalYear || 'Jan - Dec'}</p>
              </div>
            </div>
          </Card>

          {/* Quick Links & Modules Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveTab('departments')}
              className="p-5 rounded-4xl bg-white border border-[#E5E7EB] hover:border-[#0B2E23]/40 shadow-xs cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Layers className="size-5" />
                </div>
                <span className="text-xs font-bold text-[#0B2E23] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Manage</span>
                  <ChevronRight className="size-3" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">{departments.length} Functional Departments</h3>
                <p className="text-xs text-slate-500 mt-1">Configurable business divisions and allocated department heads.</p>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('teams')}
              className="p-5 rounded-4xl bg-white border border-[#E5E7EB] hover:border-[#0B2E23]/40 shadow-xs cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="size-5" />
                </div>
                <span className="text-xs font-bold text-[#0B2E23] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Manage</span>
                  <ChevronRight className="size-3" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">{teams.length} Dynamic Teams</h3>
                <p className="text-xs text-slate-500 mt-1">Operational squads with assigned team leaders within departments.</p>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('org-chart')}
              className="p-5 rounded-4xl bg-white border border-[#E5E7EB] hover:border-[#0B2E23]/40 shadow-xs cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Sparkles className="size-5" />
                </div>
                <span className="text-xs font-bold text-[#0B2E23] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>View Chart</span>
                  <ChevronRight className="size-3" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Visual Org Chart</h3>
                <p className="text-xs text-slate-500 mt-1">Dynamic tree visualizer generated from live database relationships.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPANY PROFILE EDITOR                                              */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#111111]">Legal Identity & Business Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage legal entity name, branding, fiscal settings, and corporate registration</p>
            </div>
            {isProfileSaved && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5 animate-fadeIn">
                <Check className="size-3.5" />
                <span>Saved Successfully</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 mt-6">
            {/* Branding & Entity Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Display Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="AtTech Solutions"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none focus:border-[#0B2E23] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Legal Entity Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.legalName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, legalName: e.target.value })}
                  placeholder="AtTech Technologies Inc."
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none focus:border-[#0B2E23] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Logo URL (Cloudinary / CDN)</label>
              <input
                type="url"
                value={profileForm.logo || ''}
                onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.value })}
                placeholder="https://res.cloudinary.com/demo/image/upload/logo.png"
                className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none focus:border-[#0B2E23] font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Short Business Description</label>
              <textarea
                rows={2}
                value={profileForm.shortDescription || ''}
                onChange={(e) => setProfileForm({ ...profileForm, shortDescription: e.target.value })}
                placeholder="Full-Stack Software Engineering & Enterprise Digital Solutions..."
                className="w-full p-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none focus:border-[#0B2E23] font-medium resize-none"
              />
            </div>

            {/* Contact & Registration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 border-t border-[#E5E7EB]">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Corporate Website</label>
                <input
                  type="url"
                  value={profileForm.website || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  placeholder="https://attech.solutions"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Email</label>
                <input
                  type="email"
                  value={profileForm.email || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="contact@attech.solutions"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Corporate Phone</label>
                <input
                  type="text"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Address & Jurisdiction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address</label>
                <input
                  type="text"
                  value={profileForm.address || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="100 Innovation Blvd, Suite 400"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={profileForm.city || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="New York"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
                <input
                  type="text"
                  value={profileForm.country || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  placeholder="United States"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Postal Code</label>
                <input
                  type="text"
                  value={profileForm.postalCode || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  placeholder="10001"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Fiscal & Tax */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4 border-t border-[#E5E7EB]">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Base Currency</label>
                <input
                  type="text"
                  value={profileForm.currency || 'USD'}
                  onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                  placeholder="USD"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Primary Timezone</label>
                <input
                  type="text"
                  value={profileForm.timezone || 'America/New_York'}
                  onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  placeholder="America/New_York"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tax ID / EIN</label>
                <input
                  type="text"
                  value={profileForm.taxId || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })}
                  placeholder="US-EIN-987654321"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registration Number</label>
                <input
                  type="text"
                  value={profileForm.registrationNumber || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                  placeholder="REG-2024-NYC-8821"
                  className="w-full h-11 px-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium font-mono"
                />
              </div>
            </div>

            {(isAdmin || isSuperAdmin) && (
              <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-[#AEFF48]" />}
                  <span>Save Company Changes</span>
                </button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEPARTMENTS                                                         */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments by name, code, description..."
                className="w-full h-11 pl-10 pr-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <HeroSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All Statuses"
              />

              {(isAdmin || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => handleOpenDeptModal()}
                  className="h-11 px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-sm cursor-pointer flex items-center gap-2 transition-all shrink-0"
                >
                  <Plus className="size-4 text-[#AEFF48]" />
                  <span>New Department</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Head / Manager</th>
                  <th className="py-4 px-6">Active Teams</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/70">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Layers className="size-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No departments found</p>
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((d) => (
                    <tr key={d.id || (d as any)._id} className="hover:bg-[#FAFAF9]/60 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-[#111111]">{d.name}</span>
                        {d.description && <p className="text-[11px] text-slate-500 line-clamp-1">{d.description}</p>}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-700">{d.code}</td>
                      <td className="py-4 px-6">
                        {d.head ? (
                          <span className="font-semibold text-slate-800">
                            {d.head.firstName} {d.head.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-700 text-[11px]">
                          {d.teamCount ?? 0} Teams
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleDeptStatus(d)}
                          className={`text-[10.5px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border cursor-pointer ${
                            d.status === OrgStatus.ACTIVE
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {d.status}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Edit Department"
                            onClick={() => handleOpenDeptModal(d)}
                            className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-slate-100 rounded-full cursor-pointer"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Department"
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                type: 'department',
                                id: d.id || (d as any)._id,
                                title: `Department '${d.name}'`,
                                description: 'Are you sure? Referenced child teams must be reassigned or deleted first.',
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEAMS                                                               */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams by name, code, description..."
                className="w-full h-11 pl-10 pr-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <HeroSelect
                value={selectedDeptFilter}
                onChange={setSelectedDeptFilter}
                options={deptFilterOptions}
                placeholder="All Departments"
              />
              <HeroSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All Statuses"
              />

              {(isAdmin || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => handleOpenTeamModal()}
                  className="h-11 px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-sm cursor-pointer flex items-center gap-2 transition-all shrink-0"
                >
                  <Plus className="size-4 text-[#AEFF48]" />
                  <span>New Team</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Team Name</th>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Team Lead</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/70">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="size-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No teams found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((t) => {
                    const deptObj = typeof t.departmentId === 'object' ? t.departmentId : null;
                    return (
                      <tr key={t.id || (t as any)._id} className="hover:bg-[#FAFAF9]/60 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-[#111111]">{t.name}</span>
                          {t.description && <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-700">{t.code}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-700 text-[11px]">
                            {deptObj?.name || 'Assigned'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {t.leadId && typeof t.leadId === 'object' ? (
                            <span className="font-semibold text-slate-800">
                              {(t.leadId as any).firstName} {(t.leadId as any).lastName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() => handleToggleTeamStatus(t)}
                            className={`text-[10.5px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border cursor-pointer ${
                              t.status === OrgStatus.ACTIVE
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {t.status}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              title="Edit Team"
                              onClick={() => handleOpenTeamModal(t)}
                              className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-slate-100 rounded-full cursor-pointer"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Team"
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'team',
                                  id: t.id || (t as any)._id,
                                  title: `Team '${t.name}'`,
                                  description: 'Are you sure you want to delete this team?',
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
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
      {/* TAB 5: POSITIONS                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'positions' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search positions by title, code..."
                className="w-full h-11 pl-10 pr-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <HeroSelect
                value={selectedDeptFilter}
                onChange={setSelectedDeptFilter}
                options={deptFilterOptions}
                placeholder="All Departments"
              />
              <HeroSelect
                value={selectedLevelFilter}
                onChange={setSelectedLevelFilter}
                options={levelFilterOptions}
                placeholder="All Levels"
              />

              {(isAdmin || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => handleOpenPosModal()}
                  className="h-11 px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-sm cursor-pointer flex items-center gap-2 transition-all shrink-0"
                >
                  <Plus className="size-4 text-[#AEFF48]" />
                  <span>New Position</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAF9]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Position Title</th>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Seniority Level</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/70">
                {filteredPositions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Award className="size-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No positions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map((p) => {
                    const deptObj = typeof p.departmentId === 'object' ? p.departmentId : null;
                    const levelObj = typeof p.levelId === 'object' ? p.levelId : null;
                    return (
                      <tr key={p.id || (p as any)._id} className="hover:bg-[#FAFAF9]/60 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-[#111111]">{p.name}</span>
                          {p.description && <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-700">{p.code}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-700 text-[11px]">
                            {deptObj?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {levelObj ? (
                            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]">
                              {levelObj.name} (Rank {levelObj.rank})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() => handleTogglePosStatus(p)}
                            className={`text-[10.5px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border cursor-pointer ${
                              p.status === OrgStatus.ACTIVE
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {p.status}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              title="Edit Position"
                              onClick={() => handleOpenPosModal(p)}
                              className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-slate-100 rounded-full cursor-pointer"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Position"
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'position',
                                  id: p.id || (p as any)._id,
                                  title: `Position '${p.name}'`,
                                  description: 'Are you sure you want to delete this position?',
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
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
      {/* TAB 6: LEVELS & HIERARCHY RANKING                                         */}
      {/* ========================================================================= */}
      {activeTab === 'levels' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between gap-3.5">
            <div>
              <h3 className="text-sm font-bold text-[#111111]">Organizational Seniority Hierarchy</h3>
              <p className="text-xs text-slate-500">Define custom hierarchy ranks (Intern = 1, Executive = N)</p>
            </div>

            {(isAdmin || isSuperAdmin) && (
              <button
                type="button"
                onClick={() => handleOpenLevelModal()}
                className="h-11 px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-sm cursor-pointer flex items-center gap-2 transition-all shrink-0"
              >
                <Plus className="size-4 text-[#AEFF48]" />
                <span>New Level</span>
              </button>
            )}
          </div>

          {/* Hierarchy List */}
          <div className="p-6 space-y-3">
            {safeLevels.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <GitGraph className="size-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No levels configured</p>
              </div>
            ) : (
              safeLevels.map((lvl, index) => (
                <div
                  key={lvl.id || (lvl as any)._id}
                  className="p-4 rounded-3xl border border-[#E5E7EB] bg-[#FAF7F2]/40 hover:bg-[#FAF7F2] transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-8 rounded-2xl bg-[#0B2E23] text-[#AEFF48] font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                      #{lvl.rank}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111111]">{lvl.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md font-bold">
                          {lvl.code}
                        </span>
                      </div>
                      {lvl.description && <p className="text-xs text-slate-500 mt-0.5">{lvl.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(isAdmin || isSuperAdmin) && (
                      <>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveRank(index, 'up')}
                          className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-white rounded-full border border-transparent hover:border-[#E5E7EB] disabled:opacity-30 cursor-pointer"
                          title="Move Rank Up"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === levels.length - 1}
                          onClick={() => handleMoveRank(index, 'down')}
                          className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-white rounded-full border border-transparent hover:border-[#E5E7EB] disabled:opacity-30 cursor-pointer"
                          title="Move Rank Down"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleLevelStatus(lvl)}
                      className={`text-[10.5px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border cursor-pointer ${
                        lvl.status === OrgStatus.ACTIVE
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {lvl.status}
                    </button>

                    <button
                      type="button"
                      title="Edit Level"
                      onClick={() => handleOpenLevelModal(lvl)}
                      className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-white rounded-full cursor-pointer"
                    >
                      <Edit2 className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      title="Delete Level"
                      onClick={() =>
                        setDeleteConfirm({
                          isOpen: true,
                          type: 'level',
                          id: lvl.id || (lvl as any)._id,
                          title: `Level '${lvl.name}'`,
                          description: 'Are you sure? Levels referenced by positions cannot be deleted until reassigned.',
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: LOCATIONS                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'locations' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locations by city, country, name..."
                className="w-full h-11 pl-10 pr-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full text-xs text-[#0B251A] focus:bg-white focus:outline-none font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <HeroSelect
                value={locationTypeFilter}
                onChange={setLocationTypeFilter}
                options={LOCATION_TYPE_OPTIONS}
                placeholder="All Location Types"
              />

              {(isAdmin || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => handleOpenLocationModal()}
                  className="h-11 px-5 bg-[#0B2E23] hover:bg-[#0B251A] text-white text-xs font-bold rounded-full shadow-sm cursor-pointer flex items-center gap-2 transition-all shrink-0"
                >
                  <Plus className="size-4 text-[#AEFF48]" />
                  <span>New Location</span>
                </button>
              )}
            </div>
          </div>

          {/* Locations Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <MapPin className="size-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No locations found</p>
              </div>
            ) : (
              filteredLocations.map((loc) => (
                <div
                  key={loc.id || (loc as any)._id}
                  className="p-5 rounded-3xl border border-[#E5E7EB] bg-[#FAF7F2]/40 hover:bg-[#FAF7F2] transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {loc.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleLocationStatus(loc)}
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border cursor-pointer ${
                          loc.status === OrgStatus.ACTIVE
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {loc.status}
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-[#111111] mt-3">{loc.name}</h3>
                    {loc.address && <p className="text-xs text-slate-600 mt-1">{loc.address}</p>}
                    <p className="text-xs text-slate-500 font-medium">
                      {loc.city ? `${loc.city}, ` : ''}{loc.country || 'Global'}
                    </p>
                    {loc.timezone && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
                        <Clock className="size-3" />
                        <span>{loc.timezone}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      title="Edit Location"
                      onClick={() => handleOpenLocationModal(loc)}
                      className="p-1.5 text-slate-500 hover:text-[#0B251A] hover:bg-white rounded-full cursor-pointer"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete Location"
                      onClick={() =>
                        setDeleteConfirm({
                          isOpen: true,
                          type: 'location',
                          id: loc.id || (loc as any)._id,
                          title: `Location '${loc.name}'`,
                          description: 'Are you sure you want to delete this operational location?',
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: DYNAMIC ORGANIZATION CHART                                          */}
      {/* ========================================================================= */}
      {activeTab === 'org-chart' && (
        <Card className="bg-white border border-[#E5E7EB] rounded-4xl p-6 sm:p-8 shadow-xs space-y-8 overflow-x-auto">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-[#111111]">Live Organization Hierarchy Chart</h2>
              <p className="text-xs text-slate-500 mt-0.5">Dynamically generated from MongoDB foreign-key organizational relationships</p>
            </div>
            <span className="text-xs font-bold text-[#0B2E23] px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
              Real-Time Tree
            </span>
          </div>

          {/* Root Company Node */}
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-3xl bg-[#0B2E23] text-white shadow-lg border border-[#0B251A] flex items-center gap-3.5 min-w-[260px] max-w-sm justify-center">
              <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-[#AEFF48]">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#AEFF48]">Executive Agency Root</p>
                <h3 className="text-sm font-extrabold">{company?.name || 'AtTech Solutions'}</h3>
              </div>
            </div>

            {/* Vertical Connector Line */}
            <div className="w-0.5 h-8 bg-slate-300 my-1" />

            {/* Departments Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-2">
              {(orgChart?.departments || []).map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#ECE5DA] shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#ECE5DA]">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                          {d.code}
                        </span>
                        <h4 className="text-sm font-extrabold text-[#111111] mt-1.5">{d.name}</h4>
                      </div>
                      <span className="text-[10.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {d.status}
                      </span>
                    </div>

                    {d.head && (
                      <div className="mt-3 p-2.5 rounded-2xl bg-white border border-[#ECE5DA] flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-[#0B2E23] text-white text-xs font-bold flex items-center justify-center">
                          {d.head.firstName?.[0]}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department Head</p>
                          <p className="text-xs font-bold text-slate-800">
                            {d.head.firstName} {d.head.lastName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Sub-Teams in Department */}
                    <div className="mt-4 space-y-2">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        Teams ({(d.teams || []).length})
                      </p>
                      {(!d.teams || d.teams.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No sub-teams created yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(d.teams || []).map((t) => (
                            <div
                              key={t.id}
                              className="p-2.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                <span className="font-bold text-slate-800">{t.name}</span>
                              </div>
                              <span className="font-mono text-[10px] font-bold text-slate-500">{t.code}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Defined Positions in Department */}
                  {(d.positions || []).length > 0 && (
                    <div className="pt-3 border-t border-[#ECE5DA]">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Positions ({(d.positions || []).length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(d.positions || []).map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODALS & POPUPS                                                           */}
      {/* ========================================================================= */}

      {/* 1. Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111]">{editingDept ? 'Edit Department' : 'Create Department'}</h3>
              <button type="button" onClick={() => setIsDeptModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="Engineering"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="ENG"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Head / Manager</label>
                <HeroSelect
                  value={deptForm.headId}
                  onChange={(val) => setDeptForm({ ...deptForm, headId: val })}
                  options={userSelectOptions}
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-2xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Software architecture, mobile and cloud infrastructure..."
                  className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#0B2E23] hover:bg-[#0B251A] rounded-full shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111]">{editingTeam ? 'Edit Team' : 'Create Team'}</h3>
              <button type="button" onClick={() => setIsTeamModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Department *</label>
                <HeroSelect
                  value={teamForm.departmentId}
                  onChange={(val) => setTeamForm({ ...teamForm, departmentId: val })}
                  options={deptSelectOptions}
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-2xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="Mobile Team"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Team Code *</label>
                <input
                  type="text"
                  required
                  value={teamForm.code}
                  onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value.toUpperCase() })}
                  placeholder="MOB"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Team Lead</label>
                <HeroSelect
                  value={teamForm.leadId}
                  onChange={(val) => setTeamForm({ ...teamForm, leadId: val })}
                  options={userSelectOptions}
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-2xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="Cross-platform iOS and Android apps..."
                  className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#0B2E23] hover:bg-[#0B251A] rounded-full shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Position Modal */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111]">{editingPos ? 'Edit Position' : 'Create Position'}</h3>
              <button type="button" onClick={() => setIsPosModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSavePos} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Position Title *</label>
                <input
                  type="text"
                  required
                  value={posForm.name}
                  onChange={(e) => setPosForm({ ...posForm, name: e.target.value })}
                  placeholder="Flutter Developer"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Position Code *</label>
                <input
                  type="text"
                  required
                  value={posForm.code}
                  onChange={(e) => setPosForm({ ...posForm, code: e.target.value.toUpperCase() })}
                  placeholder="DEV-FLUTTER"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <HeroSelect
                  value={posForm.departmentId}
                  onChange={(val) => setPosForm({ ...posForm, departmentId: val })}
                  options={deptSelectOptions}
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-2xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seniority Level</label>
                <HeroSelect
                  value={posForm.levelId}
                  onChange={(val) => setPosForm({ ...posForm, levelId: val })}
                  options={levelSelectOptions}
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-2xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={posForm.description}
                  onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
                  placeholder="Job position overview and technical duties..."
                  className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsPosModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#0B2E23] hover:bg-[#0B251A] rounded-full shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingPos ? 'Update Position' : 'Create Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Level Modal */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111]">{editingLevel ? 'Edit Level' : 'Create Seniority Level'}</h3>
              <button type="button" onClick={() => setIsLevelModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLevel} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Level Name *</label>
                <input
                  type="text"
                  required
                  value={levelForm.name}
                  onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                  placeholder="Senior"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Level Code *</label>
                <input
                  type="text"
                  required
                  value={levelForm.code}
                  onChange={(e) => setLevelForm({ ...levelForm, code: e.target.value.toUpperCase() })}
                  placeholder="L4"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hierarchy Rank (1..N) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={levelForm.rank}
                  onChange={(e) => setLevelForm({ ...levelForm, rank: parseInt(e.target.value, 10) || 1 })}
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={levelForm.description}
                  onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                  placeholder="Senior domain expert & lead practitioner..."
                  className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsLevelModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#0B2E23] hover:bg-[#0B251A] rounded-full shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingLevel ? 'Update Level' : 'Create Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Location Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#111111]">{editingLocation ? 'Edit Location' : 'Create Location'}</h3>
              <button type="button" onClick={() => setIsLocationModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="Head Office (New York)"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Type *</label>
                <HeroSelect
                  value={locationForm.type}
                  onChange={(val) => setLocationForm({ ...locationForm, type: val as LocationType })}
                  options={LOCATION_TYPE_OPTIONS.filter((o) => o.value !== 'all')}
                  className="w-full"
                  triggerClassName="w-full h-10 rounded-2xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    placeholder="New York"
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={locationForm.country}
                    onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                    placeholder="United States"
                    className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={locationForm.timezone}
                  onChange={(e) => setLocationForm({ ...locationForm, timezone: e.target.value })}
                  placeholder="America/New_York"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  placeholder="100 Innovation Blvd, Suite 400"
                  className="w-full h-10 px-3.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-[#0B2E23] hover:bg-[#0B251A] rounded-full shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Generic Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-4xl bg-white p-6 shadow-2xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 rounded-2xl bg-red-50 text-red-600">
                <Trash2 className="size-5" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">Delete Confirmation</h3>
            </div>
            <p className="text-xs text-slate-600 font-bold">{deleteConfirm.title}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{deleteConfirm.description}</p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
