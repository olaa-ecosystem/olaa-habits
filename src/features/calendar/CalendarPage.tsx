import { useState } from 'react';
import { HabitBadge } from '../../components/HabitBadge';
import { ChevronLeftIcon, ChevronRightIcon, SnowIcon } from '../../components/Icons';
import { appStore, useAppState } from '../../stores/appStore';
import {
  activeHabits,
  canEditDay,
  entryOf,
  logValue,
  outcomeOn,
  setSkipped,
  orderedHabits,
  setFreeze,
  toggleCheckin,
} from '../../stores/appState';
import {
  addDays,
  formatDayLong,
  formatMonth,
  fromDayKey,
  monthOf,
  toDayKey,
  weekStartOf,
  type DayKey,
} from '../../utils/date';
import { isDayBased, isScheduledOn, WEEKDAY_SHORT } from '../scheduling/schedule';
import { isMeasured, isPausedOn, planOn, unitLabel } from '../habit-management/types';
import type { Outcome } from '../habit-tracking/checkins';
import { canFreeze, canUnfreeze, freezesLeftIn } from '../streaks/freeze';
import { dayStatus, scheduleOn, type DayStatus } from './calendarDay';

const OUTCOME_TEXT: Record<Outcome, string> = {
  done: 'Đã xong',
  partial: 'Một phần',
  skipped: 'Bỏ qua',
  none: 'Chưa xong',
};

const STATUS_LABEL: Record<DayStatus, string> = {
  none: '',
  done: 'hoàn thành',
  partial: 'xong một phần',
  missed: 'bỏ lỡ',
  frozen: 'đóng băng',
  pending: 'chưa xong',
  skipped: 'bỏ qua',
};

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return toDayKey(new Date(y ?? 1970, (m ?? 1) - 1 + delta, 1)).slice(0, 7);
}

