import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { login, loadStoredSession, refresh, storeSession } from './api/auth';
import { setRefreshHandler, setSessionTokens } from './api/http';
import { AdminApi } from './api/modules';
import { Toast } from './components/Toast';
import { Sidebar, type SidebarTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SearchProvider } from './contexts/SearchContext';
import { useTheme } from './hooks/useTheme';
import { usePolling } from './hooks/usePolling';
import { OverviewPage } from './pages/OverviewPage';
import { LoginPage } from './pages/LoginPage';
import { TAB_LABELS, formatApiError } from './i18n/ar';
import {
  AreasPage,
  BankAccountPage,
  BinsPage,
  ComplaintsPage,
  CustomersPage,
  DepositRequestsPage,
  DriversPage,
  PaymentsPage,
  PlansPage,
  RoutesPage,
  SubscriptionsPage,
  TasksPage,
  UsersPage,
} from './pages/ModulePages';
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
} from './types';

const POLL_MS = 10000;

const tabs = [
  'overview',
  'users',
  'customers',
  'drivers',
  'plans',
  'bins',
  'areas',
  'routes',
  'tasks',
  'subscriptions',
  'payments',
  'bank-account',
  'deposit-requests',
  'complaints',
] as const satisfies readonly SidebarTab[];
type Tab = (typeof tabs)[number];

function useActivityLog() {
  const [items, setItems] = useState<string[]>([]);
  return {
    items,
    push: (message: string) =>
      setItems((prev) => [`${new Date().toLocaleTimeString()} - ${message}`, ...prev].slice(0, 12)),
  };
}

