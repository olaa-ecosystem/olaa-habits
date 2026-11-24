/**
 * Streaks and habit strength (module 02.04, REQ-02-020/021). Pure functions.
 *
 * - Fixed-day habits count days. A due day that is done extends the streak; a frozen day holds
 *   it (neither counts nor breaks); a missed day breaks it. Today, if not done yet, is pending
 *   and does not break anything.
 * - "N times a week" habits count weeks: a week with enough completions extends the streak;
 *   frozen days fill the gap in a week that would otherwise fall short (hold, no count).
 */
import type { HabitState } from '../../stores/habitState';
import { addDays, daysBetween, type DayKey } from '../../utils/date';
import type { Habit } from '../habit-management/types';
import { doneInWeek, frozenInWeek, isDoneOn, isFrozen } from '../habit-tracking/progress';
import { isDueOn, isWeekly, weekOf, weeklyQuota } from '../scheduling/schedule';

export interface StreakInfo {
  current: number;
  best: number;
  unit: 'day' | 'week';
  /** A freeze held a streak that then continued (badge "first freeze"). */
  freezeBridged: boolean;
}

type Mark = 'hit' | 'hold' | 'miss' | 'skip' | 'pending';

/** One mark per period (day or week) from the habit's start to today, oldest first. */
function marks(state: HabitState, habit: Habit, today: DayKey): Mark[] {
  const out: Mark[] = [];
  if (habit.startDate > today) return out;
  if (isWeekly(habit)) {
    const ws = state.settings.weekStart;
    const current = weekOf(today, ws);
    for (let w = weekOf(habit.startDate, ws); w <= current; w = addDays(w, 7)) {
      const quota = weeklyQuota(habit, w);
      const done = doneInWeek(state, habit, w, today);
      if (quota === 0) out.push('skip');
      else if (done >= quota) out.push('hit');
      else if (w === current) out.push('pending');
      else if (done + frozenInWeek(state, habit, w) >= quota) out.push('hold');
      else out.push('miss');
    }
    return out;
  }
  // Bound the scan so a wrong start date cannot freeze the UI.
  const span = Math.min(daysBetween(habit.startDate, today), 3660);
  for (let i = span; i >= 0; i -= 1) {
    const d = addDays(today, -i);
    if (isDoneOn(state, habit, d)) out.push(isDueOn(habit, d) ? 'hit' : 'skip');
    else if (!isDueOn(habit, d)) out.push('skip');
    else if (isFrozen(state, d)) out.push('hold');
    else if (d === today) out.push('pending');
    else out.push('miss');
  }
  return out;
}

export function streakOf(state: HabitState, habit: Habit, today: DayKey): StreakInfo {
  const list = marks(state, habit, today);
  let run = 0;
  let best = 0;
  let holdInRun = false;
  let freezeBridged = false;
  for (const m of list) {
    if (m === 'hit') {
      run += 1;
      if (holdInRun) freezeBridged = true;
      best = Math.max(best, run);
    } else if (m === 'hold') {
      if (run > 0) holdInRun = true;
    } else if (m === 'miss') {
      run = 0;
      holdInRun = false;
    }
  }
  return { current: run, best, unit: isWeekly(habit) ? 'week' : 'day', freezeBridged };
}

/**
 * Habit strength 0–1, an exponential average of recent periods (as in Loop Habit Tracker):
 * recent days weigh more, one miss lowers it a little instead of resetting it to zero.
 */
export function strengthOf(state: HabitState, habit: Habit, today: DayKey): number {
  const list = marks(state, habit, today);
  const halfLife = isWeekly(habit) ? 4 : 14;
  const alpha = 1 - Math.pow(0.5, 1 / halfLife);
  let score = 0;
  for (const m of list) {
    if (m === 'hit') score += alpha * (1 - score);
    else if (m === 'miss') score -= alpha * score;
  }
  return Math.max(0, Math.min(1, score));
}
