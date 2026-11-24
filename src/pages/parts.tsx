/** Pieces shared by the Habits screens, built from the Olaa Language / Note components. */
import { routeHref } from '../app/router';
import { HabitGlyph, Icon } from '../components/Icon';
import { toast } from '../components/ui';
import { isAuto, checkInKey, type Habit } from '../features/habit-management/types';
import {
  canEditDay,
  doneInWeek,
  isDoneOn,
  valueOn,
  type DayStatus,
} from '../features/habit-tracking/progress';
import {
  describeSchedule,
  isWeekly,
  weekOf,
  weeklyQuota,
  orderedWeekdays,
  weekdayShort,
} from '../features/scheduling/schedule';
import { streakOf } from '../features/streaks/streaks';
import { getLocale, tr } from '../i18n/locale';
import { LANGUAGE_URL, noteHref } from '../integrations/olaaApps';
import { setMood, setValue, tap } from '../stores/habitActions';
import { habitStore, useHabitState } from '../stores/habitStore';
import { MOODS, type HabitState, type Mood } from '../stores/habitState';
import {
  addMonths,
  fromDayKey,
  monthGrid,
  monthOf,
  today as todayKey,
  type DayKey,
} from '../utils/date';
import { formatDayLong } from '../utils/format';

export function streakLabel(n: number, unit: 'day' | 'week'): string {
  if (unit === 'week') return tr(`${n} tuần`, `${n} ${n === 1 ? 'week' : 'weeks'}`);
  return tr(`${n} ngày`, `${n} ${n === 1 ? 'day' : 'days'}`);
}

export function HabitTile({
  habit,
  size,
}: {
  habit: Pick<Habit, 'icon' | 'color'>;
  size?: 'sm' | 'lg';
}) {
  return (
    <span className={`htile hc--${habit.color}${size ? ` ${size}` : ''}`} aria-hidden="true">
      <HabitGlyph icon={habit.icon} />
    </span>
  );
}

const CHECK = (
  <svg viewBox="0 0 24 24">
    <path d="M6 12.5l4 4 8-9" />
  </svg>
);

/** What a schedule looks like on a given day: "T2, T4", "2/3 tuần này"… */
function metaFor(state: HabitState, habit: Habit, day: DayKey): string {
  if (isWeekly(habit)) {
    const w = weekOf(day, state.settings.weekStart);
    return tr(
      `${doneInWeek(state, habit, w, day)}/${weeklyQuota(habit, w)} tuần này`,
      `${doneInWeek(state, habit, w, day)}/${weeklyQuota(habit, w)} this week`,
    );
  }
  return describeSchedule(habit.schedule, getLocale(), state.settings.weekStart);
}

/**
 * One habit in the day's checklist (Olaa Note prototype `.hab`): the round check ticks it in
 * one tap (NFR-02-001), count habits get − / +, Language habits tick themselves.
 */
