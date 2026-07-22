import { ACTIVITY_TYPES, PLAN_FREQUENCIES } from '../../i18n/ar';
import type { Plan } from '../../types';

export type PlanFrequency = 'weekly' | 'monthly' | 'custom';
export type PlanActivityType = 'home' | 'commercial' | 'industrial';

export const PLAN_ACTIVITY_OPTIONS = Object.entries(ACTIVITY_TYPES) as Array<
  [PlanActivityType, string]
>;

export const PLAN_FREQUENCY_OPTIONS = Object.entries(PLAN_FREQUENCIES) as Array<
  [PlanFrequency, string]
>;

export function formatPlanPrice(price?: number) {
  if (price == null) return '—';
  return `${price.toLocaleString('ar-LY')} د.ل`;
}

export function planActivityLabel(value?: string) {
  if (!value) return '—';
  return ACTIVITY_TYPES[value] ?? value;
}

export function planFrequencyLabel(value?: string) {
  if (!value) return '—';
  return PLAN_FREQUENCIES[value] ?? value;
}

export function planStatusKey(plan: Plan) {
  return plan.active ? 'active' : 'inactive';
}
