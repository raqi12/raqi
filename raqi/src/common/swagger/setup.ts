import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ErrorEnvelopeDto,
  ForbiddenErrorDto,
  HealthDataDto,
  LogoutDataDto,
  MessageDataDto,
  NotFoundErrorDto,
  OtpSentDataDto,
  UnauthorizedErrorDto,
  ValidationErrorDto,
} from './responses/error.response';
import {
  AddressDto,
  AreaDto,
  AuthTokensDto,
  BankAccountSettingsDto,
  BinDto,
  BinStatsDto,
  ComplaintDto,
  CustomerDto,
  DepositRequestDto,
  DriverDto,
  NotificationDto,
  OverviewReportDto,
  PaymentDto,
  PlanDto,
  RefreshTokenDataDto,
  RegisterPendingDto,
  RouteDto,
  SubscriptionDto,
  TaskDto,
  UserDto,
  WalletDto,
} from './schemas/entity.schemas';

const extraModels = [
  BadRequestErrorDto,
  UnauthorizedErrorDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  ValidationErrorDto,
  ErrorEnvelopeDto,
  HealthDataDto,
  LogoutDataDto,
  MessageDataDto,
  OtpSentDataDto,
  UserDto,
  AuthTokensDto,
  RefreshTokenDataDto,
  RegisterPendingDto,
  CustomerDto,
  AddressDto,
  DriverDto,
  AreaDto,
  RouteDto,
  PlanDto,
  BinDto,
  BinStatsDto,
  SubscriptionDto,
  PaymentDto,
  TaskDto,
  ComplaintDto,
  NotificationDto,
  WalletDto,
  BankAccountSettingsDto,
  DepositRequestDto,
  OverviewReportDto,
];

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Raqi API')
    .setDescription(
      `Enterprise API for Raqi waste-management platform.

## Authentication
Protected routes require a JWT bearer token:
\`Authorization: Bearer <access_token>\`

Obtain tokens via \`POST /api/v1/auth/login\` or customer registration flow.

## Response envelope
Successful responses use:
\`\`\`json
{ "data": <payload> }
\`\`\`

## Errors
Standard NestJS error format:
\`\`\`json
{ "statusCode": 400, "message": "...", "error": "Bad Request" }
\`\`\`

## Roles
- \`admin\` — full back-office access
- \`driver\` — field operations
- \`customer\` — mobile/customer app

## File uploads
Deposit evidence: \`multipart/form-data\` with field \`evidence\` (jpg, jpeg, png, webp, max 5MB).`,
    )
    .setVersion('1.0.0')
    .setContact('Raqi Engineering', 'https://raqii.com.ly', 'support@raqii.com.ly')
    .addServer('https://api.raqii.com.ly/api/v1', 'Production')
    .addServer('http://localhost:3000/api/v1', 'Local development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from POST /auth/login',
      },
      'access-token',
    )
    .addTag('Health', 'Service health and readiness')
    .addTag('Auth', 'Registration, login, tokens, and profile')
    .addTag('Plans', 'Public subscription plans')
    .addTag('Admin - Users', 'Staff user management (admin only)')
    .addTag('Admin - Customers', 'Customer account management')
    .addTag('Customer - Addresses', 'Customer delivery addresses')
    .addTag('Admin - Drivers', 'Driver fleet management')
    .addTag('Admin - Areas', 'Service areas')
    .addTag('Admin - Routes', 'Collection routes')
    .addTag('Admin - Plans', 'Plan catalog management')
    .addTag('Admin - Bins', 'Bin inventory management')
    .addTag('Customer - Bins', 'Customer bin selection')
    .addTag('Admin - Subscriptions', 'Subscription lifecycle')
    .addTag('Customer - Subscriptions', 'Customer subscription actions')
    .addTag('Admin - Payments', 'Payment records')
    .addTag('Customer - Payments', 'Customer payments')
    .addTag('Admin - Tasks', 'Task generation and assignment')
    .addTag('Driver - Tasks', 'Driver task execution')
    .addTag('Customer - Tasks', 'Customer task history')
    .addTag('Customer - Complaints', 'Customer complaints')
    .addTag('Admin - Complaints', 'Complaint management')
    .addTag('Notifications', 'In-app notifications')
    .addTag('Customer - Wallet', 'Wallet and deposit requests')
    .addTag('Admin - Wallet Settings', 'Bank account and deposit review')
    .addTag('Admin - Reports', 'Analytics and KPIs')
    .build();

  const document = SwaggerModule.createDocument(app, config, { extraModels });
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
}

export { extraModels };
