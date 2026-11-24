/** Me (module 02.12): Olaa ID, appearance, tracking, reminders, Olaa apps and data. */
import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { AppTile, Dialog, toast } from '../components/ui';
import {
  notificationPermission,
  requestNotificationPermission,
} from '../features/reminders/reminderService';
import { setLocale, tr, useLocale } from '../i18n/locale';
import { LANGUAGE_URL, TAKENOTE_URL } from '../integrations/olaaApps';
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutAndClear,
  useAccount,
} from '../services/cloudSync';
import { updateSettings } from '../stores/habitActions';
import { habitStore, useHabitState } from '../stores/habitStore';
import { parseState, type HabitState, type ThemeChoice } from '../stores/habitState';
import { today } from '../utils/date';

function Account() {
  const account = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    setError(await action());
    setBusy(false);
  };

  if (account.status === 'off')
    return (
      <p className="muted small">
        {tr(
          'Bản này chạy trên máy, chưa bật đăng nhập. Thói quen được lưu trên trình duyệt này.',
          'This build runs on-device only. Habits are saved in this browser.',
        )}
      </p>
    );
  if (account.status === 'connecting')
    return <p className="muted small">{tr('Đang kết nối…', 'Connecting…')}</p>;
  if (account.email)
    return (
      <div className="stack">
        <p>
          {tr('Đăng nhập với', 'Signed in as')} <b>{account.email}</b>
        </p>
        <p className={account.status === 'error' ? 'err' : 'ok'} role="status">
          {account.status === 'syncing'
            ? tr('Đang đồng bộ…', 'Syncing…')
            : account.status === 'synced'
              ? tr('Đã đồng bộ', 'Synced') +
                (account.eventsLive
                  ? tr(
                      ' · đang nhận kết quả từ Olaa Language',
                      ' · receiving results from Olaa Language',
                    )
                  : '')
              : account.error}
        </p>
        <div className="row">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => void signOutAndClear()}
          >
            <Icon name="logout" /> {tr('Đăng xuất', 'Sign out')}
          </button>
        </div>
        <p className="small muted">
          {tr(
            'Đăng xuất sẽ xoá dữ liệu trên máy này; tài khoản vẫn giữ bản đầy đủ.',
            'Signing out clears this device; your account keeps everything.',
          )}
        </p>
      </div>
    );
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => signInWithEmail(email, password));
      }}
    >
      <p className="muted small">
        {tr(
          'Một tài khoản cho Olaa Language, Note và Habits: đồng bộ giữa các thiết bị và tự đánh dấu thói quen học.',
          'One account for Olaa Language, Note and Habits: sync across devices and automatic study habits.',
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
      <label className="field-label">
        Email
        <input
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="field-label">
        {tr('Mật khẩu', 'Password')}
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <div className="row">
        <button
          type="submit"
          className="btn btn--sm btn--ghost"
          disabled={busy || !email || !password}
        >
          {tr('Đăng nhập', 'Sign in')}
        </button>
        <button
          type="button"
          className="btn btn--sm btn--text"
          disabled={busy || !email || !password}
          onClick={() => void run(() => createAccountWithEmail(email, password))}
        >
          {tr('Tạo tài khoản', 'Create account')}
        </button>
      </div>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function MePage() {
  const state = useHabitState();
  const locale = useLocale();
  const s = state.settings;
  const [permission, setPermission] = useState(notificationPermission());
  const [pending, setPending] = useState<HabitState | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const set = (patch: Parameters<typeof updateSettings>[1]) =>
    habitStore.update((st) => updateSettings(st, patch));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olaa-habits-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const parsed = parseState(JSON.parse(await f.text()));
      if (!parsed) throw new Error('bad');
      setPending(parsed);
    } catch {
      toast(
        tr('Tệp không phải bản sao lưu Olaa Habits.', 'That file is not an Olaa Habits backup.'),
      );
    }
  };

  const chips = <T extends string | number>(
    label: string,
    value: T,
    options: [T, string][],
    onChange: (v: T) => void,
  ) => (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={String(v)}
          type="button"
          className="chip"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
        >
          {text}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{tr('Hồ sơ', 'Me')}</h1>
          <p>{tr('Tài khoản, giao diện và cách theo dõi.', 'Account, look and tracking.')}</p>
        </div>
      </div>
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card">
            <h2>
              <Icon name="profile" /> Olaa ID
            </h2>
            <Account />
          </section>
          <section className="card stack">
            <h2>
              <Icon name="settings" /> {tr('Giao diện', 'Appearance')}
            </h2>
            <p className="eyebrow">{tr('Ngôn ngữ', 'Language')}</p>
            {chips(
              tr('Ngôn ngữ', 'Language'),
              locale,
              [
                ['vi', 'Tiếng Việt'],
                ['en', 'English'],
              ],
              setLocale,
            )}
            <p className="eyebrow">{tr('Chế độ màu', 'Colour mode')}</p>
            {chips<ThemeChoice>(
              tr('Chế độ màu', 'Colour mode'),
              s.theme,
              [
                ['system', tr('Theo thiết bị', 'Device')],
                ['light', tr('Sáng', 'Light')],
                ['dark', tr('Tối', 'Dark')],
              ],
              (theme) => set({ theme }),
            )}
          </section>
          <section className="card stack">
            <h2>
              <Icon name="habits" /> {tr('Theo dõi', 'Tracking')}
            </h2>
            <p className="eyebrow">{tr('Tuần bắt đầu vào', 'Week starts on')}</p>
            {chips<0 | 1>(
              tr('Tuần bắt đầu vào', 'Week starts on'),
              s.weekStart,
              [
                [1, tr('Thứ Hai', 'Monday')],
                [0, tr('Chủ nhật', 'Sunday')],
              ],
              (weekStart) => set({ weekStart }),
            )}
            <p className="eyebrow">{tr('Lượt đóng băng mỗi tháng', 'Freezes per month')}</p>
            {chips<number>(
              tr('Lượt đóng băng mỗi tháng', 'Freezes per month'),
              s.freezesPerMonth,
              [0, 1, 2, 3, 4].map((n) => [n, String(n)] as [number, string]),
              (freezesPerMonth) => set({ freezesPerMonth }),
            )}
            <p className="small muted">
              {tr(
                `Ngày tính theo giờ của thiết bị (${tz}).`,
                `Days follow this device's time zone (${tz}).`,
              )}
            </p>
          </section>
        </div>

        <div className="stack">
          <section className="card stack">
            <h2>
              <Icon name="notifications" /> {tr('Nhắc nhở', 'Reminders')}
            </h2>
            <label className="switch">
              <input
                type="checkbox"
                checked={s.remindersOn}
                onChange={(e) => set({ remindersOn: e.target.checked })}
              />
              {tr('Bật nhắc nhở', 'Turn reminders on')}
            </label>
            {s.remindersOn && permission !== 'granted' && permission !== 'unsupported' && (
              <div className="row">
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={async () => setPermission(await requestNotificationPermission())}
                >
                  {tr('Cho phép thông báo', 'Allow notifications')}
                </button>
              </div>
            )}
            {permission === 'denied' && (
              <p className="err">
                {tr(
                  'Trình duyệt đang chặn thông báo. Cho phép trong cài đặt trang web.',
                  'The browser blocks notifications. Allow them in the site settings.',
                )}
              </p>
            )}
            <p className="small muted">
              {tr(
                'Nhắc khi app đang mở hoặc đã thêm vào màn hình chính. iPhone, iPad: Chia sẻ → Thêm vào MH chính (iOS 16.4+).',
                'Reminders show while the app is open or added to the home screen. iPhone and iPad: Share → Add to Home Screen (iOS 16.4+).',
              )}
            </p>
          </section>
          <section className="card appcard">
            <AppTile app="lang" size="lg" />
            <b>Olaa Language</b>
            <p>
              {tr(
                'Thói quen học tự đánh dấu từ kết quả học thật.',
                'Study habits tick themselves from real study results.',
              )}
            </p>
            <div className="row">
              <a
                className="btn btn--sm btn--ghost"
                href={LANGUAGE_URL}
                target="_blank"
                rel="noopener"
              >
                {tr('Mở Language', 'Open Language')}
              </a>
            </div>
          </section>
          <section className="card appcard">
            <AppTile app="note" size="lg" />
            <b>Olaa Note</b>
            <p>
              {tr(
                'Sổ tay gắn với thói quen và nhật ký thói quen.',
                'Notebooks linked to habits, and habit journals.',
              )}
            </p>
            <div className="row">
              <a
                className="btn btn--sm btn--ghost"
                href={TAKENOTE_URL}
                target="_blank"
                rel="noopener"
              >
                {tr('Mở Note', 'Open Note')}
              </a>
            </div>
          </section>
          <section className="card stack">
            <h2>
              <Icon name="collections" /> {tr('Dữ liệu', 'Data')}
            </h2>
            <div className="row">
              <button type="button" className="btn btn--sm btn--ghost" onClick={exportData}>
                <Icon name="download" /> {tr('Tải bản sao lưu', 'Download backup')}
              </button>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => file.current?.click()}
              >
                <Icon name="upload" /> {tr('Nhập bản sao lưu', 'Import backup')}
              </button>
              <input
                ref={file}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  void importFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
            {habitStore.saveError() && (
              <p className="err">
                {tr(
                  'Trình duyệt không cho lưu dữ liệu (có thể đang ở chế độ ẩn danh).',
                  'This browser does not allow saving data (maybe a private window).',
                )}
              </p>
            )}
          </section>
        </div>
      </div>

      {pending && (
        <Dialog
          title={tr('Thay dữ liệu hiện tại?', 'Replace current data?')}
          onClose={() => setPending(null)}
          actions={
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPending(null)}
                data-autofocus
              >
                {tr('Huỷ', 'Cancel')}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  const next = pending;
                  habitStore.update(() => next);
                  setPending(null);
                  toast(tr('Đã nhập bản sao lưu.', 'Backup imported.'));
                }}
              >
                {tr('Thay bằng bản sao lưu', 'Replace with backup')}
              </button>
            </>
          }
        >
          <p className="muted">
            {tr(
              'Mọi thói quen và lịch sử trên máy này sẽ được thay bằng bản sao lưu. Không hoàn tác được.',
              'All habits and history on this device will be replaced by the backup. This cannot be undone.',
            )}
          </p>
        </Dialog>
      )}
    </>
  );
}
