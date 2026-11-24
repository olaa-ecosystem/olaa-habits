import type { BadgeId } from '../features/gamification/badges';
import type { CheckIn, Habit } from '../features/habit-management/types';
import type { DayKey } from '../utils/date';

export const STATE_VERSION = 1;

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface Settings {
  /** 1 = Monday (default, REQ-02-002), 0 = Sunday. */
  weekStart: 0 | 1;
  /** Streak freezes allowed per calendar month (REQ-02-021, proposed 2). */
  freezesPerMonth: number;
  theme: ThemeChoice;
  /** The user turned reminders on in this app (browser permission is separate). */
  remindersOn: boolean;
}

/**
 * A completion signal from another Olaa app, kept after de-duplication by event id
 * (REQ-02-015, NFR-02-004). Only what habit maths needs is stored.
 */
export interface ReceivedEvent {
  type: 'language.daily_goal.completed' | 'language.lesson.completed';
  date: DayKey;
}

export interface EarnedBadge {
  id: BadgeId;
  earnedAt: number;
  habitId: string | null;
}

export interface HabitState {
  version: typeof STATE_VERSION;
  habits: Record<string, Habit>;
  /** Keyed by `${habitId}|${date}`. */
  checkIns: Record<string, CheckIn>;
  /** Days announced in advance as busy: streaks hold over them (REQ-02-021). */
  freezes: Record<DayKey, { createdAt: number }>;
  /** Earned once, never taken away (REQ-02-024). */
  badges: Partial<Record<BadgeId, EarnedBadge>>;
  /** Events from other apps by event id. */
  events: Record<string, ReceivedEvent>;
  settings: Settings;
}

export function defaultSettings(): Settings {
  return { weekStart: 1, freezesPerMonth: 2, theme: 'system', remindersOn: false };
}

export function emptyState(): HabitState {
  return {
    version: STATE_VERSION,
    habits: {},
    checkIns: {},
    freezes: {},
    badges: {},
    events: {},
    settings: defaultSettings(),
  };
}

/** Read stored or downloaded state; anything unexpected gives null instead of a broken app. */
export function parseState(raw: unknown): HabitState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const s = raw as Partial<HabitState>;
  if (s.version !== STATE_VERSION) return null;
  if (typeof s.habits !== 'object' || typeof s.checkIns !== 'object') return null;
  return {
    ...emptyState(),
    ...s,
    settings: { ...defaultSettings(), ...(s.settings ?? {}) },
  } as HabitState;
}
