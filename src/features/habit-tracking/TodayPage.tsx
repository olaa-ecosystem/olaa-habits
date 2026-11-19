import { useState } from 'react';
import { navigate, routeHref } from '../../app/router';
import { LANGUAGE_APP_URL } from '../../config';
import { useAccount } from '../../services/cloudSync';
import { HabitBadge } from '../../components/HabitBadge';
import { CheckIcon, FlameIcon, PlusIcon, SnowIcon } from '../../components/Icons';
import { appStore, useAppState } from '../../stores/appStore';
import {
  activeHabits,
  entryOf,
  habitStreak,
  isDone,
  logValue,
  outcomeOn,
  setFreeze,
  setNote,
  setPaused,
  setSkipped,
  toggleCheckin,
  type AppState,
} from '../../stores/appState';
import { formatDayLong, monthOf, type DayKey } from '../../utils/date';
import {
  describeTarget,
  isMeasured,
  isPausedNow,
  kindOf,
  planOn,
  unitLabel,
  type Habit,
} from '../habit-management/types';
import { describeSchedule, isScheduledOn } from '../scheduling/schedule';
import { canFreeze, freezesLeftIn, FREEZES_PER_MONTH } from '../streaks/freeze';
import { formatStreak, weekProgress } from '../streaks/streak';
import { MAX_NOTE_LENGTH } from './checkins';

/** One tap adds this much to a measured habit. */
function stepOf(habit: Habit): number {
  return kindOf(habit) === 'duration' ? 5 : 1;
}

