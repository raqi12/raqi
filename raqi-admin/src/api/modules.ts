import type {
  Address,
  Area,
  AppNotification,
  BankAccountSettings,
  AdditionalCollectionSettings,
  Bin,
  BinAssignment,
  BinStats,
  City,
  Complaint,
  Ticket,
  TicketMessage,
  TicketMessageList,
  Customer,
  CustomerDetails,
  DepositRequest,
  CashTopupRequest,
  CashTopupStatus,
  Driver,
  Faq,
  GalleryItem,
  ContentPage,
  ContentPageSlug,
  NotificationAnalytics,
  NotificationList,
  NotificationLog,
  NotificationPreference,
  NotificationTemplate,
  Overview,
  Payment,
  Plan,
  Route,
  ScheduleNotificationBody,
  ScheduledNotification,
  SendNotificationBody,
  Subscription,
  SubscriptionCost,
  SupportSettings,
  Task,
  User,
  Wallet,
  WalletTransactionList,
} from '../types';
import { apiRequest } from './http';

export const AdminApi = {
  overview: () => apiRequest<Overview>('/admin/reports/overview'),
  bins: {
    list: () => apiRequest<Bin[]>('/admin/bins'),
    stats: () => apiRequest<BinStats>('/admin/bins/stats'),
    create: (body: {
      code: string;
      capacity?: number;
      fee?: number;
      totalCount: number;
    }) => apiRequest<Bin>('/admin/bins', { method: 'POST', body: JSON.stringify(body) }),
    update: (
      id: string,
      body: {
        capacity?: number;
        fee?: number;
        totalCount?: number;
        active?: boolean;
      },
    ) =>
      apiRequest<Bin>(`/admin/bins/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    assign: (id: string, body: { customerId: string; active?: boolean }) =>
      apiRequest<Bin>(`/admin/bins/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    unassign: (id: string) =>
      apiRequest<Bin>(`/admin/bins/${id}/unassign`, { method: 'POST' }),
    assignments: (id: string) =>
      apiRequest<BinAssignment[]>(`/admin/bins/${id}/assignments`),
    releaseAssignment: (assignmentId: string) =>
      apiRequest<BinAssignment>(`/admin/bins/assignments/${assignmentId}/release`, {
        method: 'POST',
      }),
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
    list: (activityType?: string) => {
      const params = activityType ? `?activityType=${encodeURIComponent(activityType)}` : '';
      return apiRequest<Plan[]>(`/admin/plans${params}`);
    },
    create: (body: {
      name: string;
      activityType: string;
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
        activityType?: string;
        price?: number;
        frequency?: 'weekly' | 'monthly' | 'custom';
        durationDays?: number;
        numberOfCollections?: number;
        active?: boolean;
      },
    ) => apiRequest<Plan>(`/admin/plans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    cost: (planId: string, binId?: string) => {
      const params = binId ? `?binId=${encodeURIComponent(binId)}` : '';
      return apiRequest<SubscriptionCost>(`/plans/${planId}/cost${params}`);
    },
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
      email?: string;
      phone: string;
      name: string;
      password: string;
      cityId: string;
      areaId: string;
      lat: number;
      lng: number;
    }) =>
      apiRequest<Customer>('/admin/customers', { method: 'POST', body: JSON.stringify(body) }),
    getWallet: (id: string) => apiRequest<Wallet>(`/admin/customers/${id}/wallet`),
    depositWallet: (id: string, body: { amount: number; note?: string }) =>
      apiRequest<Wallet>(`/admin/customers/${id}/wallet/deposit`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    walletTransactions: {
      list: (id: string, page = 1, limit = 50, type?: string) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (type) params.set('type', type);
        return apiRequest<WalletTransactionList>(
          `/admin/customers/${id}/wallet/transactions?${params.toString()}`,
        );
      },
    },
    listAddresses: (id: string) => apiRequest<Address[]>(`/admin/customers/${id}/addresses`),
    getDetails: (id: string) => apiRequest<CustomerDetails>(`/admin/customers/${id}/details`),
    remove: (id: string) =>
      apiRequest<Customer>(`/admin/customers/${id}`, { method: 'DELETE' }),
  },
  drivers: {
    list: () => apiRequest<Driver[]>('/admin/drivers'),
    create: (body: {
      phone: string;
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
    remove: (id: string) =>
      apiRequest<Driver>(`/admin/drivers/${id}`, { method: 'DELETE' }),
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
      binId?: string;
      addressId: string;
      collectionDates: string[];
      deductWallet?: boolean;
    }) =>
      apiRequest<Subscription>('/admin/subscriptions/assign-plan', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    replaceBin: (id: string, newBinId: string) =>
      apiRequest<Subscription>(`/admin/subscriptions/${id}/replace-bin`, {
        method: 'POST',
        body: JSON.stringify({ newBinId }),
      }),
  },
  payments: {
    list: () => apiRequest<Payment[]>('/admin/payments'),
    create: (body: {
      customerId: string;
      subscriptionId?: string;
      amount: number;
      method: 'cash' | 'online';
      description?: string;
    }) =>
      apiRequest<Payment>('/admin/payments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    confirm: (id: string, body?: { description?: string }) =>
      apiRequest<Payment>(`/admin/payments/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify(body ?? {}),
      }),
    fail: (id: string) =>
      apiRequest<Payment>(`/admin/payments/${id}/fail`, { method: 'PATCH' }),
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
    additionalCollection: {
      get: () =>
        apiRequest<AdditionalCollectionSettings | null>(
          '/admin/settings/additional-collection',
        ),
      update: (body: { price: number; active?: boolean }) =>
        apiRequest<AdditionalCollectionSettings>(
          '/admin/settings/additional-collection',
          {
            method: 'PATCH',
            body: JSON.stringify(body),
          },
        ),
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
  gallery: {
    list: () => apiRequest<GalleryItem[]>('/admin/gallery'),
    create: (body: {
      title: string;
      imageUrl: string;
      caption?: string;
      linkUrl?: string;
      sortOrder?: number;
      active?: boolean;
    }) =>
      apiRequest<GalleryItem>('/admin/gallery', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    createWithImage: (formData: FormData) =>
      apiRequest<GalleryItem>('/admin/gallery/with-image', {
        method: 'POST',
        body: formData,
      }),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiRequest<{ imageUrl: string }>('/admin/gallery/upload', {
        method: 'POST',
        body: formData,
      });
    },
    update: (
      id: string,
      body: {
        title?: string;
        imageUrl?: string;
        caption?: string;
        linkUrl?: string;
        sortOrder?: number;
        active?: boolean;
      },
    ) =>
      apiRequest<GalleryItem>(`/admin/gallery/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      apiRequest<GalleryItem>(`/admin/gallery/${id}`, {
        method: 'DELETE',
      }),
  },
  pages: {
    get: (slug: ContentPageSlug) =>
      apiRequest<ContentPage>(`/admin/pages/${slug}`),
    update: (slug: ContentPageSlug, body: { title: string; body: string }) =>
      apiRequest<ContentPage>(`/admin/pages/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
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
  cashTopups: {
    list: (status?: CashTopupStatus) =>
      apiRequest<CashTopupRequest[]>(
        status ? `/admin/cash-topups?status=${status}` : '/admin/cash-topups',
      ),
    get: (id: string) => apiRequest<CashTopupRequest>(`/admin/cash-topups/${id}`),
    assign: (id: string, body: { courierName: string; courierPhone: string }) =>
      apiRequest<CashTopupRequest>(`/admin/cash-topups/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    dispatch: (id: string) =>
      apiRequest<CashTopupRequest>(`/admin/cash-topups/${id}/dispatch`, { method: 'PATCH' }),
    collect: (id: string) =>
      apiRequest<CashTopupRequest>(`/admin/cash-topups/${id}/collect`, { method: 'PATCH' }),
    confirm: (id: string) =>
      apiRequest<CashTopupRequest>(`/admin/cash-topups/${id}/confirm`, { method: 'PATCH' }),
    cancel: (id: string, reason?: string) =>
      apiRequest<CashTopupRequest>(`/admin/cash-topups/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
  },
  notifications: {
    inbox: {
      list: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        category?: string;
        isRead?: boolean;
      }) => {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.search) query.set('search', params.search);
        if (params?.type) query.set('type', params.type);
        if (params?.category) query.set('category', params.category);
        if (typeof params?.isRead === 'boolean') query.set('isRead', String(params.isRead));
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return apiRequest<NotificationList>(`/notifications${suffix}`);
      },
      unreadCount: () => apiRequest<{ count: number }>('/notifications/unread-count'),
      markRead: (id: string) =>
        apiRequest<AppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
      markAllRead: () =>
        apiRequest<{ modified: number }>('/notifications/read-all', { method: 'POST' }),
      preferences: () => apiRequest<NotificationPreference>('/notifications/preferences'),
      updatePreferences: (body: Partial<NotificationPreference>) =>
        apiRequest<NotificationPreference>('/notifications/preferences', {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
    },
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      category?: string;
      isRead?: boolean;
    }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.type) query.set('type', params.type);
      if (params?.category) query.set('category', params.category);
      if (typeof params?.isRead === 'boolean') query.set('isRead', String(params.isRead));
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return apiRequest<NotificationList>(`/admin/notifications${suffix}`);
    },
    get: (id: string) =>
      apiRequest<{ notification: AppNotification; logs: NotificationLog[] }>(
        `/admin/notifications/${id}`,
      ),
    remove: (id: string) =>
      apiRequest<AppNotification>(`/admin/notifications/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: string[]) =>
      apiRequest<{ deleted: number }>('/admin/notifications/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    send: (body: SendNotificationBody) =>
      apiRequest<{ count: number }>('/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    schedule: (body: ScheduleNotificationBody) =>
      apiRequest<ScheduledNotification>('/admin/notifications/schedule', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listScheduled: () =>
      apiRequest<ScheduledNotification[]>('/admin/notifications/scheduled'),
    updateScheduled: (id: string, body: Partial<ScheduleNotificationBody>) =>
      apiRequest<ScheduledNotification>(`/admin/notifications/scheduled/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    cancelScheduled: (id: string) =>
      apiRequest<ScheduledNotification>(`/admin/notifications/scheduled/${id}/cancel`, {
        method: 'POST',
      }),
    templates: {
      list: () => apiRequest<NotificationTemplate[]>('/admin/notifications/templates'),
      create: (body: Partial<NotificationTemplate> & { name: string; code: string; titleTemplate: string; bodyTemplate: string }) =>
        apiRequest<NotificationTemplate>('/admin/notifications/templates', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      update: (id: string, body: Partial<NotificationTemplate>) =>
        apiRequest<NotificationTemplate>(`/admin/notifications/templates/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
      remove: (id: string) =>
        apiRequest<NotificationTemplate>(`/admin/notifications/templates/${id}`, {
          method: 'DELETE',
        }),
    },
    analytics: (params?: {
      from?: string;
      to?: string;
      granularity?: 'day' | 'week' | 'month';
      type?: string;
      role?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.from) query.set('from', params.from);
      if (params?.to) query.set('to', params.to);
      if (params?.granularity) query.set('granularity', params.granularity);
      if (params?.type) query.set('type', params.type);
      if (params?.role) query.set('role', params.role);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return apiRequest<NotificationAnalytics>(`/admin/notifications/analytics${suffix}`);
    },
  },
};
