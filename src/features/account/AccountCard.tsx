import { useState, type FormEvent } from 'react';
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutAndClear,
  useAccount,
  type SyncStatus,
} from '../../services/cloudSync';

const STATUS_TEXT: Partial<Record<SyncStatus, string>> = {
  connecting: 'Đang kiểm tra tài khoản…',
  syncing: 'Đang lưu lên tài khoản…',
  synced: 'Thói quen đã lưu vào tài khoản và đồng bộ giữa các thiết bị.',
};

/** Olaa ID sign-in and sync status (REQ-02-030/031). Renders nothing without Firebase config. */
export function AccountCard({ intro }: { intro?: string }) {
  const account = useAccount();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (account.status === 'off') return null;

  const act = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const message = await action();
    setBusy(false);
    setError(message);
  };

  if (account.email !== null) {
    return (
      <div className="card account-card">
        <p>
          Đã đăng nhập: <strong>{account.email}</strong>
        </p>
        <p className={`small ${account.status === 'error' ? 'form-error' : 'muted'}`}>
          {account.status === 'error' ? account.error : STATUS_TEXT[account.status]}
        </p>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={busy}
          onClick={() => void act(async () => (await signOutAndClear(), null))}
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void act(() =>
      mode === 'signin'
        ? signInWithEmail(email, password)
        : createAccountWithEmail(email, password),
    );
  };

  return (
    <div className="card account-card">
      <p className="muted small">
        {intro ?? 'Đăng nhập bằng Olaa ID để giữ thói quen và dùng trên mọi thiết bị.'}
      </p>
      <button
        type="button"
        className="btn btn--block"
        disabled={busy || account.status === 'connecting'}
        onClick={() => void act(signInWithGoogle)}
      >
        Tiếp tục với Google
      </button>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--ghost btn--block" disabled={busy}>
          {mode === 'signin' ? 'Đăng nhập bằng email' : 'Tạo tài khoản'}
        </button>
      </form>
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setMode(mode === 'signin' ? 'create' : 'signin');
          setError(null);
        }}
      >
        {mode === 'signin' ? 'Chưa có tài khoản? Tạo tài khoản' : 'Đã có tài khoản? Đăng nhập'}
      </button>
      {error && (
        <p className="small form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
