/**
 * Automatic check-ins from Olaa Language (REQ-02-010/011/015). While signed in, listen to this
 * user's events in Firestore `events/` and recompute automatic habits whenever events or habits
 * change. Contract: olaa-platform contracts/events/language-events.md.
 */
import type { Unsubscribe } from 'firebase/firestore';
import {
  applyAutoCheckins,
  parseEvent,
  type LanguageEvent,
} from '../features/habit-tracking/autoCheckins';
import { appStore } from '../stores/appStore';
import { toDayKey } from '../utils/date';
import { onUserChange } from './cloudSync';
import { firebaseEnabled, loadedFirebase } from './firebase';

let events: LanguageEvent[] = [];
let stopListening: Unsubscribe | null = null;
let applying = false;

function recompute(): void {
  if (applying) return;
  applying = true;
  try {
    appStore.update((s) => applyAutoCheckins(s, events, toDayKey(new Date())));
  } finally {
    applying = false;
  }
}

export function startLanguageEvents(): void {
  if (!firebaseEnabled) return;
  appStore.subscribe(() => {
    if (events.length > 0) recompute();
  });
  onUserChange((uid) => {
    stopListening?.();
    stopListening = null;
    events = [];
    const fb = loadedFirebase();
    if (!uid || !fb) return;
    const { collection, onSnapshot, query, where } = fb.firestoreSdk;
    stopListening = onSnapshot(
      query(collection(fb.db, 'events'), where('userId', '==', uid)),
      (snap) => {
        events = snap.docs
          .map((d) => parseEvent(d.data()))
          .filter((e): e is LanguageEvent => e !== null);
        recompute();
      },
      () => {
        // Rules not published yet or offline: automatic habits simply stay as they are.
      },
    );
  });
}
