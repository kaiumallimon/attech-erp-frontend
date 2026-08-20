export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CEO = 'CEO',
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  SALES_MANAGER = 'SALES_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  DEVELOPER = 'DEVELOPER',
  DESIGNER = 'DESIGNER',
  QA_ENGINEER = 'QA_ENGINEER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
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

export interface CdnUsageStats {
  plan: string;
  lastUpdated: string;
  storage: {
    usage: number;
    limit: number;
    usedPercent: number;
    usageHuman: string;
    limitHuman: string;
  };
  bandwidth: {
    usage: number;
    limit: number;
    usedPercent: number;
    usageHuman: string;
    limitHuman: string;
  };
  transformations: {
    usage: number;
    limit: number;
    usedPercent: number;
  };
  objects: {
    usage: number;
    limit: number;
    usedPercent: number;
  };
  credits: {
    usage: number;
    limit: number;
    usedPercent: number;
  };
  isLive: boolean;
}

export interface CdnResourceItem {
  publicId: string;
  format: string;
  version: number;
  resourceType: string;
  type: string;
  createdAt: string;
  bytes: number;
  bytesHuman: string;
  width?: number;
  height?: number;
  secureUrl: string;
  folder?: string;
}

export interface AuditDeviceInfo {
  browser?: string;
  os?: string;
  deviceType?: string;
}

export interface AuditLogItem {
  _id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  ipMasked?: string;
  userAgent?: string;
  deviceInfo?: AuditDeviceInfo;
  status: 'SUCCESS' | 'FAILURE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditStats {
  totalEvents: number;
  totalFailures: number;
  successRate: number;
  events24h: number;
  failures24h: number;
  activeActors24h: number;
  topActions: { action: string; count: number }[];
  severityBreakdown: Record<string, number>;
  recentAlerts: AuditLogItem[];
}

export type ApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ApiKeyItem {
  _id: string;
  name: string;
  description?: string;
  key: string;
  secretPrefix: string;
  scopes: string[];
  allowedOrigins?: string[];
  allowedIps?: string[];
  status: ApiKeyStatus;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  usageCount: number;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyStats {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  totalApiRequests: number;
  topScopes: { scope: string; count: number }[];
}

export interface CreateApiKeyPayload {
  name: string;
  description?: string;
  scopes: string[];
  allowedOrigins?: string[];
  allowedIps?: string[];
  expiresAt?: string | null;
}

export type SubscriberStatus = 'SUBSCRIBED' | 'UNSUBSCRIBED';

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  name?: string;
  source: string;
  status: SubscriberStatus;
  tags: string[];
  ipAddress?: string;
  subscribedAt: string;
  unsubscribedAt?: string | null;
}

export type CampaignStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';

export interface NewsletterCampaign {
  _id: string;
  title: string;
  subject: string;
  preheader?: string;
  senderName: string;
  senderEmail: string;
  htmlContent: string;
  compiledGmailHtml?: string;
  plainTextContent?: string;
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt?: string | null;
  targetAudience: string;
  tags: string[];
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedCount: number;
  totalCampaigns: number;
  totalDelivered: number;
  deliveryRate: number;
  topSources: { source: string; count: number }[];
}

export interface CreateCampaignPayload {
  title: string;
  subject: string;
  preheader?: string;
  senderName?: string;
  senderEmail?: string;
  htmlContent: string;
  plainTextContent?: string;
  targetAudience?: string;
  tags?: string[];
}



