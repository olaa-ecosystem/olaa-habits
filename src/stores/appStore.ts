import { useSyncExternalStore } from 'react';
import { clearSaved, loadJson, saveJson } from '../services/storage';
import { toDayKey } from '../utils/date';
import { awardBadges, initialState, migrateState, type AppState } from './appState';

function isSaved(value: unknown): value is AppState {
  return migrateState(value) !== null;
}

function load(): AppState {
  // Older saved versions are migrated; defaults fill fields added later.
  return migrateState(loadJson(initialState, isSaved)) ?? initialState();
}

let state: AppState = load();
const listeners = new Set<() => void>();

function commit(next: AppState): void {
  state = next;
  saveJson(state);
  listeners.forEach((l) => l());
}

export const appStore = {
  getState: (): AppState => state,
  update(updater: (current: AppState) => AppState): void {
    const changed = updater(state);
    if (changed === state) return;
    commit(awardBadges(changed, toDayKey(new Date())));
  },
  /** Replace the whole state, e.g. with data downloaded from the account. */
  replace(next: AppState): void {
    commit(migrateState(next) ?? initialState());
  },
  reset(): void {
    clearSaved();
    state = initialState();
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAppState(): AppState {
  return useSyncExternalStore(appStore.subscribe, appStore.getState, appStore.getState);
}
