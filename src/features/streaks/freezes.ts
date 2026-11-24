/** Streak freezes: announce a busy day in advance so streaks hold (REQ-02-021). */
import type { HabitState } from '../../stores/habitState';
import { monthOf, type DayKey } from '../../utils/date';

export function freezesUsedInMonth(state: HabitState, month: string): number {
  return Object.keys(state.freezes).filter((d) => monthOf(d) === month).length;
}

export function freezesLeftInMonth(state: HabitState, month: string): number {
  return Math.max(0, state.settings.freezesPerMonth - freezesUsedInMonth(state, month));
}

export type FreezeCheck = 'ok' | 'past' | 'none-left' | 'already';

/** Only today or later days can be frozen, within the monthly allowance. */
export function canFreeze(state: HabitState, day: DayKey, today: DayKey): FreezeCheck {
  if (state.freezes[day]) return 'already';
  if (day < today) return 'past';
  if (freezesLeftInMonth(state, monthOf(day)) <= 0) return 'none-left';
  return 'ok';
}

/** A freeze can be taken back while its day has not passed. */
export function canUnfreeze(state: HabitState, day: DayKey, today: DayKey): boolean {
  return Boolean(state.freezes[day]) && day >= today;
}
