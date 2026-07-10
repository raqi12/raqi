import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminApi } from '../../api/modules';
import { useAdmin } from '../../contexts/AdminContext';
import { OverviewPage } from '../OverviewPage';
import { UsersPage } from '../module/UsersPage';
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
} from '../ModulePages';

export function AdminPageRoutes() {
  const admin = useAdmin();
  const {
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
    runMutation,
    loading,
  } = admin;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route
        path="/overview"
        element={
          <OverviewPage
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
            loading={loading}
          />
        }
      />
      <Route
        path="/users"
        element={
          <UsersPage
            users={users}
            loading={loading}
            onCreate={(body) => runMutation(() => AdminApi.users.create(body), 'تم إنشاء المستخدم')}
            onUpdate={(id, body) => runMutation(() => AdminApi.users.update(id, body), 'تم تحديث المستخدم')}
            onSetStatus={(id, status) =>
              runMutation(() => AdminApi.users.setStatus(id, status), `تم تحديث الحالة إلى ${status}`)
            }
          />
        }
      />
      <Route
        path="/customers"
        element={
          <CustomersPage
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
          />
        }
      />
      <Route
        path="/drivers"
        element={
          <DriversPage
            drivers={drivers}
            onCreate={(body) => runMutation(() => AdminApi.drivers.create(body), 'Driver created')}
            onUpdate={(id, body) => runMutation(() => AdminApi.drivers.update(id, body), 'Driver updated')}
            onSetStatus={(id, status) =>
              runMutation(() => AdminApi.drivers.setStatus(id, status), `Driver ${status}`)
            }
          />
        }
      />
      <Route
        path="/plans"
        element={
          <PlansPage
            plans={plans}
            onCreate={(body) => runMutation(() => AdminApi.plans.create(body), 'Plan created')}
            onUpdate={(id, body) => runMutation(() => AdminApi.plans.update(id, body), 'Plan updated')}
          />
        }
      />
      <Route
        path="/bins"
        element={
          <BinsPage
            bins={bins}
            customers={customers}
            onCreate={(body) => runMutation(() => AdminApi.bins.create(body), 'Bin created')}
            onUpdate={(id, body) => runMutation(() => AdminApi.bins.update(id, body), 'Bin updated')}
            onAssign={(id, customerId) =>
              runMutation(() => AdminApi.bins.assign(id, { customerId }), 'Bin assigned')
            }
            onUnassign={(id) => runMutation(() => AdminApi.bins.unassign(id), 'Bin unassigned')}
          />
        }
      />
      <Route
        path="/areas"
        element={
          <AreasPage
            areas={areas}
            onCreate={(body) => runMutation(() => AdminApi.areas.create(body), 'Area created')}
          />
        }
      />
      <Route
        path="/routes"
        element={
          <RoutesPage
            routes={routes}
            areas={areas}
            onCreate={(body) => runMutation(() => AdminApi.routes.create(body), 'Route created')}
          />
        }
      />
      <Route
        path="/tasks"
        element={
          <TasksPage
            tasks={tasks}
            areas={areas}
            drivers={drivers}
            onGenerate={(date, areaId) =>
              runMutation(() => AdminApi.tasks.generate(date, areaId), 'Tasks generated')
            }
            onAssign={(id, driverId) => runMutation(() => AdminApi.tasks.assign(id, driverId), 'Task assigned')}
          />
        }
      />
      <Route
        path="/subscriptions"
        element={
          <SubscriptionsPage
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
          />
        }
      />
      <Route
        path="/payments"
        element={
          <PaymentsPage
            payments={payments}
            onCreate={(body) => runMutation(() => AdminApi.payments.create(body), 'Payment created')}
          />
        }
      />
      <Route
        path="/bank-account"
        element={
          <BankAccountPage
            bankAccount={bankAccount}
            onUpdate={(body) =>
              runMutation(() => AdminApi.settings.bankAccount.update(body), 'Bank account updated')
            }
          />
        }
      />
      <Route
        path="/deposit-requests"
        element={
          <DepositRequestsPage
            depositRequests={depositRequests}
            onApprove={(id) => runMutation(() => AdminApi.depositRequests.approve(id), 'Deposit approved')}
            onReject={(id, reason) =>
              runMutation(() => AdminApi.depositRequests.reject(id, reason), 'Deposit rejected')
            }
          />
        }
      />
      <Route
        path="/complaints"
        element={
          <ComplaintsPage
            complaints={complaints}
            onUpdate={(id, body) => runMutation(() => AdminApi.complaints.update(id, body), 'Complaint updated')}
          />
        }
      />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
