/**
 * Olaa ID sign-in, sync and Language events (Habits PRD REQ-02-030/031, REQ-02-010/011).
 * Ported from Olaa Language so both apps behave the same.
 *
 * Habits live on the device first (localStorage). When signed in, every local change is also
 * written to Firestore at habits/{uid} (debounced) and changes from other devices are applied
 * here; the most recent copy wins. While signed in, the user's Language events are read from
 * `events/` and check off Language habits.
 */
import type { User } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { useSyncExternalStore } from 'react';
import { tr } from '../i18n/locale';
import { applyEvents, parseLanguageEvent } from '../integrations/languageEvents';
import { habitStore } from '../stores/habitStore';
import type { HabitState, ReceivedEvent } from '../stores/habitState';
import { firebaseEnabled, loadedFirebase, loadFirebase, type FirebaseServices } from './firebase';
import { fromRemoteDoc, initialSyncAction, toRemoteDoc } from './syncPolicy';

const META_KEY = 'olaa-habits/sync-meta';
const PUSH_DELAY_MS = 1500;

export type SyncStatus = 'off' | 'connecting' | 'signed-out' | 'syncing' | 'synced' | 'error';

export interface AccountState {
  status: SyncStatus;
  email: string | null;
  error: string | null;
  /** Language events are being received (REQ-02-010). */
  eventsLive: boolean;
}

let account: AccountState = {
  status: firebaseEnabled ? 'connecting' : 'off',
  email: null,
  error: null,
  eventsLive: false,
};
const accountListeners = new Set<() => void>();

function setAccount(patch: Partial<AccountState>): void {
  account = { ...account, ...patch };
  accountListeners.forEach((l) => l());
}

let localUpdatedAt = readMeta();
let currentUid: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let stopSnapshot: Unsubscribe | null = null;
let stopEvents: Unsubscribe | null = null;
let started = false;

