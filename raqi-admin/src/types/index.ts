export type ApiEnvelope<T> = {
  data: T;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    role: string;
    name: string;
  };
};

export type Overview = {
  activeSubscriptions: number;
  completedTasks: number;
  totalRevenue: number;
  generatedAt: string;
};

export type BinStats = {
  totalBins: number;
  totalCapacity: number;
  availableBins: number;
};

export type City = {
  _id?: string;
  id?: string;
  name?: string;
};

export type Area = {
  _id?: string;
  id?: string;
  name?: string;
  cityId?: string;
};

export type Route = {
  _id?: string;
  id?: string;
  name?: string;
  areaId?: string;
  stops?: string[];
};

export type Address = {
  _id?: string;
  id?: string;
  customerId?: string;
  cityId?: string;
  areaId?: string;
  isActive?: boolean;
  label?: string;
  details?: string;
};

export type Wallet = {
  _id?: string;
  id?: string;
  customerId?: string;
  balance?: number;
};

export type WalletTransaction = {
  _id?: string;
  id?: string;
  customerId?: string;
  type?: 'deposit' | 'admin_credit' | 'subscription_payment' | 'refund';
  direction?: 'credit' | 'debit';
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  referenceType?: 'deposit_request' | 'subscription' | 'manual' | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt?: string;
};

export type WalletTransactionList = {
  items: WalletTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Bin = {
  _id?: string;
  id?: string;
  code?: string;
  qr?: string;
  capacity?: number;
  fee?: number;
  status?: 'available' | 'assigned' | 'maintenance';
  customerId?: string | null;
  active?: boolean;
};

export type SubscriptionCost = {
  planId: string;
  binId?: string | null;
  planPrice: number;
  binFee: number;
  total: number;
};

export type Plan = {
  _id?: string;
  id?: string;
  name?: string;
  activityType?: string;
  price?: number;
  frequency?: 'weekly' | 'monthly' | 'custom';
  durationDays?: number;
  numberOfCollections?: number;
  active?: boolean;
};

export type User = {
  _id?: string;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: 'active' | 'inactive';
};

export type Customer = {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  cityId?: string;
  areaId?: string;
  status?: string;
};

export type CustomerDetails = {
  customer: Customer;
  wallet: Wallet | null;
  addresses: Address[];
  subscriptions: Subscription[];
  payments: Payment[];
  depositRequests: DepositRequest[];
  walletTransactions: WalletTransaction[];
  bins: Bin[];
  tasks: Task[];
  complaints: Complaint[];
};

export type Driver = {
  _id?: string;
  id?: string;
  userId?: string;
  vehicleNumber?: string;
  cityId?: string;
  areaId?: string;
  status?: 'active' | 'inactive';
};

export type Task = {
  _id?: string;
  id?: string;
  subscriptionId?: string;
  customerId?: string;
  driverId?: string;
  areaId?: string;
  scheduledDate?: string;
  date?: string;
  status?: string;
};

export type Subscription = {
  _id?: string;
  id?: string;
  customerId?: string;
  planId?: string;
  addressId?: string;
  binId?: string;
  cityId?: string;
  areaId?: string;
  driverId?: string;
  paymentStatus?: 'paid' | 'unpaid';
  status?: string;
  autoRenew?: boolean;
  expiresAt?: string;
  renewalGraceUntil?: string | null;
  renewedAt?: string | null;
};

export type Payment = {
  _id?: string;
  id?: string;
  customerId?: string;
  subscriptionId?: string;
  amount?: number;
  method?: 'cash' | 'online';
  status?: string;
};

export type Complaint = {
  _id?: string;
  id?: string;
  customerId?: string;
  subject?: string;
  body?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee?: string;
};

export type Ticket = {
  _id?: string;
  id?: string;
  ticketNumber?: string;
  userId?: string;
  userName?: string;
  subject?: string;
  description?: string;
  status?: 'pending' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string | null;
  closedAt?: string | null;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TicketMessage = {
  _id?: string;
  id?: string;
  ticketId?: string;
  senderId?: string;
  senderRole?: 'customer' | 'admin';
  body?: string;
  createdAt?: string;
};

export type TicketMessageList = {
  items: TicketMessage[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BankAccountSettings = {
  _id?: string;
  id?: string;
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  iban?: string | null;
  notes?: string | null;
  active?: boolean;
};

export type DepositRequest = {
  _id?: string;
  id?: string;
  customerId?: string;
  amount?: number;
  evidenceImageUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
};

export type WorkingHoursRange = {
  label: string;
  startTime: string;
  endTime: string;
};

export type SupportSettings = {
  _id?: string;
  id?: string;
  key?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  twitter?: string;
  workingHours?: WorkingHoursRange[];
  emergencyMessage?: string;
  emergencyPhone?: string;
  appVersion?: string;
  lastUpdateLabel?: string;
  active?: boolean;
};

export type Faq = {
  _id?: string;
  id?: string;
  question?: string;
  answer?: string;
  sortOrder?: number;
  active?: boolean;
};

export type SupportPage = {
  contacts: {
    phone: string;
    whatsapp: string;
    email: string;
    twitter: string;
  };
  workingHours: WorkingHoursRange[];
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
  }>;
  emergency: {
    message: string;
    phone: string;
  };
  appInfo: {
    version: string;
    lastUpdate: string;
  };
};