/** Month grid of done / missed / frozen days, with a day panel to correct or plan (REQ-02-025). */
export function CalendarPage({ today }: { today: DayKey }) {
  const state = useAppState();
  const [month, setMonth] = useState(monthOf(today));
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<DayKey | null>(null);

  const all = orderedHabits(state);
  const shown = filter === 'all' ? all : all.filter((h) => h.id === filter);
  const first = `${month}-01`;
  const gridStart = weekStartOf(first);
  const lastOfMonth = toDayKey(
    new Date(fromDayKey(first).getFullYear(), fromDayKey(first).getMonth() + 1, 0),
  );
  const weeks = Math.ceil(
    (Number(lastOfMonth.slice(8)) + ((fromDayKey(first).getDay() + 6) % 7)) / 7,
  );
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="page">
      <header className="page__head">
        <h1>Lịch</h1>
        <label className="select">
          <span className="visually-hidden">Xem thói quen</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Tất cả thói quen</option>
            {all.map((h) => (
              <option key={h.id} value={h.id}>
                {h.icon} {h.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="card calendar">
        <div className="calendar__nav">
          <button
            type="button"
            className="icon-btn"
            aria-label="Tháng trước"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeftIcon />
          </button>
          <h2>{formatMonth(month)}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Tháng sau"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRightIcon />
          </button>
        </div>
        <div className="calendar__grid" role="grid" aria-label={formatMonth(month)}>
          {WEEKDAY_SHORT.map((d) => (
            <span key={d} className="calendar__weekday" role="columnheader">
              {d}
            </span>
          ))}
          {cells.map((day) => {
            const status = dayStatus(state, shown, day, today);
            const outside = monthOf(day) !== month;
            return (
              <button
                key={day}
                type="button"
                role="gridcell"
                className={`day day--${status} ${outside ? 'is-outside' : ''} ${day === today ? 'is-today' : ''} ${selected === day ? 'is-selected' : ''}`}
                aria-label={`${formatDayLong(day)}${STATUS_LABEL[status] ? `, ${STATUS_LABEL[status]}` : ''}`}
                aria-pressed={selected === day}
                onClick={() => setSelected(selected === day ? null : day)}
              >
                {Number(day.slice(8))}
                {status === 'frozen' && <SnowIcon size={12} />}
              </button>
            );
          })}
        </div>
        <ul className="legend" aria-label="Chú thích">
          <li>
            <span className="day-dot day--done" />
            Hoàn thành
          </li>
          <li>
            <span className="day-dot day--partial" />
            Một phần
          </li>
          <li>
            <span className="day-dot day--missed" />
            Bỏ lỡ
          </li>
          <li>
            <span className="day-dot day--frozen" />
            Đóng băng
          </li>
          <li>
            <span className="day-dot day--skipped" />
            Bỏ qua
          </li>
        </ul>
      </div>

      {selected && renderDayPanel(selected)}
      {all.length > 0 && activeHabits(state).length === 0 && (
        <p className="muted small">Mọi thói quen đã được lưu trữ.</p>
      )}
    </div>
  );

  // A render helper, not a component: it reads this page's state and must not remount on update.
  function renderDayPanel(day: DayKey) {
    const habits = activeHabits(state).filter((h) => {
      if (h.createdOn > day || isPausedOn(h, day)) return false;
      const schedule = scheduleOn(h, day, today);
      return !isDayBased(schedule) || isScheduledOn(schedule, day);
    });
    const editable = habits.filter((h) => canEditDay(h, day, today));
    const frozen = Boolean(state.freezes[day]);
    const freezeCheck = canFreeze(state.freezes, day, today);
    return (
      <section className="card day-panel" aria-label={formatDayLong(day)}>
        <h2>{formatDayLong(day)}</h2>
        {day <= today && (
          <ul className="day-panel__list">
            {habits.length === 0 && (
              <li className="muted small">Không có thói quen nào có lịch vào ngày này.</li>
            )}
            {habits.map((h) => {
              const outcome = outcomeOn(state, h, day);
              const entry = entryOf(state, h.id, day);
              const canEdit = editable.includes(h);
              const skipped = outcome === 'skipped';
              return (
                <li key={h.id} className="day-panel__item">
                  <HabitBadge habit={h} size={32} />
                  <span className="day-panel__name">
                    {h.name}
                    {entry?.note && <span className="muted small">“{entry.note}”</span>}
                  </span>
                  {!canEdit ? (
                    <span className="muted small">{OUTCOME_TEXT[outcome]}</span>
                  ) : isMeasured(h) ? (
                    <label className="field field--inline">
                      <span className="visually-hidden">
                        {h.name}: số {unitLabel(h)}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        disabled={skipped}
                        defaultValue={entry?.status === 'done' ? (entry.value ?? 0) : ''}
                        key={`${h.id}-${day}-${entry?.updatedAt ?? 0}`}
                        onBlur={(e) =>
                          appStore.update((s) =>
                            logValue(s, h.id, day, today, Number(e.target.value) || 0),
                          )
                        }
                      />
                      <span className="muted small">
                        /{planOn(h, day).target ?? h.target} {unitLabel(h)}
                      </span>
                    </label>
                  ) : (
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={outcome === 'done'}
                        disabled={skipped}
                        onChange={() => appStore.update((s) => toggleCheckin(s, h.id, day, today))}
                      />
                      <span className="visually-hidden">{h.name} đã xong</span>
                    </label>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      className={`chip chip--small ${skipped ? 'is-selected' : ''}`}
                      aria-pressed={skipped}
                      onClick={() =>
                        appStore.update((s) => setSkipped(s, h.id, day, today, !skipped))
                      }
                    >
                      Bỏ qua
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {day < today && editable.length === 0 && habits.length > 0 && (
          <p className="muted small">Chỉ sửa được hôm nay và 2 ngày trước.</p>
        )}
        {day >= today &&
          (frozen ? (
            <div className="day-panel__freeze">
              <p>
                <SnowIcon size={16} /> Ngày này đã đóng băng.
              </p>
              {canUnfreeze(state.freezes, day, today) && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => appStore.update((s) => setFreeze(s, day, false, today))}
                >
                  Bỏ đóng băng
                </button>
              )}
            </div>
          ) : (
            <div className="day-panel__freeze">
              <p className="muted small">
                {freezeCheck.ok
                  ? `Báo trước ngày bận để giữ chuỗi. Còn ${freezesLeftIn(state.freezes, monthOf(day))} lượt trong tháng.`
                  : freezeCheck.reason}
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={!freezeCheck.ok}
                onClick={() => appStore.update((s) => setFreeze(s, day, true, today))}
              >
                Đóng băng ngày này
              </button>
            </div>
          ))}
      </section>
    );
  }
}
