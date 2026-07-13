import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config/config.module';
import { SecurityModule } from './common/security.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { PlansModule } from './modules/plans/plans.module';
import { BinsModule } from './modules/bins/bins.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AreasModule } from './modules/areas/areas.module';
import { CitiesModule } from './modules/cities/cities.module';
import { RoutesModule } from './modules/routes/routes.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { SupportModule } from './modules/support/support.module';

@Module({
  imports: [
    AppConfigModule,
    SecurityModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodbUri'),
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    DriversModule,
    PlansModule,
    BinsModule,
    SubscriptionsModule,
    PaymentsModule,
    AreasModule,
    CitiesModule,
    RoutesModule,
    TasksModule,
    ComplaintsModule,
    TicketsModule,
    NotificationsModule,
    ReportsModule,
    WalletsModule,
    SupportModule,
  ],
})
export class AppModule {}
