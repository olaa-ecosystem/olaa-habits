/**
 * Check-ins (PRD v1.0 §7.1–7.2): done or skipped, an optional value for measured habits, an
 * optional note, where it came from, and the previous versions when it was edited.
 */
import type { DayKey } from '../../utils/date';
import { isMeasured, planOn, type Habit } from '../habit-management/types';

/** `open`: only a note so far, nothing done yet. */
export type CheckInStatus = 'done' | 'skipped' | 'open';

export interface CheckInVersion {
  at: number;
  status: CheckInStatus | 'cleared';
  value?: number;
}

export interface CheckIn {
  status: CheckInStatus;
  /** Measured habits: amount logged that day. */
  value?: number;
  note?: string;
  source?: 'manual' | 'language';
  updatedAt: number;
  /** Earlier versions, oldest first, at most MAX_HISTORY. */
  history?: CheckInVersion[];
}

export const MAX_HISTORY = 10;
export const MAX_NOTE_LENGTH = 280;

/** What a day amounts to for one habit. */
export type Outcome = 'done' | 'partial' | 'skipped' | 'none';

export function outcomeOf(habit: Habit, day: DayKey, entry: CheckIn | undefined): Outcome {
  if (!entry) return 'none';
  if (entry.status === 'skipped') return 'skipped';
  if (entry.status === 'open') return 'none';
  if (!isMeasured(habit)) return 'done';
  const target = planOn(habit, day).target ?? habit.target ?? 0;
  const value = entry.value ?? 0;
  if (target > 0 && value >= target) return 'done';
  return value > 0 ? 'partial' : 'none';
}

/** Replace a check-in (or clear it with null), keeping the old version in its history. */
export function editCheckIn(
  previous: CheckIn | undefined,
  next: Omit<CheckIn, 'updatedAt' | 'history'> | null,
  now: number,
): CheckIn | undefined {
  const history = previous
    ? [
        ...(previous.history ?? []),
        { at: previous.updatedAt, status: previous.status, value: previous.value },
      ].slice(-MAX_HISTORY)
    : undefined;
  if (next === null) return undefined;
  const note = next.note?.trim().slice(0, MAX_NOTE_LENGTH) || undefined;
  return {
    status: next.status,
    ...(next.value !== undefined ? { value: Math.max(0, Math.round(next.value * 100) / 100) } : {}),
    ...(note ? { note } : {}),
    source: next.source ?? 'manual',
    updatedAt: now,
    ...(history && history.length > 0 ? { history } : {}),
  };
}
