import { isExcused, outcomeOn, segmentsOf, type AppState } from '../../stores/appState';
import type { DayKey } from '../../utils/date';
import type { Habit } from '../habit-management/types';
import { isPausedOn } from '../habit-management/types';
import { isDayBased, isScheduledOn, type Schedule } from '../scheduling/schedule';

export type DayStatus = 'none' | 'done' | 'partial' | 'missed' | 'frozen' | 'skipped' | 'pending';

/** The schedule a habit followed on `day` (plan history, PRD v1.0 §7.3). */
export function scheduleOn(habit: Habit, day: DayKey, today: DayKey): Schedule {
  return (
    segmentsOf(habit, today).find((s) => s.from <= day && day <= s.to)?.schedule ?? habit.schedule
  );
}

/** Habits that expect a check on `day`: existing, not archived, not paused, scheduled that day. */
export function dueOn(habits: Habit[], day: DayKey, today: DayKey = day): Habit[] {
  return habits.filter((h) => {
    if (h.createdOn > day || (h.archivedOn !== null && h.archivedOn <= day) || isPausedOn(h, day))
      return false;
    const schedule = scheduleOn(h, day, today);
    return isDayBased(schedule) && isScheduledOn(schedule, day);
  });
}

/** Colour of a calendar cell (module 02.07, REQ-02-025). */
export function dayStatus(state: AppState, habits: Habit[], day: DayKey, today: DayKey): DayStatus {
  if (day > today) return state.freezes[day] ? 'frozen' : 'none';
  const single = habits.length === 1 ? habits[0] : undefined;
  if (single && !isDayBased(scheduleOn(single, day, today))) {
    if (single.createdOn > day) return 'none';
    const o = outcomeOn(state, single, day);
    if (o === 'done' || o === 'partial' || o === 'skipped') return o;
    return isExcused(state, single, day) ? 'frozen' : 'none';
  }
  const due = dueOn(habits, day, today);
  if (due.length === 0) return state.freezes[day] ? 'frozen' : 'none';
  const outcomes = due.map((h) => outcomeOn(state, h, day));
  const counted = outcomes.filter((o) => o !== 'skipped');
  if (counted.length === 0) return 'skipped';
  const done = counted.filter((o) => o === 'done').length;
  if (done === counted.length) return 'done';
  if (state.freezes[day]) return 'frozen';
  if (done > 0 || counted.some((o) => o === 'partial')) return 'partial';
  return day === today ? 'pending' : 'missed';
}
