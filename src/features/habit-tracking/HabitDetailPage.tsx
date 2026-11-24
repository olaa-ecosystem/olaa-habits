import { useState } from 'react';
import { navigate, routeHref } from '../../app/router';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  ArchiveIcon,
  BackIcon,
  CheckIcon,
  DownIcon,
  EditIcon,
  ExternalIcon,
  FlameIcon,
  HabitGlyph,
  UpIcon,
} from '../../components/Icons';
import { showToast } from '../../components/Toast';
import { getLocale, tr } from '../../i18n/locale';
import { LANGUAGE_URL, noteHref } from '../../integrations/olaaApps';
import { journalText } from '../../integrations/takenote';
import { useAccount } from '../../services/cloudSync';
import { moveHabit, NOTE_MAX, setArchived, setNote, setValue } from '../../stores/habitActions';
import { habitStore, useHabitState } from '../../stores/habitStore';
import { addDays, monthOf, today as todayKey, type DayKey } from '../../utils/date';
import { formatDayLong, percent } from '../../utils/format';
import { MonthGrid } from '../calendar/MonthGrid';
import { checkInKey, isAuto, type Habit } from '../habit-management/types';
import { describeSchedule } from '../scheduling/schedule';
import { completionRate, weeklyTotals } from '../statistics/stats';
import { WeekBars } from '../statistics/WeekBars';
import { streakOf, strengthOf } from '../streaks/streaks';
import { streakLabel } from './HabitRow';
import { canEditDay, dayStatus, valueOn, EDIT_WINDOW_DAYS } from './progress';

