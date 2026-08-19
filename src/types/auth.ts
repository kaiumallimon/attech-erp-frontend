export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TECH_LEAD = 'TECH_LEAD',
  SENIOR_DEVELOPER = 'SENIOR_DEVELOPER',
  DEVELOPER = 'DEVELOPER',
  JUNIOR_DEVELOPER = 'JUNIOR_DEVELOPER',
  QA_ENGINEER = 'QA_ENGINEER',
  DEVOPS_ENGINEER = 'DEVOPS_ENGINEER',
  UI_UX_DESIGNER = 'UI_UX_DESIGNER',
  GRAPHIC_DESIGNER = 'GRAPHIC_DESIGNER',
  HR_MANAGER = 'HR_MANAGER',
  HR_EXECUTIVE = 'HR_EXECUTIVE',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  SALES_EXECUTIVE = 'SALES_EXECUTIVE',
  MARKETING_SPECIALIST = 'MARKETING_SPECIALIST',
  CLIENT_ACCOUNT_MANAGER = 'CLIENT_ACCOUNT_MANAGER',
  CLIENT = 'CLIENT',
  INTERN = 'INTERN',
  GUEST = 'GUEST',
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department?: string;
  jobTitle?: string;
  phone?: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'INVITED';
  authProvider: 'LOCAL' | 'GOOGLE';
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface RbacInfo {
  role: Role;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  customPermissions: string[];
  permissions: string[];
}

export interface AuthMeResponse {
  user: UserProfile;
  rbac: RbacInfo;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: string;
}

export interface AuthLoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
  permissions: string[];
}
