import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CUSTOMER_TYPES } from '../../customer-type';
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

  @ApiProperty({ enum: CUSTOMER_TYPES, example: 'home' })
  type: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013', description: 'Parent city MongoDB ID' })
  cityId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439014', description: 'Service area MongoDB ID' })
  areaId: string;
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

export class RegisterPendingDto {
  @ApiProperty({ example: true })
  otpSent: boolean;

  @ApiProperty({ example: 300 })
  expiresIn: number;

  @ApiProperty({ example: '+218912345678' })
  phone: string;

  @ApiProperty({ enum: CUSTOMER_TYPES, example: 'home' })
  activityType: string;
}
