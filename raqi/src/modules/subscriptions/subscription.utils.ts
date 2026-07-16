import { BadRequestException } from '@nestjs/common';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Format a Date as YYYY-MM-DD in UTC. */
export function toUtcDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as a UTC midnight Date. */
export function parseUtcDateString(value: string): Date {
  if (!DATE_ONLY_RE.test(value)) {
    throw new BadRequestException(
      `Invalid date "${value}"; expected YYYY-MM-DD`,
    );
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || toUtcDateString(parsed) !== value) {
    throw new BadRequestException(`Invalid calendar date "${value}"`);
  }
  return parsed;
}

export function shiftDateString(dateStr: string, days: number): string {
  return toUtcDateString(addDays(parseUtcDateString(dateStr), days));
}

/** Monday 00:00 UTC of the ISO week containing `date`. */
export function startOfUtcIsoWeek(date: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function endOfUtcIsoWeek(date: Date = new Date()): Date {
  const start = startOfUtcIsoWeek(date);
  return addDays(start, 6);
}

export function utcMonthDateRange(
  year: number,
  month: number,
): { from: string; to: string } {
  if (month < 1 || month > 12) {
    throw new BadRequestException('month must be 1–12');
  }
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}


/**
 * Validates and normalizes collection dates for a plan period.
 * Returns sorted unique YYYY-MM-DD strings.
 */
export function normalizeCollectionDates(
  dates: string[],
  numberOfCollections: number,
  periodStart: Date,
  periodEnd: Date,
): string[] {
  if (!Array.isArray(dates) || dates.length === 0) {
    throw new BadRequestException('collectionDates is required');
  }

  if (dates.length !== numberOfCollections) {
    throw new BadRequestException(
      `collectionDates count must equal plan numberOfCollections (${numberOfCollections})`,
    );
  }

  const startStr = toUtcDateString(periodStart);
  const endStr = toUtcDateString(periodEnd);
  const unique = new Set<string>();

  for (const raw of dates) {
    const dateStr = String(raw).slice(0, 10);
    parseUtcDateString(dateStr);

    if (dateStr < startStr) {
      throw new BadRequestException(
        `Collection date ${dateStr} is before the plan start (${startStr})`,
      );
    }
    if (dateStr > endStr) {
      throw new BadRequestException(
        `Collection date ${dateStr} is after the plan end (${endStr})`,
      );
    }
    if (unique.has(dateStr)) {
      throw new BadRequestException(
        `Duplicate collection date ${dateStr}`,
      );
    }
    unique.add(dateStr);
  }

  return [...unique].sort();
}
