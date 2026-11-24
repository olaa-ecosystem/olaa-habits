import type { DayKey, Weekday } from '../../utils/date';

/** How often a habit is due (REQ-02-002). */
export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: Weekday[] }
  | { kind: 'perWeek'; times: number };

/**
 * Where completions come from. Manual habits are checked off by the user. Language habits are
 * checked off by events from Olaa Language and cannot be ticked by hand (REQ-02-014).
 */
export type HabitSource =
  | { kind: 'manual' }
  | { kind: 'language.daily_goal' }
  | { kind: 'language.lessons' };

export type TimeOfDay = 'any' | 'morning' | 'afternoon' | 'evening';

export const HABIT_COLORS = [
  'blue',
  'orange',
  'green',
  'red',
  'gold',
  'purple',
  'teal',
  'pink',
] as const;
export type HabitColor = (typeof HABIT_COLORS)[number];

export const HABIT_ICONS = [
  'book',
  'language',
  'note',
  'pen',
  'water',
  'run',
  'dumbbell',
  'leaf',
  'moon',
  'sun',
  'heart',
  'music',
  'code',
  'coffee-off',
  'phone-off',
  'star',
] as const;
export type HabitIcon = (typeof HABIT_ICONS)[number];

export interface Habit {
  id: string;
  name: string;
  icon: HabitIcon;
  color: HabitColor;
  schedule: Schedule;
  /** Amount that counts as done on a day: 1 for yes/no habits, e.g. 8 for "8 glasses". */
  target: number;
  /** Unit label for count habits ("ly", "trang", "phút"). Empty for yes/no habits. */
  unit: string;
  timeOfDay: TimeOfDay;
  source: HabitSource;
  /** Daily reminder time "HH:MM", or null (REQ-02-022). */
  reminder: string | null;
  /** Why this habit matters to the user, shown on the habit page as a reminder. */
  why: string;
  /** Link to a notebook or page in Olaa Note, opened from the habit (Olaa Note integration). */
  noteLink: string | null;
  /** First day the habit is due. Days before it never count as missed. */
  startDate: DayKey;
  createdAt: number;
  updatedAt: number;
  /** Archived habits keep their history and can be restored (REQ-02-001). */
  archivedAt: number | null;
  order: number;
}

/** One day's record for a manual habit. Auto habits derive their value from events instead. */
export interface CheckIn {
  habitId: string;
  date: DayKey;
  value: number;
  /** Short reflection for the day; can be sent on to Olaa Note. */
  note: string;
  /** When the user last changed it; used for smart reminder suggestions (REQ-02-023). */
  updatedAt: number;
}

export function checkInKey(habitId: string, date: DayKey): string {
  return `${habitId}|${date}`;
}

export function isAuto(habit: Habit): boolean {
  return habit.source.kind !== 'manual';
}
