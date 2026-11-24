import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { BackIcon, HabitGlyph, TrashIcon } from '../../components/Icons';
import { tr } from '../../i18n/locale';
import { deleteHabit, setArchived } from '../../stores/habitActions';
import { habitStore, useHabitState } from '../../stores/habitStore';
import type { Habit } from './types';

/** Archived habits: restore with history, or delete for good (REQ-02-001). */
export function ArchivePage() {
  const state = useHabitState();
  const [confirm, setConfirm] = useState<Habit | null>(null);
  const list = Object.values(state.habits)
    .filter((h) => h.archivedAt !== null)
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
  return (
    <div className="page">
      <header className="page__head">
        <a className="icon-btn" href="#/settings" aria-label={tr('Quay lại', 'Back')}>
          <BackIcon />
        </a>
        <h1>{tr('Đã lưu trữ', 'Archived')}</h1>
      </header>
      {list.length === 0 ? (
        <div className="card empty">
          <p>{tr('Không có thói quen nào được lưu trữ.', 'No archived habits.')}</p>
        </div>
      ) : (
        <ul className="habit-list">
          {list.map((h) => (
            <li key={h.id} className={`habit-row hb-color--${h.color}`}>
              <span className="habit-row__icon">
                <HabitGlyph icon={h.icon} />
              </span>
              <span className="habit-row__body">
                <span className="habit-row__name">{h.name}</span>
              </span>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => habitStore.update((s) => setArchived(s, h.id, false, Date.now()))}
                >
                  {tr('Khôi phục', 'Restore')}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={tr(`Xoá hẳn ${h.name}`, `Delete ${h.name} for good`)}
                  onClick={() => setConfirm(h)}
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {confirm && (
        <ConfirmDialog
          title={tr('Xoá hẳn thói quen?', 'Delete this habit for good?')}
          message={tr(
            `"${confirm.name}" và toàn bộ lịch sử sẽ bị xoá. Không khôi phục được.`,
            `"${confirm.name}" and all its history will be deleted. This cannot be undone.`,
          )}
          confirmLabel={tr('Xoá hẳn', 'Delete')}
          onConfirm={() => {
            habitStore.update((s) => deleteHabit(s, confirm.id));
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
