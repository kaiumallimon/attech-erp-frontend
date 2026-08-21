export enum AccountStatus {
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface CrmAccount {
  id: string;
  companyId: string;
  name: string;
  legalName?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  status: AccountStatus | string;
  ownerId?: {
    id: string;
    employeeId: string;
    userId?: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  tags?: string[];
  customFields?: Record<string, any>;
  contactsCount?: number;
  dealsCount?: number;
  openDealsCount?: number;
  wonDealsCount?: number;
  totalDealValue?: number;
  wonDealValue?: number;
  contacts?: CrmContact[];
  deals?: CrmDeal[];
  activities?: CrmActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmContact {
  id: string;
  companyId: string;
  accountId: {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
  } | string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  linkedinUrl?: string;
  notes?: string;
  isPrimary: boolean;
  status: string;
  tags?: string[];
  customFields?: Record<string, any>;
  deals?: CrmDeal[];
  activities?: CrmActivity[];
  createdAt: string;
  updatedAt: string;
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  UNQUALIFIED = 'UNQUALIFIED',
  CONVERTED = 'CONVERTED',
}

export interface CrmLeadSource {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmLead {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  website?: string;
  sourceId?: {
    id: string;
    name: string;
  };
  status: LeadStatus | string;
  ownerId?: {
    id: string;
    employeeId: string;
    userId?: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  description?: string;
  estimatedValue?: number;
  currency?: string;
  convertedAccountId?: {
    id: string;
    name: string;
  };
  convertedContactId?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  convertedDealId?: {
    id: string;
    name: string;
    value: number;
    status: string;
  };
  convertedAt?: string;
  unqualifiedReason?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  activities?: CrmActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmPipelineStage {
  id: string;
  companyId: string;
  pipelineId: string;
  name: string;
  description?: string;
  order: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  color?: string;
  status: string;
  deals?: CrmDeal[];
  count?: number;
  totalValue?: number;
}

export interface CrmPipeline {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  status: string;
  stages?: CrmPipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export enum DealStatus {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
  ABANDONED = 'ABANDONED',
}

export interface CrmDealType {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: string;
}

export interface CrmLostReason {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: string;
}

export interface CrmDeal {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  accountId: {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
  contactId?: {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
  };
  pipelineId: {
    id: string;
    name: string;
    isDefault?: boolean;
  };
  stageId: {
    id: string;
    name: string;
    order: number;
    probability: number;
    isWon?: boolean;
    isLost?: boolean;
    color?: string;
  };
  ownerId?: {
    id: string;
    employeeId: string;
    userId?: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate?: string;
  dealTypeId?: {
    id: string;
    name: string;
  };
  status: DealStatus | string;
  lostReasonId?: {
    id: string;
    name: string;
  };
  lostNotes?: string;
  wonAt?: string;
  lostAt?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  proposals?: CrmProposal[];
  activities?: CrmActivity[];
  createdAt: string;
  updatedAt: string;
}

export enum ActivityType {
  TASK = 'TASK',
  CALL = 'CALL',
  MEETING = 'MEETING',
  FOLLOW_UP = 'FOLLOW_UP',
  NOTE = 'NOTE',
}

export enum ActivityPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ActivityStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CrmActivity {
  id: string;
  companyId: string;
  type: ActivityType | string;
  subject: string;
  description?: string;
  assignedToId?: {
    id: string;
    employeeId: string;
    userId?: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  dueDate?: string;
  completedAt?: string;
  priority: ActivityPriority | string;
  status: ActivityStatus | string;
  relatedEntityType: 'LEAD' | 'ACCOUNT' | 'CONTACT' | 'DEAL';
  relatedEntityId: string;
  callDuration?: number;
  callOutcome?: string;
  meetingStart?: string;
  meetingEnd?: string;
  meetingLocation?: string;
  createdById?: {
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface CrmProposalItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
  sortOrder?: number;
}

export interface CrmProposal {
  id: string;
  companyId: string;
  dealId: {
    id: string;
    name: string;
    value: number;
    currency: string;
    status: string;
    accountId?: {
      id: string;
      name: string;
      legalName?: string;
      website?: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    contactId?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    };
  };
  title: string;
  version: number;
  status: ProposalStatus | string;
  items: CrmProposalItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  validUntil?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  documentId?: string;
  terms?: string;
  notes?: string;
  ownerId?: {
    id: string;
    employeeId: string;
    userId?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CrmTag {
  id: string;
  companyId: string;
  name: string;
  color?: string;
  applicableTo: string[];
}

export interface CrmCustomField {
  id: string;
  companyId: string;
  entityType: 'LEAD' | 'ACCOUNT' | 'CONTACT' | 'DEAL';
  name: string;
  key: string;
  type: string;
  options?: string[];
  isRequired: boolean;
  defaultValue?: any;
}

export interface CrmDashboardSummary {
  kpis: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
    leadConversionRate: number;
    totalAccounts: number;
    activeAccounts: number;
    totalContacts: number;
    totalDeals: number;
    openDealsCount: number;
    wonDealsCount: number;
    lostDealsCount: number;
    openPipelineValue: number;
    weightedPipelineValue?: number;
    wonDealValue?: number;
    lostDealValue?: number;
    wonRevenue: number;
    lostRevenue: number;
    totalDealValue: number;
    winRate: number;
    averageDealSize: number;
  };
  leadSourceBreakdown: Array<{ id: string; name: string; count: number }>;
  recentActivities: CrmActivity[];
  upcomingTasks: CrmActivity[];
  recentDeals: CrmDeal[];
  pipelinesCount: number;
}

export interface CrmFunnelReport {
  pipeline: { id: string; name: string };
  stages: Array<{
    id: string;
    name: string;
    order: number;
    probability: number;
    isWon: boolean;
    isLost: boolean;
    color?: string;
    dealsCount: number;
    totalValue: number;
    percentageOfTotal: number;
  }>;
  totalValue: number;
  dealsCount: number;
}
