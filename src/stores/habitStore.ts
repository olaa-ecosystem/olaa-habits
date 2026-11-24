/**
 * App store: the whole state in memory, saved to localStorage after every change. The device
 * copy comes first, so the app works offline and without an account; cloud sync (when signed
 * in) mirrors it. New badges are awarded here after each change.
 */
import { useSyncExternalStore } from 'react';
import { newBadges } from '../features/gamification/badges';
import type { EarnedBadge } from './habitState';
import { today as todayKey } from '../utils/date';
import { emptyState, parseState, type HabitState } from './habitState';

const KEY = 'olaa-habits/state';

let state: HabitState = emptyState();
let ready = false;
let saveError = false;
const listeners = new Set<() => void>();
const changeListeners = new Set<(prev: HabitState, next: HabitState, local: boolean) => void>();
const badgeListeners = new Set<(badges: EarnedBadge[]) => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function save(): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    saveError = false;
  } catch {
    saveError = true;
  }
}

function withBadges(next: HabitState): { next: HabitState; earned: EarnedBadge[] } {
  const earned = newBadges(next, todayKey(), Date.now());
  if (earned.length === 0) return { next, earned };
  const badges = { ...next.badges };
  for (const b of earned) badges[b.id] = b;
  return { next: { ...next, badges }, earned };
}

function commit(next: HabitState, local: boolean): void {
  const prev = state;
  const { next: awarded, earned } = withBadges(next);
  state = awarded;
  save();
  changeListeners.forEach((l) => l(prev, state, local));
  emit();
  if (earned.length > 0) badgeListeners.forEach((l) => l(earned));
}

export const habitStore = {
  getState: (): HabitState => state,
  isReady: () => ready,
  saveError: () => saveError,

  update(updater: (current: HabitState) => HabitState): void {
    const next = updater(state);
    if (next === state) return;
    commit(next, true);
  },

  /** Replace the whole state with a copy from the account (not a local change). */
  replace(next: HabitState): void {
    commit(next, false);
  },

  /** Apply a change that came from outside this device, e.g. Language events. */
  updateFromRemote(updater: (current: HabitState) => HabitState): void {
    const next = updater(state);
    if (next === state) return;
    commit(next, false);
  },

  load(): void {
    try {
      const raw = window.localStorage.getItem(KEY);
      state = (raw && parseState(JSON.parse(raw))) || emptyState();
    } catch {
      state = emptyState();
      saveError = true;
    }
    ready = true;
    // Badges may be due for days that passed while the app was closed.
    const { next } = withBadges(state);
    state = next;
    emit();
  },

  /** Forget everything on this device (after sign-out; the account keeps its copy). */
  reset(): void {
    commit(emptyState(), false);
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Called after each change with the state before and after; `local` = made on this device. */
  onChange(listener: (prev: HabitState, next: HabitState, local: boolean) => void): () => void {
    changeListeners.add(listener);
    return () => changeListeners.delete(listener);
  },

  onBadges(listener: (badges: EarnedBadge[]) => void): () => void {
    badgeListeners.add(listener);
    return () => badgeListeners.delete(listener);
  },

  /** For tests. */
  resetForTests(next: HabitState = emptyState()): void {
    state = next;
    ready = true;
    saveError = false;
    emit();
  },
};

export function useHabitState(): HabitState {
  return useSyncExternalStore(habitStore.subscribe, habitStore.getState, habitStore.getState);
}
