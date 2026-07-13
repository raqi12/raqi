import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ACTIVITY_TYPES } from '../../activity-type';
import { Role } from '../../roles.enum';

export class UserDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'admin@raqi.local' })
  email: string;

  @ApiPropertyOptional({ example: '+218912345678' })
  phone?: string;

  @ApiProperty({ example: false })
  phoneVerified: boolean;

  @ApiProperty({ example: 'مدير النظام' })
  name: string;

  @ApiProperty({ enum: Role, example: Role.Admin })
  role: Role;

  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  status: string;

  @ApiPropertyOptional({ example: '2026-07-10T12:00:00.000Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2026-07-10T12:00:00.000Z' })
  updatedAt?: string;
}

export class CustomerDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  userId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', description: 'Parent city MongoDB ID' })
  cityId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439014', description: 'Service area MongoDB ID' })
  areaId: string;

  @ApiPropertyOptional({ example: 'أحمد الزاوي', description: 'Linked user display name' })
  name?: string;

  @ApiPropertyOptional({ example: 'customer@example.com', description: 'Linked user email' })
  email?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], example: 'active', description: 'Linked user account status' })
  status?: string;
}

export class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (Bearer)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token for POST /auth/refresh',
  })
  refreshToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;

  @ApiPropertyOptional({ type: CustomerDto })
  customer?: CustomerDto;
}

export class RefreshTokenDataDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
}

export class AddressDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  cityId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439014' })
  areaId: string;

  @ApiProperty({ example: true, description: 'Whether this is the customer primary service address' })
  isActive: boolean;

  @ApiProperty({ example: 'المنزل' })
  label: string;

  @ApiProperty({ example: 'شارع الجمهورية، بجوار المسجد' })
  details: string;
}

export class DriverDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  userId: string;

  @ApiProperty({ example: '5-12345' })
  vehicleNumber: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  cityId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439014' })
  areaId: string;

  @ApiProperty({ enum: ['active', 'inactive'], example: 'active' })
  status: string;
}

export class CityDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'طرابلس' })
  name: string;
}

export class AreaDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'حي الأندلس' })
  name: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  cityId: string;
}

export class RouteDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'مسار الصباح' })
  name: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  areaId: string;

  @ApiProperty({ type: [String], example: ['نقطة 1', 'نقطة 2'] })
  stops: string[];
}

export class PlanDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'خطة شهرية' })
  name: string;

  @ApiProperty({ enum: ACTIVITY_TYPES, example: 'home' })
  activityType: string;

  @ApiProperty({ example: 150 })
  price: number;

  @ApiProperty({ enum: ['weekly', 'monthly', 'custom'], example: 'monthly' })
  frequency: string;

  @ApiProperty({ example: 30 })
  durationDays: number;

  @ApiProperty({ example: 4 })
  numberOfCollections: number;

  @ApiProperty({ example: true })
  active: boolean;
}

export class BinDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'BIN-001' })
  code: string;

  @ApiProperty({ example: 'QR-BIN-001' })
  qr: string;

  @ApiProperty({ example: 120 })
  capacity: number;

  @ApiProperty({ example: 50, description: 'Bin fee in LYD added to subscription cost' })
  fee: number;

  @ApiProperty({ enum: ['available', 'assigned', 'maintenance'], example: 'available' })
  status: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  customerId?: string;

  @ApiProperty({ example: true })
  active: boolean;
}

export class BinStatsDto {
  @ApiProperty({ example: 10 })
  totalBins: number;

  @ApiProperty({ example: 6 })
  availableBins: number;

  @ApiProperty({ example: 3 })
  assignedBins: number;

  @ApiProperty({ example: 1 })
  maintenanceBins: number;
}

export class SubscriptionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  planId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439014' })
  addressId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439015' })
  binId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439017' })
  cityId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439016' })
  areaId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439018' })
  driverId?: string;

  @ApiProperty({
    enum: ['draft', 'requested', 'active', 'suspended', 'expired'],
    example: 'active',
  })
  status: string;

  @ApiProperty({ enum: ['unpaid', 'paid'], example: 'paid' })
  paymentStatus: string;

  @ApiPropertyOptional({ example: '2026-07-10T12:00:00.000Z' })
  renewedAt?: string;

  @ApiProperty({ example: false })
  autoRenew: boolean;

  @ApiPropertyOptional({ example: '2026-08-10T12:00:00.000Z' })
  expiresAt?: string;

  @ApiPropertyOptional({ example: '2026-08-13T12:00:00.000Z' })
  renewalGraceUntil?: string;
}

export class SubscriptionPlanSummaryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  id: string;

  @ApiProperty({ example: 'خطة شهرية' })
  name: string;

  @ApiProperty({ example: 150 })
  price: number;

  @ApiProperty({ example: 30 })
  durationDays: number;

  @ApiProperty({ enum: ['weekly', 'monthly', 'custom'], example: 'monthly' })
  frequency: string;
}

export class CustomerSubscriptionCurrentDto extends SubscriptionDto {
  @ApiPropertyOptional({ type: SubscriptionPlanSummaryDto })
  plan?: SubscriptionPlanSummaryDto;
}

