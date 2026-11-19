import type { DayKey } from '../../utils/date';
import type { Schedule } from '../scheduling/schedule';

/** A habit the user tracks (module 02.01). */
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: HabitColor;
  schedule: Schedule;
  createdOn: DayKey;
  archivedOn: DayKey | null;
}

export type HabitDraft = Pick<Habit, 'name' | 'icon' | 'color' | 'schedule'>;

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
