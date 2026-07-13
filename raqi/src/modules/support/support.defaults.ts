import { WorkingHoursRange } from './schemas/working-hours-range.schema';

export const DEFAULT_WORKING_HOURS: WorkingHoursRange[] = [
  {
    label: 'الأحد - الخميس',
    startTime: '08:00',
    endTime: '20:00',
  },
  {
    label: 'الجمعة - السبت',
    startTime: '10:00',
    endTime: '18:00',
  },
];

export const DEFAULT_FAQS = [
  {
    question: 'كيف يمكنني تغيير موعد الجمع؟',
    answer:
      'يمكنك تعديل موعد الجمع من صفحة الاشتراك أو التواصل مع خدمة العملاء لمساعدتك.',
    sortOrder: 0,
    active: true,
  },
  {
    question: 'ماذا أفعل إذا فاتني موعد الجمع؟',
    answer:
      'يمكنك إنشاء طلب إضافي من صفحة الطلبات لترتيب موعد جمع جديد.',
    sortOrder: 1,
    active: true,
  },
  {
    question: 'كيف أحصل على صندوق جديد؟',
    answer:
      'يمكنك طلب استبدال أو إضافة صندوق جديد من صفحة الطلبات.',
    sortOrder: 2,
    active: true,
  },
  {
    question: 'متى يتم تحديث النقاط المكتسبة؟',
    answer:
      'يتم تحديث النقاط تلقائياً بعد كل عملية جمع ناجحة خلال 24 ساعة.',
    sortOrder: 3,
    active: true,
  },
  {
    question: 'كيف أدفع فواتيري؟',
    answer:
      'يمكنك الدفع إلكترونياً عبر التطبيق أو نقداً للمندوب.',
    sortOrder: 4,
    active: true,
  },
];
