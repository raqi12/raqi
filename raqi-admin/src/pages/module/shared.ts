export function getId(entity: { _id?: string; id?: string }) {
  return entity._id ?? entity.id ?? '';
}

export function cityNameById(cities: { _id?: string; id?: string; name?: string }[], cityId?: string) {
  if (!cityId) return '—';
  const city = cities.find((item) => getId(item) === cityId);
  return city?.name ?? '—';
}

export function areaLabel(
  area: { name?: string; cityId?: string },
  cities: { _id?: string; id?: string; name?: string }[],
) {
  return `${area.name ?? '—'} — ${cityNameById(cities, area.cityId)}`;
}

export function areaNameById(areas: { _id?: string; id?: string; name?: string }[], areaId?: string) {
  if (!areaId) return '—';
  const area = areas.find((item) => getId(item) === areaId);
  return area?.name ?? '—';
}

export function areasForCity<T extends { cityId?: string }>(areas: T[], cityId: string): T[] {
  return areas.filter((area) => area.cityId === cityId);
}

export function userNameById(users: { _id?: string; id?: string; name?: string }[], userId?: string) {
  if (!userId) return '—';
  const user = users.find((item) => getId(item) === userId);
  return user?.name ?? '—';
}

export function userById<T extends { _id?: string; id?: string }>(
  users: T[],
  userId?: string,
): T | undefined {
  if (!userId) return undefined;
  return users.find((item) => getId(item) === userId);
}

export function userPhoneById(
  users: { _id?: string; id?: string; phone?: string }[],
  userId?: string,
) {
  return userById(users, userId)?.phone ?? '—';
}

export function userEmailById(
  users: { _id?: string; id?: string; email?: string }[],
  userId?: string,
) {
  const email = userById(users, userId)?.email;
  if (!email || email.endsWith('@phone.raqi') || email.endsWith('@deleted.local')) {
    return '—';
  }
  return email;
}

export function customerDisplayName(
  customer: { userId?: string; name?: string },
  users: { _id?: string; id?: string; name?: string }[] = [],
) {
  return customer.name ?? userNameById(users, customer.userId);
}

export function planNameById(plans: { _id?: string; id?: string; name?: string }[], planId?: string) {
  if (!planId) return '—';
  const plan = plans.find((item) => getId(item) === planId);
  return plan?.name ?? '—';
}

export function binCodeById(bins: { _id?: string; id?: string; code?: string }[], binId?: string) {
  if (!binId) return '—';
  const bin = bins.find((item) => getId(item) === binId);
  return bin?.code ?? '—';
}

export function addressLocationLabel(
  address: { cityId?: string; areaId?: string },
  cities: { _id?: string; id?: string; name?: string }[],
  areas: { _id?: string; id?: string; name?: string }[],
) {
  const city = cityNameById(cities, address.cityId);
  const area = areaNameById(areas, address.areaId);
  return `${city} / ${area}`;
}

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';
