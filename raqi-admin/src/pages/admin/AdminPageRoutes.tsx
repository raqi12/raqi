import { Navigate, Route, Routes } from 'react-router-dom';
import { useCallback } from 'react';
import { AdminApi } from '../../api/modules';
import { useAdmin } from '../../contexts/AdminContext';
import { formatApiError } from '../../i18n/ar';
import { OverviewPage } from '../OverviewPage';
import { LocationsPage } from '../module/LocationsPage';
import { LocationCreatePage } from '../module/LocationCreatePage';
import { LocationDetailPage } from '../module/LocationDetailPage';
import {
  BankAccountPage,
  AdditionalCollectionPage,
  BinsPage,
  BinCreatePage,
  BinDetailPage,
  ComplaintDetailPage,
  ComplaintsPage,
  CustomerCreatePage,
  CustomerDetailPage,
  CustomersPage,
  DepositRequestsPage,
  CashTopupsPage,
  DriverCreatePage,
  DriverDetailPage,
  DriversPage,
  GalleryCreatePage,
  GalleryDetailPage,
  GalleryPage,
  ManagerCreatePage,
  ManagerDetailPage,
  ManagersPage,
  PaymentsPage,
  PlanCreatePage,
  PlanDetailPage,
  PlansPage,
  SubscriptionCreatePage,
  SubscriptionDetailPage,
  SubscriptionsPage,
  SupportPage,
  ContentPageEditor,
  TasksPage,
  TicketChatPage,
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
      <Route path="/users" element={<Navigate to="/managers" replace />} />
      <Route
        path="/managers"
        element={<ManagersPage users={users} loading={loading} />}
      />
      <Route
        path="/managers/new"
        element={
          <ManagerCreatePage
            currentRole={session.user.role}
            onCreate={async (body) => {
              try {
                const res = await AdminApi.users.create(body);
                await loadAll();
                activity.push('تم إنشاء الحساب');
                setToast({ message: 'تم إنشاء الحساب', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إنشاء الحساب',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/managers/:id"
        element={
          <ManagerDetailPage
            users={users}
            currentRole={session.user.role}
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.users.update(id, body), 'تم تحديث الحساب')
            }
            onSetStatus={(id, status) =>
              runMutation(
                () => AdminApi.users.setStatus(id, status),
                `تم تحديث الحالة إلى ${status}`,
              )
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
            cities={cities}
            areas={areas}
            loading={loading}
          />
        }
      />
      <Route
        path="/customers/new"
        element={
          <CustomerCreatePage
            cities={cities}
            areas={areas}
            onCreate={async (body) => {
              try {
                const res = await AdminApi.customers.create(body);
                await loadAll();
                activity.push('تم إنشاء العميل');
                setToast({ message: 'تم إنشاء العميل', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إنشاء العميل',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/customers/:id"
        element={
          <CustomerDetailPage
            customers={customers}
            users={users}
            drivers={drivers}
            plans={plans}
            bins={bins}
            cities={cities}
            areas={areas}
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
          />
        }
      />
      <Route
        path="/drivers/new"
        element={
          <DriverCreatePage
            cities={cities}
            areas={areas}
            onCreate={async (body) => {
              try {
                const res = await AdminApi.drivers.create(body);
                await loadAll();
                activity.push('تم إنشاء السائق');
                setToast({ message: 'تم إنشاء السائق', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إنشاء السائق',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/drivers/:id"
        element={
          <DriverDetailPage
            drivers={drivers}
            users={users}
            cities={cities}
            areas={areas}
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.drivers.update(id, body), 'تم تحديث السائق')
            }
            onSetPassword={(id, password) =>
              runMutation(() => AdminApi.drivers.setPassword(id, password), 'تم تحديث كلمة المرور')
            }
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
        element={<PlansPage plans={plans} loading={loading} />}
      />
      <Route
        path="/plans/new"
        element={
          <PlanCreatePage
            onCreate={async (body) => {
              try {
                const res = await AdminApi.plans.create(body);
                await loadAll();
                activity.push('تم إنشاء الخطة');
                setToast({ message: 'تم إنشاء الخطة', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إنشاء الخطة',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/plans/:id"
        element={
          <PlanDetailPage
            plans={plans}
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.plans.update(id, body), 'تم تحديث الخطة')
            }
          />
        }
      />
      <Route
        path="/bins"
        element={<BinsPage bins={bins} loading={loading} />}
      />
      <Route
        path="/bins/new"
        element={
          <BinCreatePage
            onCreate={async (body) => {
              try {
                const res = await AdminApi.bins.create(body);
                await loadAll();
                activity.push('تم إنشاء الصندوق');
                setToast({ message: 'تم إنشاء الصندوق', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إنشاء الصندوق',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/bins/:id"
        element={
          <BinDetailPage
            bins={bins}
            customers={customers}
            users={users}
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.bins.update(id, body), 'تم تحديث الصندوق')
            }
            onAssign={(id, customerId) =>
              runMutation(() => AdminApi.bins.assign(id, { customerId }), 'تم تخصيص الصندوق')
            }
            onLoadAssignments={async (binId) => {
              const res = await AdminApi.bins.assignments(binId);
              return res.data;
            }}
            onReleaseAssignment={(assignmentId) =>
              runMutation(
                () => AdminApi.bins.releaseAssignment(assignmentId),
                'تم إلغاء تخصيص الصندوق',
              )
            }
          />
        }
      />
      <Route
        path="/locations"
        element={
          <LocationsPage cities={cities} areas={areas} loading={loading} />
        }
      />
      <Route
        path="/locations/new"
        element={
          <LocationCreatePage
            onCreateCity={async (body) => {
              try {
                const res = await AdminApi.cities.create(body);
                await loadAll();
                activity.push('تم إنشاء المدينة');
                setToast({ message: 'تم إنشاء المدينة', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إنشاء المدينة',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/locations/:id"
        element={
          <LocationDetailPage
            cities={cities}
            areas={areas}
            onUpdateCity={(id, body) =>
              runMutation(() => AdminApi.cities.update(id, body), 'تم تحديث المدينة')
            }
            onDeleteCity={(id) =>
              runMutation(() => AdminApi.cities.delete(id), 'تم حذف المدينة')
            }
            onCreateArea={(body) =>
              runMutation(() => AdminApi.areas.create(body), 'تم إنشاء المنطقة')
            }
            onUpdateArea={(id, body) =>
              runMutation(() => AdminApi.areas.update(id, body), 'تم تحديث المنطقة')
            }
            onDeleteArea={(id) =>
              runMutation(() => AdminApi.areas.delete(id), 'تم حذف المنطقة')
            }
          />
        }
      />
      <Route path="/areas" element={<Navigate to="/locations" replace />} />
      <Route path="/routes" element={<Navigate to="/locations" replace />} />
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
          />
        }
      />
      <Route
        path="/subscriptions/new"
        element={
          <SubscriptionCreatePage
            plans={plans}
            bins={bins}
            customers={customers}
            users={users}
            areas={areas}
            cities={cities}
            onLoadAddresses={loadCustomerAddresses}
            onCreate={async (body) => {
              try {
                const res = await AdminApi.subscriptions.create(body);
                await loadAll();
                activity.push('تم إنشاء الاشتراك');
                setToast({ message: 'تم إنشاء الاشتراك', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إنشاء الاشتراك',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/subscriptions/:id"
        element={
          <SubscriptionDetailPage
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
            onLoadAddresses={loadCustomerAddresses}
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
            loading={loading}
          />
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <TicketChatPage
            tickets={tickets}
            users={users}
            accessToken={session.accessToken}
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
            onDelete={(id) =>
              runMutation(() => AdminApi.gallery.remove(id), 'تم حذف عنصر المعرض')
            }
          />
        }
      />
      <Route
        path="/gallery/new"
        element={
          <GalleryCreatePage
            itemCount={gallery.length}
            loading={loading}
            onCreate={async (body) => {
              try {
                const res = await AdminApi.gallery.create(body);
                await loadAll();
                activity.push('تم إضافة عنصر المعرض');
                setToast({ message: 'تم إضافة عنصر المعرض', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إضافة عنصر المعرض',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
            onCreateWithImage={async (formData) => {
              try {
                const res = await AdminApi.gallery.createWithImage(formData);
                await loadAll();
                activity.push('تم إضافة عنصر المعرض');
                setToast({ message: 'تم إضافة عنصر المعرض', type: 'success' });
                return res.data;
              } catch (e) {
                const message = formatApiError(
                  e instanceof Error ? e.message : 'فشل إضافة عنصر المعرض',
                );
                setToast({ message, type: 'error' });
                return undefined;
              }
            }}
          />
        }
      />
      <Route
        path="/gallery/:id"
        element={
          <GalleryDetailPage
            items={gallery}
            loading={loading}
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
            customers={customers}
            users={users}
            loading={loading}
          />
        }
      />
      <Route
        path="/complaints/:id"
        element={
          <ComplaintDetailPage
            complaints={complaints}
            customers={customers}
            users={users}
            onUpdate={(id, body) =>
              runMutation(() => AdminApi.complaints.update(id, body), 'تم تحديث الشكوى')
            }
          />
        }
      />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
