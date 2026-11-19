import { addDays, type DayKey } from '../utils/date';
import { detectBadges, type BadgeId } from '../features/gamification/badges';
import {
  editCheckIn,
  outcomeOf,
  type CheckIn,
  type Outcome,
} from '../features/habit-tracking/checkins';
import {
  isAuto,
  isMeasured,
  isPausedNow,
  isPausedOn,
  isValidSource,
  kindOf,
  MAX_TARGET,
  planOf,
  validateDraft,
  type Habit,
  type HabitDraft,
} from '../features/habit-management/types';
import { computeConsistency, type Consistency } from '../features/streaks/consistency';
import { computeStreak, type Segment, type Streak } from '../features/streaks/streak';
import { isValidSchedule } from '../features/scheduling/schedule';
import { canFreeze, canUnfreeze } from '../features/streaks/freeze';

export const STATE_VERSION = 2;

/** Days back a check-in can still be corrected (REQ-02-003). */
export const EDITABLE_DAYS = 2;

export interface AppState {
  version: typeof STATE_VERSION;
  onboarded: boolean;
  name: string;
  habits: Record<string, Habit>;
  /** Display order of habit ids. */
  order: string[];
  /** Check-ins per habit per day (PRD v1.0 §7.1). */
  checkins: Record<string, Record<DayKey, CheckIn>>;
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

/**
 * Bring saved state up to the current version. Version 1 stored check-ins as `true` and had
 * no plans, kinds or pauses. Returns null for anything unrecognised (never guesses).
 */
export function migrateState(raw: unknown): AppState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const v = (raw as { version?: unknown }).version;
  if (v === STATE_VERSION) return { ...initialState(), ...(raw as AppState) };
  if (v !== 1) return null;
  const old = raw as Omit<AppState, 'version' | 'checkins'> & {
    checkins?: Record<string, Record<DayKey, true>>;
  };
  const habits: Record<string, Habit> = {};
  for (const [id, h] of Object.entries(old.habits ?? {})) {
    habits[id] = {
      ...h,
      kind: h.kind ?? 'binary',
      plan: h.plan ?? [{ from: h.createdOn, schedule: h.schedule }],
      pauses: h.pauses ?? [],
    };
  }
  const checkins: AppState['checkins'] = {};
  for (const [id, days] of Object.entries(old.checkins ?? {})) {
    const source = habits[id]?.source ? 'language' : 'manual';
    checkins[id] = Object.fromEntries(
      Object.keys(days).map((d) => [d, { status: 'done', source, updatedAt: 0 } satisfies CheckIn]),
    );
  }
  return { ...initialState(), ...old, version: STATE_VERSION, habits, checkins };
}

export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidDraft(draft: HabitDraft): boolean {
  return !validateDraft(draft) && isValidSchedule(draft.schedule) && isValidSource(draft.source);
}

