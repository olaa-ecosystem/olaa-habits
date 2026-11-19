import type { AppState } from '../../stores/appState';
import type { DayKey } from '../../utils/date';

/** Events read from Firestore `events/` (contracts/events/language-events.md). */
export interface LanguageEvent {
  type: 'language.daily_goal.completed' | 'language.lesson.completed';
  date: DayKey;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Keep only well-formed events; anything else is ignored rather than trusted. */
export function parseEvent(data: unknown): LanguageEvent | null {
  if (typeof data !== 'object' || data === null) return null;
  const { type, date } = data as { type?: unknown; date?: unknown };
  if (type !== 'language.daily_goal.completed' && type !== 'language.lesson.completed') return null;
  if (typeof date !== 'string' || !DAY.test(date)) return null;
  return { type, date };
}

/**
 * Recompute check-ins of automatic habits from Language events (REQ-02-010/011/015).
 * Days are taken from each event's `date`, so late events land on the right day; event ids
 * are unique, so a repeat delivery cannot count twice. Returns `state` itself when nothing
 * changes, which keeps the store from looping.
 */
export function applyAutoCheckins(
  state: AppState,
  events: LanguageEvent[],
  today: DayKey,
): AppState {
  const goalDays = new Set<DayKey>();
  const lessonsByDay = new Map<DayKey, number>();
  for (const e of events) {
    if (e.type === 'language.daily_goal.completed') goalDays.add(e.date);
    else lessonsByDay.set(e.date, (lessonsByDay.get(e.date) ?? 0) + 1);
  }

  let checkins = state.checkins;
  for (const habit of Object.values(state.habits)) {
    const source = habit.source;
    if (!source) continue;
    const last = habit.archivedOn ?? today;
    const days: Record<DayKey, true> = {};
    const candidates =
      source.kind === 'language.daily_goal'
        ? [...goalDays]
        : [...lessonsByDay].filter(([, n]) => n >= source.count).map(([d]) => d);
    for (const d of candidates) if (d >= habit.createdOn && d <= last) days[d] = true;

    const current = state.checkins[habit.id] ?? {};
    const same =
      Object.keys(current).length === Object.keys(days).length &&
      Object.keys(days).every((d) => current[d]);
    if (!same) checkins = { ...checkins, [habit.id]: days };
  }
  return checkins === state.checkins ? state : { ...state, checkins };
}
