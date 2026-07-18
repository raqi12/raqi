export const TAB_LABELS = {
  overview: 'نظرة عامة',
  users: 'المستخدمون',
  customers: 'العملاء',
  drivers: 'السائقون',
  plans: 'الخطط',
  bins: 'الصناديق',
  locations: 'المدن والمناطق',
  routes: 'المسارات',
  tasks: 'المهام',
  subscriptions: 'الاشتراكات',
  payments: 'المدفوعات',
  'bank-account': 'الحساب البنكي',
  'additional-collection': 'الجمع الإضافي',
  'deposit-requests': 'طلبات الإيداع',
  complaints: 'الشكاوى',
  tickets: 'تذاكر الدعم',
  support: 'صفحة الدعم',
  gallery: 'معرض الصور',
  privacy: 'سياسة الخصوصية',
  instructions: 'تعليمات الاستخدام',
  notifications: 'الإشعارات',
  'send-notification': 'إرسال إشعار',
} as const;

export const COMMON = {
  create: 'إنشاء',
  save: 'حفظ',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  search: 'بحث',
  refresh: 'تحديث',
  loading: 'جاري التحميل...',
  noResults: 'لا توجد نتائج',
  noData: 'لم يتم إضافة بيانات بعد.',
  trySearch: 'جرّب تعديل كلمات البحث.',
  records: 'سجل',
  show: 'إظهار',
  hide: 'إخفاء',
  edit: 'تعديل',
  delete: 'حذف',
  actions: 'إجراءات',
  status: 'الحالة',
  email: 'البريد الإلكتروني',
  name: 'الاسم',
  password: 'كلمة المرور',
  role: 'الدور',
  type: 'النوع',
  id: 'المعرف',
  vehicleNumber: 'رقم المركبة',
  city: 'المدينة',
  area: 'المنطقة',
  driver: 'السائق',
  selectCity: 'اختر المدينة',
  selectArea: 'اختر المنطقة',
} as const;

export const ROLES: Record<string, string> = {
  admin: 'مدير',
  support: 'دعم',
  operations: 'عمليات',
  manager: 'مشرف',
};

export const ACTIVITY_TYPES: Record<string, string> = {
  home: 'منزلي',
  commercial: 'تجاري',
  industrial: 'صناعي',
};

/** @deprecated Use ACTIVITY_TYPES */
export const CUSTOMER_TYPES = ACTIVITY_TYPES;

export const PLAN_FREQUENCIES: Record<string, string> = {
  weekly: 'أسبوعي',
  monthly: 'شهري',
  custom: 'مخصص',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  pending: 'معلق',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  available: 'متاح',
  assigned: 'مخصص',
  maintenance: 'صيانة',
  open: 'مفتوح',
  closed: 'مغلق',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
  suspended: 'موقوف',
  draft: 'مسودة',
  requested: 'قيد الطلب',
  expired: 'منتهٍ',
  paid: 'مدفوع',
  unpaid: 'غير مدفوع',
};

export function formatApiError(message: string): string {
  if (message === 'Failed to fetch' || message.includes('NetworkError')) {
    return 'تعذر الاتصال بالخادم. تأكد من تشغيل الخادم.';
  }
  if (message.startsWith('Request failed')) {
    return 'فشل الطلب. تحقق من بيانات الدخول أو حالة الخادم.';
  }
  return message;
}

export function formatStatus(status?: string): string {
  if (!status) return '—';
  return STATUS_LABELS[status] ?? status;
}
