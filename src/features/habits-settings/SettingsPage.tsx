import { useRef, useState } from 'react';
import { routeHref } from '../../app/router';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ArchiveIcon, BellIcon, ExternalIcon } from '../../components/Icons';
import { showToast } from '../../components/Toast';
import { LocalePicker } from '../../i18n/LocalePicker';
import { tr } from '../../i18n/locale';
import { LANGUAGE_URL, TAKENOTE_URL } from '../../integrations/olaaApps';
import { updateSettings } from '../../stores/habitActions';
import { habitStore, useHabitState } from '../../stores/habitStore';
import { parseState, type ThemeChoice } from '../../stores/habitState';
import { today } from '../../utils/date';
import {
  notificationPermission,
  requestNotificationPermission,
} from '../reminders/reminderService';
import { AccountPanel } from './AccountPanel';

/** Tracking preferences, reminders, account and data (module 02.12). */
export function SettingsPage() {
  const state = useHabitState();
  const s = state.settings;
  const [permission, setPermission] = useState(notificationPermission());
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseState>>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const archived = Object.values(state.habits).filter((h) => h.archivedAt !== null).length;
  const set = (patch: Parameters<typeof updateSettings>[1]) =>
    habitStore.update((st) => updateSettings(st, patch));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olaa-habits-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseState(JSON.parse(await file.text()));
      if (!parsed) throw new Error('bad file');
      setPendingImport(parsed);
    } catch {
      showToast({
        text: tr(
          'Tệp không đúng định dạng của Olaa Habits.',
          'That file is not an Olaa Habits backup.',
        ),
      });
    }
  };

  return (
    <div className="page">
      <header className="page__head">
        <h1>{tr('Cài đặt', 'Settings')}</h1>
      </header>

      <section className="card stack">
        <h2 className="card-title">{tr('Tài khoản Olaa ID', 'Olaa ID account')}</h2>
        <AccountPanel />
      </section>

      <section className="card stack">
        <h2 className="card-title">{tr('Giao diện', 'Appearance')}</h2>
        <fieldset>
          <legend>{tr('Ngôn ngữ', 'Language')}</legend>
          <LocalePicker />
        </fieldset>
        <fieldset>
          <legend>{tr('Chế độ màu', 'Colour mode')}</legend>
          <div className="chip-row" role="radiogroup">
            {(
              [
                ['system', tr('Theo thiết bị', 'Device')],
                ['light', tr('Sáng', 'Light')],
                ['dark', tr('Tối', 'Dark')],
              ] as [ThemeChoice, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={s.theme === id}
                className={`chip ${s.theme === id ? 'is-selected' : ''}`}
                onClick={() => set({ theme: id })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card stack">
        <h2 className="card-title">{tr('Theo dõi', 'Tracking')}</h2>
        <fieldset>
          <legend>{tr('Tuần bắt đầu vào', 'Week starts on')}</legend>
          <div className="chip-row" role="radiogroup">
            {(
              [
                [1, tr('Thứ Hai', 'Monday')],
                [0, tr('Chủ nhật', 'Sunday')],
              ] as [0 | 1, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={s.weekStart === v}
                className={`chip ${s.weekStart === v ? 'is-selected' : ''}`}
                onClick={() => set({ weekStart: v })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{tr('Lượt đóng băng mỗi tháng', 'Freezes per month')}</legend>
          <div className="chip-row" role="radiogroup">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={s.freezesPerMonth === n}
                className={`chip ${s.freezesPerMonth === n ? 'is-selected' : ''}`}
                onClick={() => set({ freezesPerMonth: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="muted small">
          {tr(
            `Ngày được tính theo giờ của thiết bị (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`,
            `Days follow this device's time zone (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`,
          )}
        </p>
      </section>

      <section className="card stack">
        <h2 className="card-title">
          <BellIcon /> {tr('Nhắc nhở', 'Reminders')}
        </h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={s.remindersOn}
            onChange={(e) => set({ remindersOn: e.target.checked })}
          />
          <span>{tr('Bật nhắc nhở', 'Turn reminders on')}</span>
        </label>
        {s.remindersOn && permission !== 'granted' && permission !== 'unsupported' && (
          <button
            type="button"
            className="btn btn--small"
            onClick={async () => setPermission(await requestNotificationPermission())}
          >
            {tr('Cho phép thông báo', 'Allow notifications')}
          </button>
        )}
        {permission === 'denied' && (
          <p className="notice notice--error">
            {tr(
              'Trình duyệt đang chặn thông báo. Mở cài đặt trang web để cho phép.',
              'The browser blocks notifications. Allow them in the site settings.',
            )}
          </p>
        )}
        <p className="muted small">
          {tr(
            'Nhắc nhở hiện khi app đang mở hoặc đã thêm vào màn hình chính. Trên iPhone, iPad: Chia sẻ → Thêm vào MH chính (iOS 16.4 trở lên).',
            'Reminders show while the app is open or added to the home screen. On iPhone and iPad: Share → Add to Home Screen (iOS 16.4 or later).',
          )}
        </p>
      </section>

      <section className="card stack">
        <h2 className="card-title">{tr('Ứng dụng Olaa', 'Olaa apps')}</h2>
        <div className="form-actions">
          <a
            className="btn btn--ghost btn--small"
            href={LANGUAGE_URL}
            target="_blank"
            rel="noopener"
          >
            <ExternalIcon /> Olaa Language
          </a>
          <a
            className="btn btn--ghost btn--small"
            href={TAKENOTE_URL}
            target="_blank"
            rel="noopener"
          >
            <ExternalIcon /> Olaa Note
          </a>
        </div>
      </section>

      <section className="card stack">
        <h2 className="card-title">{tr('Dữ liệu', 'Data')}</h2>
        <div className="form-actions">
          <a className="btn btn--ghost btn--small" href={routeHref({ name: 'archive' })}>
            <ArchiveIcon /> {tr('Đã lưu trữ', 'Archived')} ({archived})
          </a>
          <button type="button" className="btn btn--ghost btn--small" onClick={exportData}>
            {tr('Xuất dữ liệu (JSON)', 'Export data (JSON)')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => fileInput.current?.click()}
          >
            {tr('Nhập từ bản sao lưu', 'Import a backup')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void onImportFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        {habitStore.saveError() && (
          <p className="notice notice--error" role="alert">
            {tr(
              'Trình duyệt không cho lưu dữ liệu (có thể đang ở chế độ ẩn danh).',
              'This browser does not allow saving data (maybe a private window).',
            )}
          </p>
        )}
      </section>

      {pendingImport && (
        <ConfirmDialog
          title={tr('Thay dữ liệu hiện tại?', 'Replace current data?')}
          message={tr(
            'Toàn bộ thói quen và lịch sử trên máy này sẽ được thay bằng bản sao lưu. Không hoàn tác được.',
            'All habits and history on this device will be replaced by the backup. This cannot be undone.',
          )}
          confirmLabel={tr('Thay bằng bản sao lưu', 'Replace with backup')}
          onConfirm={() => {
            const next = pendingImport;
            habitStore.update(() => next);
            setPendingImport(null);
            showToast({ text: tr('Đã nhập bản sao lưu.', 'Backup imported.') });
          }}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}