/** Today's habits, one tap to check (REQ-02-003, NFR-02-001; PRD v1.0 §7.2). */
export function TodayPage({ today }: { today: DayKey }) {
  const state = useAppState();
  const [openId, setOpenId] = useState<string | null>(null);
  const habits = activeHabits(state);
  const paused = habits.filter(isPausedNow);
  const running = habits.filter((h) => !isPausedNow(h));
  const dueToday = running.filter((h) => isScheduledOn(h.schedule, today));
  const notToday = running.filter((h) => !isScheduledOn(h.schedule, today));
  const counted = dueToday.filter((h) => outcomeOn(state, h, today) !== 'skipped');
  const doneCount = counted.filter((h) => isDone(state, h.id, today)).length;
  const frozenToday = Boolean(state.freezes[today]);
  const freezesLeft = freezesLeftIn(state.freezes, monthOf(today));

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{formatDayLong(today)}</p>
          <h1>{state.name ? `Chào ${state.name}!` : 'Hôm nay'}</h1>
        </div>
        {counted.length > 0 && (
          <p className="today-count" aria-live="polite">
            <strong>{doneCount}</strong>/{counted.length} xong
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
            <TodayRow
              key={habit.id}
              habit={habit}
              state={state}
              today={today}
              open={openId === habit.id}
              onToggleOpen={() => setOpenId(openId === habit.id ? null : habit.id)}
            />
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
        running.length > 0 && (
          <div className="card freeze-card">
            <SnowIcon size={22} />
            <p>
              <strong>Bận hôm nay?</strong> Đóng băng để giữ chuỗi của mọi thói quen. Còn{' '}
              {freezesLeft}/{FREEZES_PER_MONTH} lượt tháng này.
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

      {paused.length > 0 && (
        <section>
          <h2 className="section-title">Đang tạm dừng</h2>
          <p className="muted small">Ngày tạm dừng không tính vào tỷ lệ và không làm đứt chuỗi.</p>
          <ul className="habit-list habit-list--quiet">
            {paused.map((habit) => (
              <li key={habit.id} className="habit-row">
                <HabitBadge habit={habit} size={36} />
                <span className="habit-row__text">
                  <span className="habit-row__name">{habit.name}</span>
                  <span className="habit-row__meta">{describeSchedule(habit.schedule)}</span>
                </span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => appStore.update((s) => setPaused(s, habit.id, false, today))}
                >
                  Tiếp tục
                </button>
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

function TodayRow({
  habit,
  state,
  today,
  open,
  onToggleOpen,
}: {
  habit: Habit;
  state: AppState;
  today: DayKey;
  open: boolean;
  onToggleOpen: () => void;
}) {
  const outcome = outcomeOn(state, habit, today);
  const entry = entryOf(state, habit.id, today);
  const streak = habitStreak(state, habit, today);
  const measured = isMeasured(habit);
  const target = planOn(habit, today).target ?? habit.target ?? 0;
  const value = entry?.status === 'done' ? (entry.value ?? 0) : 0;

  let meta: string;
  if (outcome === 'skipped') meta = 'Đã bỏ qua hôm nay';
  else if (measured) meta = `${value}/${target} ${unitLabel(habit)}`;
  else if (habit.schedule.kind === 'perWeek')
    meta = `${weekProgress(today, habit.createdOn, (d) => isDone(state, habit.id, d))}/${habit.schedule.times} lần tuần này`;
  else meta = describeSchedule(habit.schedule);

  return (
    <li className={`habit-row habit-row--today is-${outcome} ${open ? 'is-open' : ''}`}>
      <div className="habit-row__main">
        <HabitBadge habit={habit} />
        <span className="habit-row__text">
          <span className="habit-row__name">{habit.name}</span>
          <span className="habit-row__meta">
            {meta}
            {habit.source && <span className="auto-chip">Tự động</span>}
            {streak.current > 0 && (
              <span className="streak-chip">
                <FlameIcon size={14} />
                {formatStreak(streak)}
              </span>
            )}
            {entry?.note && <span className="note-chip">Có ghi chú</span>}
          </span>
          {measured && outcome !== 'skipped' && (
            <span
              className={`meter habit-color--${habit.color}`}
              role="progressbar"
              aria-label={`${habit.name}: ${value} trên ${target} ${unitLabel(habit)}`}
              aria-valuemin={0}
              aria-valuemax={target}
              aria-valuenow={value}
            >
              <span
                style={{ width: `${Math.min(100, target > 0 ? (value / target) * 100 : 0)}%` }}
              />
            </span>
          )}
        </span>
        {habit.source ? (
          <AutoStatus habit={habit} done={outcome === 'done'} />
        ) : measured ? (
          <button
            type="button"
            className={`check-btn check-btn--add habit-color--${habit.color}`}
            aria-pressed={outcome === 'done'}
            aria-label={`${habit.name}: thêm ${stepOf(habit)} ${unitLabel(habit)}`}
            onClick={() =>
              appStore.update((s) => logValue(s, habit.id, today, today, value + stepOf(habit)))
            }
          >
            {outcome === 'done' ? (
              <CheckIcon size={26} />
            ) : (
              <span className="check-btn__plus">+{stepOf(habit)}</span>
            )}
          </button>
        ) : (
          <button
            type="button"
            className={`check-btn habit-color--${habit.color}`}
            aria-pressed={outcome === 'done'}
            aria-label={`${habit.name}: ${outcome === 'done' ? 'đã xong, bấm để bỏ' : 'đánh dấu đã xong'}`}
            onClick={() => appStore.update((s) => toggleCheckin(s, habit.id, today, today))}
          >
            <CheckIcon size={26} />
          </button>
        )}
        <button
          type="button"
          className="icon-btn more-btn"
          aria-expanded={open}
          aria-label={`Tuỳ chọn cho ${habit.name}`}
          onClick={onToggleOpen}
        >
          ⋯
        </button>
      </div>
      {open && <RowOptions habit={habit} state={state} today={today} />}
    </li>
  );
}

/** Log an amount, skip the day, add a note, or pause the habit. */
function RowOptions({ habit, state, today }: { habit: Habit; state: AppState; today: DayKey }) {
  const entry = entryOf(state, habit.id, today);
  const skipped = entry?.status === 'skipped';
  const [note, setNoteText] = useState(entry?.note ?? '');
  const [amount, setAmount] = useState(String(entry?.status === 'done' ? (entry.value ?? '') : ''));
  const target = describeTarget(habit);

  return (
    <div className="row-options">
      {isMeasured(habit) && !habit.source && !skipped && (
        <form
          className="row-options__line"
          onSubmit={(e) => {
            e.preventDefault();
            appStore.update((s) => logValue(s, habit.id, today, today, Number(amount) || 0));
          }}
        >
          <label className="field field--inline">
            <span>Hôm nay ({unitLabel(habit)})</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn--ghost">
            Lưu
          </button>
          {target && <span className="muted small">Mục tiêu {target}</span>}
        </form>
      )}
      {!habit.source && (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => appStore.update((s) => setSkipped(s, habit.id, today, today, !skipped))}
        >
          {skipped ? 'Bỏ "bỏ qua"' : 'Bỏ qua hôm nay'}
        </button>
      )}
      {!habit.source && (
        <form
          className="row-options__line"
          onSubmit={(e) => {
            e.preventDefault();
            appStore.update((s) => setNote(s, habit.id, today, today, note));
          }}
        >
          <label className="field field--grow">
            <span>Ghi chú hôm nay</span>
            <input
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              placeholder="Ví dụ: mệt, học ít hơn"
              onChange={(e) => setNoteText(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn--ghost">
            Lưu ghi chú
          </button>
        </form>
      )}
      <button
        type="button"
        className="link-btn link-btn--start"
        onClick={() => appStore.update((s) => setPaused(s, habit.id, true, today))}
      >
        Tạm dừng thói quen này
      </button>
    </div>
  );
}

/** Automatic habits are checked by Olaa Language events, not by hand (REQ-02-014). */
function AutoStatus({ habit, done }: { habit: Habit; done: boolean }) {
  const account = useAccount();
  if (done) {
    return (
      <span
        className={`check-btn is-auto habit-color--${habit.color}`}
        role="img"
        aria-label={`${habit.name}: đã xong, ghi nhận tự động`}
      >
        <CheckIcon size={26} />
      </span>
    );
  }
  if (account.status !== 'off' && account.email === null) {
    return (
      <a className="auto-link" href={routeHref({ name: 'me' })}>
        Đăng nhập để tự ghi nhận
      </a>
    );
  }
  return (
    <a className="auto-link" href={LANGUAGE_APP_URL} target="_blank" rel="noreferrer">
      Học ngay
    </a>
  );
}