function cleanDraft(draft: HabitDraft): HabitDraft {
  const measured = draft.kind && draft.kind !== 'binary';
  return {
    name: draft.name.trim(),
    icon: draft.icon,
    color: draft.color,
    schedule: draft.schedule,
    source: draft.source ?? null,
    kind: draft.kind ?? 'binary',
    ...(measured ? { target: draft.target } : {}),
    ...(draft.kind === 'quantity' && draft.unit?.trim() ? { unit: draft.unit.trim() } : {}),
    ...(draft.description?.trim() ? { description: draft.description.trim() } : {}),
  };
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

// ---------- reading a habit's history ----------

/** Schedule stretches from the plan history, ending at the archive day or `today`. */
export function segmentsOf(habit: Habit, today: DayKey): Segment[] {
  const plan = planOf(habit);
  const end = habit.archivedOn ?? today;
  return plan.map((entry, i) => ({
    from: entry.from,
    to: plan[i + 1] ? addDays(plan[i + 1]!.from, -1) : end,
    schedule: entry.schedule,
  }));
}

export function entryOf(state: AppState, habitId: string, day: DayKey): CheckIn | undefined {
  return state.checkins[habitId]?.[day];
}

export function outcomeOn(state: AppState, habit: Habit, day: DayKey): Outcome {
  return outcomeOf(habit, day, entryOf(state, habit.id, day));
}

/** Days that do not count for a habit: global freezes and the habit's pauses. */
export function isExcused(state: AppState, habit: Habit, day: DayKey): boolean {
  return Boolean(state.freezes[day]) || isPausedOn(habit, day);
}

export function isDone(state: AppState, habitId: string, day: DayKey): boolean {
  const habit = state.habits[habitId];
  return habit ? outcomeOn(state, habit, day) === 'done' : false;
}

export function habitStreak(state: AppState, habit: Habit, today: DayKey): Streak {
  return computeStreak({
    segments: segmentsOf(habit, today),
    createdOn: habit.createdOn,
    today: habit.archivedOn ?? today,
    outcome: (d) => outcomeOn(state, habit, d),
    frozen: (d) => isExcused(state, habit, d),
  });
}

export function habitConsistency(
  state: AppState,
  habit: Habit,
  today: DayKey,
  days?: number,
): Consistency {
  return computeConsistency({
    segments: segmentsOf(habit, today),
    createdOn: habit.createdOn,
    today: habit.archivedOn ?? today,
    outcome: (d) => outcomeOn(state, habit, d),
    excused: (d) => isExcused(state, habit, d),
    days,
  });
}

/** Consistency of all active habits together. */
export function overallConsistency(state: AppState, today: DayKey, days?: number): Consistency {
  let completed = 0;
  let opportunities = 0;
  for (const h of activeHabits(state)) {
    const c = habitConsistency(state, h, today, days);
    completed += c.completed;
    opportunities += c.opportunities;
  }
  return { completed, opportunities, rate: opportunities > 0 ? completed / opportunities : null };
}

// ---------- changing habits ----------

export function addHabit(
  state: AppState,
  draft: HabitDraft,
  today: DayKey,
  id = newId(),
): AppState {
  if (!isValidDraft(draft) || state.habits[id]) return state;
  const clean = cleanDraft(draft);
  const habit: Habit = {
    ...clean,
    id,
    createdOn: today,
    archivedOn: null,
    plan: [
      { from: today, schedule: clean.schedule, ...(clean.target ? { target: clean.target } : {}) },
    ],
    pauses: [],
  };
  return { ...state, habits: { ...state.habits, [id]: habit }, order: [...state.order, id] };
}

/**
 * Edit a habit. Kind and automatic source stay as created. A new schedule or target starts
 * from today and leaves past days judged by the old plan (PRD v1.0 §7.3).
 */
export function updateHabit(
  state: AppState,
  id: string,
  draft: HabitDraft,
  today?: DayKey,
): AppState {
  const habit = state.habits[id];
  if (!habit) return state;
  const fixed: HabitDraft = { ...draft, kind: kindOf(habit), source: habit.source ?? null };
  if (!isValidDraft(fixed)) return state;
  const clean = cleanDraft(fixed);
  const day = today ?? habit.createdOn;
  const plan = planOf(habit);
  const last = plan[plan.length - 1]!;
  const planChanged =
    JSON.stringify(last.schedule) !== JSON.stringify(clean.schedule) ||
    (last.target ?? undefined) !== (clean.target ?? undefined);
  let nextPlan = plan;
  if (planChanged) {
    const entry = {
      from: day,
      schedule: clean.schedule,
      ...(clean.target ? { target: clean.target } : {}),
    };
    nextPlan =
      last.from >= day ? [...plan.slice(0, -1), { ...entry, from: last.from }] : [...plan, entry];
  }
  const next: Habit = { ...habit, ...clean, plan: nextPlan };
  if (!clean.description) delete next.description;
  if (!clean.unit) delete next.unit;
  return { ...state, habits: { ...state.habits, [id]: next } };
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

/** Pause from today, or resume (the pause then ends yesterday). PRD v1.0 §7.3. */
export function setPaused(state: AppState, id: string, paused: boolean, today: DayKey): AppState {
  const habit = state.habits[id];
  if (!habit || habit.archivedOn || paused === isPausedNow(habit)) return state;
  const pauses = [...(habit.pauses ?? [])];
  if (paused) {
    pauses.push({ from: today, to: null });
  } else {
    const open = pauses.findIndex((p) => p.to === null);
    const p = pauses[open]!;
    if (p.from >= today) pauses.splice(open, 1);
    else pauses[open] = { ...p, to: addDays(today, -1) };
  }
  return { ...state, habits: { ...state.habits, [id]: { ...habit, pauses } } };
}

// ---------- check-ins ----------

export function canEditDay(habit: Habit, day: DayKey, today: DayKey): boolean {
  return (
    habit.archivedOn === null &&
    !isAuto(habit) &&
    day <= today &&
    day >= addDays(today, -EDITABLE_DAYS) &&
    day >= habit.createdOn
  );
}

function writeEntry(
  state: AppState,
  id: string,
  day: DayKey,
  next: Omit<CheckIn, 'updatedAt' | 'history'> | null,
  now: number,
): AppState {
  const days = { ...(state.checkins[id] ?? {}) };
  const edited = editCheckIn(days[day], next, now);
  if (edited) days[day] = edited;
  else delete days[day];
  return { ...state, checkins: { ...state.checkins, [id]: days } };
}

/** Binary habits: not done → done; done or skipped → not done (a note is kept). */
export function toggleCheckin(
  state: AppState,
  id: string,
  day: DayKey,
  today: DayKey,
  now = Date.now(),
): AppState {
  const habit = state.habits[id];
  if (!habit || !canEditDay(habit, day, today) || isMeasured(habit)) return state;
  const entry = entryOf(state, id, day);
  const note = entry?.note;
  if (entry && entry.status !== 'open') {
    return writeEntry(state, id, day, note ? { status: 'open', note } : null, now);
  }
  return writeEntry(state, id, day, { status: 'done', note }, now);
}

/** Measured habits: set the amount for a day (0 clears it). */
export function logValue(
  state: AppState,
  id: string,
  day: DayKey,
  today: DayKey,
  value: number,
  now = Date.now(),
): AppState {
  const habit = state.habits[id];
  if (!habit || !canEditDay(habit, day, today) || !isMeasured(habit) || !Number.isFinite(value))
    return state;
  const entry = entryOf(state, id, day);
  const v = Math.max(0, Math.min(value, MAX_TARGET * 10));
  if (v === 0)
    return writeEntry(
      state,
      id,
      day,
      entry?.note ? { status: 'open', note: entry.note } : null,
      now,
    );
  return writeEntry(state, id, day, { status: 'done', value: v, note: entry?.note }, now);
}

/** Skip a day on purpose (rest, illness): it neither counts nor breaks the streak. */
export function setSkipped(
  state: AppState,
  id: string,
  day: DayKey,
  today: DayKey,
  skipped: boolean,
  now = Date.now(),
): AppState {
  const habit = state.habits[id];
  if (!habit || !canEditDay(habit, day, today)) return state;
  const entry = entryOf(state, id, day);
  if (skipped) return writeEntry(state, id, day, { status: 'skipped', note: entry?.note }, now);
  if (entry?.status !== 'skipped') return state;
  return writeEntry(state, id, day, entry.note ? { status: 'open', note: entry.note } : null, now);
}

export function setNote(
  state: AppState,
  id: string,
  day: DayKey,
  today: DayKey,
  note: string,
  now = Date.now(),
): AppState {
  const habit = state.habits[id];
  if (!habit || !canEditDay(habit, day, today)) return state;
  const entry = entryOf(state, id, day);
  const clean = note.trim();
  if (!entry && !clean) return state;
  if ((entry?.note ?? '') === clean) return state;
  if (!entry) return writeEntry(state, id, day, { status: 'open', note: clean }, now);
  return writeEntry(
    state,
    id,
    day,
    { status: entry.status, value: entry.value, note: clean, source: entry.source },
    now,
  );
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
  const earned = detectBadges(state, today).filter((id) => !state.badges[id]);
  if (earned.length === 0) return state;
  const badges = { ...state.badges };
  for (const id of earned) badges[id] = today;
  return { ...state, badges };
}
