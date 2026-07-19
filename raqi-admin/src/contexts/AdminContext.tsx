import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { refresh, storeSession } from '../api/auth';
import { AdminApi } from '../api/modules';
import { setRefreshHandler, setSessionTokens } from '../api/http';
import { formatApiError } from '../i18n/ar';
import type {
  Area,
  BankAccountSettings,
  AdditionalCollectionSettings,
  Bin,
  BinStats,
  City,
  Complaint,
  Ticket,
  Customer,
  DepositRequest,
  CashTopupRequest,
  Driver,
  Faq,
  GalleryItem,
  ContentPage,
  Overview,
  Payment,
  Plan,
  Route,
  Session,
  Subscription,
  SupportSettings,
  Task,
  User,
} from '../types';


type ActivityLog = {
  items: string[];
  push: (message: string) => void;
};

type AdminContextValue = {
  session: Session;
  loading: boolean;
  error: string | null;
  toast: { message: string; type: 'success' | 'error' } | null;
  lastSync: string | null;
  pollSubtitle: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setToast: (value: { message: string; type: 'success' | 'error' } | null) => void;
  loadAll: () => Promise<void>;
  runMutation: (work: () => Promise<unknown>, success: string) => Promise<void>;
  logout: () => void;
  overview: Overview | null;
  users: User[];
  customers: Customer[];
  drivers: Driver[];
  tasks: Task[];
  subscriptions: Subscription[];
  payments: Payment[];
  complaints: Complaint[];
  tickets: Ticket[];
  supportSettings: SupportSettings | null;
  faqs: Faq[];
  gallery: GalleryItem[];
  privacyPage: ContentPage | null;
  instructionsPage: ContentPage | null;
  binsStats: BinStats | null;
  plans: Plan[];
  bins: Bin[];
  cities: City[];
  areas: Area[];
  routes: Route[];
  bankAccount: BankAccountSettings | null;
  additionalCollectionSettings: AdditionalCollectionSettings | null;
  depositRequests: DepositRequest[];
  cashTopups: CashTopupRequest[];
  pendingDeposits: number;
  pendingCashTopups: number;
  activity: ActivityLog;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return value;
}

type AdminProviderProps = {
  session: Session;
  onSessionChange: (session: Session | null) => void;
  children: ReactNode;
};

function useActivityLog() {
  const [items, setItems] = useState<string[]>([]);
  return {
    items,
    push: (message: string) =>
      setItems((prev) => [`${new Date().toLocaleTimeString()} - ${message}`, ...prev].slice(0, 12)),
  };
}

