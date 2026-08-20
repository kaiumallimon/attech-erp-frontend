export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum OrgStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum LocationType {
  OFFICE = 'OFFICE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  CLIENT_SITE = 'CLIENT_SITE',
  OTHER = 'OTHER',
}

export interface Company {
  id?: string;
  _id?: string;
  name: string;
  legalName: string;
  logo?: string;
  shortDescription?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timezone: string;
  currency: string;
  fiscalYear: string;
  taxId?: string;
  vatNumber?: string;
  registrationNumber?: string;
  status: CompanyStatus;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSummary {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  jobTitle?: string;
}

export interface Department {
  id: string;
  _id?: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  headId?: string | UserSummary;
  head?: UserSummary;
  status: OrgStatus;
  teamCount?: number;
  positionCount?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  _id?: string;
  companyId: string;
  departmentId: string | { _id: string; id?: string; name: string; code: string };
  name: string;
  code: string;
  description?: string;
  leadId?: string | UserSummary;
  status: OrgStatus;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Level {
  id: string;
  _id?: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  rank: number;
  status: OrgStatus;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  _id?: string;
  companyId: string;
  departmentId?: string | { _id: string; id?: string; name: string; code: string };
  levelId?: string | Level;
  name: string;
  code: string;
  description?: string;
  status: OrgStatus;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  id: string;
  _id?: string;
  companyId: string;
  name: string;
  type: LocationType;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  description?: string;
  status: OrgStatus;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrgChartTeam {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: OrgStatus;
  lead?: UserSummary;
}

export interface OrgChartPosition {
  id: string;
  name: string;
  code: string;
  level?: Level;
  status: OrgStatus;
}

export interface OrgChartDepartment {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: OrgStatus;
  head?: UserSummary;
  teams: OrgChartTeam[];
  positions: OrgChartPosition[];
}

export interface OrgChartTree {
  company: {
    id?: string;
    name?: string;
    legalName?: string;
    logo?: string;
  };
  departments: OrgChartDepartment[];
}

export interface CompanyStats {
  totalDepartments: number;
  activeDepartments: number;
  totalTeams: number;
  activeTeams: number;
  totalPositions: number;
  totalLevels: number;
  totalLocations: number;
}