export function HabitCheckRow({ habit, day }: { habit: Habit; day: DayKey }) {
  const state = useHabitState();
  const today = todayKey();
  const value = valueOn(state, habit, day);
  const done = value >= habit.target;
  const auto = isAuto(habit);
  const editable = !auto && canEditDay(day, today);
  const streak = streakOf(state, habit, today);
  const count = habit.target > 1;

  const onTap = () => {
    const before = habitStore.getState().checkIns[checkInKey(habit.id, day)]?.value ?? 0;
    habitStore.update((s) => tap(s, habit.id, day, todayKey(), Date.now()));
    const after = habitStore.getState();
    if (!isDoneOn(after, habit, day) && before >= habit.target) {
      toast(tr(`Đã bỏ đánh dấu "${habit.name}"`, `Unchecked "${habit.name}"`), {
        action: {
          label: tr('Hoàn tác', 'Undo'),
          run: () =>
            habitStore.update((s) => setValue(s, habit.id, day, before, todayKey(), Date.now())),
        },
      });
    }
  };
  const step = (delta: number) =>
    habitStore.update((s) =>
      setValue(s, habit.id, day, valueOn(s, habit, day) + delta, todayKey(), Date.now()),
    );

  const checkLabel = auto
    ? done
      ? tr('Đã xong, ghi nhận từ Olaa Language', 'Done, recorded from Olaa Language')
      : tr(
          'Tự đánh dấu khi bạn học ở Olaa Language',
          'Ticks itself when you study in Olaa Language',
        )
    : count
      ? tr(
          `${habit.name}: ${value}/${habit.target} ${habit.unit}. Chạm để thêm 1`,
          `${habit.name}: ${value}/${habit.target} ${habit.unit}. Tap to add 1`,
        )
      : tr(`Đánh dấu xong: ${habit.name}`, `Mark done: ${habit.name}`);

  return (
    <div className={`hab${done ? ' on' : ''}`}>
      <button
        type="button"
        className={`ck${auto ? ' auto' : ''}${count && !done && value > 0 ? ' part' : ''}`}
        style={count ? ({ '--p': value / habit.target } as React.CSSProperties) : undefined}
        aria-pressed={auto ? undefined : done}
        aria-label={checkLabel}
        title={checkLabel}
        disabled={!editable}
        onClick={onTap}
      >
        {CHECK}
      </button>
      <HabitTile habit={habit} size="sm" />
      <span className="hn">
        <a href={routeHref({ name: 'habit', id: habit.id })}>{habit.name}</a>
        <span className="meta">
          {auto && (
            <span className="tag tag--lang">
              <span
                className="apptile apptile--lang sm"
                aria-hidden="true"
                style={{ width: 14, height: 14, borderRadius: 4 }}
              >
                <span className="gl" style={{ fontSize: 7 }}>
                  Aa
                </span>
              </span>
              Language
            </span>
          )}
          <span className="tag">{metaFor(state, habit, day)}</span>
          {count && (
            <span className="tag">
              {value}/{habit.target} {habit.unit}
            </span>
          )}
          {streak.current > 0 && (
            <span className="flame" title={tr('Chuỗi hiện tại', 'Current streak')}>
              <Icon name="flame" />
              {streakLabel(streak.current, streak.unit)}
            </span>
          )}
        </span>
      </span>
      <span className="side">
        {habit.noteLink && (
          <a
            className="iconbtn"
            style={{ width: 34, height: 34, minWidth: 34 }}
            href={noteHref(habit.noteLink)}
            target="_blank"
            rel="noopener"
            aria-label={tr(
              `Mở sổ tay của "${habit.name}" trong Olaa Note`,
              `Open the "${habit.name}" notebook in Olaa Note`,
            )}
            title="Olaa Note"
          >
            <Icon name="note" size="sm" />
          </a>
        )}
        {auto && !done && day === today && (
          <a className="btn btn--sm" href={LANGUAGE_URL} target="_blank" rel="noopener">
            {tr('Học ngay', 'Study now')}
          </a>
        )}
        {count && editable && (
          <span className="stepper" role="group" aria-label={habit.name}>
            <button
              type="button"
              aria-label={tr('Bớt 1', 'Minus 1')}
              disabled={value === 0}
              onClick={() => step(-1)}
            >
              <Icon name="minus" />
            </button>
            <output aria-live="polite">
              {value}/{habit.target}
            </output>
            <button type="button" aria-label={tr('Thêm 1', 'Plus 1')} onClick={() => step(1)}>
              <Icon name="plus" />
            </button>
          </span>
        )}
      </span>
    </div>
  );
}

/* ---------- moods ---------- */

export const MOOD_FACE: Record<Mood, string> = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  low: '😕',
  rough: '😫',
};
export function moodLabel(m: Mood): string {
  return {
    great: tr('Rất vui', 'Great'),
    good: tr('Vui', 'Good'),
    okay: tr('Bình thường', 'Okay'),
    low: tr('Hơi mệt', 'Low'),
    rough: tr('Mệt mỏi', 'Rough'),
  }[m];
}

