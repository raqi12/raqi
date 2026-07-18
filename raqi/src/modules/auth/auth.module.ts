import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthController, CustomerAccountController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { SmsService } from './sms.service';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => CustomersModule),
    forwardRef(() => SubscriptionsModule),
    WalletsModule,
    NotificationsModule,
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
  ],
  controllers: [AuthController, CustomerAccountController],
  providers: [AuthService, OtpService, SmsService],
  exports: [AuthService, OtpService],
})
export class AuthModule {}
