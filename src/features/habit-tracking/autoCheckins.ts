import type { AppState } from '../../stores/appState';
import type { CheckIn } from './checkins';
import type { DayKey } from '../../utils/date';

/** Events read from Firestore `events/` (contracts/events/language-events.md). */
export interface LanguageEvent {
  type: 'language.daily_goal.completed' | 'language.lesson.completed';
  date: DayKey;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Keep only well-formed events; anything else is ignored rather than trusted. */
/** Newest event envelope this app understands (contracts/events/language-events.md). */
export const SUPPORTED_EVENT_VERSION = 1;

export function parseEvent(data: unknown): LanguageEvent | null {
  if (typeof data !== 'object' || data === null) return null;
  const { type, date, version } = data as { type?: unknown; date?: unknown; version?: unknown };
  // Events from before envelope v1 have no version and are read as v1. Newer versions may
  // change meaning, so they are skipped until this app is updated.
  if (version !== undefined && (typeof version !== 'number' || version > SUPPORTED_EVENT_VERSION))
    return null;
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
    const candidates =
      source.kind === 'language.daily_goal'
        ? [...goalDays]
        : [...lessonsByDay].filter(([, n]) => n >= source.count).map(([d]) => d);
    const wanted = new Set(candidates.filter((d) => d >= habit.createdOn && d <= last));

    // Automatic entries follow the events; anything the user wrote (a skip, a note) stays.
    const current = state.checkins[habit.id] ?? {};
    const next: Record<DayKey, CheckIn> = {};
    let changed = false;
    for (const [d, entry] of Object.entries(current)) {
      if (entry.source === 'language' && !wanted.has(d)) {
        changed = true;
        continue;
      }
      next[d] = entry;
    }
    for (const d of wanted) {
      const entry = next[d];
      if (entry?.source === 'language' && entry.status === 'done') continue;
      next[d] = {
        status: 'done',
        source: 'language',
        updatedAt: 0,
        ...(entry?.note ? { note: entry.note } : {}),
      };
      changed = true;
    }
    if (changed) checkins = { ...checkins, [habit.id]: next };
  }
  return checkins === state.checkins ? state : { ...state, checkins };
}
