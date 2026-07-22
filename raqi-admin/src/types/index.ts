export type ApiEnvelope<T> = {
  data: T;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: {
    id?: string;
    email?: string;
    role: string;
    name: string;
    permissions?: string[];
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
  assignedBins?: number;
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
  lat?: number;
  lng?: number;
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
  capacity?: number;
  fee?: number;
  totalCount?: number;
  availableCount?: number;
  active?: boolean;
  /** Present on customer-detail bin views */
  assignmentId?: string;
  customerId?: string | null;
  deliveryDate?: string | null;
};

export type BinAssignment = {
  _id?: string;
  id?: string;
  binId?: string;
  customerId?: string;
  subscriptionId?: string | null;
  deliveryDate?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  phone?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  status?: 'active' | 'inactive';
};

export type Customer = {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
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
  code?: string | null;
  vehicleNumber?: string;
  cityId?: string;
  areaId?: string;
  rating?: number | null;
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
  collectionDates?: string[];
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
  subscriptionId?: string | null;
  amount?: number;
  method?: 'cash' | 'online';
  status?: 'pending' | 'pending_gateway' | 'paid' | 'failed' | string;
  walletTransactionId?: string | null;
  recordedBy?: string | null;
  description?: string | null;
  paidAt?: string | null;
  createdAt?: string;
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
  senderRole?: 'customer' | 'driver' | 'admin';
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

export type AdditionalCollectionSettings = {
  _id?: string;
  id?: string;
  key?: string;
  price?: number;
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

export type CashTopupStatus =
  | 'pending'
  | 'dispatched'
  | 'collected'
  | 'completed'
  | 'cancelled';

export type CashTopupRequest = {
  _id?: string;
  id?: string;
  customerId?: string;
  addressId?: string;
  amount?: number;
  addressLabel?: string;
  addressDetails?: string;
  cityId?: string;
  areaId?: string;
  lat?: number;
  lng?: number;
  status?: CashTopupStatus;
  courierName?: string | null;
  courierPhone?: string | null;
  dispatchedAt?: string | null;
  collectedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  reviewedBy?: string | null;
  cancellationReason?: string | null;
  walletTransactionId?: string | null;
  createdAt?: string;
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

export type GalleryItem = {
  _id?: string;
  id?: string;
  title?: string;
  imageUrl?: string;
  caption?: string;
  linkUrl?: string;
  sortOrder?: number;
  active?: boolean;
};

export type ContentPageSlug = 'privacy' | 'instructions';

export type ContentPage = {
  slug: ContentPageSlug;
  title: string;
  body: string;
  updatedAt?: string | null;
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

export type AppNotification = {
  _id?: string;
  id?: string;
  userId?: string;
  title?: string;
  body?: string;
  image?: string | null;
  type?: string;
  category?: string;
  priority?: string;
  targetType?: string;
  targetId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead?: boolean;
  isSent?: boolean;
  sentAt?: string | null;
  readAt?: string | null;
  actionUrl?: string | null;
  scheduledNotificationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationList = {
  items: AppNotification[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type NotificationLog = {
  _id?: string;
  id?: string;
  notificationId?: string;
  userId?: string;
  channel?: 'in_app' | 'push';
  status?: string;
  errorMessage?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
  createdAt?: string;
};

export type NotificationTemplate = {
  _id?: string;
  id?: string;
  name?: string;
  code?: string;
  titleTemplate?: string;
  bodyTemplate?: string;
  variables?: string[];
  type?: string;
  category?: string;
  isActive?: boolean;
};

export type ScheduledNotification = {
  _id?: string;
  id?: string;
  title?: string;
  body?: string;
  image?: string | null;
  type?: string;
  category?: string;
  priority?: string;
  audience?: string;
  userId?: string | null;
  userIds?: string[];
  role?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  actionUrl?: string | null;
  scheduledAt?: string;
  status?: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  createdBy?: string;
  createdAt?: string;
};

export type NotificationPreference = {
  _id?: string;
  id?: string;
  userId?: string;
  enabled?: boolean;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  categories?: Array<{
    category: string;
    inApp: boolean;
    push: boolean;
    email: boolean;
  }>;
};

export type NotificationAnalytics = {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  series: Array<{ date: string; sent: number; delivered: number; opened: number }>;
  firebaseEnabled: boolean;
};

export type SendNotificationBody = {
  title: string;
  body: string;
  image?: string;
  type?: string;
  category?: string;
  priority?: string;
  audience?: 'user' | 'users' | 'role' | 'roles' | 'all';
  userId?: string;
  userIds?: string[];
  role?: string;
  roles?: string[];
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
};

export type ScheduleNotificationBody = SendNotificationBody & {
  scheduledAt: string;
  status?: 'draft' | 'scheduled';
};

