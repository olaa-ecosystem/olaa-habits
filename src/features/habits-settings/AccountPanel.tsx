import { useState } from 'react';
import { tr } from '../../i18n/locale';
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutAndClear,
  useAccount,
} from '../../services/cloudSync';

/** Olaa ID sign-in (shared with Olaa Language and Olaa Note) and sync status. */
export function AccountPanel() {
  const account = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const message = await action();
    setBusy(false);
    setError(message);
  };

  if (account.status === 'off') {
    return (
      <p className="muted">
        {tr(
          'Bản này chạy trên máy, chưa bật đăng nhập. Thói quen được lưu trên trình duyệt này.',
          'This build runs on-device only, without sign-in. Habits are saved in this browser.',
        )}
      </p>
    );
  }
  if (account.status === 'connecting')
    return <p className="muted">{tr('Đang kết nối…', 'Connecting…')}</p>;

  if (account.email) {
    const statusText =
      account.status === 'syncing'
        ? tr('Đang đồng bộ…', 'Syncing…')
        : account.status === 'synced'
          ? tr('Đã đồng bộ', 'Synced')
          : (account.error ?? '');
    return (
      <div className="stack">
        <p>
          {tr('Đăng nhập với', 'Signed in as')} <strong>{account.email}</strong>
        </p>
        <p
          className={account.status === 'error' ? 'notice notice--error' : 'muted small'}
          role="status"
        >
          {statusText}
          {account.status === 'synced' &&
            (account.eventsLive
              ? tr(
                  ' · Đang nhận kết quả từ Olaa Language',
                  ' · Receiving results from Olaa Language',
                )
              : '')}
        </p>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => void signOutAndClear()}
        >
          {tr('Đăng xuất', 'Sign out')}
        </button>
        <p className="muted small">
          {tr(
            'Đăng xuất sẽ xoá dữ liệu trên máy này; tài khoản vẫn giữ bản đầy đủ.',
            'Signing out clears this device; your account keeps everything.',
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="muted">
        {tr(
          'Dùng chung tài khoản với Olaa Language và Olaa Note: đồng bộ giữa các thiết bị và tự đánh dấu thói quen học tập.',
          'One account with Olaa Language and Olaa Note: sync across devices and auto check-offs for learning habits.',
        )}
      </p>
      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={() => void run(signInWithGoogle)}
      >
        {tr('Đăng nhập với Google', 'Sign in with Google')}
      </button>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => signInWithEmail(email, password));
        }}
      >
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>{tr('Mật khẩu', 'Password')}</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn--ghost btn--small"
            disabled={busy || !email || !password}
          >
            {tr('Đăng nhập', 'Sign in')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={busy || !email || !password}
            onClick={() => void run(() => createAccountWithEmail(email, password))}
          >
            {tr('Tạo tài khoản', 'Create account')}
          </button>
        </div>
      </form>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
