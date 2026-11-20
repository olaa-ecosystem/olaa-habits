import { weekdayOf, type DayKey, type Weekday } from '../../utils/date';
import { tr } from '../../i18n/locale';

/** How often a habit repeats (module 02.02, REQ-02-002). */
export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: Weekday[] }
  | { kind: 'perWeek'; times: number };

/** Short weekday names, Monday first, in the interface language. */
export function weekdayShort(): string[] {
  return tr('T2|T3|T4|T5|T6|T7|CN', 'Mon|Tue|Wed|Thu|Fri|Sat|Sun').split('|');
}
export const MAX_TIMES_PER_WEEK = 6;

/** Day-based schedules expect a check on specific days; perWeek counts any day of the week. */
export function isDayBased(schedule: Schedule): boolean {
  return schedule.kind !== 'perWeek';
}

export function isScheduledOn(schedule: Schedule, day: DayKey): boolean {
  switch (schedule.kind) {
    case 'daily':
      return true;
    case 'weekdays':
      return schedule.days.includes(weekdayOf(day));
    case 'perWeek':
      return true;
  }
}

export function describeSchedule(schedule: Schedule): string {
  switch (schedule.kind) {
    case 'daily':
      return tr('Mỗi ngày', 'Every day');
    case 'weekdays':
      return schedule.days.length === 7
        ? tr('Mỗi ngày', 'Every day')
        : [...schedule.days]
            .sort((a, b) => a - b)
            .map((d) => weekdayShort()[d])
            .join(', ');
    case 'perWeek':
      return tr(`${schedule.times} lần mỗi tuần`, `${schedule.times} times a week`);
  }
}

export function isValidSchedule(schedule: Schedule): boolean {
  switch (schedule.kind) {
    case 'daily':
      return true;
    case 'weekdays':
      return schedule.days.length > 0 && schedule.days.every((d) => d >= 0 && d <= 6);
    case 'perWeek':
      return (
        Number.isInteger(schedule.times) &&
        schedule.times >= 1 &&
        schedule.times <= MAX_TIMES_PER_WEEK
      );
  }
}
