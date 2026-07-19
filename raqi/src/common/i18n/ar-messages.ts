/** Maps English API exception messages to Arabic for client responses. */
export const AR_MESSAGES: Record<string, string> = {
  // Auth
  'Missing access token': 'رمز الوصول مفقود',
  'Invalid access token': 'رمز الوصول غير صالح',
  'Invalid token': 'رمز غير صالح',
  'Invalid credentials': 'بيانات الدخول غير صحيحة',
  'Invalid refresh token': 'رمز التحديث غير صالح',
  'Invalid or expired OTP': 'رمز التحقق غير صالح أو منتهي',
  'Invalid registration OTP': 'رمز التحقق للتسجيل غير صالح',
  'OTP attempts exceeded': 'تم تجاوز عدد محاولات رمز التحقق',
  'Email or phone is required': 'البريد الإلكتروني أو رقم الهاتف مطلوب',
  'Provide either email or phone, not both':
    'أدخل البريد الإلكتروني أو رقم الهاتف، وليس كليهما',
  'Phone number is not verified': 'رقم الهاتف غير موثق',
  'Phone already registered': 'رقم الهاتف مسجل مسبقاً',
  'Email already exists': 'البريد الإلكتروني مستخدم مسبقاً',
  'Passwords do not match': 'كلمتا المرور غير متطابقتين',
  'Password is incorrect': 'كلمة المرور غير صحيحة',
  'Current password is incorrect': 'كلمة المرور الحالية غير صحيحة',
  'Account is deactivated': 'الحساب معطّل',
  'Account is already deactivated': 'الحساب معطّل مسبقاً',
  'Account is already active': 'الحساب نشط مسبقاً',
  'Account has been deleted': 'تم حذف الحساب',
  'Account could not be reactivated': 'تعذر إعادة تفعيل الحساب',
  'Account has no phone number for OTP':
    'لا يوجد رقم هاتف مرتبط بالحساب لإرسال رمز التحقق',
  'Unauthorized socket': 'اتصال غير مصرح به',

  // Users / roles
  'User not found': 'المستخدم غير موجود',
  'User account not found': 'حساب المستخدم غير موجود',
  'You do not have enough permissions': 'ليس لديك صلاحيات كافية',
  'You do not have access to this ticket': 'ليس لديك صلاحية للوصول إلى هذه التذكرة',
  'You do not have access to this notification':
    'ليس لديك صلاحية للوصول إلى هذا الإشعار',

  // Customers / drivers
  'Customer not found': 'العميل غير موجود',
  'Customer profile not found': 'ملف العميل غير موجود',
  'Customer account required': 'حساب العميل مطلوب',
  'Customer account is already deleted': 'حساب العميل محذوف مسبقاً',
  'Driver not found': 'السائق غير موجود',
  'Driver profile not found': 'ملف السائق غير موجود',
  'Driver account is already deleted': 'حساب السائق محذوف مسبقاً',
  'Driver is not active': 'السائق غير نشط',
  'Driver code already in use': 'رمز السائق مستخدم مسبقاً',

  // Locations
  'City not found': 'المدينة غير موجودة',
  'City name already exists': 'اسم المدينة موجود مسبقاً',
  'Area not found': 'المنطقة غير موجودة',
  'Area name already exists in this city':
    'اسم المنطقة موجود مسبقاً في هذه المدينة',
  'Area does not belong to the selected city':
    'المنطقة لا تتبع المدينة المحددة',
  'Cannot delete city with existing areas':
    'لا يمكن حذف مدينة تحتوي على مناطق',
  'Cannot delete area linked to routes':
    'لا يمكن حذف منطقة مرتبطة بمسارات',
  'Address not found': 'العنوان غير موجود',
  'Address not found for this customer': 'العنوان غير موجود لهذا العميل',
  'Address must have city and area': 'يجب أن يتضمن العنوان مدينة ومنطقة',
  'Address is incomplete; city, area, and coordinates are required':
    'العنوان غير مكتمل؛ المدينة والمنطقة والإحداثيات مطلوبة',

  // Plans / bins / subscriptions
  'Plan not found': 'الخطة غير موجودة',
  'Plan is not available': 'الخطة غير متاحة',
  'Bin not found': 'الصندوق غير موجود',
  'Bin is not available': 'الصندوق غير متاح',
  'Bin is already assigned to this subscription':
    'الصندوق مخصص مسبقاً لهذا الاشتراك',
  'Subscription not found': 'الاشتراك غير موجود',
  'Active subscription not found': 'لا يوجد اشتراك نشط',
  'Subscription area is missing': 'منطقة الاشتراك مفقودة',
  'Subscription period end date is missing':
    'تاريخ نهاية فترة الاشتراك مفقود',
  'Subscription cannot be renewed in its current status':
    'لا يمكن تجديد الاشتراك في حالته الحالية',
  'Subscription has no plan': 'الاشتراك غير مرتبط بخطة',
  'Subscription was already renewed today': 'تم تجديد الاشتراك اليوم مسبقاً',
  'collectionDates is required': 'تواريخ الجمع مطلوبة',

  // Tasks / payments
  'Task not found': 'المهمة غير موجودة',
  'Task area not found': 'منطقة المهمة غير موجودة',
  'Payment not found': 'الدفعة غير موجودة',
  'Cannot confirm a failed payment': 'لا يمكن تأكيد دفعة فاشلة',
  'Cannot fail a paid payment': 'لا يمكن تعليم دفعة مدفوعة كفاشلة',
  'Insufficient wallet balance': 'رصيد المحفظة غير كافٍ',
  'Wallet not found for customer': 'محفظة العميل غير موجودة',
  'Amount must be greater than zero': 'يجب أن يكون المبلغ أكبر من صفر',

  // Deposits / cash top-ups
  'Deposit request not found': 'طلب الإيداع غير موجود',
  'Deposit request is not pending': 'طلب الإيداع ليس قيد الانتظار',
  'Bank account is not configured yet': 'لم يتم إعداد الحساب البنكي بعد',
  'Transfer evidence image is required': 'صورة إثبات التحويل مطلوبة',
  'Cash top-up request not found': 'طلب الشحن النقدي غير موجود',
  'Assign a courier before dispatching': 'عيّن مندوباً قبل الإرسال',
  'Courier name and phone are required': 'اسم المندوب ورقم هاتفه مطلوبان',
  'Cannot assign courier to a closed request':
    'لا يمكن تعيين مندوب لطلب مغلق',
  'Courier can only be assigned while pending or dispatched':
    'يمكن تعيين المندوب فقط عندما يكون الطلب قيد الانتظار أو تم إرساله',
  'Only pending requests can be dispatched':
    'يمكن إرسال الطلبات قيد الانتظار فقط',
  'Only dispatched requests can be collected':
    'يمكن تحصيل الطلبات المُرسلة فقط',
  'Only collected requests can be confirmed and credited':
    'يمكن اعتماد وشحن الطلبات المُحصَّلة فقط',
  'Completed requests cannot be cancelled':
    'لا يمكن إلغاء الطلبات المكتملة',
  'Request is already cancelled': 'الطلب ملغى مسبقاً',
  'Request already credited': 'تم شحن المحفظة لهذا الطلب مسبقاً',
  'Customers can only cancel pending requests':
    'يمكن للعملاء إلغاء الطلبات قيد الانتظار فقط',

  // Tickets / complaints / support / gallery
  'Ticket not found': 'التذكرة غير موجودة',
  'Complaint not found': 'الشكوى غير موجودة',
  'FAQ not found': 'السؤال غير موجود',
  'Gallery item not found': 'عنصر المعرض غير موجود',
  'Image file is required': 'ملف الصورة مطلوب',
  'Rating must be between 0 and 5': 'يجب أن يكون التقييم بين 0 و 5',
  'Report problem requires reason and location':
    'الإبلاغ عن مشكلة يتطلب السبب والموقع',

  // Notifications
  'Notification not found': 'الإشعار غير موجود',
  'Scheduled notification not found': 'الإشعار المجدول غير موجود',
  'Template not found': 'القالب غير موجود',
  'No recipients found for this audience':
    'لم يتم العثور على مستلمين لهذه الفئة',
  'Cannot send notification: one or more users have no FCM device token':
    'تعذر إرسال الإشعار: بعض المستخدمين لا يملكون رمز جهاز للإشعارات',
  'role is required': 'الدور مطلوب',
  'roles is required': 'الأدوار مطلوبة',
  'userId is required': 'معرّف المستخدم مطلوب',
  'userIds is required': 'معرّفات المستخدمين مطلوبة',
  'month must be 1–12': 'يجب أن يكون الشهر بين 1 و 12',

  // Validation (custom DTO)
  'each collectionDate must be YYYY-MM-DD':
    'يجب أن يكون كل تاريخ جمع بصيغة YYYY-MM-DD',
  'collectionDate must be YYYY-MM-DD':
    'يجب أن يكون تاريخ الجمع بصيغة YYYY-MM-DD',

  // Generic Nest labels
  'Bad Request': 'طلب غير صالح',
  Unauthorized: 'غير مصرح',
  Forbidden: 'محظور',
  'Not Found': 'غير موجود',
  Conflict: 'تعارض',
  'Internal Server Error': 'خطأ في الخادم',
  'Forbidden resource': 'مورد محظور',
};

