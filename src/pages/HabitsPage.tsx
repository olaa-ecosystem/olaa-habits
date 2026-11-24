/** All habits (module 02.01): active ones with their numbers, archived ones to restore or delete. */
import { useState } from 'react';
import { routeHref } from '../app/router';
import { Icon } from '../components/Icon';
import { Dialog, Empty, useToday } from '../components/ui';
import type { Habit } from '../features/habit-management/types';
import { describeSchedule } from '../features/scheduling/schedule';
import { completionRate } from '../features/statistics/stats';
import { streakOf, strengthOf } from '../features/streaks/streaks';
import { getLocale, tr } from '../i18n/locale';
import { deleteHabit, setArchived } from '../stores/habitActions';
import { habitStore, useHabitState } from '../stores/habitStore';
import { percent } from '../utils/format';
import { HabitTile, streakLabel } from './parts';

export function HabitsPage() {
  const state = useHabitState();
  const today = useToday();
  const [confirm, setConfirm] = useState<Habit | null>(null);
  const all = Object.values(state.habits);
  const active = all.filter((h) => h.archivedAt === null).sort((a, b) => a.order - b.order);
  const archived = all
    .filter((h) => h.archivedAt !== null)
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{tr('Thói quen', 'Habits')}</h1>
          <p>
            {tr(
              `${active.length} thói quen đang theo dõi.`,
              `${active.length} habits you are tracking.`,
            )}
          </p>
        </div>
        <a className="btn" href={routeHref({ name: 'new' })}>
          <Icon name="plus" /> {tr('Thói quen mới', 'New habit')}
        </a>
      </div>

      <section className="card">
        {active.length === 0 ? (
          <Empty icon="habits" title={tr('Chưa có thói quen nào', 'No habits yet')}>
            <a className="btn btn--sm" href={routeHref({ name: 'new' })} style={{ marginTop: 10 }}>
              {tr('Tạo thói quen', 'Create a habit')}
            </a>
          </Empty>
        ) : (
          <div className="list">
            {active.map((h) => {
              const s = streakOf(state, h, today);
              const strength = strengthOf(state, h, today);
              return (
                <a key={h.id} className="hrow" href={routeHref({ name: 'habit', id: h.id })}>
                  <HabitTile habit={h} />
                  <span>
                    <b>{h.name}</b>
                    <small>
                      {describeSchedule(h.schedule, getLocale(), state.settings.weekStart)}
                      {h.target > 1 && ` · ${h.target} ${h.unit}`}
                      {h.source.kind !== 'manual' && ' · Language'}
                    </small>
                  </span>
                  <span className="nums">
                    <span>
                      <b>{streakLabel(s.current, s.unit)}</b>
                      <br />
                      {tr('chuỗi', 'streak')}
                    </span>
                    <span>
                      <b>{percent(completionRate(state, h, today, 30).ratio)}</b>
                      <br />
                      30d
                    </span>
                    <span title={tr('Độ bền', 'Strength')}>
                      <span className="meter">
                        <i style={{ width: `${strength * 100}%` }} />
                      </span>
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {archived.length > 0 && (
        <section className="card">
          <h2>
            <Icon name="archive" /> {tr('Đã lưu trữ', 'Archived')}
            <small>{tr('lịch sử được giữ nguyên', 'history is kept')}</small>
          </h2>
          <div className="list">
            {archived.map((h) => (
              <div key={h.id} className="list-row">
                <span className="row" style={{ flexWrap: 'nowrap' }}>
                  <HabitTile habit={h} size="sm" />
                  <b>{h.name}</b>
                </span>
                <span className="row">
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() =>
                      habitStore.update((s) => setArchived(s, h.id, false, Date.now()))
                    }
                  >
                    {tr('Khôi phục', 'Restore')}
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label={tr(`Xoá hẳn ${h.name}`, `Delete ${h.name} for good`)}
                    onClick={() => setConfirm(h)}
                  >
                    <Icon name="delete" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {confirm && (
        <Dialog
          title={tr('Xoá hẳn thói quen?', 'Delete this habit for good?')}
          onClose={() => setConfirm(null)}
          actions={
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirm(null)}
                data-autofocus
              >
                {tr('Huỷ', 'Cancel')}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  habitStore.update((s) => deleteHabit(s, confirm.id));
                  setConfirm(null);
                }}
              >
                <Icon name="delete" /> {tr('Xoá hẳn', 'Delete')}
              </button>
            </>
          }
        >
          <p className="muted">
            {tr(
              `"${confirm.name}" và toàn bộ lịch sử sẽ bị xoá. Không khôi phục được.`,
              `"${confirm.name}" and all its history will be deleted. This cannot be undone.`,
            )}
          </p>
        </Dialog>
      )}
    </>
  );
}
