export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return phone.trim();
  }
  return digits;
}

export function phoneToEmail(phone: string): string {
  return `${normalizePhone(phone)}@phone.raqi`;
}
