import { navigate, routeHref } from '../../app/router';
import { HabitBadge } from '../../components/HabitBadge';
import { CheckIcon, FlameIcon, PlusIcon, SnowIcon } from '../../components/Icons';
import { appStore, useAppState } from '../../stores/appStore';
import {
  activeHabits,
  isDone,
  setFreeze,
  toggleCheckin,
  type AppState,
} from '../../stores/appState';
import { formatDayLong, monthOf, type DayKey } from '../../utils/date';
import type { Habit } from '../habit-management/types';
import { describeSchedule, isScheduledOn } from '../scheduling/schedule';
import { canFreeze, freezesLeftIn, FREEZES_PER_MONTH } from '../streaks/freeze';
import { computeStreak, formatStreak, weekProgress } from '../streaks/streak';

export function habitStreak(state: AppState, habit: Habit, today: DayKey) {
  return computeStreak({
    schedule: habit.schedule,
    createdOn: habit.createdOn,
    today,
    done: (d) => isDone(state, habit.id, d),
    frozen: (d) => Boolean(state.freezes[d]),
  });
}

/** Today's habits, one tap to check (REQ-02-003, NFR-02-001). */
export function TodayPage({ today }: { today: DayKey }) {
  const state = useAppState();
  const habits = activeHabits(state);
  const dueToday = habits.filter((h) => isScheduledOn(h.schedule, today));
  const notToday = habits.filter((h) => !isScheduledOn(h.schedule, today));
  const doneCount = dueToday.filter((h) => isDone(state, h.id, today)).length;
  const frozenToday = Boolean(state.freezes[today]);
  const freezesLeft = freezesLeftIn(state.freezes, monthOf(today));

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{formatDayLong(today)}</p>
          <h1>{state.name ? `Chào ${state.name}!` : 'Hôm nay'}</h1>
        </div>
        {dueToday.length > 0 && (
          <p className="today-count" aria-live="polite">
            <strong>{doneCount}</strong>/{dueToday.length} xong
          </p>
        )}
      </header>

      {habits.length === 0 ? (
        <div className="card empty">
          <p>Bạn chưa có thói quen nào.</p>
          <a className="btn" href={routeHref({ name: 'habit-new' })}>
            Tạo thói quen
          </a>
        </div>
      ) : (
        <ul className="habit-list" aria-label="Thói quen hôm nay">
          {dueToday.map((habit) => (
            <TodayRow key={habit.id} habit={habit} state={state} today={today} />
          ))}
        </ul>
      )}

      {frozenToday ? (
        <div className="card freeze-card is-on">
          <SnowIcon size={22} />
          <p>
            <strong>Hôm nay đã đóng băng.</strong> Chuỗi của bạn được giữ nguyên.
          </p>
          <button
            type="button"
            className="link-btn"
            onClick={() => appStore.update((s) => setFreeze(s, today, false, today))}
          >
            Bỏ đóng băng
          </button>
        </div>
      ) : (
        habits.length > 0 && (
          <div className="card freeze-card">
            <SnowIcon size={22} />
            <p>
              <strong>Bận hôm nay?</strong> Đóng băng để giữ chuỗi. Còn {freezesLeft}/
              {FREEZES_PER_MONTH} lượt tháng này.
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={!canFreeze(state.freezes, today, today).ok}
              onClick={() => appStore.update((s) => setFreeze(s, today, true, today))}
            >
              Đóng băng hôm nay
            </button>
          </div>
        )
      )}

      {notToday.length > 0 && (
        <section>
          <h2 className="section-title">Không có lịch hôm nay</h2>
          <ul className="habit-list habit-list--quiet">
            {notToday.map((habit) => (
              <li key={habit.id} className="habit-row">
                <HabitBadge habit={habit} size={36} />
                <span className="habit-row__text">
                  <span className="habit-row__name">{habit.name}</span>
                  <span className="habit-row__meta">{describeSchedule(habit.schedule)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {habits.length > 0 && (
        <button type="button" className="add-fab" onClick={() => navigate({ name: 'habit-new' })}>
          <PlusIcon />
          <span>Thêm thói quen</span>
        </button>
      )}
    </div>
  );
}

function TodayRow({ habit, state, today }: { habit: Habit; state: AppState; today: DayKey }) {
  const done = isDone(state, habit.id, today);
  const streak = habitStreak(state, habit, today);
  const meta =
    habit.schedule.kind === 'perWeek'
      ? `${weekProgress(today, habit.createdOn, (d) => isDone(state, habit.id, d))}/${habit.schedule.times} lần tuần này`
      : describeSchedule(habit.schedule);

  return (
    <li className={`habit-row ${done ? 'is-done' : ''}`}>
      <HabitBadge habit={habit} />
      <span className="habit-row__text">
        <span className="habit-row__name">{habit.name}</span>
        <span className="habit-row__meta">
          {meta}
          {streak.current > 0 && (
            <span className="streak-chip">
              <FlameIcon size={14} />
              {formatStreak(streak)}
            </span>
          )}
        </span>
      </span>
      <button
        type="button"
        className={`check-btn habit-color--${habit.color}`}
        aria-pressed={done}
        aria-label={`${habit.name}: ${done ? 'đã xong, bấm để bỏ' : 'đánh dấu đã xong'}`}
        onClick={() => appStore.update((s) => toggleCheckin(s, habit.id, today, today))}
      >
        <CheckIcon size={26} />
      </button>
    </li>
  );
}
