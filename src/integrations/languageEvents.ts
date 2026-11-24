/**
 * Consumer of the Olaa Language event contract (olaa-platform contracts/events/language-events.md,
 * PROPOSED). Rules from the contract: read only the user's own events, count by `date` not
 * `occurredAt`, never write, skip unknown versions, expect late events. Pure functions.
 */
import type { HabitState, ReceivedEvent } from '../stores/habitState';
import { isDayKey } from '../utils/date';

const KNOWN_TYPES = new Set<ReceivedEvent['type']>([
  'language.daily_goal.completed',
  'language.lesson.completed',
]);
export const SUPPORTED_ENVELOPE_VERSION = 1;

/** A Firestore `events/` document as received, or null when it should be ignored. */
export function parseLanguageEvent(data: unknown, uid: string): ReceivedEvent | null {
  if (typeof data !== 'object' || data === null) return null;
  const e = data as Record<string, unknown>;
  // Events written before envelope v1 have no version: treat them as v1.
  const version = e.version ?? 1;
  if (version !== SUPPORTED_ENVELOPE_VERSION) return null;
  if (e.userId !== uid || e.source !== 'language') return null;
  if (typeof e.type !== 'string' || !KNOWN_TYPES.has(e.type as ReceivedEvent['type'])) return null;
  if (!isDayKey(e.date)) return null;
  return { type: e.type as ReceivedEvent['type'], date: e.date };
}

/** Add events not seen before. The same event id is counted once (NFR-02-004). */
export function applyEvents(
  state: HabitState,
  incoming: { id: string; event: ReceivedEvent }[],
): HabitState {
  const fresh = incoming.filter(({ id }) => !state.events[id]);
  if (fresh.length === 0) return state;
  const events = { ...state.events };
  for (const { id, event } of fresh) events[id] = event;
  return { ...state, events };
}
