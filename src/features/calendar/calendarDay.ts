import { isDone, type AppState } from '../../stores/appState';
import type { DayKey } from '../../utils/date';
import type { Habit } from '../habit-management/types';
import { isDayBased, isScheduledOn } from '../scheduling/schedule';

export type DayStatus = 'none' | 'done' | 'partial' | 'missed' | 'frozen' | 'pending';

/** Habits that expect a check on `day` (day-based schedules, existing and not archived then). */
export function dueOn(habits: Habit[], day: DayKey): Habit[] {
  return habits.filter(
    (h) =>
      h.createdOn <= day &&
      (h.archivedOn === null || h.archivedOn > day) &&
      isDayBased(h.schedule) &&
      isScheduledOn(h.schedule, day),
  );
}

/** Colour of a calendar cell (module 02.07, REQ-02-025). */
export function dayStatus(state: AppState, habits: Habit[], day: DayKey, today: DayKey): DayStatus {
  if (day > today) return state.freezes[day] ? 'frozen' : 'none';
  const single = habits.length === 1 ? habits[0] : undefined;
  const due =
    single && !isDayBased(single.schedule)
      ? single.createdOn <= day
        ? [single]
        : []
      : dueOn(habits, day);
  const done = due.filter((h) => isDone(state, h.id, day)).length;
  if (due.length > 0 && done === due.length) return 'done';
  if (state.freezes[day]) return 'frozen';
  if (single && !isDayBased(single.schedule)) return 'none';
  if (due.length === 0) return 'none';
  if (done > 0) return 'partial';
  return day === today ? 'pending' : 'missed';
}
