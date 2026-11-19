import type { DayKey } from '../../utils/date';
import type { Schedule } from '../scheduling/schedule';

/**
 * Where an automatic habit gets its check-ins (REQ-02-010/011). Manual habits have none.
 * Events come from Olaa Language (olaa-platform contracts/events/language-events.md).
 */
export type AutoSource =
  | { kind: 'language.daily_goal' }
  | { kind: 'language.new_lessons'; count: number };

export const MAX_NEW_LESSONS = 10;

/** A habit the user tracks (module 02.01). */
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: HabitColor;
  schedule: Schedule;
  createdOn: DayKey;
  archivedOn: DayKey | null;
  /** Missing or null: checked by hand. */
  source?: AutoSource | null;
}

export type HabitDraft = Pick<Habit, 'name' | 'icon' | 'color' | 'schedule' | 'source'>;

export function isAuto(habit: Pick<Habit, 'source'>): boolean {
  return Boolean(habit.source);
}

export function describeSource(source: AutoSource): string {
  return source.kind === 'language.daily_goal'
    ? 'Tự động: đạt mục tiêu ngày ở Olaa Language'
    : `Tự động: xong ${source.count} bài mới ở Olaa Language`;
}

export function isValidSource(source: AutoSource | null | undefined): boolean {
  if (!source) return true;
  if (source.kind === 'language.daily_goal') return true;
  return Number.isInteger(source.count) && source.count >= 1 && source.count <= MAX_NEW_LESSONS;
}

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
  '📚',
  '🗣️',
  '✍️',
  '📖',
  '🎧',
  '🧠',
  '🏃',
  '🧘',
  '💧',
  '🥗',
  '😴',
  '🎸',
  '🎨',
  '💻',
  '🧹',
  '🌱',
] as const;

export const MAX_NAME_LENGTH = 60;

export function validateDraft(draft: HabitDraft): string | null {
  const name = draft.name.trim();
  if (!name) return 'Nhập tên thói quen.';
  if (name.length > MAX_NAME_LENGTH) return `Tên tối đa ${MAX_NAME_LENGTH} ký tự.`;
  return null;
}
