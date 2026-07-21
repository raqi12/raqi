/**
 * Canonical Libyan mobile storage form: 09xxxxxxxx (10 digits).
 * Accepts 09…, 9…, +2189…, 2189…, 002189…
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (!digits) {
    return phone.trim();
  }

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('218') && digits.length >= 12) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.length === 9 && digits.startsWith('9')) {
    digits = `0${digits}`;
  }

  return digits;
}

/**
 * Forms that may already exist in Mongo for the same Libyan mobile
 * (legacy rows stored as 9… / 218… before canonicalization).
 */
export function phoneLookupVariants(phone: string): string[] {
  const canonical = normalizePhone(phone);
  const variants = new Set<string>([canonical]);

  const rawDigits = phone.replace(/\D/g, '');
  if (rawDigits) {
    variants.add(rawDigits);
    if (rawDigits.startsWith('00')) {
      variants.add(rawDigits.slice(2));
    }
  }

  if (canonical.startsWith('0') && canonical.length === 10) {
    const national = canonical.slice(1);
    variants.add(national);
    variants.add(`218${national}`);
  }

  return [...variants];
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