export class PaymentDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  subscriptionId?: string;

  @ApiProperty({ example: 150 })
  amount: number;

  @ApiProperty({ enum: ['cash', 'online'], example: 'cash' })
  method: string;

  @ApiProperty({
    enum: ['pending', 'pending_gateway', 'paid', 'failed'],
    example: 'paid',
  })
  status: string;
}

export class TaskDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  subscriptionId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  customerId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439014' })
  driverId?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439015' })
  areaId: string;

  @ApiProperty({ example: '2026-07-10' })
  scheduledDate: string;

  @ApiProperty({
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
    example: 'pending',
  })
  status: string;
}

export class ComplaintDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiProperty({ example: 'تأخر في الجمع' })
  subject: string;

  @ApiProperty({ example: 'لم يتم جمع النفايات في الموعد المحدد' })
  body: string;

  @ApiProperty({
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    example: 'open',
  })
  status: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  assignee?: string;
}

export class TicketDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'TKT-20260712-0001' })
  ticketNumber: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  userId: string;

  @ApiPropertyOptional({ example: 'أحمد محمد' })
  userName?: string;

  @ApiProperty({ example: 'مشكلة في الجمع' })
  subject: string;

  @ApiProperty({ example: 'لم يتم الجمع منذ 3 أيام' })
  description: string;

  @ApiProperty({
    enum: ['pending', 'open', 'in_progress', 'resolved', 'closed'],
    example: 'pending',
  })
  status: string;

  @ApiProperty({
    enum: ['low', 'medium', 'high', 'urgent'],
    example: 'medium',
  })
  priority: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  assigneeId?: string | null;

  @ApiPropertyOptional({ example: '2026-07-12T18:00:00.000Z' })
  closedAt?: string | null;

  @ApiProperty({ example: '2026-07-12T18:00:00.000Z' })
  lastMessageAt: string;

  @ApiPropertyOptional({ example: '2026-07-12T18:00:00.000Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2026-07-12T18:00:00.000Z' })
  updatedAt?: string;
}

export class TicketMessageDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  ticketId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  senderId: string;

  @ApiProperty({ enum: ['customer', 'admin'], example: 'customer' })
  senderRole: string;

  @ApiProperty({ example: 'مرحباً، أحتاج مساعدة' })
  body: string;

  @ApiProperty({ example: '2026-07-12T18:00:00.000Z' })
  createdAt: string;
}

export class TicketMessageListDto {
  @ApiProperty({ type: TicketMessageDto, isArray: true })
  items: TicketMessageDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class NotificationDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  userId: string;

  @ApiProperty({ example: 'تم تفعيل الاشتراك' })
  title: string;

  @ApiProperty({ example: 'تم تفعيل اشتراكك بنجاح' })
  body: string;

  @ApiProperty({ example: false })
  isRead: boolean;
}

export class WalletDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiProperty({ example: 250.5 })
  balance: number;
}

export class WalletBalanceDto {
  @ApiProperty({ example: 250.5 })
  balance: number;

  @ApiProperty({ example: 'LYD', description: 'Wallet currency' })
  currency: string;
}

export class WalletTransactionDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiProperty({
    enum: ['deposit', 'admin_credit', 'subscription_payment', 'refund'],
    example: 'deposit',
  })
  type: string;

  @ApiProperty({ enum: ['credit', 'debit'], example: 'credit' })
  direction: string;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: 250.5 })
  balanceBefore: number;

  @ApiProperty({ example: 750.5 })
  balanceAfter: number;

  @ApiPropertyOptional({
    enum: ['deposit_request', 'subscription', 'manual'],
    example: 'deposit_request',
  })
  referenceType?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  referenceId?: string;

  @ApiPropertyOptional({ example: 'إيداع محفظة معتمد' })
  description?: string;

  @ApiPropertyOptional({ example: '2026-07-13T10:00:00.000Z' })
  createdAt?: string;
}

export class WalletTransactionListDto {
  @ApiProperty({ type: WalletTransactionDto, isArray: true })
  items: WalletTransactionDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class BankAccountSettingsDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'default' })
  key: string;

  @ApiProperty({ example: 'مصرف الجمهورية' })
  bankName: string;

  @ApiProperty({ example: 'شركة رقي' })
  accountHolder: string;

  @ApiProperty({ example: '1234567890' })
  accountNumber: string;

  @ApiPropertyOptional({ example: 'LY123456789012345678' })
  iban?: string;

  @ApiPropertyOptional({ example: 'حساب الإيداعات الرئيسي' })
  notes?: string;

  @ApiProperty({ example: true })
  active: boolean;
}

export class DepositRequestDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  customerId: string;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: '/uploads/deposits/abc123.jpg' })
  evidenceImageUrl: string;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'], example: 'pending' })
  status: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  reviewedBy?: string;

  @ApiPropertyOptional({ example: 'صورة غير واضحة' })
  rejectionReason?: string;
}

export class CustomerDetailsDto {
  @ApiProperty({ type: CustomerDto })
  customer: CustomerDto;

