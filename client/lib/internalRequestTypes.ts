export type CountList = {
  countTotal: number;
  approvedTotal: number;
  pendingTotal: number;
  rejectedTotal: number;
  outstandingTotal: number;
};

// Nested types
export type User = {
  name: string;
  email: string;
  department: string;
};

export type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
  id: string;
  total: number;
  _id: string;
};

export type Account = {
  accountName: string;
  accountNumber: string;
  bankName: string;
};

export type Approval = {
  name: string;
  email: string;
  department: string;
};

export type PaymentHistory = {
  amount: number;
  date: Date;
  bank: string;
  paidBy: string;
  paymentMethod: number;
};

export type InternalRequisition = {
  paymentMethod: string | null;
  bank: string | null;
  referenceNumber: number | null;
  amountPaid: number;
  paymentType: string | null;
  _id: string;
  title: string;
  department: string;
  priority: string;
  category: string;
  approvedOn: Date;
  rejectedOn: Date;
  comment: string;
  requestedOn: Date;
  location: string;
  items: Item[];
  user: User;
  attachments: any[];
  approvedByFinance: Approval | null;
  approvedByHeadOfDepartment: boolean;
  totalAmount: number;
  requisitionNumber: string;
  accountToPay: Account | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
  paymentHistory: PaymentHistory[];
  amountRemaining: number;
  totalAmmontPaid: number;
  id: string;
};

export type InternalRequisitionOutPut = {
  data: InternalRequisition;
};

export type AllDataResponse = {
  data: InternalRequisition[];
  nextCursor: { timestamp: string; id: string } | null;
  hasMore: boolean;
  counts: CountList;
};

export type CreateRequisitionPayload = {
  title: string;
  location: string;
  category: string;
  requestedOn: string;
  accountToPay: Account;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    id: string;
    total: number;
  }[];
  attachement: File[];
};

export type DashboardData = {
  overview: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  };
  departmentStats: StatsWithAmounts[];
  locationStats: StatsWithAmounts[];
  recentRequisitions: {
    _id: string;
    title: string;
    department: string;
    totalAmount: number;
    requisitionNumber: string;
    status: string;
    createdAt: string;
    amountRemaining?: number;
    totalAmmontPaid?: number;
    id?: string;
  }[];
  categoryCount: {
    _id: string;
    count: number;
  }[];
  insights: {
    approvalRate: number;
    avgProcessingDays: number;
    topDepartment: string;
    monthOverMonthGrowth: number;
  };
  monthlyTrends: {
    _id: { year: number; month: number };
    count: number;
    totalAmount: number;
    approved: number;
    pending: number;
    rejected: number;
  }[];
};

export type Stats = {
  _id: string | null;
  count: number;
  totalAmount: number;
  pending: number;
  approved: number;
  rejected: number;
};

export type StatsWithAmounts = Stats & {
  pendingAmount?: number;
  approvedAmount?: number;
  rejectedAmount?: number;
};
