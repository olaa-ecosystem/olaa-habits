import type { DayKey } from '../../utils/date';
import type { Schedule } from '../scheduling/schedule';
import { tr } from '../../i18n/locale';

/**
 * Where an automatic habit gets its check-ins (REQ-02-010/011). Manual habits have none.
 * Events come from Olaa Language (olaa-platform contracts/events/language-events.md).
 */
export type AutoSource =
  | { kind: 'language.daily_goal' }
  | { kind: 'language.new_lessons'; count: number };

export const MAX_NEW_LESSONS = 10;

/**
 * How a habit is measured (PRD v1.0 §7.4). Binary: done or not. Quantity: a number of `unit`
 * against a target. Duration: minutes against a target. Fixed once the habit is created.
 */
export type HabitKind = 'binary' | 'quantity' | 'duration';

/**
 * The plan in force from a day on. Changing the schedule or target appends a new entry from
 * today, so past days keep being judged by the plan that applied then (PRD v1.0 §7.3).
 */
export interface PlanEntry {
  from: DayKey;
  schedule: Schedule;
  /** Measured habits only. */
  target?: number;
}

/** A pause (vacation, illness, rest). Paused days neither count nor break a streak. */
export interface Pause {
  from: DayKey;
  /** Last paused day, or null while still paused. */
  to: DayKey | null;
}

/** A habit the user tracks (module 02.01). */
export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: HabitColor;
  /** The current schedule (same as the last plan entry). */
  schedule: Schedule;
  createdOn: DayKey;
  archivedOn: DayKey | null;
  /** Missing or null: checked by hand. */
  source?: AutoSource | null;
  kind?: HabitKind;
  /** Current target for measured habits (same as the last plan entry). */
  target?: number;
  /** Unit label for quantity habits, e.g. "ly", "trang". */
  unit?: string;
  plan?: PlanEntry[];
  pauses?: Pause[];
}

export type HabitDraft = Pick<Habit, 'name' | 'icon' | 'color' | 'schedule' | 'source'> &
  Partial<Pick<Habit, 'kind' | 'target' | 'unit' | 'description'>>;

export const MAX_TARGET = 10_000;
export const MAX_UNIT_LENGTH = 16;
export const MAX_DESCRIPTION_LENGTH = 200;

export function kindOf(habit: Pick<Habit, 'kind'>): HabitKind {
  return habit.kind ?? 'binary';
}

export function isMeasured(habit: Pick<Habit, 'kind'>): boolean {
  return kindOf(habit) !== 'binary';
}

/** Plan entries in date order; habits saved before plans existed get one from creation. */
export function planOf(habit: Habit): PlanEntry[] {
  return habit.plan && habit.plan.length > 0
    ? habit.plan
    : [{ from: habit.createdOn, schedule: habit.schedule, target: habit.target }];
}

export function planOn(habit: Habit, day: DayKey): PlanEntry {
  const plan = planOf(habit);
  let current = plan[0]!;
  for (const entry of plan) if (entry.from <= day) current = entry;
  return current;
}

export function isPausedOn(habit: Pick<Habit, 'pauses'>, day: DayKey): boolean {
  return (habit.pauses ?? []).some((p) => p.from <= day && (p.to === null || day <= p.to));
}

export function isPausedNow(habit: Pick<Habit, 'pauses'>): boolean {
  return (habit.pauses ?? []).some((p) => p.to === null);
}

export function unitLabel(habit: Pick<Habit, 'kind' | 'unit'>): string {
  return kindOf(habit) === 'duration'
    ? tr('phút', 'min')
    : habit.unit?.trim() || tr('lần', 'times');
}

export function describeTarget(habit: Pick<Habit, 'kind' | 'unit' | 'target'>): string | null {
  if (!isMeasured(habit) || !habit.target) return null;
  return `${habit.target} ${unitLabel(habit)}`;
}

export function isAuto(habit: Pick<Habit, 'source'>): boolean {
  return Boolean(habit.source);
}

export function describeSource(source: AutoSource): string {
  return source.kind === 'language.daily_goal'
    ? tr(
        'Tự động: đạt mục tiêu ngày ở Olaa Language',
        'Automatic: daily goal reached in Olaa Language',
      )
    : tr(
        `Tự động: xong ${source.count} bài mới ở Olaa Language`,
        `Automatic: ${source.count} new lesson${source.count === 1 ? '' : 's'} done in Olaa Language`,
      );
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
  if (!name) return tr('Nhập tên thói quen.', 'Enter a habit name.');
  if (name.length > MAX_NAME_LENGTH)
    return tr(
      `Tên tối đa ${MAX_NAME_LENGTH} ký tự.`,
      `Use at most ${MAX_NAME_LENGTH} characters for the name.`,
    );
  if ((draft.description ?? '').length > MAX_DESCRIPTION_LENGTH) {
    return tr(
      `Mô tả tối đa ${MAX_DESCRIPTION_LENGTH} ký tự.`,
      `Use at most ${MAX_DESCRIPTION_LENGTH} characters for the description.`,
    );
  }
  if (draft.kind && draft.kind !== 'binary') {
    if (draft.source)
      return tr(
        'Thói quen tự động chỉ dùng loại đánh dấu xong.',
        'Automatic habits can only be done / not done.',
      );
    const t = draft.target;
    if (t === undefined || !Number.isFinite(t) || t <= 0 || t > MAX_TARGET) {
      return tr('Nhập mục tiêu lớn hơn 0.', 'Enter a target above 0.');
    }
    if ((draft.unit ?? '').length > MAX_UNIT_LENGTH)
      return tr(
        `Đơn vị tối đa ${MAX_UNIT_LENGTH} ký tự.`,
        `Use at most ${MAX_UNIT_LENGTH} characters for the unit.`,
      );
  }
  return null;
}
