/** A small message at the bottom of the screen, optionally with one action (e.g. Undo). */
import { useEffect, useSyncExternalStore } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'info' | 'reward';
  action?: { label: string; run: () => void };
}

let current: ToastMessage | null = null;
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function showToast(message: Omit<ToastMessage, 'id'>): void {
  seq += 1;
  current = { ...message, id: seq };
  emit();
}

export function dismissToast(): void {
  current = null;
  emit();
}

const TOAST_MS = 5000;

export function ToastHost() {
  const toast = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => current,
  );
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      if (current?.id === toast.id) dismissToast();
    }, TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toast && (
        <div className={`toast ${toast.tone === 'reward' ? 'toast--reward' : ''}`} key={toast.id}>
          <span>{toast.text}</span>
          {toast.action && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                toast.action?.run();
                dismissToast();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
