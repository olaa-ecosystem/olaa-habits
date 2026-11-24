/**
 * What happened on a day for a habit (module 02.03). Manual habits read their check-in; Language
 * habits count the events received for that day, so a late event fixes the day automatically
 * (REQ-02-015). Pure functions.
 */
import type { HabitState } from '../../stores/habitState';
import { addDays, type DayKey } from '../../utils/date';
import { checkInKey, type Habit } from '../habit-management/types';
import { isDueOn, isWeekly, weekOf, weeklyQuota } from '../scheduling/schedule';

export function valueOn(state: HabitState, habit: Habit, day: DayKey): number {
  switch (habit.source.kind) {
    case 'manual':
      return state.checkIns[checkInKey(habit.id, day)]?.value ?? 0;
    case 'language.daily_goal':
      return countEvents(state, 'language.daily_goal.completed', day) > 0 ? 1 : 0;
    case 'language.lessons':
      return countEvents(state, 'language.lesson.completed', day);
  }
}

function countEvents(state: HabitState, type: string, day: DayKey): number {
  let n = 0;
  for (const e of Object.values(state.events)) if (e.type === type && e.date === day) n += 1;
  return n;
}

export function isDoneOn(state: HabitState, habit: Habit, day: DayKey): boolean {
  return valueOn(state, habit, day) >= habit.target;
}

export function isFrozen(state: HabitState, day: DayKey): boolean {
  return Boolean(state.freezes[day]);
}

/** Completed days in the week that starts on `weekStartDay`, up to and including `until`. */
export function doneInWeek(
  state: HabitState,
  habit: Habit,
  weekStartDay: DayKey,
  until: DayKey,
): number {
  let n = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(weekStartDay, i);
    if (d > until) break;
    if (d >= habit.startDate && isDoneOn(state, habit, d)) n += 1;
  }
  return n;
}

export function frozenInWeek(state: HabitState, habit: Habit, weekStartDay: DayKey): number {
  let n = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(weekStartDay, i);
    if (d >= habit.startDate && isFrozen(state, d) && !isDoneOn(state, habit, d)) n += 1;
  }
  return n;
}

export type DayStatus =
  | 'done'
  | 'partial'
  | 'frozen'
  | 'missed'
  | 'pending'
  | 'open'
  | 'not-due'
  | 'future';

/**
 * Status used by the calendar and history. "open" is a day of an N-times-a-week habit with no
 * completion: it is not a miss on its own.
 */
export function dayStatus(state: HabitState, habit: Habit, day: DayKey, today: DayKey): DayStatus {
  if (day > today) return isFrozen(state, day) && day >= habit.startDate ? 'frozen' : 'future';
  if (day < habit.startDate) return 'not-due';
  const value = valueOn(state, habit, day);
  if (value >= habit.target) return 'done';
  if (isFrozen(state, day) && (isWeekly(habit) || isDueOn(habit, day))) return 'frozen';
  if (value > 0) return 'partial';
  if (isWeekly(habit)) return 'open';
  if (!isDueOn(habit, day)) return 'not-due';
  return day === today ? 'pending' : 'missed';
}

/**
 * Should the habit appear on the Today list for `day`? Fixed-day habits: when due. Weekly
 * habits: every day until the week's count is reached, and on the days they were done.
 */
export function isOnAgenda(
  state: HabitState,
  habit: Habit,
  day: DayKey,
  weekStart: 0 | 1,
): boolean {
  if (habit.archivedAt !== null || day < habit.startDate) return false;
  if (!isWeekly(habit)) return isDueOn(habit, day);
  if (valueOn(state, habit, day) > 0) return true;
  const week = weekOf(day, weekStart);
  return doneInWeek(state, habit, week, day) < weeklyQuota(habit, week);
}

/** Share of the day's agenda that is done, 0–1, plus counts. */
export function dayProgress(
  state: HabitState,
  day: DayKey,
): { done: number; total: number; ratio: number } {
  const ws = state.settings.weekStart;
  let done = 0;
  let total = 0;
  for (const h of Object.values(state.habits)) {
    if (!isOnAgenda(state, h, day, ws)) continue;
    total += 1;
    if (isDoneOn(state, h, day)) done += 1;
  }
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

/** Manual check-ins can be changed for today and the two days before (REQ-02-003). */
export const EDIT_WINDOW_DAYS = 2;

export function canEditDay(day: DayKey, today: DayKey): boolean {
  return day <= today && day >= addDays(today, -EDIT_WINDOW_DAYS);
}
