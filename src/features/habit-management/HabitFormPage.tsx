import { useState } from 'react';
import { navigate } from '../../app/router';
import { BackIcon, HabitGlyph } from '../../components/Icons';
import { getLocale, tr } from '../../i18n/locale';
import { normalizeNoteLink, TAKENOTE_URL } from '../../integrations/olaaApps';
import { createHabit, NAME_MAX, updateHabit, type HabitInput } from '../../stores/habitActions';
import { habitStore, useHabitState } from '../../stores/habitStore';
import { today as todayKey, type Weekday } from '../../utils/date';
import { suggestReminder } from '../reminders/reminders';
import { orderedWeekdays, weekdayShort } from '../scheduling/schedule';
import { TEMPLATES } from './templates';
import {
  HABIT_COLORS,
  HABIT_ICONS,
  type Habit,
  type HabitSource,
  type Schedule,
  type TimeOfDay,
} from './types';

const COLOR_NAMES: Record<string, [string, string]> = {
  blue: ['Xanh dương', 'Blue'],
  orange: ['Cam', 'Orange'],
  green: ['Xanh lá', 'Green'],
  red: ['Đỏ', 'Red'],
  gold: ['Vàng', 'Gold'],
  purple: ['Tím', 'Purple'],
  teal: ['Xanh ngọc', 'Teal'],
  pink: ['Hồng', 'Pink'],
};

function blank(): HabitInput {
  return {
    name: '',
    icon: 'star',
    color: 'blue',
    schedule: { kind: 'daily' },
    target: 1,
    unit: '',
    timeOfDay: 'any',
    source: { kind: 'manual' },
    reminder: null,
    noteLink: null,
    startDate: todayKey(),
  };
}

function fromHabit(h: Habit): HabitInput {
  const {
    name,
    icon,
    color,
    schedule,
    target,
    unit,
    timeOfDay,
    source,
    reminder,
    noteLink,
    startDate,
  } = h;
  return {
    name,
    icon,
    color,
    schedule,
    target,
    unit,
    timeOfDay,
    source,
    reminder,
    noteLink,
    startDate,
  };
}

