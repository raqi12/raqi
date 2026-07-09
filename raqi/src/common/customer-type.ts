export const CUSTOMER_TYPES = ['home', 'commercial', 'industrial'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
