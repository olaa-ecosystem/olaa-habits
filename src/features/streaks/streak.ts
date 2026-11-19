import { addDays, daysBetween, weekStartOf, type DayKey } from '../../utils/date';
import { isDayBased, isScheduledOn, type Schedule } from '../scheduling/schedule';

export interface StreakInput {
  schedule: Schedule;
  /** First day the habit existed. */
  createdOn: DayKey;
  /** Last day to consider (today, or the archive day). */
  today: DayKey;
  done: (day: DayKey) => boolean;
  frozen: (day: DayKey) => boolean;
}

export interface Streak {
  current: number;
  best: number;
  unit: 'day' | 'week';
}

/**
 * Current and best streak (module 02.04, REQ-02-020).
 * - Day-based habits count completed scheduled days. A frozen day keeps the streak without
 *   adding to it; today not done yet is still pending, so it never breaks the streak.
 * - "N times a week" habits count weeks that reached N. Each frozen day lowers that week's
 *   target by one. The current week is pending until it ends; the first (partial) week never
 *   breaks a streak.
 */
export function computeStreak(input: StreakInput): Streak {
  if (input.createdOn > input.today) return { current: 0, best: 0, unit: unitOf(input.schedule) };
  return isDayBased(input.schedule) ? dayStreak(input) : weekStreak(input);
}

function unitOf(schedule: Schedule): Streak['unit'] {
  return isDayBased(schedule) ? 'day' : 'week';
}

function dayStreak({ schedule, createdOn, today, done, frozen }: StreakInput): Streak {
  let run = 0;
  let best = 0;
  for (const day of daysBetween(createdOn, today)) {
    if (!isScheduledOn(schedule, day)) continue;
    if (done(day)) {
      run += 1;
      best = Math.max(best, run);
    } else if (frozen(day) || day === today) {
      continue;
    } else {
      run = 0;
    }
  }
  return { current: run, best, unit: 'day' };
}

function weekStreak({ schedule, createdOn, today, done, frozen }: StreakInput): Streak {
  const times = schedule.kind === 'perWeek' ? schedule.times : 1;
  const firstWeek = weekStartOf(createdOn);
  const currentWeek = weekStartOf(today);
  let run = 0;
  let best = 0;
  for (let week = firstWeek; week <= currentWeek; week = addDays(week, 7)) {
    const days = daysBetween(week, addDays(week, 6)).filter((d) => d >= createdOn && d <= today);
    const completed = days.filter(done).length;
    const target = Math.max(0, times - days.filter(frozen).length);
    if (target > 0 && completed >= target) {
      run += 1;
      best = Math.max(best, run);
    } else if (target === 0 || week === currentWeek || week === firstWeek) {
      continue;
    } else {
      run = 0;
    }
  }
  return { current: run, best, unit: 'week' };
}

/** Checks so far in the week containing `today` (for "2/3 this week"). */
export function weekProgress(
  today: DayKey,
  createdOn: DayKey,
  done: (day: DayKey) => boolean,
): number {
  const week = weekStartOf(today);
  return daysBetween(week, today).filter((d) => d >= createdOn && done(d)).length;
}

export function formatStreak(streak: Pick<Streak, 'current' | 'unit'>): string {
  return `${streak.current} ${streak.unit === 'day' ? 'ngày' : 'tuần'}`;
}
