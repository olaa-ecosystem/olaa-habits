import { addDays, daysBetween, weekStartOf, type DayKey } from '../../utils/date';
import { isDayBased, isScheduledOn, type Schedule } from '../scheduling/schedule';
import type { Outcome } from '../habit-tracking/checkins';

/** A stretch of days with one schedule (from the habit's plan history). */
export interface Segment {
  from: DayKey;
  to: DayKey;
  schedule: Schedule;
}

export interface StreakInput {
  /** Either one schedule for the whole life of the habit… */
  schedule?: Schedule;
  /** …or the schedule history, oldest first (PRD v1.0 §7.3). */
  segments?: Segment[];
  createdOn: DayKey;
  /** Last day to consider (today, or the archive day). */
  today: DayKey;
  /** Outcome of a day; `done` is the simple binary shortcut. */
  outcome?: (day: DayKey) => Outcome;
  done?: (day: DayKey) => boolean;
  /** Days that are excused for this habit: global freezes and pauses. */
  frozen: (day: DayKey) => boolean;
}

export interface Streak {
  current: number;
  best: number;
  unit: 'day' | 'week';
}

function segmentsOf(input: StreakInput): Segment[] {
  if (input.segments && input.segments.length > 0) {
    return input.segments
      .map((s) => ({
        ...s,
        from: s.from < input.createdOn ? input.createdOn : s.from,
        to: s.to > input.today ? input.today : s.to,
      }))
      .filter((s) => s.from <= s.to);
  }
  return [
    { from: input.createdOn, to: input.today, schedule: input.schedule ?? { kind: 'daily' } },
  ];
}

/**
 * Current and best streak (module 02.04). A done day adds one. Skipped, partial, frozen and
 * paused days keep the streak without adding (humane tracking, PRD v1.0 §7.3); today not done
 * yet is pending. "N times a week" stretches count weeks that met the quota, where every
 * skipped or excused day lowers that week's quota by one. A schedule change starts a new
 * stretch but keeps the run going; past days are judged by the schedule that applied then.
 */
export function computeStreak(input: StreakInput): Streak {
  const segments = segmentsOf(input);
  const last = segments[segments.length - 1];
  const unit: Streak['unit'] = last && !isDayBased(last.schedule) ? 'week' : 'day';
  if (input.createdOn > input.today || segments.length === 0) return { current: 0, best: 0, unit };
  const outcome = input.outcome ?? ((d: DayKey) => (input.done?.(d) ? 'done' : 'none'));

  let run = 0;
  let best = 0;
  const hit = () => {
    run += 1;
    best = Math.max(best, run);
  };

  for (const seg of segments) {
    if (isDayBased(seg.schedule)) {
      for (const day of daysBetween(seg.from, seg.to)) {
        if (!isScheduledOn(seg.schedule, day)) continue;
        const o = outcome(day);
        if (o === 'done') hit();
        else if (o === 'skipped' || o === 'partial' || input.frozen(day) || day === input.today)
          continue;
        else run = 0;
      }
    } else {
      const times = seg.schedule.kind === 'perWeek' ? seg.schedule.times : 1;
      const currentWeek = weekStartOf(input.today);
      for (let week = weekStartOf(seg.from); week <= weekStartOf(seg.to); week = addDays(week, 7)) {
        const days = daysBetween(week, addDays(week, 6)).filter(
          (d) => d >= seg.from && d <= seg.to,
        );
        const excused = days.filter((d) => input.frozen(d) || outcome(d) === 'skipped').length;
        const completed = days.filter((d) => outcome(d) === 'done').length;
        const target = Math.max(0, times - excused);
        if (target > 0 && completed >= target) hit();
        else if (target === 0 || week === currentWeek || days.length < 7) continue;
        else run = 0;
      }
    }
  }
  return { current: run, best, unit };
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