export function AdminProvider({ session, onSessionChange, children }: AdminProviderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [supportSettings, setSupportSettings] = useState<SupportSettings | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [privacyPage, setPrivacyPage] = useState<ContentPage | null>(null);
  const [instructionsPage, setInstructionsPage] = useState<ContentPage | null>(null);
  const [binsStats, setBinsStats] = useState<BinStats | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccountSettings | null>(null);
  const [additionalCollectionSettings, setAdditionalCollectionSettings] =
    useState<AdditionalCollectionSettings | null>(null);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [cashTopups, setCashTopups] = useState<CashTopupRequest[]>([]);
  const activity = useActivityLog();

  const applySession = useCallback(
    (next: Session | null) => {
      onSessionChange(next);
      storeSession(next);
      setSessionTokens(next?.accessToken ?? null, next?.refreshToken ?? null);
    },
    [onSessionChange],
  );

  const refreshAccessToken = useCallback(async () => {
    if (!session.refreshToken) return null;
    try {
      const res = await refresh(session.refreshToken);
      const next = { ...session, accessToken: res.data.accessToken };
      applySession(next);
      return next.accessToken;
    } catch {
      applySession(null);
      return null;
    }
  }, [applySession, session]);

  const loadAll = useCallback(async () => {
    if (!session.accessToken) return;
    // #region agent log
    fetch('http://127.0.0.1:7507/ingest/e05eb89e-9cfa-4057-adc1-4bbb50888184',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c8176'},body:JSON.stringify({sessionId:'1c8176',location:'AdminContext.tsx:loadAll-start',message:'loadAll started',data:{pathname:window.location.pathname},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        binsStatsRes,
        plansRes,
        binsRes,
        citiesRes,
        areasRes,
        routesRes,
        usersRes,
        customersRes,
        driversRes,
        tasksRes,
        subscriptionsRes,
        paymentsRes,
        complaintsRes,
        ticketsRes,
        supportSettingsRes,
        faqsRes,
        galleryRes,
        privacyPageRes,
        instructionsPageRes,
        bankAccountRes,
        additionalCollectionRes,
        depositRequestsRes,
        cashTopupsRes,
      ] = await Promise.all([
        AdminApi.overview(),
        AdminApi.bins.stats(),
        AdminApi.plans.list(),
        AdminApi.bins.list(),
        AdminApi.cities.list(),
        AdminApi.areas.list(),
        AdminApi.routes.list(),
        AdminApi.users.list(),
        AdminApi.customers.list(),
        AdminApi.drivers.list(),
        AdminApi.tasks.list(),
        AdminApi.subscriptions.list(),
        AdminApi.payments.list(),
        AdminApi.complaints.list(),
        AdminApi.tickets.list(),
        AdminApi.support.settings.get(),
        AdminApi.support.faqs.list(),
        AdminApi.gallery.list(),
        AdminApi.pages.get('privacy'),
        AdminApi.pages.get('instructions'),
        AdminApi.settings.bankAccount.get(),
        AdminApi.settings.additionalCollection.get(),
        AdminApi.depositRequests.list(),
        AdminApi.cashTopups.list(),
      ]);
      setOverview(overviewRes.data);
      setBinsStats(binsStatsRes.data);
      setPlans(plansRes.data);
      setBins(binsRes.data);
      setCities(citiesRes.data);
      setAreas(areasRes.data);
      setRoutes(routesRes.data);
      setUsers(usersRes.data);
      setCustomers(customersRes.data);
      setDrivers(driversRes.data);
      setTasks(tasksRes.data);
      setSubscriptions(subscriptionsRes.data);
      setPayments(paymentsRes.data);
      setComplaints(complaintsRes.data);
      setTickets(ticketsRes.data);
      setSupportSettings(supportSettingsRes.data);
      setFaqs(faqsRes.data);
      setGallery(galleryRes.data);
      setPrivacyPage(privacyPageRes.data);
      setInstructionsPage(instructionsPageRes.data);
      setBankAccount(bankAccountRes.data);
      setAdditionalCollectionSettings(additionalCollectionRes.data);
      setDepositRequests(depositRequestsRes.data);
      setCashTopups(cashTopupsRes.data);
      setLastSync(new Date().toLocaleTimeString());
      // #region agent log
      fetch('http://127.0.0.1:7507/ingest/e05eb89e-9cfa-4057-adc1-4bbb50888184',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c8176'},body:JSON.stringify({sessionId:'1c8176',location:'AdminContext.tsx:loadAll-done',message:'loadAll completed',data:{pathname:window.location.pathname,customersCount:customersRes.data.length},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
      // #endregion
    } catch (e) {
      setError(formatApiError(e instanceof Error ? e.message : 'فشل تحميل اللوحة'));
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  const runMutation = useCallback(
    async (work: () => Promise<unknown>, success: string) => {
      try {
        await work();
        await loadAll();
        activity.push(success);
        setToast({ message: success, type: 'success' });
      } catch (e) {
        const message = formatApiError(e instanceof Error ? e.message : 'فشلت العملية');
        setToast({ message, type: 'error' });
        setError(message);
      }
    },
    [activity, loadAll],
  );

  useEffect(() => {
    setSessionTokens(session.accessToken, session.refreshToken);
    setRefreshHandler(refreshAccessToken);
  }, [refreshAccessToken, session.accessToken, session.refreshToken]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7507/ingest/e05eb89e-9cfa-4057-adc1-4bbb50888184',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1c8176'},body:JSON.stringify({sessionId:'1c8176',location:'AdminContext.tsx:initial-load',message:'initial loadAll triggered (no polling)',data:{pathname:window.location.pathname},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    void loadAll();
  }, [loadAll]);

  function logout() {
    applySession(null);
    activity.push('خروج المدير');
  }

  const pendingDeposits = depositRequests.filter((r) => r.status === 'pending').length;
  const pendingCashTopups = cashTopups.filter((r) => r.status === 'pending').length;
  const pollSubtitle = lastSync ? `آخر مزامنة ${lastSync}` : 'اضغط تحديث لمزامنة البيانات';

  const value = useMemo<AdminContextValue>(
    () => ({
      session,
      loading,
      error,
      toast,
      lastSync,
      pollSubtitle,
      searchQuery,
      setSearchQuery,
      setToast,
      loadAll,
      runMutation,
      logout,
      overview,
      users,
      customers,
      drivers,
      tasks,
      subscriptions,
      payments,
      complaints,
      tickets,
      supportSettings,
      faqs,
      gallery,
      privacyPage,
      instructionsPage,
      binsStats,
      plans,
      bins,
      cities,
      areas,
      routes,
      bankAccount,
      additionalCollectionSettings,
      depositRequests,
      cashTopups,
      pendingDeposits,
      pendingCashTopups,
      activity,
    }),
    [
      session,
      loading,
      error,
      toast,
      lastSync,
      pollSubtitle,
      searchQuery,
      loadAll,
      runMutation,
      overview,
      users,
      customers,
      drivers,
      tasks,
      subscriptions,
      payments,
      complaints,
      tickets,
      supportSettings,
      faqs,
      gallery,
      privacyPage,
      instructionsPage,
      binsStats,
      plans,
      bins,
      cities,
      areas,
      routes,
      bankAccount,
      additionalCollectionSettings,
      depositRequests,
      cashTopups,
      pendingDeposits,
      pendingCashTopups,
      activity,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
