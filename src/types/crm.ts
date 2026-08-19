export enum LeadStage {
  NEW_INQUIRY = 'NEW_INQUIRY',
  DISCOVERY_SCHEDULED = 'DISCOVERY_SCHEDULED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
  NURTURING = 'NURTURING',
}

export enum LeadSource {
  PORTFOLIO_CONTACT = 'PORTFOLIO_CONTACT',
  CAL_SCHEDULER = 'CAL_SCHEDULER',
  NEWSLETTER_CONVERSION = 'NEWSLETTER_CONVERSION',
  MANUAL_OUTREACH = 'MANUAL_OUTREACH',
  INBOUND_EMAIL = 'INBOUND_EMAIL',
  API_INGESTION = 'API_INGESTION',
}

export enum LeadPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum BudgetRange {
  UNDER_5K = 'Under $5,000',
  FIVE_TO_15K = '$5,000 – $15,000',
  FIFTEEN_TO_50K = '$15,000 – $50,000',
  FIFTY_PLUS = '$50,000+',
  UNSPECIFIED = 'Not sure yet',
}

export enum ClientTier {
  STARTUP = 'STARTUP',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
  RETAINER = 'RETAINER',
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CHURNED = 'CHURNED',
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum CrmActivityType {
  NOTE = 'NOTE',
  CALL = 'CALL',
  MEETING = 'MEETING',
  EMAIL = 'EMAIL',
  STAGE_CHANGE = 'STAGE_CHANGE',
  PROPOSAL = 'PROPOSAL',
  CONVERTED = 'CONVERTED',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
}

export interface ScopingCallInfo {
  scheduledAt?: string;
  timezone?: string;
  calBookingId?: string;
  meetingUrl?: string;
  status?: string;
}

export interface CrmLead {
  _id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  service: string;
  budgetRange: BudgetRange;
  description?: string;
  status: LeadStage;
  source: LeadSource;
  priority: LeadPriority;
  estimatedValue: number;
  score: number;
  scopingCall?: ScopingCallInfo;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  tags: string[];
  convertedClientId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmClient {
  _id: string;
  companyName: string;
  industry?: string;
  website?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  billingEmail?: string;
  country?: string;
  tier: ClientTier;
  status: ClientStatus;
  totalLifetimeValue: number;
  originLeadId?: string;
  accountManagerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  activeServices: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmActivity {
  _id: string;
  type: CrmActivityType;
  title: string;
  content?: string;
  actorId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  actorName?: string;
  leadId?: string;
  clientId?: string;
  createdAt: string;
}

export interface ProposalItem {
  serviceName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ProposalMilestone {
  title: string;
  percentage: number;
  amount: number;
  triggerEvent?: string;
}

export interface CrmProposal {
  _id: string;
  proposalNumber: string;
  title: string;
  leadId?: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  items: ProposalItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: ProposalStatus;
  milestones: ProposalMilestone[];
  validUntil?: string;
  termsAndConditions?: string;
  createdAt: string;
}

export interface CrmStats {
  totalPipelineValue: number;
  wonPipelineValue: number;
  activeLeadsCount: number;
  totalLeadsCount: number;
  scopingCallsBooked: number;
  wonDealsCount: number;
  lostDealsCount: number;
  winConversionRate: number;
  activeClientsCount: number;
  stageBreakdown: Record<string, { count: number; value: number }>;
  serviceDistribution: Record<string, number>;
}
