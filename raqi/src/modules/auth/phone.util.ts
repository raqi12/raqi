export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return phone.trim();
  }
  return digits;
}

/** Format for iSend / Libyan SMS gateways: 2189xxxxxxxx */
export function formatPhoneForSms(phone: string): string {
  let digits = normalizePhone(phone);

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0') && digits.length === 10) {
    digits = `218${digits.slice(1)}`;
  } else if (digits.length === 9 && digits.startsWith('9')) {
    digits = `218${digits}`;
  } else if (!digits.startsWith('218') && digits.length >= 9) {
    // already international other formats — keep digits as-is
  }

  return digits;
}

export function phoneToEmail(phone: string): string {
  return `${normalizePhone(phone)}@phone.raqi`;
}