function readMeta(): number {
  try {
    const value = Number(window.localStorage.getItem(META_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeMeta(value: number): void {
  localUpdatedAt = value;
  try {
    window.localStorage.setItem(META_KEY, String(value));
  } catch {
    // Kept in memory only; sync still works this session.
  }
}

function userDoc(fb: FirebaseServices, uid: string) {
  return fb.firestoreSdk.doc(fb.db, 'habits', uid);
}

async function push(): Promise<void> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  const uid = currentUid;
  const fb = loadedFirebase();
  if (!uid || !fb) return;
  setAccount({ status: 'syncing' });
  try {
    await fb.firestoreSdk.setDoc(
      userDoc(fb, uid),
      toRemoteDoc(habitStore.getState(), localUpdatedAt),
    );
    if (currentUid === uid) setAccount({ status: 'synced', error: null });
  } catch {
    if (currentUid === uid) {
      setAccount({
        status: 'error',
        error: tr(
          'Chưa lưu được lên tài khoản. Dữ liệu vẫn an toàn trên máy này.',
          'Could not save to your account. Your habits are safe on this device.',
        ),
      });
    }
  }
}

function schedulePush(): void {
  if (!currentUid) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void push(), PUSH_DELAY_MS);
}

async function flush(): Promise<void> {
  if (pushTimer) await push();
}

function applyRemote(state: HabitState, updatedAt: number): void {
  // Events are facts from Language, not edits: keep the ones this device already received.
  const events = { ...state.events, ...habitStore.getState().events };
  habitStore.replace({ ...state, events });
  writeMeta(updatedAt);
}

/** Listen to this user's Language events; late and repeated events are handled by id. */
function listenToEvents(fb: FirebaseServices, uid: string): void {
  const { collection, onSnapshot, query, where } = fb.firestoreSdk;
  stopEvents?.();
  stopEvents = onSnapshot(
    query(collection(fb.db, 'events'), where('userId', '==', uid)),
    (snap) => {
      const incoming: { id: string; event: ReceivedEvent }[] = [];
      snap.forEach((doc) => {
        const event = parseLanguageEvent(doc.data(), uid);
        if (event) incoming.push({ id: doc.id, event });
      });
      habitStore.updateFromRemote((s) => applyEvents(s, incoming));
      setAccount({ eventsLive: true });
    },
    () => setAccount({ eventsLive: false }),
  );
}

async function handleSignedIn(fb: FirebaseServices, user: User): Promise<void> {
  const { getDoc, onSnapshot } = fb.firestoreSdk;
  currentUid = user.uid;
  setAccount({ status: 'syncing', email: user.email, error: null });
  try {
    const snap = await getDoc(userDoc(fb, user.uid));
    const remote = snap.exists() ? fromRemoteDoc(snap.data()) : null;
    if (snap.exists() && !remote) {
      setAccount({
        status: 'error',
        error: tr(
          'Tài khoản được lưu bởi phiên bản mới hơn. Tải lại trang để cập nhật.',
          'Your account was saved by a newer version of the app. Reload the page to update.',
        ),
      });
      return;
    }
    const action = initialSyncAction(habitStore.getState(), localUpdatedAt, remote);
    if (action === 'pull' && remote) applyRemote(remote.state, remote.updatedAt);
    if (action === 'push') await push();
    if (currentUid !== user.uid) return;

    stopSnapshot?.();
    stopSnapshot = onSnapshot(
      userDoc(fb, user.uid),
      (s) => {
        if (s.metadata.hasPendingWrites || !s.exists()) return;
        const latest = fromRemoteDoc(s.data());
        if (latest && latest.updatedAt > localUpdatedAt)
          applyRemote(latest.state, latest.updatedAt);
      },
      () =>
        setAccount({
          status: 'error',
          error: tr('Mất kết nối với tài khoản.', 'Lost the connection to your account.'),
        }),
    );
    listenToEvents(fb, user.uid);
    setAccount({ status: 'synced' });
  } catch {
    if (currentUid === user.uid) {
      setAccount({
        status: 'error',
        error: tr(
          'Không kết nối được tài khoản. Dữ liệu vẫn an toàn trên máy này.',
          'Could not reach your account. Your habits are safe on this device.',
        ),
      });
    }
  }
}

function handleSignedOut(): void {
  currentUid = null;
  stopSnapshot?.();
  stopSnapshot = null;
  stopEvents?.();
  stopEvents = null;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  setAccount({ status: 'signed-out', email: null, error: null, eventsLive: false });
}

/** Call once at startup. Does nothing when Firebase is not configured. */
export function startCloudSync(): void {
  if (started || !firebaseEnabled) return;
  started = true;

  habitStore.onChange((_prev, _next, local) => {
    if (!local) return;
    writeMeta(Date.now());
    schedulePush();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  loadFirebase().then(
    (fb) => {
      if (!fb) return;
      fb.authSdk.onAuthStateChanged(fb.auth, (user) => {
        if (user) void handleSignedIn(fb, user);
        else handleSignedOut();
      });
    },
    () =>
      setAccount({
        status: 'error',
        error: tr(
          'Không tải được phần đăng nhập. Kiểm tra mạng rồi tải lại trang.',
          'Could not load sign-in. Check your connection and reload the page.',
        ),
      }),
  );
}

function authErrorMessage(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code;
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return tr('Email hoặc mật khẩu không đúng.', 'Email or password is incorrect.');
    case 'auth/email-already-in-use':
      return tr(
        'Email này đã có tài khoản. Hãy đăng nhập.',
        'An account with this email already exists. Sign in instead.',
      );
    case 'auth/weak-password':
      return tr('Mật khẩu cần ít nhất 6 ký tự.', 'Use at least 6 characters for the password.');
    case 'auth/invalid-email':
      return tr('Email chưa đúng định dạng.', 'That email address does not look right.');
    case 'auth/popup-blocked':
      return tr(
        'Trình duyệt chặn cửa sổ đăng nhập. Cho phép cửa sổ bật lên rồi thử lại.',
        'Your browser blocked the sign-in window. Allow pop-ups and try again.',
      );
    case 'auth/network-request-failed':
      return tr(
        'Không có mạng. Kiểm tra kết nối rồi thử lại.',
        'No connection. Check your internet and try again.',
      );
    case 'auth/unauthorized-domain':
      return tr(
        'Địa chỉ web này chưa được phép đăng nhập.',
        'Sign-in is not allowed on this web address yet.',
      );
    default:
      return tr('Đăng nhập không thành công. Thử lại nhé.', 'Sign-in failed. Please try again.');
  }
}

function run(action: (fb: FirebaseServices) => Promise<unknown>): Promise<string | null> {
  const attempt = (fb: FirebaseServices | null) =>
    fb
      ? action(fb).then(
          () => null,
          (error: unknown) => authErrorMessage(error),
        )
      : Promise.resolve(tr('Chưa có đăng nhập.', 'Sign-in is not available.'));
  const ready = loadedFirebase();
  if (ready) return attempt(ready);
  return loadFirebase().then(attempt, () =>
    tr('Không tải được phần đăng nhập.', 'Could not load sign-in. Check your connection.'),
  );
}

export function signInWithGoogle(): Promise<string | null> {
  return run((fb) => fb.authSdk.signInWithPopup(fb.auth, new fb.authSdk.GoogleAuthProvider()));
}

export function signInWithEmail(email: string, password: string): Promise<string | null> {
  return run((fb) => fb.authSdk.signInWithEmailAndPassword(fb.auth, email.trim(), password));
}

export function createAccountWithEmail(email: string, password: string): Promise<string | null> {
  return run((fb) => fb.authSdk.createUserWithEmailAndPassword(fb.auth, email.trim(), password));
}

/** Save pending changes, sign out, and clear this device (the account keeps the habits). */
export async function signOutAndClear(): Promise<void> {
  const fb = loadedFirebase();
  if (!fb) return;
  await flush();
  await fb.authSdk.signOut(fb.auth);
  handleSignedOut();
  habitStore.reset();
  writeMeta(0);
}

function subscribeAccount(listener: () => void): () => void {
  accountListeners.add(listener);
  return () => accountListeners.delete(listener);
}

export function useAccount(): AccountState {
  return useSyncExternalStore(
    subscribeAccount,
    () => account,
    () => account,
  );
}
