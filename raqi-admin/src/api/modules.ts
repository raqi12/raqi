import type {
  Address,
  Area,
  BankAccountSettings,
  Bin,
  BinStats,
  City,
  Complaint,
  Ticket,
  TicketMessage,
  TicketMessageList,
  Customer,
  CustomerDetails,
  DepositRequest,
  Driver,
  Faq,
  Overview,
  Payment,
  Plan,
  Route,
  Subscription,
  SupportSettings,
  Task,
  User,
  Wallet,
} from '../types';
import { apiRequest } from './http';

export const AdminApi = {
  overview: () => apiRequest<Overview>('/admin/reports/overview'),
  bins: {
    list: () => apiRequest<Bin[]>('/admin/bins'),
    stats: () => apiRequest<BinStats>('/admin/bins/stats'),
    create: (body: { code: string; qr: string; capacity?: number }) =>
      apiRequest<Bin>('/admin/bins', { method: 'POST', body: JSON.stringify(body) }),
    update: (
      id: string,
      body: { capacity?: number; status?: 'available' | 'assigned' | 'maintenance' },
    ) =>
      apiRequest<Bin>(`/admin/bins/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    assign: (id: string, body: { customerId: string; active?: boolean }) =>
      apiRequest<Bin>(`/admin/bins/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    unassign: (id: string) =>
      apiRequest<Bin>(`/admin/bins/${id}/unassign`, { method: 'POST' }),
  },
  areas: {
    list: (cityId?: string) =>
      apiRequest<Area[]>(cityId ? `/admin/areas?cityId=${cityId}` : '/admin/areas'),
    create: (body: { name: string; cityId: string }) =>
      apiRequest<Area>('/admin/areas', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string; cityId?: string }) =>
      apiRequest<Area>(`/admin/areas/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      apiRequest<Area>(`/admin/areas/${id}`, { method: 'DELETE' }),
  },
  cities: {
    list: () => apiRequest<City[]>('/admin/cities'),
    create: (body: { name: string }) =>
      apiRequest<City>('/admin/cities', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name?: string }) =>
      apiRequest<City>(`/admin/cities/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      apiRequest<City>(`/admin/cities/${id}`, { method: 'DELETE' }),
  },
  routes: {
    list: () => apiRequest<Route[]>('/admin/routes'),
    create: (body: { name: string; areaId: string; stops?: string[] }) =>
      apiRequest<Route>('/admin/routes', { method: 'POST', body: JSON.stringify(body) }),
  },
  plans: {
    list: () => apiRequest<Plan[]>('/admin/plans'),
    create: (body: {
      name: string;
      price: number;
      frequency: 'weekly' | 'monthly' | 'custom';
      durationDays: number;
      numberOfCollections: number;
      active?: boolean;
    }) => apiRequest<Plan>('/admin/plans', { method: 'POST', body: JSON.stringify(body) }),
    update: (
      id: string,
      body: {
        name?: string;
        price?: number;
        frequency?: 'weekly' | 'monthly' | 'custom';
        durationDays?: number;
        numberOfCollections?: number;
        active?: boolean;
      },
    ) => apiRequest<Plan>(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  users: {
    list: () => apiRequest<User[]>('/admin/users'),
    create: (body: { email: string; name: string; password: string; role: string }) =>
      apiRequest<User>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { email?: string; name?: string }) =>
      apiRequest<User>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    setStatus: (id: string, status: 'active' | 'inactive') =>
      apiRequest<User>(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  customers: {
    list: () => apiRequest<Customer[]>('/admin/customers'),
    create: (body: {
      email: string;
      name: string;
      password: string;
      type: string;
      cityId: string;
      areaId: string;
    }) =>
      apiRequest<Customer>('/admin/customers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { type: string }) =>
      apiRequest<Customer>(`/admin/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    getWallet: (id: string) => apiRequest<Wallet>(`/admin/customers/${id}/wallet`),
    depositWallet: (id: string, body: { amount: number; note?: string }) =>
      apiRequest<Wallet>(`/admin/customers/${id}/wallet/deposit`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listAddresses: (id: string) => apiRequest<Address[]>(`/admin/customers/${id}/addresses`),
    getDetails: (id: string) => apiRequest<CustomerDetails>(`/admin/customers/${id}/details`),
  },
  drivers: {
    list: () => apiRequest<Driver[]>('/admin/drivers'),
    create: (body: {
      email: string;
      name: string;
      password: string;
      vehicleNumber: string;
      cityId: string;
      areaId: string;
    }) => apiRequest<Driver>('/admin/drivers', { method: 'POST', body: JSON.stringify(body) }),
    update: (
      id: string,
      body: { vehicleNumber?: string; cityId?: string; areaId?: string },
    ) =>
      apiRequest<Driver>(`/admin/drivers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    setStatus: (id: string, status: 'active' | 'inactive') =>
      apiRequest<Driver>(`/admin/drivers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  tasks: {
    list: () => apiRequest<Task[]>('/admin/tasks'),
    generate: (date: string, areaId: string) =>
      apiRequest<Task[]>('/admin/tasks/generate', {
        method: 'POST',
        body: JSON.stringify({ date, areaId }),
      }),
    assign: (id: string, driverId: string) =>
      apiRequest<Task>(`/admin/tasks/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ driverId }),
      }),
  },
  subscriptions: {
    list: () => apiRequest<Subscription[]>('/admin/subscriptions'),
    create: (body: {
      customerId: string;
      planId?: string;
      addressId: string;
      binId?: string;
      paymentStatus?: 'paid' | 'unpaid';
    }) =>
      apiRequest<Subscription>('/admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    assignDriver: (id: string, driverId: string) =>
      apiRequest<Subscription>(`/admin/subscriptions/${id}/assign-driver`, {
        method: 'PATCH',
        body: JSON.stringify({ driverId }),
      }),
    update: (
      id: string,
      body: {
        planId?: string;
        addressId?: string;
        binId?: string;
        paymentStatus?: 'paid' | 'unpaid';
      },
    ) =>
      apiRequest<Subscription>(`/admin/subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    activate: (id: string) =>
      apiRequest<Subscription>(`/admin/subscriptions/${id}/activate`, { method: 'PATCH' }),
    suspend: (id: string) =>
      apiRequest<Subscription>(`/admin/subscriptions/${id}/suspend`, { method: 'PATCH' }),
    renew: (id: string) =>
      apiRequest<Subscription>(`/admin/subscriptions/${id}/renew`, { method: 'PATCH' }),
    assignPlan: (body: {
      customerId: string;
      planId: string;
      binId: string;
      addressId: string;
      deductWallet?: boolean;
    }) =>
      apiRequest<Subscription>('/admin/subscriptions/assign-plan', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  payments: {
    list: () => apiRequest<Payment[]>('/admin/payments'),
    create: (body: {
      customerId: string;
      subscriptionId?: string;
      amount: number;
      method: 'cash' | 'online';
    }) =>
      apiRequest<Payment>('/admin/payments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  complaints: {
    list: () => apiRequest<Complaint[]>('/admin/complaints'),
    update: (
      id: string,
      body: { status?: 'open' | 'in_progress' | 'resolved' | 'closed'; assignee?: string },
    ) =>
      apiRequest<Complaint>(`/admin/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
  tickets: {
    list: (params?: {
      status?: string;
      priority?: string;
      assigneeId?: string;
      search?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.priority) query.set('priority', params.priority);
      if (params?.assigneeId) query.set('assigneeId', params.assigneeId);
      if (params?.search) query.set('search', params.search);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return apiRequest<Ticket[]>(`/admin/tickets${suffix}`);
    },
    get: (id: string) => apiRequest<Ticket>(`/admin/tickets/${id}`),
    update: (
      id: string,
      body: {
        status?: Ticket['status'];
        priority?: Ticket['priority'];
        assigneeId?: string;
      },
    ) =>
      apiRequest<Ticket>(`/admin/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    listMessages: (id: string, page = 1, limit = 100) =>
      apiRequest<TicketMessageList>(
        `/admin/tickets/${id}/messages?page=${page}&limit=${limit}`,
      ),
    sendMessage: (id: string, body: string) =>
      apiRequest<TicketMessage>(`/admin/tickets/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
  },
  settings: {
    bankAccount: {
      get: () => apiRequest<BankAccountSettings | null>('/admin/settings/bank-account'),
      update: (body: {
        bankName: string;
        accountHolder: string;
        accountNumber: string;
        iban?: string;
        notes?: string;
        active?: boolean;
      }) =>
        apiRequest<BankAccountSettings>('/admin/settings/bank-account', {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
    },
  },
  support: {
    settings: {
      get: () => apiRequest<SupportSettings | null>('/admin/support/settings'),
      update: (body: {
        phone: string;
        whatsapp: string;
        email: string;
        twitter: string;
        workingHours: Array<{ label: string; startTime: string; endTime: string }>;
        emergencyMessage: string;
        emergencyPhone: string;
        appVersion: string;
        lastUpdateLabel: string;
        active?: boolean;
      }) =>
        apiRequest<SupportSettings>('/admin/support/settings', {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
    },
    faqs: {
      list: () => apiRequest<Faq[]>('/admin/support/faqs'),
      create: (body: {
        question: string;
        answer: string;
        sortOrder?: number;
        active?: boolean;
      }) =>
        apiRequest<Faq>('/admin/support/faqs', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      update: (
        id: string,
        body: {
          question?: string;
          answer?: string;
          sortOrder?: number;
          active?: boolean;
        },
      ) =>
        apiRequest<Faq>(`/admin/support/faqs/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        apiRequest<Faq>(`/admin/support/faqs/${id}`, {
          method: 'DELETE',
        }),
    },
  },
  depositRequests: {
    list: (status?: 'pending' | 'approved' | 'rejected') =>
      apiRequest<DepositRequest[]>(
        status ? `/admin/deposit-requests?status=${status}` : '/admin/deposit-requests',
      ),
    approve: (id: string) =>
      apiRequest<DepositRequest>(`/admin/deposit-requests/${id}/approve`, { method: 'PATCH' }),
    reject: (id: string, rejectionReason?: string) =>
      apiRequest<DepositRequest>(`/admin/deposit-requests/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason }),
      }),
  },
};
