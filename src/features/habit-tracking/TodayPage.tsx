import { useState } from 'react';
import { navigate, routeHref } from '../../app/router';
import { BoltIcon, PlusIcon, SnowIcon } from '../../components/Icons';
import { showToast } from '../../components/Toast';
import { getLocale, tr } from '../../i18n/locale';
import { createHabit, freezeDay, setValue, tap, unfreezeDay } from '../../stores/habitActions';
import { habitStore, useHabitState } from '../../stores/habitStore';
import { today as todayKey, weekDays, weekday, monthOf, type DayKey } from '../../utils/date';
import { formatDayLong } from '../../utils/format';
import { checkInKey, type Habit, type TimeOfDay } from '../habit-management/types';
import { TEMPLATES } from '../habit-management/templates';
import { insightsFor } from '../insights/insights';
import { weekdayShort } from '../scheduling/schedule';
import { canFreeze, freezesLeftInMonth } from '../streaks/freezes';
import { HabitRow } from './HabitRow';
import { ProgressRing } from './ProgressRing';
import { canEditDay, dayProgress, isDoneOn, isFrozen, isOnAgenda } from './progress';

const GROUPS: { id: TimeOfDay; label: () => string }[] = [
  { id: 'any', label: () => tr('Cả ngày', 'Any time') },
  { id: 'morning', label: () => tr('Buổi sáng', 'Morning') },
  { id: 'afternoon', label: () => tr('Buổi chiều', 'Afternoon') },
  { id: 'evening', label: () => tr('Buổi tối', 'Evening') },
];