/** One habit: streaks, strength, calendar, recent days with notes (modules 02.03/02.04/02.09). */
export function HabitDetailPage({ habitId }: { habitId: string }) {
  const state = useHabitState();
  const habit = state.habits[habitId];
  const today = todayKey();
  const [month, setMonth] = useState(monthOf(today));
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (!habit) {
    return (
      <div className="page">
        <div className="card empty">
          <p>{tr('Không tìm thấy thói quen này.', 'This habit was not found.')}</p>
          <a className="btn" href="#/">
            {tr('Về hôm nay', 'Back to today')}
          </a>
        </div>
      </div>
    );
  }

  const streak = streakOf(state, habit, today);
  const strength = strengthOf(state, habit, today);
  const rate30 = completionRate(state, habit, today, 30);
  const auto = isAuto(habit);
  const recent = Array.from({ length: EDIT_WINDOW_DAYS + 1 }, (_, i) => addDays(today, -i)).filter(
    (d) => d >= habit.startDate,
  );
  const journal = Object.values(state.checkIns)
    .filter((c) => c.habitId === habit.id && c.note.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const sendToNote = async () => {
    const text = journalText(habit, journal, getLocale());
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        text: tr(
          'Đã chép nhật ký. Dán vào một trang trong Olaa Note.',
          'Journal copied. Paste it into a page in Olaa Note.',
        ),
      });
    } catch {
      showToast({
        text: tr(
          'Trình duyệt không cho chép. Hãy chép tay nhé.',
          'The browser blocked copying. Copy it by hand.',
        ),
      });
    }
    window.open(noteHref(habit.noteLink), '_blank', 'noopener');
  };

  return (
    <div className="page">
      <header className="page__head detail-head">
        <a className="icon-btn" href="#/" aria-label={tr('Về hôm nay', 'Back to today')}>
          <BackIcon />
        </a>
        <span className={`habit-row__icon hb-color--${habit.color}`}>
          <HabitGlyph icon={habit.icon} />
        </span>
        <div className="detail-head__text">
          <h1>{habit.name}</h1>
          <p className="muted">
            {describeSchedule(habit.schedule, getLocale(), state.settings.weekStart)}
            {habit.target > 1 && ` · ${habit.target} ${habit.unit}`}
            {auto && ` · ${tr('Tự động từ Olaa Language', 'Auto from Olaa Language')}`}
          </p>
        </div>
        <a className="btn btn--ghost btn--small" href={routeHref({ name: 'edit', id: habit.id })}>
          <EditIcon /> {tr('Sửa', 'Edit')}
        </a>
      </header>

      <section className="stat-tiles" aria-label={tr('Số liệu', 'Numbers')}>
        <div className="card stat-tile">
          <span className="stat stat--streak">
            <FlameIcon /> {streakLabel(streak.current, streak.unit)}
          </span>
          <span className="muted small">{tr('Chuỗi hiện tại', 'Current streak')}</span>
        </div>
        <div className="card stat-tile">
          <span className="stat stat--xp">{streakLabel(streak.best, streak.unit)}</span>
          <span className="muted small">{tr('Chuỗi dài nhất', 'Best streak')}</span>
        </div>
        <div className="card stat-tile">
          <span className="stat">{percent(strength)}</span>
          <span className="muted small">{tr('Độ bền thói quen', 'Habit strength')}</span>
        </div>
        <div className="card stat-tile">
          <span className="stat">{percent(rate30.ratio)}</span>
          <span className="muted small">{tr('Hoàn thành 30 ngày', '30-day completion')}</span>
        </div>
      </section>

      {auto && <LanguageCard />}

      <section className="card stack">
        <h2 className="card-title">{tr('Mấy ngày gần đây', 'Recent days')}</h2>
        <ul className="recent-list">
          {recent.map((d) => (
            <RecentDay key={d} habit={habit} day={d} today={today} />
          ))}
        </ul>
        {!auto && (
          <p className="muted small">
            {tr('Sửa được hôm nay và 2 ngày trước.', 'You can change today and the 2 days before.')}
          </p>
        )}
      </section>

      <section className="card">
        <MonthGrid
          month={month}
          weekStart={state.settings.weekStart}
          today={today}
          statusOf={(d) => dayStatus(state, habit, d, today)}
          onMonth={setMonth}
          dayLabel={(d) => {
            const v = valueOn(state, habit, d);
            return habit.target > 1 && v > 0 ? `${v}/${habit.target} ${habit.unit}` : null;
          }}
        />
      </section>

      <section className="card stack">
        <h2 className="card-title">{tr('12 tuần gần đây', 'Last 12 weeks')}</h2>
        <WeekBars data={weeklyTotals(state, today, 12, habit.id)} />
      </section>

      <section className="card stack note-card">
        <h2 className="card-title">Olaa Note</h2>
        <p>
          {habit.noteLink
            ? tr(
                'Thói quen này gắn với một sổ tay trong Olaa Note.',
                'This habit is linked to a notebook in Olaa Note.',
              )
            : tr(
                'Gắn một sổ tay Olaa Note (ví dụ sổ từ vựng) để mở nhanh khi làm thói quen.',
                'Link an Olaa Note notebook (e.g. your vocabulary notebook) to open it right from the habit.',
              )}
        </p>
        <div className="form-actions">
          <a
            className="btn btn--accent btn--small"
            href={noteHref(habit.noteLink)}
            target="_blank"
            rel="noopener"
          >
            <ExternalIcon />{' '}
            {habit.noteLink
              ? tr('Mở sổ tay', 'Open notebook')
              : tr('Mở Olaa Note', 'Open Olaa Note')}
          </a>
          {journal.length > 0 && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => void sendToNote()}
            >
              {tr('Chép nhật ký sang Olaa Note', 'Copy journal to Olaa Note')}
            </button>
          )}
          {!habit.noteLink && (
            <a
              className="btn btn--ghost btn--small"
              href={routeHref({ name: 'edit', id: habit.id })}
            >
              {tr('Gắn sổ tay', 'Link a notebook')}
            </a>
          )}
        </div>
        {journal.length > 0 && (
          <ul className="journal">
            {journal.slice(0, 10).map((c) => (
              <li key={c.date}>
                <span className="muted small">{formatDayLong(c.date)}</span>
                <p>{c.note}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-actions">
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => habitStore.update((s) => moveHabit(s, habit.id, -1))}
          >
            <UpIcon /> {tr('Lên trên', 'Move up')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => habitStore.update((s) => moveHabit(s, habit.id, 1))}
          >
            <DownIcon /> {tr('Xuống dưới', 'Move down')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => setConfirmArchive(true)}
          >
            <ArchiveIcon /> {tr('Lưu trữ', 'Archive')}
          </button>
        </div>
      </section>

      {confirmArchive && (
        <ConfirmDialog
          title={tr('Lưu trữ thói quen?', 'Archive this habit?')}
          message={tr(
            `"${habit.name}" sẽ ẩn khỏi danh sách hằng ngày. Lịch sử được giữ nguyên và bạn khôi phục được bất cứ lúc nào.`,
            `"${habit.name}" leaves your daily list. Its history is kept and you can restore it any time.`,
          )}
          confirmLabel={tr('Lưu trữ', 'Archive')}
          onConfirm={() => {
            habitStore.update((s) => setArchived(s, habit.id, true, Date.now()));
            setConfirmArchive(false);
            navigate({ name: 'today', day: null }, true);
          }}
          onCancel={() => setConfirmArchive(false)}
        />
      )}
    </div>
  );
}

function RecentDay({ habit, day, today }: { habit: Habit; day: DayKey; today: DayKey }) {
  const state = useHabitState();
  const check = state.checkIns[checkInKey(habit.id, day)];
  const value = valueOn(state, habit, day);
  const done = value >= habit.target;
  const [note, setNoteText] = useState(check?.note ?? '');
  const auto = isAuto(habit);
  const editable = !auto && canEditDay(day, today);
  const commitNote = () =>
    habitStore.update((s) => setNote(s, habit.id, day, note, today, Date.now()));
  return (
    <li className="recent-day">
      <div className="recent-day__row">
        <span className="recent-day__date">
          {day === today ? tr('Hôm nay', 'Today') : formatDayLong(day)}
        </span>
        {habit.target > 1 ? (
          <label className="field field--narrow">
            <span className="visually-hidden">{tr('Số lượng', 'Amount')}</span>
            <input
              type="number"
              min={0}
              max={9999}
              value={value}
              disabled={!editable}
              onChange={(e) =>
                habitStore.update((s) =>
                  setValue(s, habit.id, day, Number(e.target.value), today, Date.now()),
                )
              }
            />
          </label>
        ) : (
          <button
            type="button"
            className={`check check--small ${done ? 'is-on' : ''}`}
            aria-pressed={done}
            aria-label={tr(`Xong ngày ${formatDayLong(day)}`, `Done on ${formatDayLong(day)}`)}
            disabled={!editable}
            onClick={() =>
              habitStore.update((s) => setValue(s, habit.id, day, done ? 0 : 1, today, Date.now()))
            }
          >
            <CheckIcon size={18} />
          </button>
        )}
      </div>
      <label className="field">
        <span className="visually-hidden">{tr('Ghi chú', 'Note')}</span>
        <textarea
          rows={2}
          maxLength={NOTE_MAX}
          value={note}
          placeholder={tr('Ghi lại cảm nhận, điều học được…', 'How did it go? What did you learn?')}
          onChange={(e) => setNoteText(e.target.value)}
          onBlur={commitNote}
        />
      </label>
    </li>
  );
}

function LanguageCard() {
  const account = useAccount();
  const connected = account.status === 'synced' && account.eventsLive;
  return (
    <section className="card stack language-card">
      <h2 className="card-title">Olaa Language</h2>
      <p>
        {connected
          ? tr(
              'Đang nhận kết quả học từ Olaa Language. Học xong là thói quen tự đánh dấu.',
              'Receiving your study results from Olaa Language. Finish studying and this habit checks itself off.',
            )
          : account.status === 'off'
            ? tr(
                'Bản này chưa bật đăng nhập Olaa ID, nên chưa nhận được kết quả từ Olaa Language.',
                'Olaa ID sign-in is not set up in this build, so results from Olaa Language cannot arrive yet.',
              )
            : tr(
                'Đăng nhập Olaa ID (cùng tài khoản với Olaa Language) trong Cài đặt để thói quen tự đánh dấu.',
                'Sign in with Olaa ID (the same account as Olaa Language) in Settings so this habit checks itself off.',
              )}
      </p>
      <div className="form-actions">
        <a
          className="btn btn--accent btn--small"
          href={LANGUAGE_URL}
          target="_blank"
          rel="noopener"
        >
          <ExternalIcon /> {tr('Học ngay', 'Study now')}
        </a>
        {!connected && account.status !== 'off' && (
          <a className="btn btn--ghost btn--small" href={routeHref({ name: 'settings' })}>
            {tr('Đăng nhập', 'Sign in')}
          </a>
        )}
      </div>
    </section>
  );
}