  @ApiProperty({ type: WalletDto })
  wallet: WalletDto;

  @ApiProperty({ type: AddressDto, isArray: true })
  addresses: AddressDto[];

  @ApiProperty({ type: SubscriptionDto, isArray: true })
  subscriptions: SubscriptionDto[];

  @ApiProperty({ type: PaymentDto, isArray: true })
  payments: PaymentDto[];

  @ApiProperty({ type: DepositRequestDto, isArray: true })
  depositRequests: DepositRequestDto[];

  @ApiProperty({ type: WalletTransactionDto, isArray: true })
  walletTransactions: WalletTransactionDto[];

  @ApiProperty({ type: BinDto, isArray: true })
  bins: BinDto[];

  @ApiProperty({ type: TaskDto, isArray: true })
  tasks: TaskDto[];

  @ApiProperty({ type: ComplaintDto, isArray: true })
  complaints: ComplaintDto[];
}

export class OverviewReportDto {
  @ApiProperty({ example: 42 })
  activeSubscriptions: number;

  @ApiProperty({ example: 128 })
  completedTasks: number;

  @ApiProperty({ example: 15750 })
  totalRevenue: number;

  @ApiProperty({ example: '2026-07-10T18:00:00.000Z' })
  generatedAt: string;
}

export class WorkingHoursRangeDto {
  @ApiProperty({ example: 'الأحد - الخميس' })
  label: string;

  @ApiProperty({ example: '08:00' })
  startTime: string;

  @ApiProperty({ example: '20:00' })
  endTime: string;
}

export class SupportContactsDto {
  @ApiProperty({ example: '920000000' })
  phone: string;

  @ApiProperty({ example: '091xxxxxxxx' })
  whatsapp: string;

  @ApiProperty({ example: 'support@text.sa' })
  email: string;

  @ApiProperty({ example: 'text' })
  twitter: string;
}

export class SupportEmergencyDto {
  @ApiProperty({
    example:
      'حالة طوارئ: للإبلاغ عن مشاكل عاجلة مثل انسكاب النفايات أو تأخير حرج، اتصل بخط الطوارئ.',
  })
  message: string;

  @ApiProperty({ example: '920000000' })
  phone: string;
}

export class SupportAppInfoDto {
  @ApiProperty({ example: 'v2.4.1' })
  version: string;

  @ApiProperty({ example: 'يونيو ٢٠٢٦' })
  lastUpdate: string;
}

export class SupportFaqItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'كيف يمكنني تغيير موعد الجمع؟' })
  question: string;

  @ApiProperty({
    example:
      'يمكنك تعديل موعد الجمع من صفحة الاشتراك أو التواصل مع خدمة العملاء.',
  })
  answer: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;
}

export class SupportPageDto {
  @ApiProperty({ type: SupportContactsDto })
  contacts: SupportContactsDto;

  @ApiProperty({ type: WorkingHoursRangeDto, isArray: true })
  workingHours: WorkingHoursRangeDto[];

  @ApiProperty({ type: SupportFaqItemDto, isArray: true })
  faqs: SupportFaqItemDto[];

  @ApiProperty({ type: SupportEmergencyDto })
  emergency: SupportEmergencyDto;

  @ApiProperty({ type: SupportAppInfoDto })
  appInfo: SupportAppInfoDto;
}

export class SupportSettingsDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'default' })
  key: string;

  @ApiProperty({ example: '920000000' })
  phone: string;

  @ApiProperty({ example: '091xxxxxxxx' })
  whatsapp: string;

  @ApiProperty({ example: 'support@text.sa' })
  email: string;

  @ApiProperty({ example: 'text' })
  twitter: string;

  @ApiProperty({ type: WorkingHoursRangeDto, isArray: true })
  workingHours: WorkingHoursRangeDto[];

  @ApiProperty({
    example:
      'حالة طوارئ: للإبلاغ عن مشاكل عاجلة مثل انسكاب النفايات أو تأخير حرج، اتصل بخط الطوارئ.',
  })
  emergencyMessage: string;

  @ApiProperty({ example: '920000000' })
  emergencyPhone: string;

  @ApiProperty({ example: 'v2.4.1' })
  appVersion: string;

  @ApiProperty({ example: 'يونيو ٢٠٢٦' })
  lastUpdateLabel: string;

  @ApiProperty({ example: true })
  active: boolean;
}

export class FaqDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'كيف يمكنني تغيير موعد الجمع؟' })
  question: string;

  @ApiProperty({
    example:
      'يمكنك تعديل موعد الجمع من صفحة الاشتراك أو التواصل مع خدمة العملاء.',
  })
  answer: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ example: true })
  active: boolean;
}

export class RegisterPendingDto {
  @ApiProperty({ example: true })
  otpSent: boolean;

  @ApiProperty({ example: 300 })
  expiresIn: number;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Dev/test OTP returned in API response until SMS is integrated',
  })
  otp?: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Alias of otp during dev/testing',
  })
  debugOtp?: string;

  @ApiProperty({ example: '+218912345678' })
  phone: string;
}
