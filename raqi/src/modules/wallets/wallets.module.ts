import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import {
  BankAccountSettings,
  BankAccountSettingsSchema,
} from './schemas/bank-account-settings.schema';
import {
  DepositRequest,
  DepositRequestSchema,
} from './schemas/deposit-request.schema';
import {
  CashTopupRequest,
  CashTopupRequestSchema,
} from './schemas/cash-topup-request.schema';
import {
  WalletTransaction,
  WalletTransactionSchema,
} from './schemas/wallet-transaction.schema';
import {
  AdminWalletSettingsController,
  CustomerWalletController,
  WalletBalanceController,
} from './wallets.controller';
import {
  AdminCashTopupsController,
  CustomerCashTopupsController,
} from './cash-topups.controller';
import { WalletsService } from './wallets.service';
import { BankAccountSettingsService } from './bank-account-settings.service';
import { DepositRequestsService } from './deposit-requests.service';
import { CashTopupsService } from './cash-topups.service';
import { WalletTransactionsService } from './wallet-transactions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: BankAccountSettings.name, schema: BankAccountSettingsSchema },
      { name: DepositRequest.name, schema: DepositRequestSchema },
      { name: CashTopupRequest.name, schema: CashTopupRequestSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
    forwardRef(() => CustomersModule),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [
    CustomerWalletController,
    WalletBalanceController,
    AdminWalletSettingsController,
    CustomerCashTopupsController,
    AdminCashTopupsController,
  ],
  providers: [
    WalletsService,
    BankAccountSettingsService,
    DepositRequestsService,
    CashTopupsService,
    WalletTransactionsService,
  ],
  exports: [
    WalletsService,
    DepositRequestsService,
    CashTopupsService,
    WalletTransactionsService,
  ],
})
export class WalletsModule {}
