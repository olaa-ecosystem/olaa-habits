import { addDays, type DayKey } from '../utils/date';
import { detectBadges, type BadgeId } from '../features/gamification/badges';
import { validateDraft, type Habit, type HabitDraft } from '../features/habit-management/types';
import { isValidSchedule } from '../features/scheduling/schedule';
import { canFreeze, canUnfreeze } from '../features/streaks/freeze';

export const STATE_VERSION = 1;

/** Days back a check-in can still be corrected (REQ-02-003). */
export const EDITABLE_DAYS = 2;

export interface AppState {
  version: typeof STATE_VERSION;
  onboarded: boolean;
  name: string;
  habits: Record<string, Habit>;
  /** Display order of habit ids. */
  order: string[];
  checkins: Record<string, Record<DayKey, true>>;
  freezes: Record<DayKey, true>;
  badges: Partial<Record<BadgeId, DayKey>>;
}

export function initialState(): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    name: '',
    habits: {},
    order: [],
    checkins: {},
    freezes: {},
    badges: {},
  };
}

export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanDraft(draft: HabitDraft): HabitDraft {
  return { ...draft, name: draft.name.trim() };
}

export function orderedHabits(state: AppState): Habit[] {
  return state.order.map((id) => state.habits[id]).filter((h): h is Habit => Boolean(h));
}

export function activeHabits(state: AppState): Habit[] {
  return orderedHabits(state).filter((h) => h.archivedOn === null);
}

export function archivedHabits(state: AppState): Habit[] {
  return orderedHabits(state).filter((h) => h.archivedOn !== null);
}

export function addHabit(
  state: AppState,
  draft: HabitDraft,
  today: DayKey,
  id = newId(),
): AppState {
  if (validateDraft(draft) || !isValidSchedule(draft.schedule) || state.habits[id]) return state;
  const habit: Habit = { ...cleanDraft(draft), id, createdOn: today, archivedOn: null };
  return { ...state, habits: { ...state.habits, [id]: habit }, order: [...state.order, id] };
}

export function updateHabit(state: AppState, id: string, draft: HabitDraft): AppState {
  const habit = state.habits[id];
  if (!habit || validateDraft(draft) || !isValidSchedule(draft.schedule)) return state;
  return { ...state, habits: { ...state.habits, [id]: { ...habit, ...cleanDraft(draft) } } };
}

/** Archive keeps history (REQ-02-001); restore brings the habit back. */
export function archiveHabit(state: AppState, id: string, today: DayKey): AppState {
  const habit = state.habits[id];
  if (!habit || habit.archivedOn) return state;
  return { ...state, habits: { ...state.habits, [id]: { ...habit, archivedOn: today } } };
}

export function restoreHabit(state: AppState, id: string): AppState {
  const habit = state.habits[id];
  if (!habit || !habit.archivedOn) return state;
  return { ...state, habits: { ...state.habits, [id]: { ...habit, archivedOn: null } } };
}

export function canEditDay(habit: Habit, day: DayKey, today: DayKey): boolean {
  return (
    habit.archivedOn === null &&
    day <= today &&
    day >= addDays(today, -EDITABLE_DAYS) &&
    day >= habit.createdOn
  );
}

export function isDone(state: AppState, habitId: string, day: DayKey): boolean {
  return Boolean(state.checkins[habitId]?.[day]);
}

export function toggleCheckin(state: AppState, id: string, day: DayKey, today: DayKey): AppState {
  const habit = state.habits[id];
  if (!habit || !canEditDay(habit, day, today)) return state;
  const days = { ...(state.checkins[id] ?? {}) };
  if (days[day]) delete days[day];
  else days[day] = true;
  return { ...state, checkins: { ...state.checkins, [id]: days } };
}

export function setFreeze(state: AppState, day: DayKey, on: boolean, today: DayKey): AppState {
  if (on && !canFreeze(state.freezes, day, today).ok) return state;
  if (!on && !canUnfreeze(state.freezes, day, today)) return state;
  const freezes = { ...state.freezes };
  if (on) freezes[day] = true;
  else delete freezes[day];
  return { ...state, freezes };
}

export function completeOnboarding(
  state: AppState,
  input: { name: string; drafts: HabitDraft[] },
  today: DayKey,
): AppState {
  let next: AppState = { ...state, onboarded: true, name: input.name.trim().slice(0, 40) };
  for (const draft of input.drafts) next = addHabit(next, draft, today);
  return next;
}

/** Record newly earned badges with the day they were earned; never removes one. */
export function awardBadges(state: AppState, today: DayKey): AppState {
  const earned = detectBadges({
    habits: orderedHabits(state),
    checkins: state.checkins,
    freezes: state.freezes,
    today,
  }).filter((id) => !state.badges[id]);
  if (earned.length === 0) return state;
  const badges = { ...state.badges };
  for (const id of earned) badges[id] = today;
  return { ...state, badges };
}
