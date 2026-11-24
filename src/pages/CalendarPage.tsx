/**
 * Calendar (REQ-02-025, REQ-02-021): the month for all habits or one, and the chosen day in
 * full — mood, checklist, freeze and notes — like the Olaa Note prototype's Today view.
 */
import { useState } from 'react';
import { Icon } from '../components/Icon';
import { toast, useToday } from '../components/ui';
import { checkInKey } from '../features/habit-management/types';
import { dayProgress, dayStatus, isFrozen, isOnAgenda } from '../features/habit-tracking/progress';
import { canFreeze, canUnfreeze, freezesLeftInMonth } from '../features/streaks/freezes';
import { tr } from '../i18n/locale';
import { freezeDay, unfreezeDay } from '../stores/habitActions';
import { habitStore, useHabitState } from '../stores/habitStore';
import { monthOf, today as todayKey, type DayKey } from '../utils/date';
import { formatDayLong } from '../utils/format';
import { HabitCheckRow, HabitTile, MonthCalendar, MoodPicker, type CalMark } from './parts';

export function CalendarPage() {
  const state = useHabitState();
  const today = useToday();
  const [month, setMonth] = useState(monthOf(today));
  const [filter, setFilter] = useState<string | null>(null);
  const [day, setDay] = useState<DayKey>(today);
  const habits = Object.values(state.habits)
    .filter((h) => h.archivedAt === null)
    .sort((a, b) => a.order - b.order);
  const one = filter ? state.habits[filter] : undefined;

  const markOf = (d: DayKey): CalMark => {
    if (one) return dayStatus(state, one, d, today);
    if (d > today) return isFrozen(state, d) ? 'frozen' : 'future';
    const p = dayProgress(state, d);
    if (p.total === 0) return isFrozen(state, d) ? 'frozen' : 'none';
    if (p.done === p.total) return 'done';
    if (isFrozen(state, d)) return 'frozen';
    if (p.done > 0) return 'partial';
    return d === today ? 'pending' : 'missed';
  };
  const ratioOf = (d: DayKey) => {
    if (d > today) return 0;
    const p = dayProgress(state, d);
    return p.total ? p.done / p.total : 0;
  };

  const agenda = habits.filter((h) => isOnAgenda(state, h, day, state.settings.weekStart));
  const notes = Object.values(state.checkIns).filter((c) => c.date === day && c.note.trim());
  const left = freezesLeftInMonth(state, monthOf(day));
  const check = canFreeze(state, day, today);

  const toggleFreeze = () => {
    if (canUnfreeze(state, day, today)) {
      habitStore.update((s) => unfreezeDay(s, day, todayKey()));
      toast(tr('Đã bỏ đóng băng.', 'Unfrozen.'));
    } else if (check === 'ok') {
      habitStore.update((s) => freezeDay(s, day, todayKey(), Date.now()));
      toast(tr(`${formatDayLong(day)} được đóng băng.`, `${formatDayLong(day)} is frozen.`), {
        action: {
          label: tr('Hoàn tác', 'Undo'),
          run: () => habitStore.update((s) => unfreezeDay(s, day, todayKey())),
        },
      });
    }
  };

  return (
    <>
      <div className="page__head">
        <div>
          <h1>{tr('Lịch', 'Calendar')}</h1>
          <p>
            {tr(
              'Chạm một ngày để xem, đánh dấu hoặc đóng băng.',
              'Tap a day to see it, tick habits or freeze it.',
            )}
          </p>
        </div>
      </div>
      <div
        className="chips"
        role="radiogroup"
        aria-label={tr('Xem thói quen', 'Show habit')}
        style={{ marginBottom: 14 }}
      >
        <button
          type="button"
          className="chip"
          role="radio"
          aria-checked={filter === null}
          onClick={() => setFilter(null)}
        >
          {tr('Tất cả', 'All')}
        </button>
        {habits.map((h) => (
          <button
            key={h.id}
            type="button"
            className="chip"
            role="radio"
            aria-checked={filter === h.id}
            onClick={() => setFilter(h.id)}
          >
            <HabitTile habit={h} size="sm" />
            {h.name}
          </button>
        ))}
      </div>
      <div className="grid grid--today">
        <section className="card">
          <MonthCalendar
            month={month}
            onMonth={setMonth}
            markOf={markOf}
            ratioOf={one ? undefined : ratioOf}
            selected={day}
            onDay={setDay}
          />
        </section>

        <div className="stack">
          <section className="card">
            <h2>
              {formatDayLong(day)}
              {day === today && <span className="tag tag--accent">{tr('Hôm nay', 'Today')}</span>}
            </h2>
            {day <= today ? (
              <div className="stack">
                <MoodPicker day={day} />
                {agenda.length > 0 ? (
                  <div className="hlist">
                    {agenda.map((h) => (
                      <HabitCheckRow key={h.id} habit={h} day={day} />
                    ))}
                  </div>
                ) : (
                  <p className="muted small">
                    {tr('Không có thói quen nào ngày này.', 'Nothing was scheduled that day.')}
                  </p>
                )}
              </div>
            ) : (
              <p className="muted small">
                {tr(
                  `${agenda.length} thói quen đến hạn ngày này.`,
                  `${agenda.length} habits due that day.`,
                )}
              </p>
            )}
          </section>

          <section className="card">
            <h2>
              <Icon name="snow" /> {tr('Đóng băng', 'Freeze')}
              <small>
                {tr(
                  `tháng này còn ${left}/${state.settings.freezesPerMonth}`,
                  `${left}/${state.settings.freezesPerMonth} left this month`,
                )}
              </small>
            </h2>
            <p className="small muted" style={{ marginBottom: 10 }}>
              {isFrozen(state, day)
                ? tr(
                    'Ngày này được đóng băng: chuỗi giữ nguyên.',
                    'This day is frozen: streaks hold.',
                  )
                : day < today
                  ? tr(
                      'Chỉ đóng băng được hôm nay hoặc các ngày sau.',
                      'Only today or later days can be frozen.',
                    )
                  : check === 'none-left'
                    ? tr('Hết lượt đóng băng của tháng này.', 'No freezes left this month.')
                    : tr(
                        'Biết trước ngày bận? Đóng băng để giữ mọi chuỗi.',
                        'Know a busy day is coming? Freeze it to keep every streak.',
                      )}
            </p>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              disabled={!canUnfreeze(state, day, today) && check !== 'ok'}
              onClick={toggleFreeze}
            >
              <Icon name="snow" />{' '}
              {isFrozen(state, day)
                ? tr('Bỏ đóng băng', 'Unfreeze')
                : tr('Đóng băng ngày này', 'Freeze this day')}
            </button>
          </section>

          {notes.length > 0 && (
            <section className="card">
              <h2>{tr('Ghi chú trong ngày', 'Notes that day')}</h2>
              <div className="journal">
                {notes.map((c) => (
                  <div key={checkInKey(c.habitId, c.date)} className="note-item">
                    <b>{state.habits[c.habitId]?.name ?? ''}</b>
                    <p>{c.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
