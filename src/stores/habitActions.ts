/** State changes. Pure: each returns a new state, or the same object when nothing changes. */
import { canFreeze, canUnfreeze } from '../features/streaks/freezes';
import {
  checkInKey,
  isAuto,
  type CheckIn,
  type Habit,
  type HabitColor,
  type HabitIcon,
  type HabitSource,
  type Schedule,
  type TimeOfDay,
} from '../features/habit-management/types';
import { canEditDay } from '../features/habit-tracking/progress';
import type { DayKey } from '../utils/date';
import { newId } from '../utils/id';
import type { HabitState, Settings } from './habitState';

export interface HabitInput {
  name: string;
  icon: HabitIcon;
  color: HabitColor;
  schedule: Schedule;
  target: number;
  unit: string;
  timeOfDay: TimeOfDay;
  source: HabitSource;
  reminder: string | null;
  noteLink: string | null;
  startDate: DayKey;
}

export const NAME_MAX = 60;

/** Clean user input: trimmed name, sane target and schedule. */
export function sanitizeInput(input: HabitInput): HabitInput {
  const target = Math.max(1, Math.min(999, Math.round(input.target) || 1));
  let schedule = input.schedule;
  if (schedule.kind === 'weekdays') {
    const days = [...new Set(schedule.days)].sort();
    schedule =
      days.length === 0 || days.length === 7 ? { kind: 'daily' } : { kind: 'weekdays', days };
  } else if (schedule.kind === 'perWeek') {
    schedule = { kind: 'perWeek', times: Math.max(1, Math.min(7, Math.round(schedule.times))) };
  }
  return {
    ...input,
    name: input.name.trim().slice(0, NAME_MAX),
    unit: target > 1 ? input.unit.trim().slice(0, 16) : '',
    target: input.source.kind === 'language.daily_goal' ? 1 : target,
    schedule,
  };
}

export function createHabit(
  state: HabitState,
  input: HabitInput,
  now: number,
): { state: HabitState; id: string } {
  const clean = sanitizeInput(input);
  const id = newId('h_');
  const order = Math.max(0, ...Object.values(state.habits).map((h) => h.order + 1));
  const habit: Habit = {
    ...clean,
    id,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    order,
  };
  return { state: { ...state, habits: { ...state.habits, [id]: habit } }, id };
}

export function updateHabit(
  state: HabitState,
  id: string,
  input: HabitInput,
  now: number,
): HabitState {
  const old = state.habits[id];
  if (!old) return state;
  const clean = sanitizeInput(input);
  return { ...state, habits: { ...state.habits, [id]: { ...old, ...clean, updatedAt: now } } };
}

export function setArchived(
  state: HabitState,
  id: string,
  archived: boolean,
  now: number,
): HabitState {
  const old = state.habits[id];
  if (!old || (old.archivedAt !== null) === archived) return state;
  return {
    ...state,
    habits: {
      ...state.habits,
      [id]: { ...old, archivedAt: archived ? now : null, updatedAt: now },
    },
  };
}

/** Delete a habit and its history for good (only offered for archived habits). */
export function deleteHabit(state: HabitState, id: string): HabitState {
  if (!state.habits[id]) return state;
  const habits = { ...state.habits };
  delete habits[id];
  const checkIns = Object.fromEntries(
    Object.entries(state.checkIns).filter(([, c]) => c.habitId !== id),
  );
  return { ...state, habits, checkIns };
}

/** Move a habit one place up or down in the list. */
export function moveHabit(state: HabitState, id: string, delta: -1 | 1): HabitState {
  const list = Object.values(state.habits)
    .filter((h) => h.archivedAt === null)
    .sort((a, b) => a.order - b.order);
  const i = list.findIndex((h) => h.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return state;
  const a = list[i]!;
  const b = list[j]!;
  return {
    ...state,
    habits: { ...state.habits, [a.id]: { ...a, order: b.order }, [b.id]: { ...b, order: a.order } },
  };
}

/**
 * Set a manual habit's amount for a day. Refused for Language habits (REQ-02-014) and for days
 * outside the edit window (REQ-02-003).
 */
export function setValue(
  state: HabitState,
  habitId: string,
  date: DayKey,
  value: number,
  today: DayKey,
  now: number,
): HabitState {
  const habit = state.habits[habitId];
  if (!habit || isAuto(habit) || !canEditDay(date, today) || date < habit.startDate) return state;
  const key = checkInKey(habitId, date);
  const old = state.checkIns[key];
  const v = Math.max(0, Math.min(9999, Math.round(value)));
  if ((old?.value ?? 0) === v) return state;
  const checkIns = { ...state.checkIns };
  if (v === 0 && !old?.note) delete checkIns[key];
  else checkIns[key] = { habitId, date, value: v, note: old?.note ?? '', updatedAt: now };
  return { ...state, checkIns };
}

/** One tap: done ↔ not done for yes/no habits, +1 for count habits (wraps to 0 when full). */
export function tap(
  state: HabitState,
  habitId: string,
  date: DayKey,
  today: DayKey,
  now: number,
): HabitState {
  const habit = state.habits[habitId];
  if (!habit) return state;
  const current = state.checkIns[checkInKey(habitId, date)]?.value ?? 0;
  const next =
    habit.target === 1 ? (current >= 1 ? 0 : 1) : current >= habit.target ? 0 : current + 1;
  return setValue(state, habitId, date, next, today, now);
}

export const NOTE_MAX = 1000;

/** A short reflection for a habit on a day. Allowed on any past day (it is not a check-in). */
export function setNote(
  state: HabitState,
  habitId: string,
  date: DayKey,
  note: string,
  today: DayKey,
  now: number,
): HabitState {
  if (!state.habits[habitId] || date > today) return state;
  const key = checkInKey(habitId, date);
  const old = state.checkIns[key];
  const text = note.slice(0, NOTE_MAX);
  if ((old?.note ?? '') === text) return state;
  const checkIns = { ...state.checkIns };
  const next: CheckIn = {
    habitId,
    date,
    value: old?.value ?? 0,
    note: text,
    updatedAt: old?.updatedAt ?? now,
  };
  if (next.value === 0 && !text) delete checkIns[key];
  else checkIns[key] = next;
  return { ...state, checkIns };
}

export function freezeDay(state: HabitState, day: DayKey, today: DayKey, now: number): HabitState {
  if (canFreeze(state, day, today) !== 'ok') return state;
  return { ...state, freezes: { ...state.freezes, [day]: { createdAt: now } } };
}

export function unfreezeDay(state: HabitState, day: DayKey, today: DayKey): HabitState {
  if (!canUnfreeze(state, day, today)) return state;
  const freezes = { ...state.freezes };
  delete freezes[day];
  return { ...state, freezes };
}

export function updateSettings(state: HabitState, patch: Partial<Settings>): HabitState {
  return { ...state, settings: { ...state.settings, ...patch } };
}
