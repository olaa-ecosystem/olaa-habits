/**
 * Calendar days as "YYYY-MM-DD" keys in the device's local time zone (NFR-02-002).
 * All habit maths works on day keys, never on timestamps, so travelling or a DST change moves
 * "today" with the user instead of splitting a day in two.
 */
export type DayKey = string;

/** 0 = Sunday … 6 = Saturday, as in Date#getDay. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function today(): DayKey {
  return toDayKey(new Date());
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

export function weekday(key: DayKey): Weekday {
  return fromDayKey(key).getDay() as Weekday;
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((fromDayKey(b).getTime() - fromDayKey(a).getTime()) / 86_400_000);
}

/** First day of the week containing `key`. `weekStart` 1 = Monday (default in Vietnam), 0 = Sunday. */
export function startOfWeek(key: DayKey, weekStart: 0 | 1): DayKey {
  const offset = (weekday(key) - weekStart + 7) % 7;
  return addDays(key, -offset);
}

export function weekDays(key: DayKey, weekStart: 0 | 1): DayKey[] {
  const first = startOfWeek(key, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

export function lastNDays(end: DayKey, n: number): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
}

/** "YYYY-MM" of a day. */
export function monthOf(key: DayKey): string {
  return key.slice(0, 7);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y ?? 1970, (m ?? 1) - 1 + n, 1, 12);
  return toDayKey(d).slice(0, 7);
}

/**
 * Weeks covering a month for a calendar grid: each row has 7 day keys, starting on the week
 * start; days outside the month are included so the grid is rectangular.
 */
export function monthGrid(month: string, weekStart: 0 | 1): DayKey[][] {
  const first = `${month}-01`;
  const start = startOfWeek(first, weekStart);
  const rows: DayKey[][] = [];
  let day = start;
  do {
    const row = Array.from({ length: 7 }, (_, i) => addDays(day, i));
    rows.push(row);
    day = addDays(day, 7);
  } while (monthOf(day) === month);
  return rows;
}

/** Minutes since midnight from "HH:MM", or null. */
export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
