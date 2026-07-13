import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersModule } from '../customers/customers.module';
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
  WalletTransaction,
  WalletTransactionSchema,
} from './schemas/wallet-transaction.schema';
import {
  AdminWalletSettingsController,
  CustomerWalletController,
  WalletBalanceController,
} from './wallets.controller';
import { WalletsService } from './wallets.service';
import { BankAccountSettingsService } from './bank-account-settings.service';
import { DepositRequestsService } from './deposit-requests.service';
import { WalletTransactionsService } from './wallet-transactions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: BankAccountSettings.name, schema: BankAccountSettingsSchema },
      { name: DepositRequest.name, schema: DepositRequestSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
    ]),
    forwardRef(() => CustomersModule),
  ],
  controllers: [
    CustomerWalletController,
    WalletBalanceController,
    AdminWalletSettingsController,
  ],
  providers: [
    WalletsService,
    BankAccountSettingsService,
    DepositRequestsService,
    WalletTransactionsService,
  ],
  exports: [WalletsService, DepositRequestsService, WalletTransactionsService],
})
export class WalletsModule {}
