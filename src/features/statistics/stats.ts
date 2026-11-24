/** Completion rates and trends (module 02.09). Pure functions. */
import type { HabitState } from '../../stores/habitState';
import { addDays, lastNDays, type DayKey } from '../../utils/date';
import type { Habit } from '../habit-management/types';
import { dayProgress, doneInWeek, isDoneOn, isFrozen } from '../habit-tracking/progress';
import { isDueOn, isWeekly, weekOf, weeklyQuota } from '../scheduling/schedule';

export interface Rate {
  done: number;
  due: number;
  /** 0–1, or null when nothing was due. */
  ratio: number | null;
}

/**
 * Share of due occurrences completed in the `days` days ending today. Frozen days are left
 * out; today only counts once it is done, so an unfinished morning does not lower the rate.
 */
export function completionRate(state: HabitState, habit: Habit, today: DayKey, days: number): Rate {
  const from = addDays(today, -(days - 1));
  let done = 0;
  let due = 0;
  if (isWeekly(habit)) {
    const ws = state.settings.weekStart;
    for (let w = weekOf(from, ws); w <= today; w = addDays(w, 7)) {
      const quota = weeklyQuota(habit, w);
      if (quota === 0) continue;
      const got = Math.min(quota, doneInWeek(state, habit, w, today));
      const current = w === weekOf(today, ws);
      if (current && got < quota) {
        done += got;
        due += got;
        continue;
      }
      done += got;
      due += quota;
    }
  } else {
    for (const d of lastNDays(today, days)) {
      if (!isDueOn(habit, d)) continue;
      const hit = isDoneOn(state, habit, d);
      if (!hit && (isFrozen(state, d) || d === today)) continue;
      due += 1;
      if (hit) done += 1;
    }
  }
  return { done, due, ratio: due === 0 ? null : done / due };
}

/** Overall rate across active habits. */
export function overallRate(state: HabitState, today: DayKey, days: number): Rate {
  let done = 0;
  let due = 0;
  for (const h of Object.values(state.habits)) {
    if (h.archivedAt !== null) continue;
    const r = completionRate(state, h, today, days);
    done += r.done;
    due += r.due;
  }
  return { done, due, ratio: due === 0 ? null : done / due };
}

/** Completions per week for the last `weeks` weeks, oldest first (bar chart). */
export function weeklyTotals(
  state: HabitState,
  today: DayKey,
  weeks: number,
  habitId?: string,
): { week: DayKey; done: number }[] {
  const ws = state.settings.weekStart;
  const current = weekOf(today, ws);
  const habits = Object.values(state.habits).filter((h) =>
    habitId ? h.id === habitId : h.archivedAt === null,
  );
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDays(current, -7 * (weeks - 1 - i));
    let done = 0;
    for (let d = 0; d < 7; d += 1) {
      const day = addDays(week, d);
      if (day > today) break;
      for (const h of habits) if (day >= h.startDate && isDoneOn(state, h, day)) done += 1;
    }
    return { week, done };
  });
}

/** Share of the day's agenda done, for each of the last `days` days (heatmap). */
export function dailyRatios(state: HabitState, today: DayKey, days: number): Map<DayKey, number> {
  const out = new Map<DayKey, number>();
  for (const d of lastNDays(today, days)) {
    const p = dayProgress(state, d);
    if (p.total > 0) out.set(d, p.ratio);
  }
  return out;
}

/** Weekday (0–6) with the most and fewest completions over the last 8 weeks (insights). */
export function weekdayPattern(state: HabitState, today: DayKey): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of lastNDays(today, 56)) {
    const p = dayProgress(state, d);
    counts[new Date(`${d}T12:00:00`).getDay()]! += p.done;
  }
  return counts;
}
