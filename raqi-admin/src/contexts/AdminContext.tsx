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
import { usePolling } from '../hooks/usePolling';
import { formatApiError } from '../i18n/ar';
import type {
  Area,
  BankAccountSettings,
  Bin,
  BinStats,
  Complaint,
  Customer,
  DepositRequest,
  Driver,
  Overview,
  Payment,
  Plan,
  Route,
  Session,
  Subscription,
  Task,
  User,
} from '../types';

const POLL_MS = 10000;

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
  binsStats: BinStats | null;
  plans: Plan[];
  bins: Bin[];
  areas: Area[];
  routes: Route[];
  bankAccount: BankAccountSettings | null;
  depositRequests: DepositRequest[];
  pendingDeposits: number;
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
  const [binsStats, setBinsStats] = useState<BinStats | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccountSettings | null>(null);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
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
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        binsStatsRes,
        plansRes,
        binsRes,
        areasRes,
        routesRes,
        usersRes,
        customersRes,
        driversRes,
        tasksRes,
        subscriptionsRes,
        paymentsRes,
        complaintsRes,
        bankAccountRes,
        depositRequestsRes,
      ] = await Promise.all([
        AdminApi.overview(),
        AdminApi.bins.stats(),
        AdminApi.plans.list(),
        AdminApi.bins.list(),
        AdminApi.areas.list(),
        AdminApi.routes.list(),
        AdminApi.users.list(),
        AdminApi.customers.list(),
        AdminApi.drivers.list(),
        AdminApi.tasks.list(),
        AdminApi.subscriptions.list(),
        AdminApi.payments.list(),
        AdminApi.complaints.list(),
        AdminApi.settings.bankAccount.get(),
        AdminApi.depositRequests.list(),
      ]);
      setOverview(overviewRes.data);
      setBinsStats(binsStatsRes.data);
      setPlans(plansRes.data);
      setBins(binsRes.data);
      setAreas(areasRes.data);
      setRoutes(routesRes.data);
      setUsers(usersRes.data);
      setCustomers(customersRes.data);
      setDrivers(driversRes.data);
      setTasks(tasksRes.data);
      setSubscriptions(subscriptionsRes.data);
      setPayments(paymentsRes.data);
      setComplaints(complaintsRes.data);
      setBankAccount(bankAccountRes.data);
      setDepositRequests(depositRequestsRes.data);
      setLastSync(new Date().toLocaleTimeString());
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

  usePolling(loadAll, Boolean(session.accessToken), POLL_MS);

  function logout() {
    applySession(null);
    activity.push('خروج المدير');
  }

  const pendingDeposits = depositRequests.filter((r) => r.status === 'pending').length;
  const pollSubtitle = `تحديث تلقائي كل ${POLL_MS / 1000} ثانية${lastSync ? ` • آخر مزامنة ${lastSync}` : ''}`;

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
      binsStats,
      plans,
      bins,
      areas,
      routes,
      bankAccount,
      depositRequests,
      pendingDeposits,
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
      binsStats,
      plans,
      bins,
      areas,
      routes,
      bankAccount,
      depositRequests,
      pendingDeposits,
      activity,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