const HTTP_ERROR_AR: Record<number, string> = {
  400: 'طلب غير صالح',
  401: 'غير مصرح',
  403: 'محظور',
  404: 'غير موجود',
  409: 'تعارض',
  422: 'بيانات غير قابلة للمعالجة',
  500: 'خطأ في الخادم',
};

const VALIDATION_PATTERNS: Array<{ test: RegExp; toAr: (m: RegExpMatchArray) => string }> = [
  {
    test: /^(.+) must be an email$/,
    toAr: (m) => `${fieldAr(m[1])} يجب أن يكون بريداً إلكترونياً صالحاً`,
  },
  {
    test: /^(.+) should not be empty$/,
    toAr: (m) => `${fieldAr(m[1])} مطلوب ولا يمكن أن يكون فارغاً`,
  },
  {
    test: /^(.+) must be a string$/,
    toAr: (m) => `${fieldAr(m[1])} يجب أن يكون نصاً`,
  },
  {
    test: /^(.+) must be a number$/,
    toAr: (m) => `${fieldAr(m[1])} يجب أن يكون رقماً`,
  },
  {
    test: /^(.+) must be a boolean value$/,
    toAr: (m) => `${fieldAr(m[1])} يجب أن يكون قيمة منطقية`,
  },
  {
    test: /^(.+) must be an array$/,
    toAr: (m) => `${fieldAr(m[1])} يجب أن يكون مصفوفة`,
  },
  {
    test: /^(.+) must be longer than or equal to (\d+) characters$/,
    toAr: (m) =>
      `${fieldAr(m[1])} يجب أن يكون بطول ${m[2]} حرفاً على الأقل`,
  },
  {
    test: /^(.+) must be shorter than or equal to (\d+) characters$/,
    toAr: (m) =>
      `${fieldAr(m[1])} يجب ألا يتجاوز ${m[2]} حرفاً`,
  },
  {
    test: /^(.+) must not be less than (\d+)$/,
    toAr: (m) => `${fieldAr(m[1])} يجب ألا يقل عن ${m[2]}`,
  },
  {
    test: /^(.+) must not be greater than (\d+)$/,
    toAr: (m) => `${fieldAr(m[1])} يجب ألا يزيد عن ${m[2]}`,
  },
  {
    test: /^(.+) must be one of the following values: (.+)$/,
    toAr: (m) =>
      `${fieldAr(m[1])} يجب أن يكون إحدى القيم التالية: ${m[2]}`,
  },
  {
    test: /^(.+) must be a mongodb id$/,
    toAr: (m) => `${fieldAr(m[1])} يجب أن يكون معرّفاً صالحاً`,
  },
  {
    test: /^(.+) must be a valid enum value$/,
    toAr: (m) => `${fieldAr(m[1])} قيمة غير صالحة`,
  },
  {
    test: /^property (.+) should not exist$/,
    toAr: (m) => `الحقل ${m[1]} غير مسموح به`,
  },
];

