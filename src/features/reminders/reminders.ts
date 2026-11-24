/** Reminders (module 02.08, REQ-02-022/023). The rules are pure; `reminderService` delivers. */
import type { HabitState } from '../../stores/habitState';
import { formatTime, parseTime, toDayKey, type DayKey } from '../../utils/date';
import type { Habit } from '../habit-management/types';
import { isDoneOn, isOnAgenda } from '../habit-tracking/progress';

/**
 * Habits whose reminder time has come today and that are still not done. Habits already
 * reminded today (`fired`) are left out, and nothing is sent for a finished habit.
 */
export function dueReminders(
  state: HabitState,
  today: DayKey,
  nowMinutes: number,
  fired: ReadonlySet<string>,
): Habit[] {
  return Object.values(state.habits).filter((h) => {
    if (!h.reminder || fired.has(`${h.id}|${today}`)) return false;
    const at = parseTime(h.reminder);
    if (at === null || at > nowMinutes) return false;
    return isOnAgenda(state, h, today, state.settings.weekStart) && !isDoneOn(state, h, today);
  });
}

/** Days of data needed before suggesting a time (REQ-02-023). */
export const SMART_MIN_DAYS = 7;

/**
 * Suggest a reminder 30 minutes before the user's usual check-in time: the median time of day
 * of same-day check-ins, rounded to a quarter hour. Null until there are 7 days of data.
 */
export function suggestReminder(state: HabitState, habit: Habit): string | null {
  const minutes: number[] = [];
  for (const c of Object.values(state.checkIns)) {
    if (c.habitId !== habit.id || c.value <= 0) continue;
    const at = new Date(c.updatedAt);
    if (toDayKey(at) !== c.date) continue; // ticked later, from history: not a habit time
    minutes.push(at.getHours() * 60 + at.getMinutes());
  }
  if (minutes.length < SMART_MIN_DAYS) return null;
  minutes.sort((a, b) => a - b);
  const median = minutes[Math.floor(minutes.length / 2)]!;
  const suggested = Math.max(0, Math.round((median - 30) / 15) * 15);
  return formatTime(suggested);
}
