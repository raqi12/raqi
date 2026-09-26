import { STATUS_LABELS } from '../../i18n/ar';
import type {
  Area,
  Bin,
  City,
  Customer,
  Driver,
  Plan,
  Subscription,
  User,
} from '../../types';
import {
  areaNameById,
  binCodeById,
  cityNameById,
  customerDisplayName,
  getId,
  planNameById,
  userEmailById,
  userPhoneById,
} from './shared';
import { driverNameById } from './subscriptionUi';

export type SubscriptionDateField = 'collection' | 'expires' | 'created';

export type SubscriptionFilterState = {
  query: string;
  cityId: string;
  areaId: string;
  driverId: string;
  planId: string;
  status: string;
  paymentStatus: string;
  collectionDate: string;
  dateFrom: string;
  dateTo: string;
  dateField: SubscriptionDateField;
  unassignedDriver: boolean;
};

export const EMPTY_SUBSCRIPTION_FILTERS: SubscriptionFilterState = {
  query: '',
  cityId: '',
  areaId: '',
  driverId: '',
  planId: '',
  status: '',
  paymentStatus: '',
  collectionDate: '',
  dateFrom: '',
  dateTo: '',
  dateField: 'collection',
  unassignedDriver: false,
};

export type SubscriptionTableRow = Subscription & {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  planName: string;
  binCode: string;
  cityName: string;
  areaName: string;
  driverName: string;
  statusLabel: string;
  paymentLabel: string;
  collectionSummary: string;
  expiresLabel: string;
  createdLabel: string;
  searchText: string;
};

function datePart(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function inRange(isoDay: string, from: string, to: string) {
  if (from && isoDay < from) return false;
  if (to && isoDay > to) return false;
  return true;
}

export function buildSubscriptionTableRows(
  subscriptions: Subscription[],
  plans: Plan[],
  bins: Bin[],
  customers: Customer[],
  users: User[],
  drivers: Driver[],
  areas: Area[],
  cities: City[],
): SubscriptionTableRow[] {
  return subscriptions.map((subscription) => {
    const customer = customers.find((item) => getId(item) === subscription.customerId);
    const customerName = customer ? customerDisplayName(customer, users) : '—';
    const customerPhone = customer ? userPhoneById(users, customer.userId) : '—';
    const customerEmail = customer ? userEmailById(users, customer.userId) : '—';
    const planName = planNameById(plans, subscription.planId);
    const binCode = binCodeById(bins, subscription.binId);
    const cityName = cityNameById(cities, subscription.cityId);
    const areaName = areaNameById(areas, subscription.areaId);
    const driverName = driverNameById(drivers, users, subscription.driverId);
    const statusLabel = STATUS_LABELS[subscription.status ?? ''] ?? subscription.status ?? '—';
    const paymentLabel =
      STATUS_LABELS[subscription.paymentStatus ?? ''] ?? subscription.paymentStatus ?? '—';
    const collectionDates = (subscription.collectionDates ?? []).map(String).sort();
    const collectionSummary = collectionDates.length ? collectionDates.join('، ') : '—';
    const expiresLabel = datePart(subscription.expiresAt) || '—';
    const createdLabel = datePart(subscription.createdAt) || '—';
    const id = getId(subscription);

    const searchText = [
      id,
      customerName,
      customerPhone,
      customerEmail,
      planName,
      cityName,
      areaName,
      driverName,
      binCode,
      statusLabel,
      paymentLabel,
      subscription.status,
      subscription.paymentStatus,
      collectionSummary,
      expiresLabel,
      createdLabel,
    ]
      .join(' ')
      .toLowerCase();

    return {
      ...subscription,
      customerName,
      customerPhone,
      customerEmail,
      planName,
      binCode,
      cityName,
      areaName,
      driverName,
      statusLabel,
      paymentLabel,
      collectionSummary,
      expiresLabel,
      createdLabel,
      searchText,
    };
  });
}

export function filterSubscriptionRows(
  rows: SubscriptionTableRow[],
  filters: SubscriptionFilterState,
): SubscriptionTableRow[] {
  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (query && !row.searchText.includes(query)) {
      return false;
    }
    if (filters.cityId && row.cityId !== filters.cityId) {
      return false;
    }
    if (filters.areaId && row.areaId !== filters.areaId) {
      return false;
    }
    if (filters.unassignedDriver) {
      if (row.driverId) return false;
    } else if (filters.driverId && row.driverId !== filters.driverId) {
      return false;
    }
    if (filters.planId && row.planId !== filters.planId) {
      return false;
    }
    if (filters.status && row.status !== filters.status) {
      return false;
    }
    if (filters.paymentStatus && row.paymentStatus !== filters.paymentStatus) {
      return false;
    }
    if (filters.collectionDate) {
      const dates = row.collectionDates ?? [];
      if (!dates.some((d) => datePart(d) === filters.collectionDate)) {
        return false;
      }
    }

    const from = filters.dateFrom;
    const to = filters.dateTo;
    if (from || to) {
      if (filters.dateField === 'collection') {
        const dates = (row.collectionDates ?? []).map(datePart).filter(Boolean);
        if (!dates.some((day) => inRange(day, from, to))) {
          return false;
        }
      } else if (filters.dateField === 'expires') {
        const day = datePart(row.expiresAt);
        if (!day || !inRange(day, from, to)) {
          return false;
        }
      } else {
        const day = row.createdLabel !== '—' ? row.createdLabel : '';
        if (!day || !inRange(day, from, to)) {
          return false;
        }
      }
    }

    return true;
  });
}

export function hasActiveSubscriptionFilters(filters: SubscriptionFilterState) {
  return (
    filters.query.trim() !== '' ||
    filters.cityId !== '' ||
    filters.areaId !== '' ||
    filters.driverId !== '' ||
    filters.planId !== '' ||
    filters.status !== '' ||
    filters.paymentStatus !== '' ||
    filters.collectionDate !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.unassignedDriver
  );
}