const FIELD_AR: Record<string, string> = {
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  phone: 'رقم الهاتف',
  name: 'الاسم',
  role: 'الدور',
  status: 'الحالة',
  amount: 'المبلغ',
  cityId: 'المدينة',
  areaId: 'المنطقة',
  customerId: 'العميل',
  driverId: 'السائق',
  planId: 'الخطة',
  binId: 'الصندوق',
  addressId: 'العنوان',
  subject: 'الموضوع',
  body: 'المحتوى',
  title: 'العنوان',
  otp: 'رمز التحقق',
  code: 'الرمز',
  lat: 'خط العرض',
  lng: 'خط الطول',
  addressLabel: 'تسمية العنوان',
  vehicleNumber: 'رقم المركبة',
  collectionDates: 'تواريخ الجمع',
  collectionDate: 'تاريخ الجمع',
  image: 'الصورة',
  evidenceImage: 'صورة الإثبات',
};

function fieldAr(field: string): string {
  return FIELD_AR[field] ?? field;
}

export function translateMessage(message: string): string {
  if (typeof message !== 'string') {
    return String(message ?? '');
  }
  const exact = AR_MESSAGES[message];
  if (exact) {
    return exact;
  }

  const calendarMatch = message.match(/^Invalid calendar date "(.+)"$/);
  if (calendarMatch) {
    return `تاريخ غير صالح "${calendarMatch[1]}"`;
  }

  // Mongoose path required errors, e.g. "Path `lat` is required."
  const requiredPath = message.match(/^Path `(.+)` is required\.?$/i);
  if (requiredPath) {
    return `${fieldAr(requiredPath[1])} مطلوب`;
  }

  for (const rule of VALIDATION_PATTERNS) {
    const match = message.match(rule.test);
    if (match) {
      return rule.toAr(match);
    }
  }

  return message;
}

export function translateMessages(message: string | string[]): string | string[] {
  if (Array.isArray(message)) {
    return message.map(translateMessage);
  }
  return translateMessage(message);
}

export function httpErrorLabelAr(statusCode: number, fallback?: string): string {
  return HTTP_ERROR_AR[statusCode] ?? (fallback ? translateMessage(fallback) : 'خطأ');
}
