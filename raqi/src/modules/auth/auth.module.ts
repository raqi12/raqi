import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { CustomersModule } from '../customers/customers.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { Otp, OtpSchema } from './schemas/otp.schema';

@Module({
  imports: [
    UsersModule,
    CustomersModule,
    WalletsModule,
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService],
})
export class AuthModule {}
