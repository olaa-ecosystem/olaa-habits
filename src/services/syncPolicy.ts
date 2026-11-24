/**
 * Pure rules for syncing between this device and the account (no Firebase imports, so they are
 * unit-tested on their own). Same document shape as Olaa Language; the Firestore rules for
 * `habits/{uid}` in olaa-platform accept exactly these fields.
 */
import { parseState, STATE_VERSION, type HabitState } from '../stores/habitState';

export interface RemoteSnapshot {
  state: HabitState;
  updatedAt: number;
}

export type InitialSyncAction = 'pull' | 'push' | 'none';

/** Has this device got anything worth keeping? */
export function hasLocalData(state: HabitState): boolean {
  return Object.keys(state.habits).length > 0;
}

/**
 * Right after sign-in: no account copy → upload ours if any; empty device → download;
 * both exist → the most recently changed copy wins.
 */
export function initialSyncAction(
  local: HabitState,
  localUpdatedAt: number,
  remote: RemoteSnapshot | null,
): InitialSyncAction {
  if (!remote) return hasLocalData(local) ? 'push' : 'none';
  if (!hasLocalData(local)) return 'pull';
  if (remote.updatedAt > localUpdatedAt) return 'pull';
  if (remote.updatedAt < localUpdatedAt) return 'push';
  return 'none';
}

/** Firestore document at habits/{uid}. */
export interface RemoteDoc {
  stateJson: string;
  updatedAt: number;
  schemaVersion: number;
}

export function toRemoteDoc(state: HabitState, updatedAt: number): RemoteDoc {
  return { stateJson: JSON.stringify(state), updatedAt, schemaVersion: STATE_VERSION };
}

/** Parse the account copy; anything unexpected is ignored rather than applied. */
export function fromRemoteDoc(data: unknown): RemoteSnapshot | null {
  if (typeof data !== 'object' || data === null) return null;
  const { stateJson, updatedAt, schemaVersion } = data as Partial<RemoteDoc>;
  if (schemaVersion !== STATE_VERSION) return null;
  if (typeof stateJson !== 'string' || typeof updatedAt !== 'number') return null;
  try {
    const state = parseState(JSON.parse(stateJson));
    return state ? { state, updatedAt } : null;
  } catch {
    return null;
  }
}