/** "How was the day?" (Olaa Note prototype mood picker). Tap again to clear. */
export function MoodPicker({ day }: { day: DayKey }) {
  const state = useHabitState();
  const current = state.moods[day] ?? null;
  return (
    <div className="moods" role="group" aria-label={tr('Tâm trạng trong ngày', 'Mood of the day')}>
      {MOODS.map((m) => (
        <button
          key={m}
          type="button"
          className="mood"
          aria-pressed={current === m}
          aria-label={moodLabel(m)}
          title={moodLabel(m)}
          onClick={() =>
            habitStore.update((s) => setMood(s, day, current === m ? null : m, todayKey()))
          }
        >
          <span aria-hidden="true">{MOOD_FACE[m]}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- month calendar ---------- */

export type CalMark = DayStatus | 'none';

export function statusText(s: CalMark): string {
  switch (s) {
    case 'done':
      return tr('đã xong', 'done');
    case 'partial':
      return tr('làm một phần', 'partly done');
    case 'frozen':
      return tr('đóng băng', 'frozen');
    case 'missed':
      return tr('bị lỡ', 'missed');
    case 'pending':
      return tr('chưa xong', 'not done yet');
    case 'open':
      return tr('chưa làm', 'not done');
    case 'future':
      return tr('sắp tới', 'upcoming');
    default:
      return tr('không có lịch', 'nothing scheduled');
  }
}

/**
 * Month calendar in the Note prototype's style: a dot per day (filled = done, soft = partly,
 * blue ring = frozen, hatched = missed), the share of habits done as a bar, and the day's mood.
 */
export function MonthCalendar({
  month,
  onMonth,
  markOf,
  ratioOf,
  selected,
  onDay,
}: {
  month: string;
  onMonth: (month: string) => void;
  markOf: (day: DayKey) => CalMark;
  ratioOf?: (day: DayKey) => number;
  selected?: DayKey;
  onDay?: (day: DayKey) => void;
}) {
  const state = useHabitState();
  const today = todayKey();
  const locale = getLocale();
  const ws = state.settings.weekStart;
  const title = fromDayKey(`${month}-01`).toLocaleDateString(locale === 'en' ? 'en-GB' : 'vi-VN', {
    month: 'long',
    year: 'numeric',
  });
  return (
    <>
      <div className="cal__head">
        <button
          type="button"
          className="iconbtn"
          aria-label={tr('Tháng trước', 'Previous month')}
          onClick={() => onMonth(addMonths(month, -1))}
        >
          <Icon name="back" />
        </button>
        <h3 style={{ textTransform: 'capitalize' }} aria-live="polite">
          {title}
        </h3>
        <button
          type="button"
          className="iconbtn"
          aria-label={tr('Tháng sau', 'Next month')}
          onClick={() => onMonth(addMonths(month, 1))}
        >
          <Icon name="next" />
        </button>
      </div>
      <div className="cal" role="grid" aria-label={title}>
        {orderedWeekdays(ws).map((d) => (
          <div key={d} className="cal__dow" role="columnheader">
            {weekdayShort(d, locale)}
          </div>
        ))}
        {monthGrid(month, ws)
          .flat()
          .map((day) => {
            if (monthOf(day) !== month)
              return <div key={day} className="cal__day out" aria-hidden="true" />;
            const mark = markOf(day);
            const mood = state.moods[day];
            const ratio = ratioOf?.(day);
            const label = `${formatDayLong(day)}: ${statusText(mark)}${mood ? `, ${moodLabel(mood)}` : ''}`;
            const inner = (
              <>
                {Number(day.slice(8))}
                <span className="dot">
                  {mark === 'done' && CHECK}
                  {mark === 'frozen' && <Icon name="snow" size="sm" />}
                </span>
                {ratio !== undefined && (
                  <span className="cal__bar">
                    <i style={{ width: `${Math.round(ratio * 100)}%` }} />
                  </span>
                )}
                {mood && (
                  <span className="mo" aria-hidden="true">
                    {MOOD_FACE[mood]}
                  </span>
                )}
              </>
            );
            const common = {
              className: 'cal__day',
              'data-mark': mark,
              'data-today': day === today,
              title: label,
            };
            return onDay ? (
              <button
                key={day}
                type="button"
                {...common}
                role="gridcell"
                aria-label={label}
                aria-pressed={selected === day}
                onClick={() => onDay(day)}
              >
                {inner}
              </button>
            ) : (
              <div key={day} {...common} role="gridcell" aria-label={label}>
                {inner}
              </div>
            );
          })}
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'var(--check)' }} />
          {tr('Xong', 'Done')}
        </span>
        <span>
          <i style={{ background: 'var(--warm-soft)' }} />
          {tr('Một phần', 'Partly')}
        </span>
        <span>
          <i style={{ border: '1.5px solid var(--sky)' }} />
          {tr('Đóng băng', 'Frozen')}
        </span>
        <span>
          <i
            style={{
              border: '1.5px solid var(--ink-3)',
              background:
                'repeating-linear-gradient(135deg, var(--line) 0 3px, transparent 3px 6px)',
            }}
          />
          {tr('Bị lỡ', 'Missed')}
        </span>
      </div>
    </>
  );
}
