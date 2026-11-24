import { routeHref } from '../../app/router';
import {
  CheckIcon,
  ExternalIcon,
  FlameIcon,
  HabitGlyph,
  MinusIcon,
  PlusIcon,
} from '../../components/Icons';
import { getLocale, tr } from '../../i18n/locale';
import { LANGUAGE_URL, noteHref } from '../../integrations/olaaApps';
import { useHabitState } from '../../stores/habitStore';
import type { DayKey } from '../../utils/date';
import { isAuto, type Habit } from '../habit-management/types';
import { describeSchedule, isWeekly, weekOf, weeklyQuota } from '../scheduling/schedule';
import { streakOf } from '../streaks/streaks';
import { ProgressRing } from './ProgressRing';
import { doneInWeek, valueOn } from './progress';

export function streakLabel(n: number, unit: 'day' | 'week'): string {
  if (unit === 'week') return tr(`${n} tuần`, `${n} ${n === 1 ? 'week' : 'weeks'}`);
  return tr(`${n} ngày`, `${n} ${n === 1 ? 'day' : 'days'}`);
}

/** One habit on the day list. Check-off is a single tap (NFR-02-001). */
export function HabitRow({
  habit,
  day,
  today,
  editable,
  onTap,
  onStep,
}: {
  habit: Habit;
  day: DayKey;
  today: DayKey;
  editable: boolean;
  onTap: () => void;
  onStep: (delta: number) => void;
}) {
  const state = useHabitState();
  const value = valueOn(state, habit, day);
  const done = value >= habit.target;
  const streak = streakOf(state, habit, today);
  const ws = state.settings.weekStart;
  const auto = isAuto(habit);

  let meta = describeSchedule(habit.schedule, getLocale(), ws);
  if (isWeekly(habit)) {
    const w = weekOf(day, ws);
    meta = tr(
      `${doneInWeek(state, habit, w, day)}/${weeklyQuota(habit, w)} tuần này`,
      `${doneInWeek(state, habit, w, day)}/${weeklyQuota(habit, w)} this week`,
    );
  }

  return (
    <li className={`habit-row hb-color--${habit.color} ${done ? 'is-done' : ''}`}>
      <span className="habit-row__icon">
        <HabitGlyph icon={habit.icon} />
      </span>
      <a className="habit-row__body" href={routeHref({ name: 'habit', id: habit.id })}>
        <span className="habit-row__name">{habit.name}</span>
        <span className="habit-row__meta">
          {auto && (
            <span className="chip chip--auto">{tr('Tự động · Language', 'Auto · Language')}</span>
          )}
          <span>{meta}</span>
          {habit.target > 1 && (
            <span>
              {value}/{habit.target} {habit.unit}
            </span>
          )}
          {streak.current > 0 && (
            <span className="stat stat--streak" title={tr('Chuỗi hiện tại', 'Current streak')}>
              <FlameIcon size={15} /> {streakLabel(streak.current, streak.unit)}
            </span>
          )}
        </span>
      </a>
      {habit.noteLink && (
        <a
          className="icon-btn habit-row__note"
          href={noteHref(habit.noteLink)}
          target="_blank"
          rel="noopener"
          aria-label={tr(
            `Mở sổ tay của ${habit.name} trong Olaa Note`,
            `Open ${habit.name} notebook in Olaa Note`,
          )}
          title="Olaa Note"
        >
          <ExternalIcon />
        </a>
      )}
      <div className="habit-row__action">
        {auto ? (
          done ? (
            <span className="check is-on is-static" role="img" aria-label={tr('Đã xong', 'Done')}>
              <CheckIcon />
            </span>
          ) : day === today ? (
            <a
              className="btn btn--small btn--accent"
              href={LANGUAGE_URL}
              target="_blank"
              rel="noopener"
            >
              {tr('Học ngay', 'Study now')}
            </a>
          ) : (
            <span className="muted small">{tr('Chưa xong', 'Not done')}</span>
          )
        ) : habit.target === 1 ? (
          <button
            type="button"
            className={`check ${done ? 'is-on' : ''}`}
            aria-pressed={done}
            aria-label={tr(`Đánh dấu xong: ${habit.name}`, `Mark done: ${habit.name}`)}
            disabled={!editable}
            onClick={onTap}
          >
            <CheckIcon />
          </button>
        ) : (
          <div className="stepper" role="group" aria-label={habit.name}>
            <button
              type="button"
              className="icon-btn"
              aria-label={tr('Bớt 1', 'Minus 1')}
              disabled={!editable || value === 0}
              onClick={() => onStep(-1)}
            >
              <MinusIcon />
            </button>
            <button
              type="button"
              className="stepper__value"
              disabled={!editable}
              onClick={onTap}
              aria-label={tr(
                `${habit.name}: ${value} trên ${habit.target} ${habit.unit}. Chạm để thêm 1.`,
                `${habit.name}: ${value} of ${habit.target} ${habit.unit}. Tap to add 1.`,
              )}
            >
              <ProgressRing ratio={value / habit.target} size={46}>
                {done ? <CheckIcon size={18} /> : value}
              </ProgressRing>
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={tr('Thêm 1', 'Plus 1')}
              disabled={!editable}
              onClick={() => onStep(1)}
            >
              <PlusIcon />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
