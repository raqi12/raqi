export const TAB_LABELS = {
  overview: 'نظرة عامة',
  users: 'المستخدمون',
  customers: 'العملاء',
  drivers: 'السائقون',
  plans: 'الخطط',
  bins: 'الصناديق',
  areas: 'المناطق',
  routes: 'المسارات',
  tasks: 'المهام',
  subscriptions: 'الاشتراكات',
  payments: 'المدفوعات',
  'bank-account': 'الحساب البنكي',
  'deposit-requests': 'طلبات الإيداع',
  complaints: 'الشكاوى',
} as const;

export function formatApiError(message: string): string {
  if (message === 'Failed to fetch' || message.includes('NetworkError')) {
    return 'تعذر الاتصال بالخادم. تأكد من تشغيل الخادم على المنفذ 3000.';
  }
  if (message.startsWith('Request failed')) {
    return 'فشل الطلب. تحقق من بيانات الدخول أو حالة الخادم.';
  }
  return message;
}
