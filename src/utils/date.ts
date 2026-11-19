/** Local calendar day key, e.g. "2026-11-19". Streaks follow the learner's local day. */
export type DayKey = string;

export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

export function lastNDays(today: DayKey, n: number): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

/** Monday-first weekday index: 0 = Monday … 6 = Sunday (PRD default week start). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function weekdayOf(key: DayKey): Weekday {
  return ((fromDayKey(key).getDay() + 6) % 7) as Weekday;
}

/** Monday of the week containing `key`. */
export function weekStartOf(key: DayKey): DayKey {
  return addDays(key, -weekdayOf(key));
}

/** "2026-11" for a day key. */
export function monthOf(key: DayKey): string {
  return key.slice(0, 7);
}

/** Days from `from` to `to` inclusive (empty when from > to). */
export function daysBetween(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

const WEEKDAY_LONG = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

/** "Thứ Năm, 19 tháng 11" */
export function formatDayLong(key: DayKey): string {
  const date = fromDayKey(key);
  return `${WEEKDAY_LONG[weekdayOf(key)]}, ${date.getDate()} tháng ${date.getMonth() + 1}`;
}

/** "Tháng 11, 2026" */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  return `Tháng ${Number(m)}, ${y}`;
}
