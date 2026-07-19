import { Navigate, Route, Routes } from 'react-router-dom';
import { useCallback } from 'react';
import { AdminApi } from '../../api/modules';
import { useAdmin } from '../../contexts/AdminContext';
import { OverviewPage } from '../OverviewPage';
import { LocationsPage } from '../module/LocationsPage';
import { DriversPage } from '../module/DriversPage';
import { UsersPage } from '../module/UsersPage';
import {
  BankAccountPage,
  AdditionalCollectionPage,
  BinsPage,
  ComplaintsPage,
  CustomersPage,
  DepositRequestsPage,
  CashTopupsPage,
  PaymentsPage,
  PlansPage,
  RoutesPage,
  SubscriptionsPage,
  SupportPage,
  GalleryPage,
  ContentPageEditor,
  TasksPage,
  TicketsPage,
} from '../ModulePages';
import { NotificationsPage } from '../module/NotificationsPage';

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
    tickets,
    supportSettings,
    faqs,
    gallery,
    privacyPage,
    instructionsPage,
    binsStats,
    plans,
    bins,
    routes,
    bankAccount,
    additionalCollectionSettings,
    depositRequests,
    cashTopups,
    pendingDeposits,
    activity,
    runMutation,
    loading,
    loadAll,
    session,
    setToast,
  } = admin;

  const loadCustomerDetails = useCallback(async (id: string) => {
    const res = await AdminApi.customers.getDetails(id);
    return res.data;
  }, []);

  const loadCustomerAddresses = useCallback(async (customerId: string) => {
    const res = await AdminApi.customers.listAddresses(customerId);
    return res.data;
  }, []);

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
            drivers={drivers}
            plans={plans}
            bins={bins}
            cities={cities}
            areas={areas}
            loading={loading}
            onCreate={(body) => runMutation(() => AdminApi.customers.create(body), 'تم إنشاء العميل')}
            onLoadDetails={loadCustomerDetails}
            onDeposit={(id, amount) =>
              runMutation(() => AdminApi.customers.depositWallet(id, { amount }), 'تم الإيداع في المحفظة')
            }
            onAssignPlan={(body) =>
              runMutation(() => AdminApi.subscriptions.assignPlan(body), 'تم تعيين الاشتراك')
            }
            onDelete={(id) =>
              runMutation(() => AdminApi.customers.remove(id), 'تم حذف حساب العميل')
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
            onDelete={(id) =>
              runMutation(() => AdminApi.drivers.remove(id), 'تم حذف حساب السائق')
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
            tasks={tasks}
            payments={payments}
            areas={areas}
            cities={cities}
            loading={loading}
            onLoadAddresses={loadCustomerAddresses}
            onCreate={(body) => runMutation(() => AdminApi.subscriptions.create(body), 'تم إنشاء الاشتراك')}
            onAssignDriver={(id, driverId) =>
              runMutation(() => AdminApi.subscriptions.assignDriver(id, driverId), 'تم تعيين السائق')
            }
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.subscriptions.update(id, body), 'تم تحديث الاشتراك')
            }
            onActivate={(id) => runMutation(() => AdminApi.subscriptions.activate(id), 'تم تفعيل الاشتراك')}
            onSuspend={(id) => runMutation(() => AdminApi.subscriptions.suspend(id), 'تم إيقاف الاشتراك')}
            onRenew={(id) => runMutation(() => AdminApi.subscriptions.renew(id), 'تم تجديد الاشتراك')}
            onReplaceBin={(id, newBinId) =>
              runMutation(
                () => AdminApi.subscriptions.replaceBin(id, newBinId),
                'تم استبدال الصندوق',
              )
            }
          />
        }
      />
      <Route
        path="/payments"
        element={
          <PaymentsPage
            payments={payments}
            customers={customers}
            users={users}
            subscriptions={subscriptions}
            onCreate={(body) =>
              runMutation(() => AdminApi.payments.create(body), 'تم تسجيل الدفعة وإيداع المحفظة')
            }
            onConfirm={(id) =>
              runMutation(() => AdminApi.payments.confirm(id), 'تم تأكيد الدفعة')
            }
            onFail={(id) =>
              runMutation(() => AdminApi.payments.fail(id), 'تم تعليم الدفعة كفاشلة')
            }
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
        path="/additional-collection"
        element={
          <AdditionalCollectionPage
            settings={additionalCollectionSettings}
            onUpdate={(body) =>
              runMutation(
                () => AdminApi.settings.additionalCollection.update(body),
                'تم حفظ سعر الجمع الإضافي',
              )
            }
          />
        }
      />
      <Route
        path="/deposit-requests"
        element={
          <DepositRequestsPage
            depositRequests={depositRequests}
            customers={customers}
            users={users}
            loading={loading}
            onApprove={(id) =>
              runMutation(() => AdminApi.depositRequests.approve(id), 'تم اعتماد طلب الإيداع')
            }
            onReject={(id, reason) =>
              runMutation(() => AdminApi.depositRequests.reject(id, reason), 'تم رفض طلب الإيداع')
            }
          />
        }
      />
      <Route
        path="/cash-topups"
        element={
          <CashTopupsPage
            cashTopups={cashTopups}
            customers={customers}
            loading={loading}
            onAssign={(id, body) =>
              runMutation(() => AdminApi.cashTopups.assign(id, body), 'تم تعيين المندوب')
            }
            onDispatch={(id) =>
              runMutation(() => AdminApi.cashTopups.dispatch(id), 'تم إرسال المندوب')
            }
            onCollect={(id) =>
              runMutation(() => AdminApi.cashTopups.collect(id), 'تم تأكيد التحصيل')
            }
            onConfirm={(id) =>
              runMutation(() => AdminApi.cashTopups.confirm(id), 'تم شحن المحفظة')
            }
            onCancel={(id, reason) =>
              runMutation(() => AdminApi.cashTopups.cancel(id, reason), 'تم إلغاء الطلب')
            }
          />
        }
      />
      <Route
        path="/tickets"
        element={
          <TicketsPage
            tickets={tickets}
            users={users}
            accessToken={session.accessToken}
            loading={loading}
            onRefresh={loadAll}
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.tickets.update(id, body), 'تم تحديث التذكرة')
            }
          />
        }
      />
      <Route
        path="/notifications/*"
        element={
          <NotificationsPage
            users={users}
            onToast={(message) => setToast({ message, type: 'success' })}
          />
        }
      />
      <Route
        path="/support"
        element={
          <SupportPage
            supportSettings={supportSettings}
            faqs={faqs}
            loading={loading}
            onUpdateSettings={(body) =>
              runMutation(() => AdminApi.support.settings.update(body), 'تم حفظ إعدادات الدعم')
            }
            onCreateFaq={(body) =>
              runMutation(() => AdminApi.support.faqs.create(body), 'تم إضافة السؤال')
            }
            onUpdateFaq={(id, body) =>
              runMutation(() => AdminApi.support.faqs.update(id, body), 'تم تحديث السؤال')
            }
            onDeleteFaq={(id) =>
              runMutation(() => AdminApi.support.faqs.remove(id), 'تم حذف السؤال')
            }
          />
        }
      />
      <Route
        path="/privacy"
        element={
          <ContentPageEditor
            slug="privacy"
            heading="سياسة الخصوصية"
            description="المحتوى الذي يظهر في شاشة سياسة الخصوصية داخل التطبيق."
            page={privacyPage}
            loading={loading}
            onSave={(body) =>
              runMutation(() => AdminApi.pages.update('privacy', body), 'تم حفظ سياسة الخصوصية')
            }
          />
        }
      />
      <Route
        path="/instructions"
        element={
          <ContentPageEditor
            slug="instructions"
            heading="تعليمات الاستخدام"
            description="المحتوى الذي يظهر في شاشة تعليمات الاستخدام داخل التطبيق."
            page={instructionsPage}
            loading={loading}
            onSave={(body) =>
              runMutation(
                () => AdminApi.pages.update('instructions', body),
                'تم حفظ تعليمات الاستخدام',
              )
            }
          />
        }
      />
      <Route
        path="/gallery"
        element={
          <GalleryPage
            items={gallery}
            loading={loading}
            onCreate={(body) =>
              runMutation(() => AdminApi.gallery.create(body), 'تم إضافة عنصر المعرض')
            }
            onCreateWithImage={(formData) =>
              runMutation(() => AdminApi.gallery.createWithImage(formData), 'تم إضافة عنصر المعرض')
            }
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.gallery.update(id, body), 'تم تحديث عنصر المعرض')
            }
            onUpload={async (file) => {
              const res = await AdminApi.gallery.upload(file);
              return res.data.imageUrl;
            }}
            onDelete={(id) =>
              runMutation(() => AdminApi.gallery.remove(id), 'تم حذف عنصر المعرض')
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
