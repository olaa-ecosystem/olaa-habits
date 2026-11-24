/** Synthetic test data only. */
import type { Habit } from '../../src/features/habit-management/types';
import { checkInKey } from '../../src/features/habit-management/types';
import { emptyState, type HabitState } from '../../src/stores/habitState';

export function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Read',
    icon: 'book',
    color: 'blue',
    schedule: { kind: 'daily' },
    target: 1,
    unit: '',
    timeOfDay: 'any',
    source: { kind: 'manual' },
    reminder: null,
    noteLink: null,
    startDate: '2026-11-01',
    createdAt: 0,
    updatedAt: 0,
    archivedAt: null,
    order: 0,
    ...over,
  };
}

export function stateWith(
  habits: Habit[],
  done: Record<string, string[]> = {},
  values: Record<string, number> = {},
): HabitState {
  const s = emptyState();
  for (const h of habits) s.habits[h.id] = h;
  for (const [id, days] of Object.entries(done)) {
    for (const d of days) {
      s.checkIns[checkInKey(id, d)] = {
        habitId: id,
        date: d,
        value: values[`${id}|${d}`] ?? s.habits[id]!.target,
        note: '',
        updatedAt: 0,
      };
    }
  }
  return s;
}

export function freeze(s: HabitState, ...days: string[]): HabitState {
  for (const d of days) s.freezes[d] = { createdAt: 0 };
  return s;
}
