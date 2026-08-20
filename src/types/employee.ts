import { UserProfile } from './auth';
import { Department, Level, Location, Position, Team } from './company';

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  FREELANCE = 'FREELANCE',
  TEMPORARY = 'TEMPORARY',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
  RETIRED = 'RETIRED',
}

export interface EmployeeCertification {
  id?: string;
  _id?: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface EmployeeDocument {
  id?: string;
  _id?: string;
  title: string;
  documentType: string;
  fileUrl: string;
  cdnPublicId?: string;
  fileSize?: number;
  mimeType?: string;
  isSensitive: boolean;
  uploadedAt: string;
}

export interface DirectReportSummary {
  id?: string;
  _id?: string;
  employeeId: string;
  userId?: Partial<UserProfile>;
  positionId?: Partial<Position>;
  levelId?: Partial<Level>;
  employmentStatus: EmploymentStatus;
}

export interface Employee {
  id: string;
  _id?: string;
  userId: UserProfile | string;
  companyId: string;
  employeeId: string;
  departmentId?: Department | string;
  teamId?: Team | string;
  positionId?: Position | string;
  levelId?: Level | string;
  locationId?: Location | string;
  managerId?: Employee | string;
  employmentType: EmploymentType;
  employmentStatus: EmploymentStatus;
  joiningDate: string;
  probationEndDate?: string;
  confirmationDate?: string;
  employmentEndDate?: string;
  bio?: string;
  skills: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  certifications: EmployeeCertification[];
  documents: EmployeeDocument[];
  directReports?: DirectReportSummary[];
  directReportsCount?: number;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  suspendedEmployees: number;
  inactiveEmployees: number;
  fullTimeCount: number;
  partTimeCount: number;
  contractCount: number;
  internCount: number;
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    count: number;
  }>;
  activeRate: number;
}

export interface Skill {
  id: string;
  _id?: string;
  name: string;
  category: string;
  description?: string;
  usageCount: number;
}

export interface CreateEmployeePayload {
  userId: string;
  companyId?: string;
  employeeId?: string;
  departmentId?: string;
  teamId?: string;
  positionId?: string;
  levelId?: string;
  locationId?: string;
  managerId?: string;
  employmentType?: EmploymentType;
  employmentStatus?: EmploymentStatus;
  joiningDate?: string;
  probationEndDate?: string;
  confirmationDate?: string;
  employmentEndDate?: string;
  bio?: string;
  skills?: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate?: string;
    expiryDate?: string;
    credentialUrl?: string;
  }>;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {}

export interface UpdateEmployeeStatusPayload {
  status: EmploymentStatus;
  reason?: string;
  effectiveDate?: string;
}

export interface AttachDocumentPayload {
  title: string;
  documentType: string;
  fileUrl: string;
  cdnPublicId?: string;
  fileSize?: number;
  mimeType?: string;
  isSensitive?: boolean;
}
