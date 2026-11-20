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
import { isDayBased, isScheduledOn, weekdayShort } from '../scheduling/schedule';
import { isMeasured, isPausedOn, planOn, unitLabel } from '../habit-management/types';
import type { Outcome } from '../habit-tracking/checkins';
import { canFreeze, canUnfreeze, freezesLeftIn } from '../streaks/freeze';
import { dayStatus, scheduleOn, type DayStatus } from './calendarDay';
import { tr } from '../../i18n/locale';

const outcomeText = (o: Outcome): string =>
  ({
    done: tr('Đã xong', 'Done'),
    partial: tr('Một phần', 'Partly'),
    skipped: tr('Bỏ qua', 'Skipped'),
    none: tr('Chưa xong', 'Not done'),
  })[o];

const statusLabel = (s: DayStatus): string =>
  ({
    none: '',
    done: tr('hoàn thành', 'done'),
    partial: tr('xong một phần', 'partly done'),
    missed: tr('bỏ lỡ', 'missed'),
    frozen: tr('đóng băng', 'frozen'),
    pending: tr('chưa xong', 'not done yet'),
    skipped: tr('bỏ qua', 'skipped'),
  })[s];

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
        <h1>{tr('Lịch', 'Calendar')}</h1>
        <label className="select">
          <span className="visually-hidden">{tr('Xem thói quen', 'Show habit')}</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{tr('Tất cả thói quen', 'All habits')}</option>
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
            aria-label={tr('Tháng trước', 'Previous month')}
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeftIcon />
          </button>
          <h2>{formatMonth(month)}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label={tr('Tháng sau', 'Next month')}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRightIcon />
          </button>
        </div>
        <div className="calendar__grid" role="grid" aria-label={formatMonth(month)}>
          {weekdayShort().map((d) => (
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
                aria-label={`${formatDayLong(day)}${statusLabel(status) ? `, ${statusLabel(status)}` : ''}`}
                aria-pressed={selected === day}
                onClick={() => setSelected(selected === day ? null : day)}
              >
                {Number(day.slice(8))}
                {status === 'frozen' && <SnowIcon size={12} />}
              </button>
            );
          })}
        </div>
        <ul className="legend" aria-label={tr('Chú thích', 'Legend')}>
          <li>
            <span className="day-dot day--done" />
            {tr('Hoàn thành', 'Done')}
          </li>
          <li>
            <span className="day-dot day--partial" />
            {tr('Một phần', 'Partly')}
          </li>
          <li>
            <span className="day-dot day--missed" />
            {tr('Bỏ lỡ', 'Missed')}
          </li>
          <li>
            <span className="day-dot day--frozen" />
            {tr('Đóng băng', 'Frozen')}
          </li>
          <li>
            <span className="day-dot day--skipped" />
            {tr('Bỏ qua', 'Skipped')}
          </li>
        </ul>
      </div>

      {selected && renderDayPanel(selected)}
      {all.length > 0 && activeHabits(state).length === 0 && (
        <p className="muted small">
          {tr('Mọi thói quen đã được lưu trữ.', 'All habits are archived.')}
        </p>
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
              <li className="muted small">
                {tr(
                  'Không có thói quen nào có lịch vào ngày này.',
                  'No habits are scheduled on this day.',
                )}
              </li>
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
                    <span className="muted small">{outcomeText(outcome)}</span>
                  ) : isMeasured(h) ? (
                    <label className="field field--inline">
                      <span className="visually-hidden">
                        {h.name}: {tr('số', 'number of')} {unitLabel(h)}
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
                      <span className="visually-hidden">
                        {h.name} {tr('đã xong', 'done')}
                      </span>
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
                      {tr('Bỏ qua', 'Skip')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {day < today && editable.length === 0 && habits.length > 0 && (
          <p className="muted small">
            {tr(
              'Chỉ sửa được hôm nay và 2 ngày trước.',
              'Only today and the 2 days before can be edited.',
            )}
          </p>
        )}
        {day >= today &&
          (frozen ? (
            <div className="day-panel__freeze">
              <p>
                <SnowIcon size={16} /> {tr('Ngày này đã đóng băng.', 'This day is frozen.')}
              </p>
              {canUnfreeze(state.freezes, day, today) && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => appStore.update((s) => setFreeze(s, day, false, today))}
                >
                  {tr('Bỏ đóng băng', 'Unfreeze')}
                </button>
              )}
            </div>
          ) : (
            <div className="day-panel__freeze">
              <p className="muted small">
                {freezeCheck.ok
                  ? tr(
                      `Báo trước ngày bận để giữ chuỗi. Còn ${freezesLeftIn(state.freezes, monthOf(day))} lượt trong tháng.`,
                      `Mark a busy day ahead to keep your streaks. ${freezesLeftIn(state.freezes, monthOf(day))} left this month.`,
                    )
                  : freezeCheck.reason}
              </p>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={!freezeCheck.ok}
                onClick={() => appStore.update((s) => setFreeze(s, day, true, today))}
              >
                {tr('Đóng băng ngày này', 'Freeze this day')}
              </button>
            </div>
          ))}
      </section>
    );
  }
}
