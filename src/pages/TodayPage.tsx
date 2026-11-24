/**
 * Today: the Olaa Language / Note "Today" layout — a hero ring for the day, the week, the
 * habit checklist grouped by time of day, the mood of the day, freezes, a tip, and the cards
 * for Olaa Language and Olaa Note.
 */
import { useState } from 'react';
import { navigate, routeHref } from '../app/router';
import { Icon } from '../components/Icon';
import { AppTile, Confetti, Ring, toast, useToday } from '../components/ui';
import { createHabit, freezeDay, unfreezeDay } from '../stores/habitActions';
import { BADGE_IDS } from '../features/gamification/badges';
import { TEMPLATES } from '../features/habit-management/templates';
import type { Habit, TimeOfDay } from '../features/habit-management/types';
import { canEditDay, dayProgress, isFrozen, isOnAgenda } from '../features/habit-tracking/progress';
import { insightsFor } from '../features/insights/insights';
import { weekdayShort } from '../features/scheduling/schedule';
import { canFreeze, freezesLeftInMonth } from '../features/streaks/freezes';
import { fullDayStreak } from '../features/streaks/streaks';
import { getLocale, tr } from '../i18n/locale';
import { LANGUAGE_URL, TAKENOTE_URL } from '../integrations/olaaApps';
import { useAccount } from '../services/cloudSync';
import { habitStore, useHabitState } from '../stores/habitStore';
import { monthOf, today as todayKey, weekDays, weekday, type DayKey } from '../utils/date';
import { formatDayLong } from '../utils/format';
import { HabitCheckRow, HabitTile, MoodPicker } from './parts';

const GROUPS: { id: TimeOfDay; label: [string, string] }[] = [
  { id: 'any', label: ['Cả ngày', 'Any time'] },
  { id: 'morning', label: ['Buổi sáng', 'Morning'] },
  { id: 'afternoon', label: ['Buổi chiều', 'Afternoon'] },
  { id: 'evening', label: ['Buổi tối', 'Evening'] },
];

