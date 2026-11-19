import { routeHref } from '../../app/router';
import { HabitBadge } from '../../components/HabitBadge';
import { FlameIcon, PlusIcon } from '../../components/Icons';
import { appStore, useAppState } from '../../stores/appStore';
import {
  activeHabits,
  archivedHabits,
  habitConsistency,
  habitStreak,
  restoreHabit,
} from '../../stores/appState';
import { CONSISTENCY_DAYS, formatRate } from '../streaks/consistency';
import type { DayKey } from '../../utils/date';
import { describeSchedule } from '../scheduling/schedule';
import { describeSource, describeTarget, isPausedNow } from './types';
import { formatStreak } from '../streaks/streak';

/** All habits, with archived ones kept below (module 02.01). */
export function HabitsPage({ today }: { today: DayKey }) {
  const state = useAppState();
  const active = activeHabits(state);
  const archived = archivedHabits(state);

  return (
    <div className="page">
      <header className="page__head">
        <h1>Thói quen</h1>
        <a className="btn" href={routeHref({ name: 'habit-new' })}>
          <PlusIcon />
          Thêm
        </a>
      </header>

      {active.length === 0 ? (
        <div className="card empty">
          <p>Chưa có thói quen nào đang theo dõi.</p>
        </div>
      ) : (
        <ul className="habit-list">
          {active.map((habit) => {
            const streak = habitStreak(state, habit, today);
            const consistency = habitConsistency(state, habit, today);
            return (
              <li key={habit.id}>
                <a
                  className="habit-row habit-row--link"
                  href={routeHref({ name: 'habit-edit', habitId: habit.id })}
                >
                  <HabitBadge habit={habit} />
                  <span className="habit-row__text">
                    <span className="habit-row__name">{habit.name}</span>
                    <span className="habit-row__meta">
                      {describeSchedule(habit.schedule)}
                      {habit.source && (
                        <span className="auto-chip">{describeSource(habit.source)}</span>
                      )}
                      {describeTarget(habit) && <span>Mục tiêu {describeTarget(habit)}</span>}
                      {isPausedNow(habit) && <span className="note-chip">Đang tạm dừng</span>}
                      <span className="streak-chip">
                        <FlameIcon size={14} />
                        {formatStreak(streak)} · dài nhất {streak.best}
                      </span>
                      <span
                        className="rate-chip"
                        title={`${consistency.completed}/${consistency.opportunities} lần có lịch`}
                      >
                        Nhất quán {CONSISTENCY_DAYS} ngày: {formatRate(consistency)}
                      </span>
                    </span>
                  </span>
                  <span className="habit-row__edit">Sửa</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {archived.length > 0 && (
        <section>
          <h2 className="section-title">Đã lưu trữ</h2>
          <ul className="habit-list habit-list--quiet">
            {archived.map((habit) => (
              <li key={habit.id} className="habit-row">
                <HabitBadge habit={habit} size={36} />
                <span className="habit-row__text">
                  <span className="habit-row__name">{habit.name}</span>
                  <span className="habit-row__meta">
                    Lưu trữ từ {habit.archivedOn?.split('-').reverse().join('/')}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => appStore.update((s) => restoreHabit(s, habit.id))}
                >
                  Khôi phục
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