export function App() {
  const [session, setSession] = useState<Session | null>(() => loadStoredSession());
  const [email, setEmail] = useState('admin@raqi.local');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();

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

  const isAdmin = useMemo(() => session?.user.role === 'admin', [session]);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    storeSession(next);
    setSessionTokens(next?.accessToken ?? null, next?.refreshToken ?? null);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!session?.refreshToken) return null;
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
    if (!session?.accessToken) return;
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
      ] =
        await Promise.all([
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
  }, [session?.accessToken]);

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
    setSessionTokens(session?.accessToken ?? null, session?.refreshToken ?? null);
    setRefreshHandler(session ? refreshAccessToken : null);
  }, [refreshAccessToken, session]);

  useEffect(() => {
    if (window.innerWidth <= 900) {
      setSidebarCollapsed(true);
      setMobileNavOpen(false);
    }
  }, []);

  usePolling(loadAll, Boolean(session?.accessToken && isAdmin), POLL_MS);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      applySession(res.data);
      setToast({ message: 'تم تسجيل الدخول بنجاح', type: 'success' });
      activity.push('دخول المدير');
    } catch (e) {
      setError(formatApiError(e instanceof Error ? e.message : 'فشل تسجيل الدخول'));
      applySession(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    applySession(null);
    setOverview(null);
    setUsers([]);
    setCustomers([]);
    setDrivers([]);
    setTasks([]);
    setSubscriptions([]);
    setPayments([]);
    setComplaints([]);
    setBinsStats(null);
    setPlans([]);
    setBins([]);
    setAreas([]);
    setRoutes([]);
    setBankAccount(null);
    setDepositRequests([]);
    activity.push('خروج المدير');
  }

  if (!session) {
    return (
      <LoginPage
        email={email}
        password={password}
        loading={loading}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  if (!isAdmin) {
    return (
      <main className="container">
        <section className="panel access-denied">
          <h2>الوصول مرفوض</h2>
          <p>هذه اللوحة مخصصة لحسابات المدير فقط.</p>
          <button onClick={logout}>تسجيل الخروج</button>
        </section>
      </main>
    );
  }

  const pendingDeposits = depositRequests.filter((r) => r.status === 'pending').length;
  const syncSubtitle = `تحديث تلقائي كل ${POLL_MS / 1000} ثانية${lastSync ? ` • آخر مزامنة ${lastSync}` : ''}`;

  return (
    <SearchProvider query={searchQuery} setQuery={setSearchQuery}>
      <div className="app-shell">
        <Sidebar
          activeTab={activeTab}
          onSelect={(tab) => {
            setActiveTab(tab);
            setSearchQuery('');
            if (window.innerWidth <= 900) {
              setMobileNavOpen(false);
            }
          }}
          userEmail={session.user.email}
          pendingDeposits={pendingDeposits}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onLogout={logout}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="main-area">
          <TopBar
            title={TAB_LABELS[activeTab]}
            subtitle={syncSubtitle}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            loading={loading}
            onRefresh={() => void loadAll()}
            theme={theme}
            onToggleTheme={toggleTheme}
            userEmail={session.user.email}
            onOpenMenu={() => setMobileNavOpen(true)}
          />

          <main className="content">
            {error ? <p className="error">{error}</p> : null}

            <div className="page-stack">
      {activeTab === 'overview' ? <OverviewPage
        overview={overview}
        usersCount={users.length}
        customersCount={customers.length}
        driversCount={drivers.length}
        tasksCount={tasks.length}
        subscriptionsCount={subscriptions.length}
        paymentsCount={payments.length}
        complaintsCount={complaints.length}
        binsStats={binsStats}
        pendingDeposits={pendingDeposits}
        activityItems={activity.items}
      /> : null}

      {activeTab === 'users' ? <UsersPage
        users={users}
        onCreate={(body) => runMutation(() => AdminApi.users.create(body), 'User created')}
        onUpdate={(id, body) => runMutation(() => AdminApi.users.update(id, body), 'User updated')}
        onSetStatus={(id, status) => runMutation(() => AdminApi.users.setStatus(id, status), `User ${status}`)}
      /> : null}

      {activeTab === 'customers' ? <CustomersPage
        customers={customers}
        plans={plans}
        bins={bins}
        onCreate={(body) => runMutation(() => AdminApi.customers.create(body), 'Customer created')}
        onUpdate={(id, body) => runMutation(() => AdminApi.customers.update(id, body), 'Customer updated')}
        onLoadDetails={async (id) => {
          const [walletRes, addressesRes] = await Promise.all([
            AdminApi.customers.getWallet(id),
            AdminApi.customers.listAddresses(id),
          ]);
          return { wallet: walletRes.data, addresses: addressesRes.data };
        }}
        onDeposit={(id, amount) =>
          runMutation(() => AdminApi.customers.depositWallet(id, { amount }), 'Wallet deposit completed')
        }
        onAssignPlan={(body) =>
          runMutation(() => AdminApi.subscriptions.assignPlan(body), 'Plan subscription assigned')
        }
      /> : null}

      {activeTab === 'drivers' ? <DriversPage
        drivers={drivers}
        onCreate={(body) => runMutation(() => AdminApi.drivers.create(body), 'Driver created')}
        onUpdate={(id, body) => runMutation(() => AdminApi.drivers.update(id, body), 'Driver updated')}
        onSetStatus={(id, status) => runMutation(() => AdminApi.drivers.setStatus(id, status), `Driver ${status}`)}
      /> : null}

      {activeTab === 'plans' ? <PlansPage
        plans={plans}
        onCreate={(body) => runMutation(() => AdminApi.plans.create(body), 'Plan created')}
        onUpdate={(id, body) => runMutation(() => AdminApi.plans.update(id, body), 'Plan updated')}
      /> : null}

      {activeTab === 'bins' ? <BinsPage
        bins={bins}
        customers={customers}
        onCreate={(body) => runMutation(() => AdminApi.bins.create(body), 'Bin created')}
        onUpdate={(id, body) => runMutation(() => AdminApi.bins.update(id, body), 'Bin updated')}
        onAssign={(id, customerId) => runMutation(() => AdminApi.bins.assign(id, { customerId }), 'Bin assigned')}
        onUnassign={(id) => runMutation(() => AdminApi.bins.unassign(id), 'Bin unassigned')}
      /> : null}

      {activeTab === 'areas' ? <AreasPage
        areas={areas}
        onCreate={(body) => runMutation(() => AdminApi.areas.create(body), 'Area created')}
      /> : null}

      {activeTab === 'routes' ? <RoutesPage
        routes={routes}
        areas={areas}
        onCreate={(body) => runMutation(() => AdminApi.routes.create(body), 'Route created')}
      /> : null}

      {activeTab === 'tasks' ? <TasksPage
        tasks={tasks}
        areas={areas}
        drivers={drivers}
        onGenerate={(date, areaId) => runMutation(() => AdminApi.tasks.generate(date, areaId), 'Tasks generated')}
        onAssign={(id, driverId) => runMutation(() => AdminApi.tasks.assign(id, driverId), 'Task assigned')}
      /> : null}

      {activeTab === 'subscriptions' ? <SubscriptionsPage
        subscriptions={subscriptions}
        plans={plans}
        bins={bins}
        customers={customers}
        areas={areas}
        onLoadAddresses={async (customerId) => {
          const res = await AdminApi.customers.listAddresses(customerId);
          return res.data;
        }}
        onCreate={(body) => runMutation(() => AdminApi.subscriptions.create(body), 'Subscription created')}
        onActivate={(id) => runMutation(() => AdminApi.subscriptions.activate(id), 'Subscription activated')}
        onSuspend={(id) => runMutation(() => AdminApi.subscriptions.suspend(id), 'Subscription suspended')}
        onRenew={(id) => runMutation(() => AdminApi.subscriptions.renew(id), 'Subscription renewed')}
      /> : null}

      {activeTab === 'payments' ? <PaymentsPage
        payments={payments}
        onCreate={(body) => runMutation(() => AdminApi.payments.create(body), 'Payment created')}
      /> : null}

      {activeTab === 'bank-account' ? <BankAccountPage
        bankAccount={bankAccount}
        onUpdate={(body) => runMutation(() => AdminApi.settings.bankAccount.update(body), 'Bank account updated')}
      /> : null}

      {activeTab === 'deposit-requests' ? <DepositRequestsPage
        depositRequests={depositRequests}
        onApprove={(id) => runMutation(() => AdminApi.depositRequests.approve(id), 'Deposit approved')}
        onReject={(id, reason) => runMutation(() => AdminApi.depositRequests.reject(id, reason), 'Deposit rejected')}
      /> : null}

      {activeTab === 'complaints' ? <ComplaintsPage
        complaints={complaints}
        onUpdate={(id, body) => runMutation(() => AdminApi.complaints.update(id, body), 'Complaint updated')}
      /> : null}
            </div>

            <Toast message={toast?.message ?? null} type={toast?.type} onClose={() => setToast(null)} />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
