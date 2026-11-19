import { monthOf, type DayKey } from '../../utils/date';

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
  if (day < today) return { ok: false, reason: 'Chỉ đóng băng được hôm nay hoặc các ngày sau.' };
  if (freezes[day]) return { ok: false, reason: 'Ngày này đã được đóng băng.' };
  if (freezesLeftIn(freezes, monthOf(day)) === 0) {
    return { ok: false, reason: `Tháng này đã dùng hết ${FREEZES_PER_MONTH} lượt đóng băng.` };
  }
  return { ok: true };
}

/** A freeze can be cancelled until its day has passed. */
export function canUnfreeze(freezes: FreezeDays, day: DayKey, today: DayKey): boolean {
  return Boolean(freezes[day]) && day >= today;
}
