/** When a habit is due (module 02.02, REQ-02-002). Pure functions. */
import type { DayKey, Weekday } from '../../utils/date';
import { addDays, startOfWeek, weekday } from '../../utils/date';
import type { Habit, Schedule } from '../habit-management/types';

/** Has the habit started by this day? */
export function hasStarted(habit: Habit, day: DayKey): boolean {
  return day >= habit.startDate;
}

/**
 * Due on a specific day. "N times a week" habits have no fixed days: every day of the week is
 * open until the weekly count is reached, so they are never due on a single day.
 */
export function isDueOn(habit: Habit, day: DayKey): boolean {
  if (!hasStarted(habit, day)) return false;
  switch (habit.schedule.kind) {
    case 'daily':
      return true;
    case 'weekdays':
      return habit.schedule.days.includes(weekday(day));
    case 'perWeek':
      return false;
  }
}

export function isWeekly(habit: Habit): habit is Habit & { schedule: { kind: 'perWeek' } } {
  return habit.schedule.kind === 'perWeek';
}

/**
 * Completions needed in the week starting `weekStartDay`. The first week of a habit started
 * mid-week asks for no more than the days left in it.
 */
export function weeklyQuota(habit: Habit, weekStartDay: DayKey): number {
  if (habit.schedule.kind !== 'perWeek') return 0;
  const weekEnd = addDays(weekStartDay, 6);
  if (habit.startDate > weekEnd) return 0;
  const firstDay = habit.startDate > weekStartDay ? habit.startDate : weekStartDay;
  let daysLeft = 0;
  for (let d = firstDay; d <= weekEnd; d = addDays(d, 1)) daysLeft += 1;
  return Math.min(habit.schedule.times, daysLeft);
}

export function weekOf(day: DayKey, weekStart: 0 | 1): DayKey {
  return startOfWeek(day, weekStart);
}

const WEEKDAY_SHORT_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayShort(day: Weekday, locale: 'vi' | 'en'): string {
  return (locale === 'en' ? WEEKDAY_SHORT_EN : WEEKDAY_SHORT_VI)[day] ?? '';
}

/** Weekdays in display order for the chosen week start. */
export function orderedWeekdays(weekStart: 0 | 1): Weekday[] {
  return Array.from({ length: 7 }, (_, i) => ((i + weekStart) % 7) as Weekday);
}

/** Plain description of a schedule, e.g. "Hằng ngày", "T2, T4, T6", "3 lần mỗi tuần". */
export function describeSchedule(
  schedule: Schedule,
  locale: 'vi' | 'en',
  weekStart: 0 | 1,
): string {
  switch (schedule.kind) {
    case 'daily':
      return locale === 'en' ? 'Every day' : 'Hằng ngày';
    case 'weekdays': {
      if (schedule.days.length === 7) return locale === 'en' ? 'Every day' : 'Hằng ngày';
      return orderedWeekdays(weekStart)
        .filter((d) => schedule.days.includes(d))
        .map((d) => weekdayShort(d, locale))
        .join(', ');
    }
    case 'perWeek':
      return locale === 'en'
        ? `${schedule.times} ${schedule.times === 1 ? 'time' : 'times'} a week`
        : `${schedule.times} lần mỗi tuần`;
  }
}