/** Create or edit a habit (module 02.01 / 02.02). */
export function HabitFormPage({ habitId }: { habitId: string | null }) {
  const state = useHabitState();
  const existing = habitId ? state.habits[habitId] : undefined;
  const [form, setForm] = useState<HabitInput>(() => (existing ? fromHabit(existing) : blank()));
  const [noteInput, setNoteInput] = useState(existing?.noteLink ?? '');
  const [error, setError] = useState<string | null>(null);
  const locale = getLocale();
  const ws = state.settings.weekStart;

  if (habitId && !existing) {
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

  const set = <K extends keyof HabitInput>(key: K, value: HabitInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const isLanguage = form.source.kind !== 'manual';
  const suggestion = existing ? suggestReminder(state, existing) : null;

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setForm({
      ...t.make(todayKey()),
      name: locale === 'en' ? t.name[1] : t.name[0],
      unit: t.unit ? (locale === 'en' ? t.unit[1] : t.unit[0]) : '',
    });
  };

  const setSource = (source: HabitSource) =>
    setForm((f) => ({
      ...f,
      source,
      target:
        source.kind === 'language.lessons'
          ? Math.max(1, f.target)
          : source.kind === 'manual'
            ? f.target
            : 1,
      unit:
        source.kind === 'language.lessons'
          ? tr('bài', 'lessons')
          : source.kind === 'manual'
            ? f.unit
            : '',
      icon:
        source.kind === 'manual'
          ? f.icon
          : source.kind === 'language.lessons'
            ? 'book'
            : 'language',
    }));

  const onSubmit = () => {
    if (!form.name.trim()) {
      setError(tr('Đặt tên cho thói quen nhé.', 'Give the habit a name.'));
      return;
    }
    let noteLink: string | null = null;
    if (noteInput.trim()) {
      noteLink = normalizeNoteLink(noteInput);
      if (!noteLink) {
        setError(
          tr(
            `Liên kết sổ tay phải là địa chỉ của Olaa Note (${TAKENOTE_URL}…).`,
            `The notebook link must be an Olaa Note address (${TAKENOTE_URL}…).`,
          ),
        );
        return;
      }
    }
    const input = { ...form, noteLink };
    if (existing) {
      habitStore.update((s) => updateHabit(s, existing.id, input, Date.now()));
      navigate({ name: 'habit', id: existing.id }, true);
    } else {
      let id = '';
      habitStore.update((s) => {
        const r = createHabit(s, input, Date.now());
        id = r.id;
        return r.state;
      });
      navigate({ name: 'habit', id }, true);
    }
  };

  return (
    <div className="page">
      <header className="page__head">
        <button
          type="button"
          className="icon-btn"
          aria-label={tr('Quay lại', 'Back')}
          onClick={() => history.back()}
        >
          <BackIcon />
        </button>
        <h1>{existing ? tr('Sửa thói quen', 'Edit habit') : tr('Thói quen mới', 'New habit')}</h1>
      </header>

      {!existing && (
        <section className="card stack">
          <h2 className="card-title">{tr('Bắt đầu từ mẫu', 'Start from a template')}</h2>
          <div className="chip-row">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" className="chip" onClick={() => applyTemplate(t.id)}>
                {locale === 'en' ? t.name[1] : t.name[0]}
              </button>
            ))}
          </div>
        </section>
      )}

      <form
        className="card stack habit-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {error && (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        )}
        <label className="field">
          <span>{tr('Tên', 'Name')}</span>
          <input
            value={form.name}
            maxLength={NAME_MAX}
            placeholder={tr('Ví dụ: Học 15 từ mới', 'e.g. Learn 15 new words')}
            onChange={(e) => set('name', e.target.value)}
            autoFocus={!existing}
          />
        </label>

        <fieldset>
          <legend>{tr('Cách ghi nhận', 'How it is tracked')}</legend>
          <div className="chip-row" role="radiogroup">
            {(
              [
                [{ kind: 'manual' }, tr('Tự đánh dấu', 'I check it off')],
                [
                  { kind: 'language.daily_goal' },
                  tr('Tự động: mục tiêu ngày Language', 'Auto: Language daily goal'),
                ],
                [
                  { kind: 'language.lessons' },
                  tr('Tự động: số bài mới Language', 'Auto: new Language lessons'),
                ],
              ] as [HabitSource, string][]
            ).map(([src, label]) => (
              <button
                key={src.kind}
                type="button"
                role="radio"
                aria-checked={form.source.kind === src.kind}
                className={`chip ${form.source.kind === src.kind ? 'is-selected' : ''}`}
                onClick={() => setSource(src)}
              >
                {label}
              </button>
            ))}
          </div>
          {isLanguage && (
            <p className="muted small">
              {tr(
                'Đánh dấu tự động khi bạn học trong Olaa Language (cần đăng nhập Olaa ID ở cả hai app). Không đánh dấu tay được.',
                'Checked off automatically when you study in Olaa Language (sign in with Olaa ID in both apps). Cannot be checked by hand.',
              )}
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend>{tr('Biểu tượng', 'Icon')}</legend>
          <div className="picker">
            {HABIT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`icon-option hb-color--${form.color} ${form.icon === ic ? 'is-selected' : ''}`}
                aria-pressed={form.icon === ic}
                aria-label={ic}
                onClick={() => set('icon', ic)}
              >
                <HabitGlyph icon={ic} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{tr('Màu', 'Colour')}</legend>
          <div className="picker">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch hb-color--${c} ${form.color === c ? 'is-selected' : ''}`}
                aria-pressed={form.color === c}
                aria-label={COLOR_NAMES[c]?.[locale === 'en' ? 1 : 0] ?? c}
                onClick={() => set('color', c)}
              />
            ))}
          </div>
        </fieldset>

        <ScheduleField
          schedule={form.schedule}
          weekStart={ws}
          onChange={(s) => set('schedule', s)}
        />

        {form.source.kind !== 'language.daily_goal' && (
          <fieldset>
            <legend>{tr('Mục tiêu mỗi lần', 'Target each time')}</legend>
            <div className="inline-fields">
              <label className="field field--narrow">
                <span className="visually-hidden">{tr('Số lượng', 'Amount')}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  value={form.target}
                  onChange={(e) => set('target', Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span className="visually-hidden">{tr('Đơn vị', 'Unit')}</span>
                <input
                  value={form.unit}
                  maxLength={16}
                  disabled={form.target <= 1 || form.source.kind === 'language.lessons'}
                  placeholder={tr('ly, trang, phút…', 'glasses, pages, minutes…')}
                  onChange={(e) => set('unit', e.target.value)}
                />
              </label>
            </div>
            <p className="muted small">
              {tr(
                'Để 1 nếu chỉ cần làm hay không làm.',
                'Leave at 1 for a simple done / not done habit.',
              )}
            </p>
          </fieldset>
        )}

        <fieldset>
          <legend>{tr('Thời điểm trong ngày', 'Time of day')}</legend>
          <div className="chip-row" role="radiogroup">
            {(
              [
                ['any', tr('Cả ngày', 'Any time')],
                ['morning', tr('Sáng', 'Morning')],
                ['afternoon', tr('Chiều', 'Afternoon')],
                ['evening', tr('Tối', 'Evening')],
              ] as [TimeOfDay, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={form.timeOfDay === id}
                className={`chip ${form.timeOfDay === id ? 'is-selected' : ''}`}
                onClick={() => set('timeOfDay', id)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{tr('Nhắc nhở', 'Reminder')}</legend>
          <div className="inline-fields">
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.reminder !== null}
                onChange={(e) => set('reminder', e.target.checked ? (suggestion ?? '20:00') : null)}
              />
              <span>{tr('Nhắc tôi lúc', 'Remind me at')}</span>
            </label>
            <label className="field field--narrow">
              <span className="visually-hidden">{tr('Giờ nhắc', 'Reminder time')}</span>
              <input
                type="time"
                value={form.reminder ?? ''}
                disabled={form.reminder === null}
                onChange={(e) => set('reminder', e.target.value || null)}
              />
            </label>
          </div>
          {suggestion && suggestion !== form.reminder && (
            <button
              type="button"
              className="link-btn link-btn--left"
              onClick={() => set('reminder', suggestion)}
            >
              {tr(
                `Gợi ý: ${suggestion}, trước giờ bạn hay làm`,
                `Suggested: ${suggestion}, before your usual time`,
              )}
            </button>
          )}
          <p className="muted small">
            {tr(
              'Không nhắc nếu hôm đó đã xong. Bật thông báo trong Cài đặt.',
              'No reminder when the habit is already done that day. Turn notifications on in Settings.',
            )}
          </p>
        </fieldset>

        <label className="field">
          <span>{tr('Sổ tay Olaa Note (không bắt buộc)', 'Olaa Note notebook (optional)')}</span>
          <input
            type="url"
            inputMode="url"
            value={noteInput}
            placeholder={`${TAKENOTE_URL}#/nb/…`}
            onChange={(e) => setNoteInput(e.target.value)}
          />
          <span className="muted small">
            {tr(
              'Mở sổ tay trong Olaa Note, sao chép địa chỉ trên trình duyệt rồi dán vào đây. Thói quen sẽ có nút mở thẳng sổ tay đó.',
              'Open the notebook in Olaa Note, copy the address from the browser and paste it here. The habit gets a button that opens it.',
            )}
          </span>
        </label>

        <label className="field field--narrow">
          <span>{tr('Bắt đầu từ ngày', 'Starts on')}</span>
          <input
            type="date"
            value={form.startDate}
            max="2100-12-31"
            onChange={(e) => e.target.value && set('startDate', e.target.value)}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn--success">
            {existing ? tr('Lưu', 'Save') : tr('Tạo thói quen', 'Create habit')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => history.back()}>
            {tr('Huỷ', 'Cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

function ScheduleField({
  schedule,
  weekStart,
  onChange,
}: {
  schedule: Schedule;
  weekStart: 0 | 1;
  onChange: (s: Schedule) => void;
}) {
  const locale = getLocale();
  const days: Weekday[] = schedule.kind === 'weekdays' ? schedule.days : [1, 2, 3, 4, 5];
  const times = schedule.kind === 'perWeek' ? schedule.times : 3;
  return (
    <fieldset>
      <legend>{tr('Lặp lại', 'Repeat')}</legend>
      <div className="chip-row" role="radiogroup">
        {(
          [
            ['daily', tr('Hằng ngày', 'Every day')],
            ['weekdays', tr('Chọn ngày', 'Pick days')],
            ['perWeek', tr('N lần mỗi tuần', 'N times a week')],
          ] as [Schedule['kind'], string][]
        ).map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={schedule.kind === kind}
            className={`chip ${schedule.kind === kind ? 'is-selected' : ''}`}
            onClick={() =>
              onChange(
                kind === 'daily'
                  ? { kind }
                  : kind === 'weekdays'
                    ? { kind, days }
                    : { kind, times },
              )
            }
          >
            {label}
          </button>
        ))}
      </div>
      {schedule.kind === 'weekdays' && (
        <div className="day-picker" role="group" aria-label={tr('Các ngày', 'Days')}>
          {orderedWeekdays(weekStart).map((d) => {
            const on = schedule.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                className={`day-toggle ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    kind: 'weekdays',
                    days: on ? schedule.days.filter((x) => x !== d) : [...schedule.days, d],
                  })
                }
              >
                {weekdayShort(d, locale)}
              </button>
            );
          })}
        </div>
      )}
      {schedule.kind === 'perWeek' && (
        <div
          className="day-picker"
          role="radiogroup"
          aria-label={tr('Số lần mỗi tuần', 'Times a week')}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={schedule.times === n}
              className={`day-toggle ${schedule.times === n ? 'is-selected' : ''}`}
              onClick={() => onChange({ kind: 'perWeek', times: n })}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
