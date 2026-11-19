import { addDays, daysBetween, weekStartOf, type DayKey } from '../../utils/date';
import type { Outcome } from '../habit-tracking/checkins';
import { isDayBased, isScheduledOn } from '../scheduling/schedule';
import type { Segment } from './streak';

export const CONSISTENCY_DAYS = 30;

export interface Consistency {
  /** Completed opportunities; a partial day counts as half. */
  completed: number;
  /** Scheduled opportunities, not counting skipped, frozen or paused days. */
  opportunities: number;
  /** completed / opportunities, or null when there were none yet. */
  rate: number | null;
}

/**
 * Completion rate over a window, separate from the streak (PRD v1.0 §7.2 "Consistency").
 * Today counts only once it is done, so an unfinished today never lowers the rate.
 */
export function computeConsistency(input: {
  segments: Segment[];
  createdOn: DayKey;
  today: DayKey;
  outcome: (day: DayKey) => Outcome;
  excused: (day: DayKey) => boolean;
  days?: number;
}): Consistency {
  const start = addDays(input.today, -((input.days ?? CONSISTENCY_DAYS) - 1));
  let completed = 0;
  let opportunities = 0;
  for (const seg of input.segments) {
    const from = [seg.from, input.createdOn, start].sort().at(-1)!;
    const to = seg.to < input.today ? seg.to : input.today;
    if (from > to) continue;
    if (isDayBased(seg.schedule)) {
      for (const day of daysBetween(from, to)) {
        if (!isScheduledOn(seg.schedule, day) || input.excused(day)) continue;
        const o = input.outcome(day);
        if (o === 'skipped') continue;
        if (day === input.today && o !== 'done') continue;
        opportunities += 1;
        completed += o === 'done' ? 1 : o === 'partial' ? 0.5 : 0;
      }
    } else {
      const times = seg.schedule.kind === 'perWeek' ? seg.schedule.times : 1;
      for (let week = weekStartOf(from); week <= weekStartOf(to); week = addDays(week, 7)) {
        const days = daysBetween(week, addDays(week, 6)).filter((d) => d >= from && d <= to);
        const excused = days.filter(
          (d) => input.excused(d) || input.outcome(d) === 'skipped',
        ).length;
        const quota = Math.max(0, Math.round((times * days.length) / 7) - excused);
        const done = days.filter((d) => input.outcome(d) === 'done').length;
        const partial = days.filter((d) => input.outcome(d) === 'partial').length;
        const got = Math.min(quota, done + partial * 0.5);
        const isCurrent = weekStartOf(input.today) === week;
        opportunities += isCurrent ? Math.min(quota, got) : quota;
        completed += got;
      }
    }
  }
  return { completed, opportunities, rate: opportunities > 0 ? completed / opportunities : null };
}

export function formatRate(c: Consistency): string {
  return c.rate === null ? '—' : `${Math.round(c.rate * 100)}%`;
}
