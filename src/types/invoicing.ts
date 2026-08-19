export enum InvoiceType {
  CONTRACT_MILESTONE = 'CONTRACT_MILESTONE',
  REVISION_FEE = 'REVISION_FEE',
  RETAINER = 'RETAINER',
  CUSTOM = 'CUSTOM',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  BANK_DEPOSIT = 'BANK_DEPOSIT',
  ACH = 'ACH',
  CASH = 'CASH',
  CRYPTO = 'CRYPTO',
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentRecord {
  _id: string;
  paymentNumber: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  transactionReference?: string;
  paidAt: string;
  recordedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  notes?: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: InvoiceType;
  isRevision: boolean;
  revisionNumber?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  clientId: {
    _id: string;
    companyName: string;
    tier: string;
    primaryContactName?: string;
    billingEmail?: string;
  };
  projectId?: {
    _id: string;
    name: string;
    code: string;
    type: string;
    status: string;
    contractAmount: number;
    revisionTotalAmount: number;
  };
  clientName: string;
  clientEmail: string;
  billingAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  paymentTerms?: string;
  payments?: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoicingStats {
  totalInvoicedAmount: number;
  totalCollectedAmount: number;
  totalReceivablesAmount: number;
  totalOverdueAmount: number;
  totalRevisionRevenue: number;
  totalPaymentsRecorded: number;
  collectionRate: number;
  statusCounts: Record<string, number>;
  totalInvoicesCount: number;
}
