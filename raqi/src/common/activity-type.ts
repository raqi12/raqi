export const ACTIVITY_TYPES = ['home', 'commercial', 'industrial'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
