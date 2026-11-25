/** One habit: streaks, strength, calendar, recent days with notes, Olaa Note and Language links. */
import { useState } from 'react';
import { navigate, routeHref } from '../app/router';
import { Icon } from '../components/Icon';
import { AppTile, BackLink, Dialog, Empty, Ring, toast, useToday } from '../components/ui';
import { isAuto, checkInKey, type Habit } from '../features/habit-management/types';
import {
  canEditDay,
  dayStatus,
  valueOn,
  EDIT_WINDOW_DAYS,
} from '../features/habit-tracking/progress';
import { describeSchedule } from '../features/scheduling/schedule';
import { completionRate, weeklyTotals } from '../features/statistics/stats';
import { streakOf, strengthOf } from '../features/streaks/streaks';
import { getLocale, tr } from '../i18n/locale';
import { LANGUAGE_URL, noteHref } from '../integrations/olaaApps';
import { journalText } from '../integrations/takenote';
import { useAccount } from '../services/cloudSync';
import { moveHabit, NOTE_MAX, setArchived, setNote, setValue } from '../stores/habitActions';
import { habitStore, useHabitState } from '../stores/habitStore';
import { addDays, monthOf, today as todayKey, type DayKey } from '../utils/date';
import { formatDayLong, percent } from '../utils/format';
import { HabitTile, MonthCalendar, streakLabel } from './parts';
import { WeekBars } from './StatsPage';

