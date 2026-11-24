import { getLocale } from '../i18n/locale';
import { fromDayKey, type DayKey } from './date';

const DAY_LONG_VI = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const DAY_LONG_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "Thứ Ba, 24/11" or "Tuesday, 24 Nov". */
export function formatDayLong(key: DayKey): string {
  const d = fromDayKey(key);
  return getLocale() === 'en'
    ? `${DAY_LONG_EN[d.getDay()]}, ${d.getDate()} ${MONTH_EN[d.getMonth()]}`
    : `${DAY_LONG_VI[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

/** "24/11/2026" or "24 Nov 2026". */
export function formatDate(key: DayKey): string {
  const d = fromDayKey(key);
  return getLocale() === 'en'
    ? `${d.getDate()} ${MONTH_EN[d.getMonth()]} ${d.getFullYear()}`
    : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/** "Tháng 11, 2026" or "November 2026" for "YYYY-MM". */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (getLocale() === 'en') {
    const name = new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleString('en-US', { month: 'long' });
    return `${name} ${y}`;
  }
  return `Tháng ${m}, ${y}`;
}

export function percent(ratio: number | null): string {
  return ratio === null ? '—' : `${Math.round(ratio * 100)}%`;
}
