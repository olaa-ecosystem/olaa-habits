import { useState } from 'react';
import { navigate } from '../../app/router';
import { HabitGlyph, SnowIcon } from '../../components/Icons';
import { showToast } from '../../components/Toast';
import { tr } from '../../i18n/locale';
import { freezeDay, unfreezeDay } from '../../stores/habitActions';
import { habitStore, useHabitState } from '../../stores/habitStore';
import { monthOf, today as todayKey, type DayKey } from '../../utils/date';
import { formatDayLong } from '../../utils/format';
import { dayProgress, dayStatus, isFrozen, type DayStatus } from '../habit-tracking/progress';
import { canFreeze, canUnfreeze, freezesLeftInMonth } from '../streaks/freezes';
import { MonthGrid } from './MonthGrid';

/** Month view of all habits or one, and planning freezes for busy days (REQ-02-021/025). */
export function CalendarPage() {
  const state = useHabitState();
  const today = todayKey();
  const [month, setMonth] = useState(monthOf(today));
  const [filter, setFilter] = useState<string | null>(null);
  const habits = Object.values(state.habits)
    .filter((h) => h.archivedAt === null)
    .sort((a, b) => a.order - b.order);
  const selected = filter ? state.habits[filter] : undefined;

  const statusOf = (d: DayKey): DayStatus => {
    if (selected) return dayStatus(state, selected, d, today);
    if (d > today) return isFrozen(state, d) ? 'frozen' : 'future';
    const p = dayProgress(state, d);
    if (p.total === 0) return isFrozen(state, d) ? 'frozen' : 'not-due';
    if (p.done === p.total) return 'done';
    if (isFrozen(state, d)) return 'frozen';
    if (p.done > 0) return 'partial';
    return d === today ? 'pending' : 'missed';
  };

  const onDay = (d: DayKey) => {
    // Past days open that day's list; today and later toggle a freeze.
    if (d < today) {
      navigate({ name: 'today', day: d });
      return;
    }
    if (canUnfreeze(state, d, today)) {
      habitStore.update((s) => unfreezeDay(s, d, today));
      showToast({ text: tr(`Đã bỏ đóng băng ${formatDayLong(d)}`, `Unfroze ${formatDayLong(d)}`) });
      return;
    }
    const check = canFreeze(state, d, today);
    if (check === 'ok') {
      habitStore.update((s) => freezeDay(s, d, today, Date.now()));
      showToast({
        text: tr(
          `${formatDayLong(d)} được đóng băng. Chuỗi sẽ giữ nguyên.`,
          `${formatDayLong(d)} is frozen. Streaks will hold.`,
        ),
        action: {
          label: tr('Hoàn tác', 'Undo'),
          run: () => habitStore.update((s) => unfreezeDay(s, d, todayKey())),
        },
      });
    } else if (check === 'none-left') {
      showToast({
        text: tr('Hết lượt đóng băng của tháng này.', 'No freezes left for this month.'),
      });
    }
  };

  return (
    <div className="page">
      <header className="page__head">
        <h1>{tr('Lịch', 'Calendar')}</h1>
      </header>
      <div className="chip-row" role="radiogroup" aria-label={tr('Xem thói quen', 'Show habit')}>
        <button
          type="button"
          role="radio"
          aria-checked={filter === null}
          className={`chip ${filter === null ? 'is-selected' : ''}`}
          onClick={() => setFilter(null)}
        >
          {tr('Tất cả', 'All')}
        </button>
        {habits.map((h) => (
          <button
            key={h.id}
            type="button"
            role="radio"
            aria-checked={filter === h.id}
            className={`chip hb-color--${h.color} ${filter === h.id ? 'is-selected' : ''}`}
            onClick={() => setFilter(h.id)}
          >
            <HabitGlyph icon={h.icon} size={16} /> {h.name}
          </button>
        ))}
      </div>
      <section className="card">
        <MonthGrid
          month={month}
          weekStart={state.settings.weekStart}
          today={today}
          statusOf={statusOf}
          onMonth={setMonth}
          onDay={onDay}
        />
      </section>
      <section className="card stack">
        <h2 className="card-title">
          <SnowIcon /> {tr('Đóng băng chuỗi', 'Streak freezes')}
        </h2>
        <p>
          {tr(
            `Biết trước ngày bận (thi, đi xa, ốm)? Chạm vào ngày đó trên lịch để đóng băng: chuỗi giữ nguyên. Tháng này còn ${freezesLeftInMonth(state, month)}/${state.settings.freezesPerMonth} lượt.`,
            `Know a busy day is coming (exam, travel, sick)? Tap it on the calendar to freeze it and keep your streaks. ${freezesLeftInMonth(state, month)} of ${state.settings.freezesPerMonth} left this month.`,
          )}
        </p>
        <p className="muted small">
          {tr(
            'Chỉ đóng băng được hôm nay hoặc các ngày sau. Chạm lại ngày đã đóng băng để bỏ.',
            'Only today or later days can be frozen. Tap a frozen day again to undo.',
          )}
        </p>
      </section>
    </div>
  );
}