/** Main screen: the day's habits, checked off in one tap (NFR-02-001). */
export function TodayPage({ day: dayParam }: { day: string | null }) {
  const state = useHabitState();
  const today = todayKey();
  const day: DayKey = dayParam && dayParam <= today ? dayParam : today;
  const isToday = day === today;
  const ws = state.settings.weekStart;
  const [confirmFreeze, setConfirmFreeze] = useState(false);

  const agenda = Object.values(state.habits)
    .filter((h) => isOnAgenda(state, h, day, ws))
    .sort(
      (a, b) =>
        Number(b.source.kind !== 'manual') - Number(a.source.kind !== 'manual') ||
        a.order - b.order,
    );
  const progress = dayProgress(state, day);
  const frozen = isFrozen(state, day);
  const freezesLeft = freezesLeftInMonth(state, monthOf(day));
  const editable = canEditDay(day, today);
  const hasHabits = Object.values(state.habits).some((h) => h.archivedAt === null);
  const insight = isToday ? insightsFor(state, today)[0] : undefined;

  const onTap = (h: Habit) => {
    const before = state.checkIns[checkInKey(h.id, day)]?.value ?? 0;
    const allDoneBefore = progress.total > 0 && progress.done === progress.total;
    habitStore.update((s) => tap(s, h.id, day, today, Date.now()));
    const after = habitStore.getState();
    const p = dayProgress(after, day);
    if (!allDoneBefore && p.total > 0 && p.done === p.total) {
      showToast({
        text: tr('Xong hết rồi. Một ngày trọn vẹn!', 'All done. A full day!'),
        tone: 'reward',
      });
    } else if (h.target === 1 && !isDoneOn(after, h, day)) {
      showToast({
        text: tr(`Đã bỏ đánh dấu "${h.name}"`, `Unchecked "${h.name}"`),
        action: {
          label: tr('Hoàn tác', 'Undo'),
          run: () =>
            habitStore.update((s) => setValue(s, h.id, day, before, todayKey(), Date.now())),
        },
      });
    }
  };

  const onStep = (h: Habit, delta: number) => {
    const current = habitStore.getState().checkIns[checkInKey(h.id, day)]?.value ?? 0;
    habitStore.update((s) => setValue(s, h.id, day, current + delta, today, Date.now()));
  };

  return (
    <div className="page today">
      <header className="page__head">
        <div>
          <p className="eyebrow">
            {isToday ? tr('Hôm nay', 'Today') : tr('Xem lại', 'Looking back')}
          </p>
          <h1>{formatDayLong(day)}</h1>
        </div>
        <a className="btn" href={routeHref({ name: 'new' })}>
          <PlusIcon /> {tr('Thói quen', 'Habit')}
        </a>
      </header>

      <ol className="week-strip" aria-label={tr('Tuần này', 'This week')}>
        {weekDays(today, ws).map((d) => {
          const p = dayProgress(state, d);
          const future = d > today;
          const label = weekdayShort(weekday(d), getLocale());
          return (
            <li key={d}>
              <a
                className={`week-day ${d === day ? 'is-selected' : ''} ${future ? 'is-future' : ''}`}
                href={
                  future ? undefined : routeHref({ name: 'today', day: d === today ? null : d })
                }
                aria-current={d === day ? 'date' : undefined}
                aria-label={`${formatDayLong(d)}: ${p.done}/${p.total}`}
              >
                <span className="week-day__name">{label}</span>
                <ProgressRing ratio={future ? 0 : p.ratio} size={38} frozen={isFrozen(state, d)}>
                  {Number(d.slice(8))}
                </ProgressRing>
              </a>
            </li>
          );
        })}
      </ol>

      {hasHabits && (
        <section
          className="card summary"
          aria-label={tr('Tiến độ trong ngày', 'Progress for the day')}
        >
          <div className="summary__row">
            <strong>
              {progress.total === 0
                ? tr('Không có thói quen nào cho ngày này', 'Nothing scheduled for this day')
                : tr(
                    `${progress.done}/${progress.total} thói quen`,
                    `${progress.done} of ${progress.total} habits`,
                  )}
            </strong>
            <span className="muted small">
              <SnowIcon size={14} />{' '}
              {tr(
                `Còn ${freezesLeft} lượt đóng băng tháng này`,
                `${freezesLeft} freezes left this month`,
              )}
            </span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.done}
          >
            <div className="progress__fill" style={{ width: `${progress.ratio * 100}%` }} />
          </div>
          {frozen ? (
            <p className="freeze-note">
              <SnowIcon size={16} />{' '}
              {tr(
                'Ngày này được đóng băng: chuỗi giữ nguyên.',
                'This day is frozen: streaks hold.',
              )}
              {isToday && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => habitStore.update((s) => unfreezeDay(s, day, today))}
                >
                  {tr('Bỏ đóng băng', 'Unfreeze')}
                </button>
              )}
            </p>
          ) : (
            isToday &&
            progress.done < progress.total &&
            canFreeze(state, day, today) === 'ok' &&
            (confirmFreeze ? (
              <div className="freeze-confirm">
                <p>
                  {tr(
                    `Hôm nay bận? Đóng băng để giữ chuỗi. Dùng 1 trong ${freezesLeft} lượt còn lại của tháng.`,
                    `Busy today? Freeze it to keep your streaks. Uses 1 of your ${freezesLeft} freezes left this month.`,
                  )}
                </p>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => {
                      habitStore.update((s) => freezeDay(s, day, today, Date.now()));
                      setConfirmFreeze(false);
                    }}
                  >
                    <SnowIcon size={16} /> {tr('Đóng băng hôm nay', 'Freeze today')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => setConfirmFreeze(false)}
                  >
                    {tr('Thôi', 'Not now')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="link-btn freeze-link"
                onClick={() => setConfirmFreeze(true)}
              >
                <SnowIcon size={16} />{' '}
                {tr('Hôm nay bận? Đóng băng chuỗi', 'Busy today? Freeze streaks')}
              </button>
            ))
          )}
          {!editable && (
            <p className="muted small">
              {tr(
                'Chỉ sửa được hôm nay và 2 ngày trước. Ngày này chỉ để xem.',
                'Only today and the 2 days before can be changed. This day is read-only.',
              )}
            </p>
          )}
        </section>
      )}

      {insight && (
        <aside className="card insight">
          <BoltIcon /> <span>{getLocale() === 'en' ? insight.en : insight.vi}</span>
        </aside>
      )}

      {!hasHabits ? (
        <EmptyToday />
      ) : (
        GROUPS.map((g) => {
          const items = agenda.filter((h) => h.timeOfDay === g.id);
          if (items.length === 0) return null;
          return (
            <section key={g.id} className="habit-group" aria-labelledby={`group-${g.id}`}>
              <h2 id={`group-${g.id}`} className="group-title">
                {g.label()}
              </h2>
              <ul className="habit-list">
                {items.map((h) => (
                  <HabitRow
                    key={h.id}
                    habit={h}
                    day={day}
                    today={today}
                    editable={editable}
                    onTap={() => onTap(h)}
                    onStep={(d) => onStep(h, d)}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}

      {hasHabits && agenda.length === 0 && (
        <div className="card empty">
          <p>
            {tr(
              'Hôm nay không có thói quen nào đến hạn. Nghỉ ngơi nhé.',
              'Nothing is due today. Enjoy the rest.',
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/** First run: suggest learning habits, one tap to add. */
function EmptyToday() {
  const locale = getLocale();
  const add = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    const name = locale === 'en' ? t.name[1] : t.name[0];
    const unit = t.unit ? (locale === 'en' ? t.unit[1] : t.unit[0]) : '';
    habitStore.update(
      (s) => createHabit(s, { ...t.make(todayKey()), name, unit }, Date.now()).state,
    );
  };
  return (
    <section className="card empty welcome">
      <h2>{tr('Bắt đầu với một thói quen nhỏ', 'Start with one small habit')}</h2>
      <p>
        {tr(
          'Thói quen học tập từ Olaa Language được đánh dấu tự động khi bạn học thật. Chọn một mẫu, hoặc tự tạo.',
          'Learning habits from Olaa Language check themselves off when you really study. Pick a template or make your own.',
        )}
      </p>
      <div className="template-grid">
        {TEMPLATES.slice(0, 6).map((t) => (
          <button key={t.id} type="button" className="choice" onClick={() => add(t.id)}>
            <PlusIcon /> {locale === 'en' ? t.name[1] : t.name[0]}
          </button>
        ))}
      </div>
      <button type="button" className="btn" onClick={() => navigate({ name: 'new' })}>
        {tr('Tự tạo thói quen', 'Create my own')}
      </button>
    </section>
  );
}