export function HabitPage({ habitId }: { habitId: string }) {
  const state = useHabitState();
  const today = useToday();
  const [month, setMonth] = useState(monthOf(today));
  const [confirmArchive, setConfirmArchive] = useState(false);
  const habit = state.habits[habitId];

  if (!habit)
    return (
      <>
        <BackLink to="#habits">{tr('Thói quen', 'Habits')}</BackLink>
        <section className="card">
          <Empty
            icon="habits"
            title={tr('Không tìm thấy thói quen này', 'This habit was not found')}
          />
        </section>
      </>
    );

  const streak = streakOf(state, habit, today);
  const strength = strengthOf(state, habit, today);
  const rate = completionRate(state, habit, today, 30);
  const auto = isAuto(habit);
  const recent = Array.from({ length: EDIT_WINDOW_DAYS + 1 }, (_, i) => addDays(today, -i)).filter(
    (d) => d >= habit.startDate,
  );
  const journal = Object.values(state.checkIns)
    .filter((c) => c.habitId === habit.id && c.note.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const copyJournal = async () => {
    try {
      await navigator.clipboard.writeText(journalText(habit, journal, getLocale()));
      toast(
        tr(
          'Đã chép nhật ký. Dán vào một trang Olaa Note.',
          'Journal copied. Paste it into an Olaa Note page.',
        ),
      );
    } catch {
      toast(tr('Trình duyệt không cho chép.', 'The browser blocked copying.'));
    }
    window.open(noteHref(habit.noteLink), '_blank', 'noopener');
  };

  return (
    <>
      <BackLink to="#habits">{tr('Thói quen', 'Habits')}</BackLink>
      <section className="card habit-head" style={{ marginTop: 8 }}>
        <HabitTile habit={habit} size="lg" />
        <div>
          <h1>{habit.name}</h1>
          <p className="muted small">
            {describeSchedule(habit.schedule, getLocale(), state.settings.weekStart)}
            {habit.target > 1 && ` · ${habit.target} ${habit.unit}`}
            {habit.reminder && ` · ${tr('nhắc lúc', 'reminder')} ${habit.reminder}`}
          </p>
          {auto && (
            <span className="tag tag--lang" style={{ marginTop: 6 }}>
              {tr('Tự động từ Olaa Language', 'Auto from Olaa Language')}
            </span>
          )}
        </div>
        <a className="btn btn--sm btn--ghost" href={routeHref({ name: 'edit', id: habit.id })}>
          <Icon name="edit" /> {tr('Sửa', 'Edit')}
        </a>
        {habit.why && (
          <p className="why" style={{ gridColumn: '1 / -1' }}>
            <b>{tr('Vì sao: ', 'Why: ')}</b>
            {habit.why}
          </p>
        )}
        <div
          className="stats"
          style={{
            gridColumn: '1 / -1',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            marginTop: 0,
          }}
        >
          <div className="stat">
            <b style={{ color: 'var(--warm)' }}>{streakLabel(streak.current, streak.unit)}</b>
            <span>{tr('chuỗi hiện tại', 'current streak')}</span>
          </div>
          <div className="stat">
            <b>{streakLabel(streak.best, streak.unit)}</b>
            <span>{tr('chuỗi dài nhất', 'best streak')}</span>
          </div>
          <div className="stat">
            <b>{percent(strength)}</b>
            <span>{tr('độ bền thói quen', 'habit strength')}</span>
          </div>
          <div className="stat">
            <b>{percent(rate.ratio)}</b>
            <span>{tr('hoàn thành 30 ngày', '30-day completion')}</span>
          </div>
        </div>
      </section>

      <div className="grid grid--2" style={{ marginTop: 14, alignItems: 'start' }}>
        <div className="stack">
          <section className="card">
            <h2>
              {tr('Mấy ngày gần đây', 'Recent days')}
              <small>
                {auto
                  ? tr('tự ghi nhận', 'recorded for you')
                  : tr('sửa được 3 ngày', 'editable for 3 days')}
              </small>
            </h2>
            <div className="days">
              {recent.map((d) => (
                <RecentDay key={d} habit={habit} day={d} />
              ))}
            </div>
          </section>

          {auto ? <LanguageCard /> : null}

          <section className="card appcard">
            <AppTile app="note" size="lg" />
            <b>Olaa Note</b>
            <p>
              {habit.noteLink
                ? tr(
                    'Thói quen này gắn với một sổ tay trong Olaa Note.',
                    'This habit is linked to an Olaa Note notebook.',
                  )
                : tr(
                    'Gắn một sổ tay (ví dụ sổ từ vựng) để mở nhanh khi làm thói quen.',
                    'Link a notebook (e.g. your vocabulary notebook) to open it right from the habit.',
                  )}
            </p>
            <div className="row">
              <a
                className="btn btn--sm btn--ghost"
                href={noteHref(habit.noteLink)}
                target="_blank"
                rel="noopener"
              >
                <Icon name="external" />{' '}
                {habit.noteLink ? tr('Mở sổ tay', 'Open notebook') : tr('Mở Note', 'Open Note')}
              </a>
              {journal.length > 0 && (
                <button
                  type="button"
                  className="btn btn--sm btn--text"
                  onClick={() => void copyJournal()}
                >
                  {tr('Chép nhật ký sang Note', 'Copy journal to Note')}
                </button>
              )}
              {!habit.noteLink && (
                <a
                  className="btn btn--sm btn--text"
                  href={routeHref({ name: 'edit', id: habit.id })}
                >
                  {tr('Gắn sổ tay', 'Link a notebook')}
                </a>
              )}
            </div>
          </section>

          {journal.length > 0 && (
            <section className="card">
              <h2>
                {tr('Nhật ký', 'Journal')}
                <small>{journal.length}</small>
              </h2>
              <div className="journal">
                {journal.slice(0, 12).map((c) => (
                  <div key={c.date} className="note-item">
                    <b>{formatDayLong(c.date)}</b>
                    <p>{c.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="stack">
          <section className="card">
            <MonthCalendar
              month={month}
              onMonth={setMonth}
              markOf={(d) => dayStatus(state, habit, d, today)}
            />
          </section>
          <section className="card">
            <h2>{tr('12 tuần gần đây', 'Last 12 weeks')}</h2>
            <WeekBars data={weeklyTotals(state, today, 12, habit.id)} />
          </section>
          <div className="row">
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => habitStore.update((s) => moveHabit(s, habit.id, -1))}
            >
              <Icon name="up" /> {tr('Lên trên', 'Move up')}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => habitStore.update((s) => moveHabit(s, habit.id, 1))}
            >
              <Icon name="down" /> {tr('Xuống dưới', 'Move down')}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setConfirmArchive(true)}
            >
              <Icon name="archive" /> {tr('Lưu trữ', 'Archive')}
            </button>
          </div>
        </div>
      </div>

      {confirmArchive && (
        <Dialog
          title={tr('Lưu trữ thói quen?', 'Archive this habit?')}
          onClose={() => setConfirmArchive(false)}
          actions={
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmArchive(false)}
                data-autofocus
              >
                {tr('Huỷ', 'Cancel')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  habitStore.update((s) => setArchived(s, habit.id, true, Date.now()));
                  setConfirmArchive(false);
                  navigate({ name: 'habits' }, true);
                }}
              >
                <Icon name="archive" /> {tr('Lưu trữ', 'Archive')}
              </button>
            </>
          }
        >
          <p className="muted">
            {tr(
              `"${habit.name}" rời khỏi danh sách hằng ngày. Lịch sử được giữ và khôi phục được bất cứ lúc nào.`,
              `"${habit.name}" leaves your daily list. Its history is kept and you can restore it any time.`,
            )}
          </p>
        </Dialog>
      )}
    </>
  );
}

function RecentDay({ habit, day }: { habit: Habit; day: DayKey }) {
  const state = useHabitState();
  const today = todayKey();
  const value = valueOn(state, habit, day);
  const done = value >= habit.target;
  const auto = isAuto(habit);
  const editable = !auto && canEditDay(day, today);
  const [note, setNoteText] = useState(state.checkIns[checkInKey(habit.id, day)]?.note ?? '');
  return (
    <div className="dayrow">
      <div className="dayrow__top">
        <b>{day === today ? tr('Hôm nay', 'Today') : formatDayLong(day)}</b>
        {habit.target > 1 ? (
          <span className="stepper">
            <button
              type="button"
              aria-label={tr('Bớt 1', 'Minus 1')}
              disabled={!editable || value === 0}
              onClick={() =>
                habitStore.update((s) => setValue(s, habit.id, day, value - 1, today, Date.now()))
              }
            >
              <Icon name="minus" />
            </button>
            <output>
              {value}/{habit.target}
            </output>
            <button
              type="button"
              aria-label={tr('Thêm 1', 'Plus 1')}
              disabled={!editable}
              onClick={() =>
                habitStore.update((s) => setValue(s, habit.id, day, value + 1, today, Date.now()))
              }
            >
              <Icon name="plus" />
            </button>
          </span>
        ) : (
          <span className={`hab${done ? ' on' : ''}`} style={{ padding: 0, minHeight: 0 }}>
            <button
              type="button"
              className={`ck${auto ? ' auto' : ''}`}
              aria-pressed={done}
              aria-label={tr(`Xong ngày ${formatDayLong(day)}`, `Done on ${formatDayLong(day)}`)}
              disabled={!editable}
              onClick={() =>
                habitStore.update((s) =>
                  setValue(s, habit.id, day, done ? 0 : 1, today, Date.now()),
                )
              }
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 12.5l4 4 8-9" />
              </svg>
            </button>
          </span>
        )}
      </div>
      <label className="sr-only" htmlFor={`note-${day}`}>
        {tr('Ghi chú', 'Note')}
      </label>
      <textarea
        id={`note-${day}`}
        className="input input--area"
        rows={2}
        maxLength={NOTE_MAX}
        value={note}
        placeholder={tr('Cảm nhận, điều học được…', 'How did it go? What did you learn?')}
        onChange={(e) => setNoteText(e.target.value)}
        onBlur={() =>
          habitStore.update((s) => setNote(s, habit.id, day, note, todayKey(), Date.now()))
        }
      />
    </div>
  );
}

function LanguageCard() {
  const account = useAccount();
  const live = account.status === 'synced' && account.eventsLive;
  return (
    <section className="card appcard">
      <AppTile app="lang" size="lg" />
      <b>Olaa Language</b>
      <p>
        {live
          ? tr(
              'Đang nhận kết quả học. Học xong là thói quen tự đánh dấu.',
              'Receiving study results. Finish studying and this habit ticks itself.',
            )
          : account.status === 'off'
            ? tr(
                'Bản này chưa bật Olaa ID, nên chưa nhận được kết quả học.',
                'Olaa ID is not set up in this build, so results cannot arrive yet.',
              )
            : tr(
                'Đăng nhập Olaa ID (cùng tài khoản với Language) ở Hồ sơ.',
                'Sign in with Olaa ID (same account as Language) in Me.',
              )}
      </p>
      <div className="row">
        <a className="btn btn--sm btn--ghost" href={LANGUAGE_URL} target="_blank" rel="noopener">
          {tr('Học ngay', 'Study now')}
        </a>
        {live && <Ring value={1} size={22} width={3} warm label={tr('Đã kết nối', 'Connected')} />}
      </div>
    </section>
  );
}
