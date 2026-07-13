export const WALLET_TRANSACTION_TYPES = [
  'deposit',
  'admin_credit',
  'subscription_payment',
  'refund',
] as const;

export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

export const WALLET_TRANSACTION_DIRECTIONS = ['credit', 'debit'] as const;

export type WalletTransactionDirection =
  (typeof WALLET_TRANSACTION_DIRECTIONS)[number];

export const WALLET_TRANSACTION_REFERENCE_TYPES = [
  'deposit_request',
  'subscription',
  'manual',
] as const;

export type WalletTransactionReferenceType =
  (typeof WALLET_TRANSACTION_REFERENCE_TYPES)[number];

export type ApplyWalletMovementInput = {
  customerId: string;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  amount: number;
  referenceType?: WalletTransactionReferenceType;
  referenceId?: string | null;
  description?: string | null;
  createdBy?: string | null;
};
