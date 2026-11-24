/**
 * Delivers reminders with the browser's Notification API while the app is open or installed to
 * the home screen. Push to a closed app needs the platform's notification service (branch 05),
 * which does not exist yet; this is the local part of REQ-02-022.
 */
import { tr } from '../../i18n/locale';
import { habitStore } from '../../stores/habitStore';
import { today } from '../../utils/date';
import { dueReminders } from './reminders';

const FIRED_KEY = 'olaa-habits/reminders-fired';
const CHECK_EVERY_MS = 30_000;

function readFired(): Set<string> {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(FIRED_KEY) ?? '[]');
    return new Set(
      Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [],
    );
  } catch {
    return new Set();
  }
}

function writeFired(fired: Set<string>): void {
  const day = today();
  // Keep only today's entries so the list never grows.
  const kept = [...fired].filter((k) => k.endsWith(`|${day}`));
  try {
    window.localStorage.setItem(FIRED_KEY, JSON.stringify(kept));
  } catch {
    // Without storage a reminder could repeat after a reload; acceptable.
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function check(): void {
  const state = habitStore.getState();
  if (!state.settings.remindersOn || notificationPermission() !== 'granted') return;
  const day = today();
  const now = new Date();
  const fired = readFired();
  const due = dueReminders(state, day, now.getHours() * 60 + now.getMinutes(), fired);
  for (const h of due) {
    fired.add(`${h.id}|${day}`);
    try {
      new Notification(h.name, {
        body: tr(
          'Đến giờ rồi. Một chạm để đánh dấu xong.',
          'Time for this one. One tap to check it off.',
        ),
        tag: `olaa-habits-${h.id}`,
        icon: './favicon.svg',
      });
    } catch {
      // Some browsers only allow notifications from a service worker; skip quietly.
    }
  }
  if (due.length > 0) writeFired(fired);
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startReminders(): void {
  if (timer || !notificationsSupported()) return;
  check();
  timer = setInterval(check, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
