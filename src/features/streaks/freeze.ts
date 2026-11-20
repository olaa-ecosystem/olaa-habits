import { monthOf, type DayKey } from '../../utils/date';
import { tr } from '../../i18n/locale';

/** Streak freezes per calendar month (PRD 02, open question 1: proposed 2). */
export const FREEZES_PER_MONTH = 2;

export type FreezeDays = Record<DayKey, true>;

export function freezesUsedIn(freezes: FreezeDays, month: string): number {
  return Object.keys(freezes).filter((d) => monthOf(d) === month).length;
}

export function freezesLeftIn(freezes: FreezeDays, month: string): number {
  return Math.max(0, FREEZES_PER_MONTH - freezesUsedIn(freezes, month));
}

export type FreezeCheck = { ok: true } | { ok: false; reason: string };

/** REQ-02-021: freeze only today or later, at most FREEZES_PER_MONTH per month. */
export function canFreeze(freezes: FreezeDays, day: DayKey, today: DayKey): FreezeCheck {
  if (day < today)
    return {
      ok: false,
      reason: tr(
        'Chỉ đóng băng được hôm nay hoặc các ngày sau.',
        'Only today or later days can be frozen.',
      ),
    };
  if (freezes[day])
    return { ok: false, reason: tr('Ngày này đã được đóng băng.', 'This day is already frozen.') };
  if (freezesLeftIn(freezes, monthOf(day)) === 0) {
    return {
      ok: false,
      reason: tr(
        `Tháng này đã dùng hết ${FREEZES_PER_MONTH} lượt đóng băng.`,
        `All ${FREEZES_PER_MONTH} freezes for this month are used.`,
      ),
    };
  }
  return { ok: true };
}

/** A freeze can be cancelled until its day has passed. */
export function canUnfreeze(freezes: FreezeDays, day: DayKey, today: DayKey): boolean {
  return Boolean(freezes[day]) && day >= today;
}
