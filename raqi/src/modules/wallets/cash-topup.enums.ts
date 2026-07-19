export const CASH_TOPUP_STATUSES = [
  'pending',
  'dispatched',
  'collected',
  'completed',
  'cancelled',
] as const;

export type CashTopupStatus = (typeof CASH_TOPUP_STATUSES)[number];
