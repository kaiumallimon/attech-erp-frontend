export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE_SPRINT = 'ACTIVE_SPRINT',
  CLIENT_REVIEW = 'CLIENT_REVIEW',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED',
}

export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ProjectType {
  AI_AUTOMATION_SPRINT = 'AI_AUTOMATION_SPRINT',
  FULLSTACK_SPRINT = 'FULLSTACK_SPRINT',
  CLOUD_INFRASTRUCTURE = 'CLOUD_INFRASTRUCTURE',
  CYBERSECURITY = 'CYBERSECURITY',
  CUSTOM_DEV = 'CUSTOM_DEV',
  MAINTENANCE_RETAINER = 'MAINTENANCE_RETAINER',
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  CODE_REVIEW = 'CODE_REVIEW',
  TESTING = 'TESTING',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum RevisionStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  INVOICED = 'INVOICED',
  REJECTED = 'REJECTED',
}

export interface ProjectRevision {
  _id?: string;
  revisionNumber: string;
  title: string;
  description?: string;
  amount: number;
  status: RevisionStatus;
  invoiceId?: string;
  isPaid: boolean;
  requestedAt: string;
  approvedAt?: string;
}

export interface ProjectTeamMember {
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  role: string;
  allocationPercentage: number;
}

export interface Sprint {
  _id: string;
  name: string;
  projectId: string;
  goal?: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  leadId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    avatar?: string;
  };
  assignedMemberIds?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    avatar?: string;
  }>;
  velocityHours?: number;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
  sprintId?: {
    _id: string;
    name: string;
    status: string;
  } | string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    avatar?: string;
  };
  reporterId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
    avatar?: string;
  };
  estimatedHours?: number;
  loggedHours?: number;
  dueDate?: string;
  tags?: string[];
  order?: number;
  createdAt: string;
}

export interface Project {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  clientId: {
    _id: string;
    companyName: string;
    tier: string;
    primaryContactName?: string;
    primaryContactEmail?: string;
    billingEmail?: string;
  };
  originLeadId?: {
    _id: string;
    name: string;
    email: string;
    service: string;
  };
  proposalId?: {
    _id: string;
    proposalNumber: string;
    title: string;
    totalAmount: number;
  };
  projectManagerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  teamMembers: ProjectTeamMember[];
  contractAmount: number;
  revisionTotalAmount: number;
  currency: string;
  startDate?: string;
  targetDeliveryDate?: string;
  completedDate?: string;
  repositoryUrl?: string;
  demoUrl?: string;
  figmaUrl?: string;
  revisions: ProjectRevision[];
  tags: string[];
  sprints?: Sprint[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsStats {
  totalProjectsCount: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
  activeSprintsCount: number;
  tasksInReviewCount: number;
  totalContractValue: number;
  totalRevisionValue: number;
  taskCompletionRate: number;
  statusDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
}
