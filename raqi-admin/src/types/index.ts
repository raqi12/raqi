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

export type Bin = {
  _id?: string;
  id?: string;
  code?: string;
  qr?: string;
  capacity?: number;
  status?: 'available' | 'assigned' | 'maintenance';
  customerId?: string | null;
  active?: boolean;
};

export type Plan = {
  _id?: string;
  id?: string;
  name?: string;
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
  type?: string;
  cityId?: string;
  areaId?: string;
  status?: string;
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
