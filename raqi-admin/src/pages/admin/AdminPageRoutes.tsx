import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminApi } from '../../api/modules';
import { useAdmin } from '../../contexts/AdminContext';
import { OverviewPage } from '../OverviewPage';
import { LocationsPage } from '../module/LocationsPage';
import { DriversPage } from '../module/DriversPage';
import { UsersPage } from '../module/UsersPage';
import {
  BankAccountPage,
  BinsPage,
  ComplaintsPage,
  CustomersPage,
  DepositRequestsPage,
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
    cities,
    areas,
    tasks,
    subscriptions,
    payments,
    complaints,
    binsStats,
    plans,
    bins,
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
            users={users}
            plans={plans}
            bins={bins}
            cities={cities}
            areas={areas}
            loading={loading}
            onCreate={(body) => runMutation(() => AdminApi.customers.create(body), 'تم إنشاء العميل')}
            onUpdate={(id, body) => runMutation(() => AdminApi.customers.update(id, body), 'تم تحديث العميل')}
            onLoadDetails={async (id) => {
              const [walletRes, addressesRes] = await Promise.all([
                AdminApi.customers.getWallet(id),
                AdminApi.customers.listAddresses(id),
              ]);
              return { wallet: walletRes.data, addresses: addressesRes.data };
            }}
            onDeposit={(id, amount) =>
              runMutation(() => AdminApi.customers.depositWallet(id, { amount }), 'تم الإيداع في المحفظة')
            }
            onAssignPlan={(body) =>
              runMutation(() => AdminApi.subscriptions.assignPlan(body), 'تم تعيين الاشتراك')
            }
          />
        }
      />
      <Route
        path="/drivers"
        element={
          <DriversPage
            drivers={drivers}
            users={users}
            cities={cities}
            areas={areas}
            loading={loading}
            onCreate={(body) => runMutation(() => AdminApi.drivers.create(body), 'تم إنشاء السائق')}
            onUpdate={(id, body) => runMutation(() => AdminApi.drivers.update(id, body), 'تم تحديث السائق')}
            onSetStatus={(id, status) =>
              runMutation(
                () => AdminApi.drivers.setStatus(id, status),
                status === 'active' ? 'تم تفعيل السائق' : 'تم تعطيل السائق',
              )
            }
          />
        }
      />
      <Route
        path="/plans"
        element={
          <PlansPage
            plans={plans}
            loading={loading}
            onCreate={(body) => runMutation(() => AdminApi.plans.create(body), 'تم إنشاء الخطة')}
            onUpdate={(id, body) => runMutation(() => AdminApi.plans.update(id, body), 'تم تحديث الخطة')}
          />
        }
      />
      <Route
        path="/bins"
        element={
          <BinsPage
            bins={bins}
            customers={customers}
            users={users}
            loading={loading}
            onCreate={(body) => runMutation(() => AdminApi.bins.create(body), 'تم إنشاء الصندوق')}
            onUpdate={(id, body) => runMutation(() => AdminApi.bins.update(id, body), 'تم تحديث الصندوق')}
            onAssign={(id, customerId) =>
              runMutation(() => AdminApi.bins.assign(id, { customerId }), 'تم تخصيص الصندوق')
            }
            onUnassign={(id) => runMutation(() => AdminApi.bins.unassign(id), 'تم إلغاء تخصيص الصندوق')}
          />
        }
      />
      <Route
        path="/locations"
        element={
          <LocationsPage
            cities={cities}
            areas={areas}
            loading={loading}
            onCreateCity={(body) => runMutation(() => AdminApi.cities.create(body), 'تم إنشاء المدينة')}
            onUpdateCity={(id, body) => runMutation(() => AdminApi.cities.update(id, body), 'تم تحديث المدينة')}
            onDeleteCity={(id) => runMutation(() => AdminApi.cities.delete(id), 'تم حذف المدينة')}
            onCreateArea={(body) => runMutation(() => AdminApi.areas.create(body), 'تم إنشاء المنطقة')}
            onUpdateArea={(id, body) => runMutation(() => AdminApi.areas.update(id, body), 'تم تحديث المنطقة')}
            onDeleteArea={(id) => runMutation(() => AdminApi.areas.delete(id), 'تم حذف المنطقة')}
          />
        }
      />
      <Route path="/areas" element={<Navigate to="/locations" replace />} />
      <Route
        path="/routes"
        element={
          <RoutesPage
            routes={routes}
            areas={areas}
            cities={cities}
            loading={loading}
            onCreate={(body) => runMutation(() => AdminApi.routes.create(body), 'تم إنشاء المسار')}
          />
        }
      />
      <Route
        path="/tasks"
        element={
          <TasksPage
            tasks={tasks}
            areas={areas}
            cities={cities}
            drivers={drivers}
            users={users}
            loading={loading}
            onGenerate={(date, areaId) =>
              runMutation(() => AdminApi.tasks.generate(date, areaId), 'تم توليد المهام')
            }
            onAssign={(id, driverId) =>
              runMutation(() => AdminApi.tasks.assign(id, driverId), 'تم تعيين السائق')
            }
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
            users={users}
            drivers={drivers}
            areas={areas}
            cities={cities}
            loading={loading}
            onLoadAddresses={async (customerId) => {
              const res = await AdminApi.customers.listAddresses(customerId);
              return res.data;
            }}
            onCreate={(body) => runMutation(() => AdminApi.subscriptions.create(body), 'تم إنشاء الاشتراك')}
            onAssignDriver={(id, driverId) =>
              runMutation(() => AdminApi.subscriptions.assignDriver(id, driverId), 'تم تعيين السائق')
            }
            onActivate={(id) => runMutation(() => AdminApi.subscriptions.activate(id), 'تم تفعيل الاشتراك')}
            onSuspend={(id) => runMutation(() => AdminApi.subscriptions.suspend(id), 'تم إيقاف الاشتراك')}
            onRenew={(id) => runMutation(() => AdminApi.subscriptions.renew(id), 'تم تجديد الاشتراك')}
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