export function TodayPage({ day: dayParam }: { day: string | null }) {
  const state = useHabitState();
  const today = useToday();
  const account = useAccount();
  const day: DayKey = dayParam && dayParam <= today ? dayParam : today;
  const isToday = day === today;
  const ws = state.settings.weekStart;
  const [celebrate, setCelebrate] = useState(false);

  const agenda = Object.values(state.habits)
    .filter((h) => isOnAgenda(state, h, day, ws))
    .sort(
      (a, b) =>
        Number(b.source.kind !== 'manual') - Number(a.source.kind !== 'manual') ||
        a.order - b.order,
    );
  const p = dayProgress(state, day);
  const hasHabits = Object.values(state.habits).some((h) => h.archivedAt === null);
  const freezesLeft = freezesLeftInMonth(state, monthOf(day));
  const frozen = isFrozen(state, day);
  const insight = isToday ? insightsFor(state, today)[0] : undefined;
  const autoHabits = agenda.filter((h) => h.source.kind !== 'manual').length;

  // Celebrate the moment the day becomes complete.
  const wasComplete = p.total > 0 && p.done === p.total;
  const onChange = () => {
    const after = dayProgress(habitStore.getState(), day);
    if (!wasComplete && after.total > 0 && after.done === after.total) {
      setCelebrate(true);
      toast(tr('Xong hết rồi. Một ngày trọn vẹn!', 'All done. A full day!'), { reward: true });
      setTimeout(() => setCelebrate(false), 2600);
    }
  };

  const hour = new Date().getHours();
  const greet = !isToday
    ? tr('Xem lại', 'Looking back')
    : hour < 11
      ? tr('Chào buổi sáng', 'Good morning')
      : hour < 18
        ? tr('Chào buổi chiều', 'Good afternoon')
        : tr('Chào buổi tối', 'Good evening');

  return (
    <div className="grid grid--today">
      {celebrate && <Confetti />}
      <div className="stack">
        <section className="card hero">
          <Ring
            value={p.total ? p.done / p.total : 0}
            size={96}
            width={9}
            warm
            label={tr(`${p.done} trên ${p.total} thói quen`, `${p.done} of ${p.total} habits`)}
          >
            <b>{p.done}</b>
            <small>/{p.total}</small>
          </Ring>
          <div>
            <p className="eyebrow">{greet}</p>
            <h1>{formatDayLong(day)}</h1>
            <p className="muted small">
              {!hasHabits
                ? tr('Thêm thói quen đầu tiên để bắt đầu.', 'Add your first habit to begin.')
                : p.total === 0
                  ? tr(
                      'Không có thói quen nào cho ngày này. Nghỉ ngơi nhé.',
                      'Nothing scheduled for this day. Enjoy the rest.',
                    )
                  : p.done === p.total
                    ? tr(
                        'Xong hết rồi. Phần còn lại của ngày là của bạn.',
                        'All done. The rest of the day is yours.',
                      )
                    : tr(`Còn ${p.total - p.done} thói quen nữa.`, `${p.total - p.done} to go.`)}
            </p>
          </div>
          <div className="stats" style={{ gridColumn: '1 / -1' }}>
            <div className="stat">
              <b>{fullDayStreak(state, today)}</b>
              <span>{tr('ngày trọn vẹn liên tiếp', 'full days in a row')}</span>
            </div>
            <div className="stat">
              <b>{freezesLeft}</b>
              <span>{tr('lượt đóng băng còn lại', 'freezes left')}</span>
            </div>
            <div className="stat">
              <b>
                {Object.keys(state.badges).length}/{BADGE_IDS.length}
              </b>
              <span>{tr('huy hiệu', 'badges')}</span>
            </div>
          </div>
          <nav
            className="week"
            style={{ gridColumn: '1 / -1' }}
            aria-label={tr('Tuần này', 'This week')}
          >
            {weekDays(today, ws).map((d) => {
              const dp = dayProgress(state, d);
              const future = d > today;
              const name = weekdayShort(weekday(d), getLocale());
              const ring = (
                <Ring
                  value={future ? 0 : dp.total ? dp.done / dp.total : 0}
                  size={34}
                  width={3.5}
                  warm
                >
                  <b>{Number(d.slice(8))}</b>
                </Ring>
              );
              return future ? (
                <span
                  key={d}
                  className={`wk${isFrozen(state, d) ? ' frozen' : ''}`}
                  aria-hidden="true"
                >
                  {name}
                  {ring}
                </span>
              ) : (
                <a
                  key={d}
                  href={routeHref({ name: 'today', day: d === today ? null : d })}
                  aria-current={d === day ? 'date' : undefined}
                  className={isFrozen(state, d) ? 'frozen' : undefined}
                  aria-label={`${formatDayLong(d)}: ${dp.done}/${dp.total}`}
                >
                  {name}
                  {ring}
                </a>
              );
            })}
          </nav>
        </section>

        {!hasHabits ? (
          <Welcome />
        ) : (
          <section className="card">
            <h2>
              <AppTile app="habit" size="sm" />
              {isToday
                ? tr('Thói quen hôm nay', 'Today’s habits')
                : tr('Thói quen ngày này', 'Habits that day')}
              <small>{tr(`${p.done}/${p.total} xong`, `${p.done} of ${p.total} done`)}</small>
            </h2>
            {!canEditDay(day, today) && (
              <p className="small muted" style={{ marginBottom: 8 }}>
                {tr(
                  'Chỉ sửa được hôm nay và 2 ngày trước. Ngày này chỉ để xem.',
                  'Only today and the 2 days before can be changed. This day is read-only.',
                )}
              </p>
            )}
            {agenda.length === 0 ? (
              <p className="muted small">
                {tr('Không có thói quen nào đến hạn.', 'Nothing is due.')}
              </p>
            ) : (
              <div onClickCapture={() => setTimeout(onChange, 0)}>
                {GROUPS.map((g) => {
                  const items = agenda.filter((h: Habit) => h.timeOfDay === g.id);
                  if (!items.length) return null;
                  return (
                    <div key={g.id}>
                      <p className="eyebrow hgroup">{tr(...g.label)}</p>
                      <div className="hlist">
                        {items.map((h) => (
                          <HabitCheckRow key={h.id} habit={h} day={day} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="row" style={{ marginTop: 12 }}>
              <a className="btn btn--sm btn--ghost" href={routeHref({ name: 'new' })}>
                <Icon name="plus" /> {tr('Thói quen mới', 'New habit')}
              </a>
            </div>
          </section>
        )}
      </div>

      <div className="stack">
        <section className="card">
          <h2>
            {isToday
              ? tr('Hôm nay thế nào?', 'How’s today?')
              : tr('Ngày này thế nào?', 'How was that day?')}
          </h2>
          <MoodPicker day={day} />
        </section>

        {hasHabits && (isToday || frozen) && (
          <section className="card">
            <h2>
              <Icon name="snow" /> {tr('Đóng băng chuỗi', 'Streak freeze')}
              <small>
                {tr(
                  `còn ${freezesLeft}/${state.settings.freezesPerMonth}`,
                  `${freezesLeft}/${state.settings.freezesPerMonth} left`,
                )}
              </small>
            </h2>
            {frozen ? (
              <div className="stack">
                <p className="small">
                  {tr(
                    'Ngày này được đóng băng: mọi chuỗi giữ nguyên.',
                    'This day is frozen: every streak holds.',
                  )}
                </p>
                {isToday && (
                  <div className="row">
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      onClick={() => habitStore.update((s) => unfreezeDay(s, day, todayKey()))}
                    >
                      {tr('Bỏ đóng băng', 'Unfreeze')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="stack">
                <p className="small muted">
                  {tr(
                    'Hôm nay bận (thi, đi xa, ốm)? Đóng băng để giữ chuỗi. Lên kế hoạch cho các ngày sau ở mục Lịch.',
                    'Busy today (exam, travel, sick)? Freeze it to keep your streaks. Plan later days in Calendar.',
                  )}
                </p>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    disabled={canFreeze(state, day, today) !== 'ok'}
                    onClick={() => {
                      habitStore.update((s) => freezeDay(s, day, todayKey(), Date.now()));
                      toast(tr('Đã đóng băng hôm nay.', 'Today is frozen.'), {
                        action: {
                          label: tr('Hoàn tác', 'Undo'),
                          run: () => habitStore.update((s) => unfreezeDay(s, day, todayKey())),
                        },
                      });
                    }}
                  >
                    <Icon name="snow" /> {tr('Đóng băng hôm nay', 'Freeze today')}
                  </button>
                  <a className="btn btn--sm btn--text" href={routeHref({ name: 'calendar' })}>
                    {tr('Mở lịch', 'Open calendar')}
                  </a>
                </div>
              </div>
            )}
          </section>
        )}

        {insight && (
          <section className="card insight">
            <Icon name="sparkle" />
            <p className="small">{getLocale() === 'en' ? insight.en : insight.vi}</p>
          </section>
        )}

        <section className="card appcard">
          <AppTile app="lang" size="lg" />
          <b>Olaa Language</b>
          <p>
            {account.email
              ? tr(
                  autoHabits
                    ? `${autoHabits} thói quen học tự đánh dấu khi bạn học xong.`
                    : 'Thêm thói quen học từ Language để tự đánh dấu khi bạn học.',
                  autoHabits
                    ? `${autoHabits} study habits tick themselves when you finish.`
                    : 'Add a Language study habit that ticks itself when you study.',
                )
              : account.status === 'off'
                ? tr(
                    'Bản này chưa bật Olaa ID, nên chưa nhận được kết quả học.',
                    'Olaa ID is not set up in this build, so study results cannot arrive yet.',
                  )
                : tr(
                    'Đăng nhập Olaa ID ở Hồ sơ để thói quen học tự đánh dấu.',
                    'Sign in with Olaa ID (Me) so study habits tick themselves.',
                  )}
          </p>
          <div className="row">
            <a
              className="btn btn--sm btn--ghost"
              href={LANGUAGE_URL}
              target="_blank"
              rel="noopener"
            >
              {tr('Học ngay', 'Study now')}
            </a>
            {!account.email && account.status !== 'off' && (
              <a className="btn btn--sm btn--text" href="#/me">
                {tr('Đăng nhập', 'Sign in')}
              </a>
            )}
          </div>
        </section>

        <section className="card appcard">
          <AppTile app="note" size="lg" />
          <b>Olaa Note</b>
          <p>
            {tr(
              'Gắn sổ tay cho thói quen để mở nhanh, và chép nhật ký thói quen sang một trang ghi chú.',
              'Link a notebook to a habit to open it fast, and copy a habit journal into a note page.',
            )}
          </p>
          <div className="row">
            <a
              className="btn btn--sm btn--ghost"
              href={TAKENOTE_URL}
              target="_blank"
              rel="noopener"
            >
              {tr('Mở Note', 'Open Note')}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

/** First run: learning templates first, one tap to add (REQ-02-004). */
function Welcome() {
  const en = getLocale() === 'en';
  const add = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    const name = en ? t.name[1] : t.name[0];
    const unit = t.unit ? (en ? t.unit[1] : t.unit[0]) : '';
    habitStore.update(
      (s) => createHabit(s, { ...t.make(todayKey()), name, unit }, Date.now()).state,
    );
  };
  return (
    <section className="card welcome-card">
      <h2>{tr('Bắt đầu với một thói quen nhỏ', 'Start with one small habit')}</h2>
      <p className="muted small">
        {tr(
          'Thói quen học từ Olaa Language tự đánh dấu khi bạn học thật. Chọn một mẫu, hoặc tự tạo.',
          'Study habits from Olaa Language tick themselves when you really study. Pick a template or make your own.',
        )}
      </p>
      <div className="tpl">
        {TEMPLATES.map((t) => {
          const preview = t.make(todayKey());
          return (
            <button key={t.id} type="button" onClick={() => add(t.id)}>
              <HabitTile habit={preview} size="sm" />
              {en ? t.name[1] : t.name[0]}
            </button>
          );
        })}
      </div>
      <div className="row">
        <button type="button" className="btn" onClick={() => navigate({ name: 'new' })}>
          <Icon name="plus" /> {tr('Tự tạo thói quen', 'Create my own')}
        </button>
      </div>
    </section>
  );
}
